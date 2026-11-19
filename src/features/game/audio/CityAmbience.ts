import { Howler } from 'howler';
import { AudioManager } from './AudioManager';
import type { DistrictId } from '../world/kit/cityPlan';

// Procedural, positional city soundscape on Howler's AudioContext (so the HUD mute and the
// mobile/autoplay unlock apply). Everything is synthesised; no sample files are needed:
//   • a soft instrumental chord pad carries the background (Owner feedback 19 Nov 2026: the
//     noise beds below used to be the dominant layer and read as "white noise" — they're now a
//     quiet supporting texture under this pad, not the main thing you hear),
//   • a quiet traffic-road texture (filtered brown noise) that swells near busy roads,
//   • four positional engine voices that ride the nearest vehicles (Doppler-free, panned in 3D),
//   • horns from real vehicles, more often when traffic is crawling,
//   • crowd murmur that follows pedestrian density (busiest in the market),
//   • district colour: generator hum in the market, server hum in Tech Park, birds in the gardens,
//   • a faint wind/air bed so silence never sounds broken.
// Phase C can swap any voice for CC0 recordings without changing the callers.

type Vec = { x: number; y: number; z: number };
export interface AmbienceFrame {
  listener: Vec;
  forward: Vec;
  player: Vec;
  district: DistrictId;
  vehicles: { x: number; z: number; speed: number; kind: string }[];
  pedestrians: { x: number; z: number }[];
  /** Point sources with a steady hum (generators, cooling units). */
  hums: { x: number; z: number; hz: number; gain: number }[];
}

function noiseBuffer(ctx: AudioContext, kind: 'brown' | 'pink' | 'white', seconds = 4) {
  const len = ctx.sampleRate * seconds, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  let last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'white') d[i] = w;
    else if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    else {
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  return buf;
}

const setPos = (p: PannerNode, v: Vec, t: number) => {
  if (p.positionX) { p.positionX.setTargetAtTime(v.x, t, 0.05); p.positionY.setTargetAtTime(v.y, t, 0.05); p.positionZ.setTargetAtTime(v.z, t, 0.05); }
  else p.setPosition(v.x, v.y, v.z);
};

export class CityAmbience {
  private ctx: AudioContext;
  private out: GainNode;
  private buffers: Record<'brown' | 'pink' | 'white', AudioBuffer>;
  private traffic!: GainNode;
  private crowd!: GainNode;
  private chatter!: GainNode;
  private chatterFilter!: BiquadFilterNode;
  private air!: GainNode;
  private techHum!: GainNode;
  private engines: { osc: OscillatorNode; sub: OscillatorNode; gain: GainNode; pan: PannerNode }[] = [];
  private hums: { osc: OscillatorNode; gain: GainNode; pan: PannerNode }[] = [];
  private sources: AudioScheduledSourceNode[] = [];
  private nextHorn = 3;
  private nextBirds = 2;
  private clock = 0;
  // Owner feedback 19 Nov 2026: the noise-bed wash (brown/pink/white noise beds below) read as
  // "white noise in the background" and was disliked. A soft instrumental pad now carries the
  // background instead; the noise beds stay only as a much quieter supporting texture under it.
  private music!: GainNode;
  private pad: { osc: OscillatorNode; gain: GainNode }[] = [];
  private bassOsc!: OscillatorNode;
  private bassGain!: GainNode;
  private chordTimer = 0;
  private chordIdx = -1;
  /** Each chord: [root, third, fifth, octave-root] in Hz, a calm Dorian/pentatonic-flavoured loop
   * in a warm low-mid register so it sits behind SFX rather than competing with them. */
  private static readonly CHORDS: [number, number, number, number][] = [
    [130.81, 155.56, 196.0, 261.63], // Cm
    [174.61, 207.65, 261.63, 349.23], // Fm
    [116.54, 146.83, 174.61, 233.08], // A♭
    [155.56, 196.0, 233.08, 311.13], // E♭
  ];
  private static readonly PAD_MIX = [0.46, 0.36, 0.3, 0.1];

  static create(): CityAmbience | null {
    AudioManager.warmUp(); // creates Howler's context
    const ctx = Howler.ctx as AudioContext | undefined;
    if (!ctx || !Howler.masterGain) return null;
    // Howler suspends an idle context after 30 s with no Howl playing; the city never goes quiet.
    Howler.autoSuspend = false;
    return new CityAmbience(ctx, Howler.masterGain);
  }

  private constructor(ctx: AudioContext, master: GainNode) {
    this.ctx = ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0.9;
    this.out.connect(master);
    this.buffers = { brown: noiseBuffer(ctx, 'brown'), pink: noiseBuffer(ctx, 'pink'), white: noiseBuffer(ctx, 'white', 2) };

    this.traffic = this.bed('brown', [{ type: 'lowpass', f: 260, q: 0.5 }], 0);
    this.crowd = this.bed('pink', [{ type: 'bandpass', f: 520, q: 0.7 }], 0);
    const chat = this.bedWithFilter('pink', { type: 'bandpass', f: 1400, q: 3 }, 0);
    this.chatter = chat.gain;
    this.chatterFilter = chat.filter;
    this.air = this.bed('white', [{ type: 'highpass', f: 3500, q: 0.3 }, { type: 'lowpass', f: 9000, q: 0.3 }], 0.0025);

    // Tech Park server hum (non-positional, district wide).
    this.techHum = ctx.createGain();
    this.techHum.gain.value = 0;
    this.techHum.connect(this.out);
    for (const [hz, g] of [[60, 0.6], [120, 0.3], [180, 0.12]] as const) {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.frequency.value = hz; og.gain.value = g;
      o.connect(og).connect(this.techHum);
      o.start(); this.sources.push(o);
    }

    // Soft instrumental pad: 4 warm voices (root, third, fifth, a quiet octave-up shimmer) through
    // a shared lowpass, retargeted to a new chord every ~16s by update(). Non-positional, like the
    // tech hum — this is the music bed, not a sound effect.
    this.music = ctx.createGain();
    this.music.gain.value = 0.16;
    this.music.connect(this.out);
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass'; padFilter.frequency.value = 1100; padFilter.Q.value = 0.4;
    padFilter.connect(this.music);
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = i === 3 ? 'sine' : 'triangle';
      gain.gain.value = 0;
      osc.connect(gain).connect(padFilter);
      osc.start();
      this.sources.push(osc);
      this.pad.push({ osc, gain });
    }
    // A soft root-note pulse under each chord, for a faint sense of movement rather than a drone.
    const bassOsc = ctx.createOscillator();
    bassOsc.type = 'sine';
    this.bassGain = ctx.createGain();
    this.bassGain.gain.value = 0;
    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'lowpass'; bassFilter.frequency.value = 220;
    bassOsc.connect(this.bassGain).connect(bassFilter).connect(this.music);
    bassOsc.start();
    this.sources.push(bassOsc);
    this.bassOsc = bassOsc;

    // Positional engine voices that follow the nearest vehicles.
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator(), sub = ctx.createOscillator();
      osc.type = 'sawtooth'; sub.type = 'square';
      osc.frequency.value = 45; sub.frequency.value = 22.5;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 340; lp.Q.value = 1.2;
      const sg = ctx.createGain(); sg.gain.value = 0.5;
      const gain = ctx.createGain(); gain.gain.value = 0;
      const pan = this.panner(6, 70);
      osc.connect(lp); sub.connect(sg).connect(lp);
      lp.connect(gain).connect(pan).connect(this.out);
      osc.start(); sub.start();
      this.sources.push(osc, sub);
      this.engines.push({ osc, sub, gain, pan });
    }
  }

  private panner(ref: number, max: number) {
    const p = this.ctx.createPanner();
    p.panningModel = 'equalpower';
    p.distanceModel = 'inverse';
    p.refDistance = ref;
    p.maxDistance = max;
    p.rolloffFactor = 1.1;
    return p;
  }

  private bed(kind: 'brown' | 'pink' | 'white', filters: { type: BiquadFilterType; f: number; q: number }[], gain: number) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers[kind];
    src.loop = true;
    src.loopStart = Math.random();
    let node: AudioNode = src;
    for (const f of filters) {
      const b = this.ctx.createBiquadFilter();
      b.type = f.type; b.frequency.value = f.f; b.Q.value = f.q;
      node = node.connect(b);
    }
    const g = this.ctx.createGain();
    g.gain.value = gain;
    node.connect(g).connect(this.out);
    src.start(0, Math.random() * 2);
    this.sources.push(src);
    return g;
  }

  private bedWithFilter(kind: 'pink', f: { type: BiquadFilterType; f: number; q: number }, gain: number) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers[kind];
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = f.type; filter.frequency.value = f.f; filter.Q.value = f.q;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(this.out);
    src.start(0, 1.3);
    this.sources.push(src);
    return { gain: g, filter };
  }

  /** A car or danfo horn at a world position: two detuned square tones, sometimes a double tap. */
  private horn(at: Vec, kind: string) {
    const t = this.ctx.currentTime;
    const base = kind === 'okada' || kind === 'keke' ? 520 + Math.random() * 120 : kind === 'danfo' ? 300 + Math.random() * 60 : 380 + Math.random() * 90;
    const pan = this.panner(8, 140);
    setPos(pan, at, t);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2200;
    const g = this.ctx.createGain();
    g.gain.value = 0;
    lp.connect(g).connect(pan).connect(this.out);
    const taps = Math.random() < 0.45 ? 2 : 1;
    const len = taps === 2 ? 0.16 : 0.32 + Math.random() * 0.4;
    for (let k = 0; k < taps; k++) {
      const t0 = t + k * (len + 0.09);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.16, t0 + 0.015);
      g.gain.setValueAtTime(0.16, t0 + len);
      g.gain.linearRampToValueAtTime(0, t0 + len + 0.04);
    }
    const end = t + taps * (len + 0.09) + 0.1;
    for (const ratio of [1, 1.26]) {
      const o = this.ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = base * ratio;
      o.connect(lp);
      o.start(t); o.stop(end);
    }
    window.setTimeout(() => pan.disconnect(), (end - t) * 1000 + 200);
  }

  /** A short bird phrase from a tree near the listener. */
  private birds(at: Vec) {
    const t = this.ctx.currentTime, pan = this.panner(4, 60);
    setPos(pan, at, t);
    const g = this.ctx.createGain();
    g.gain.value = 0;
    g.connect(pan).connect(this.out);
    const notes = 3 + Math.floor(Math.random() * 5), base = 2600 + Math.random() * 1600;
    let end = t;
    for (let k = 0; k < notes; k++) {
      const t0 = t + k * (0.09 + Math.random() * 0.07), o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(base * (0.9 + Math.random() * 0.2), t0);
      o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.4), t0 + 0.06);
      const og = this.ctx.createGain();
      og.gain.setValueAtTime(0, t0);
      og.gain.linearRampToValueAtTime(0.05, t0 + 0.01);
      og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07);
      o.connect(og).connect(g);
      o.start(t0); o.stop(t0 + 0.08);
      end = t0 + 0.1;
    }
    g.gain.value = 1;
    window.setTimeout(() => pan.disconnect(), (end - t) * 1000 + 200);
  }

  /** Advances the instrumental pad, crossfading to the next chord in the loop every ~16s. */
  private updateMusic(dt: number, t: number) {
    this.chordTimer -= dt;
    if (this.chordTimer <= 0 || this.chordIdx < 0) {
      this.chordTimer = 15 + Math.random() * 4;
      this.chordIdx = (this.chordIdx + 1) % CityAmbience.CHORDS.length;
      const chord = CityAmbience.CHORDS[this.chordIdx];
      this.pad.forEach((voice, i) => {
        voice.osc.frequency.setTargetAtTime(chord[i], t, 2.2); // slow glide, never a hard retune
        voice.gain.gain.setTargetAtTime(CityAmbience.PAD_MIX[i], t, 3);
      });
      this.bassOsc.frequency.setTargetAtTime(chord[0] / 2, t, 2.2);
      // A soft pulse on the root marks the chord change without becoming a beat.
      this.bassGain.gain.cancelScheduledValues(t);
      this.bassGain.gain.setValueAtTime(this.bassGain.gain.value, t);
      this.bassGain.gain.linearRampToValueAtTime(0.1, t + 1.5);
      this.bassGain.gain.exponentialRampToValueAtTime(0.015, t + 9);
    }
  }

  update(dt: number, f: AmbienceFrame) {
    const ctx = this.ctx, t = ctx.currentTime;
    this.clock += dt;
    this.updateMusic(dt, t);
    // Listener follows the camera.
    const L = ctx.listener;
    if (L.positionX) {
      L.positionX.setTargetAtTime(f.listener.x, t, 0.03); L.positionY.setTargetAtTime(f.listener.y, t, 0.03); L.positionZ.setTargetAtTime(f.listener.z, t, 0.03);
      L.forwardX.setTargetAtTime(f.forward.x, t, 0.03); L.forwardY.setTargetAtTime(f.forward.y, t, 0.03); L.forwardZ.setTargetAtTime(f.forward.z, t, 0.03);
      L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
    } else {
      L.setPosition(f.listener.x, f.listener.y, f.listener.z);
      L.setOrientation(f.forward.x, f.forward.y, f.forward.z, 0, 1, 0);
    }

    // Vehicles by distance from the player.
    const p = f.player;
    const near = f.vehicles.filter(Boolean).map((v) => ({ v, d2: (v.x - p.x) ** 2 + (v.z - p.z) ** 2 })).sort((a, b) => a.d2 - b.d2);
    let density = 0, crawling = 0, inRange = 0;
    for (const { v, d2 } of near) {
      if (d2 > 160 * 160) break;
      density += 1 / (1 + d2 / 900);
      if (d2 < 60 * 60) { inRange++; if (v.speed < 2) crawling++; }
    }
    // Owner feedback 19 Nov 2026: this traffic-noise bed was the main thing read as "white noise"
    // — halved so it's a quiet road-texture under the instrumental pad, not the dominant layer.
    this.traffic.gain.setTargetAtTime(Math.min(0.14, 0.01 + density * 0.035), t, 0.6);

    this.engines.forEach((e, i) => {
      const n = near[i];
      if (!n || n.d2 > 70 * 70) { e.gain.gain.setTargetAtTime(0, t, 0.3); return; }
      const v = n.v;
      const small = v.kind === 'okada' || v.kind === 'keke';
      const hz = (small ? 70 : v.kind === 'danfo' ? 38 : 46) + v.speed * (small ? 9 : 5);
      e.osc.frequency.setTargetAtTime(hz, t, 0.2);
      e.sub.frequency.setTargetAtTime(hz / 2, t, 0.2);
      e.gain.gain.setTargetAtTime(0.06 + Math.min(0.12, v.speed * 0.012) + (v.kind === 'danfo' ? 0.04 : 0), t, 0.25);
      setPos(e.pan, { x: v.x, y: 0.8, z: v.z }, t);
    });

    // Horns: a busy road honks; a jam honks a lot.
    this.nextHorn -= dt;
    if (this.nextHorn <= 0) {
      const busy = inRange + crawling * 3;
      this.nextHorn = busy > 0 ? 2 + Math.random() * Math.max(2, 22 - busy * 2) : 6;
      const pick = near.filter((n) => n.d2 < 90 * 90);
      if (pick.length && Math.random() < 0.85) {
        const { v } = pick[Math.floor(Math.random() * pick.length)];
        this.horn({ x: v.x, y: 1, z: v.z }, v.kind);
      }
    }

    // Crowd murmur from nearby walkers, louder in the market.
    let people = 0;
    for (const q of f.pedestrians) { if (!q) continue; const d2 = (q.x - p.x) ** 2 + (q.z - p.z) ** 2; if (d2 < 35 * 35) people += 1 / (1 + d2 / 120); }
    const marketBoost = f.district === 'market' ? 0.03 : f.district === 'gateway' ? 0.012 : 0;
    this.crowd.gain.setTargetAtTime(Math.min(0.1, marketBoost + people * 0.018), t, 0.8);
    // Chatter shimmers: random syllable-rate wobble on a narrow band.
    const wobble = 0.5 + 0.5 * Math.sin(this.clock * 7.3) * Math.sin(this.clock * 3.1 + 1);
    this.chatter.gain.setTargetAtTime(Math.min(0.03, (marketBoost + people * 0.012) * wobble), t, 0.08);
    this.chatterFilter.frequency.setTargetAtTime(1100 + 700 * Math.abs(Math.sin(this.clock * 1.7)), t, 0.1);

    // District colour.
    this.techHum.gain.setTargetAtTime(f.district === 'tech' ? 0.02 : 0, t, 1.5);
    const green = f.district === 'gardens' || f.district === 'academy';
    this.air.gain.setTargetAtTime(green ? 0.005 : 0.0025, t, 1.5);
    this.nextBirds -= dt;
    if (this.nextBirds <= 0) {
      this.nextBirds = green ? 1.5 + Math.random() * 4 : 9 + Math.random() * 12;
      const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 20;
      this.birds({ x: p.x + Math.cos(a) * r, y: 6, z: p.z + Math.sin(a) * r });
    }

    // Point hums (generators, cooling units): voices created on first sight.
    while (this.hums.length < f.hums.length) {
      const h = f.hums[this.hums.length];
      const osc = this.ctx.createOscillator(), lp = this.ctx.createBiquadFilter(), gain = this.ctx.createGain(), pan = this.panner(3, 40);
      osc.type = 'sawtooth'; osc.frequency.value = h.hz;
      lp.type = 'lowpass'; lp.frequency.value = 180;
      gain.gain.value = h.gain;
      setPos(pan, { x: h.x, y: 0.8, z: h.z }, t);
      osc.connect(lp).connect(gain).connect(pan).connect(this.out);
      osc.start();
      this.sources.push(osc);
      this.hums.push({ osc, gain, pan });
    }
  }

  dispose() {
    for (const s of this.sources) { try { s.stop(); } catch { /* already stopped */ } }
    this.out.disconnect();
  }
}
