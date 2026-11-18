import { Howl, Howler } from 'howler';
import { useGameState } from '../engine/GameState';

// Game audio on howler.js: handles the mobile/autoplay unlock, pooling and global mute.
// Sound files are CC0 (Kenney Impact + Interface Sounds); see CREDITS.md.

type UiSound = 'click' | 'open' | 'close' | 'confirm' | 'error' | 'select';

const UI: Record<UiSound, string> = {
  click: '/assets/audio/ui/click_002.ogg',
  open: '/assets/audio/ui/open_001.ogg',
  close: '/assets/audio/ui/close_001.ogg',
  confirm: '/assets/audio/ui/confirmation_002.ogg',
  error: '/assets/audio/ui/error_004.ogg',
  select: '/assets/audio/ui/select_001.ogg',
};
const STEPS = [0, 1, 2, 3, 4].map((i) => `/assets/audio/sfx/footstep_concrete_00${i}.ogg`);

let ui: Partial<Record<UiSound, Howl>> | null = null;
let steps: Howl[] | null = null;
let lastStep = -1;

function ensureLoaded() {
  if (typeof window === 'undefined' || ui) return;
  ui = Object.fromEntries(Object.entries(UI).map(([k, src]) => [k, new Howl({ src: [src], volume: 0.5, preload: true })]));
  steps = STEPS.map((src) => new Howl({ src: [src], volume: 0.22, preload: true }));
  // Keep howler's global mute in sync with the HUD mute toggle.
  Howler.mute(useGameState.getState().isMuted);
  useGameState.subscribe((s, prev) => {
    if (s.isMuted !== prev.isMuted) Howler.mute(s.isMuted);
  });
}

export class AudioManager {
  /** Loads the sound set and creates Howler's AudioContext (used by the city ambience). */
  static warmUp() {
    ensureLoaded();
  }

  /** Plays a random concrete footstep, never the same sample twice in a row. */
  static playFootstep(running = false) {
    ensureLoaded();
    if (!steps) return;
    let i = Math.floor(Math.random() * steps.length);
    if (i === lastStep) i = (i + 1) % steps.length;
    lastStep = i;
    const id = steps[i].play();
    steps[i].rate(running ? 1.15 : 0.95 + Math.random() * 0.1, id);
  }

  static playUi(name: UiSound) {
    ensureLoaded();
    ui?.[name]?.play();
  }

  static playSuccessStinger() {
    AudioManager.playUi('confirm');
  }
}
