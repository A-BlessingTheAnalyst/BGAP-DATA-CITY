import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Texture } from 'three';
import { seeded } from './palette';

// Procedural canvas textures: façades, signs, roofs and ground.
// Generated once per unique key and cached, so 40 shops share one texture each.

const cache = new Map<string, Texture>();

function make(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat = false): Texture {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  draw(ctx);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) tex.wrapS = tex.wrapT = RepeatWrapping;
  cache.set(key, tex);
  return tex;
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** Window grid façade. `lit` is the share of windows glowing warm (offices at dusk). */
export function facadeTexture(opts: {
  wall: string;
  glass: string;
  cols: number;
  rows: number;
  lit?: number;
  style?: 'punched' | 'curtain' | 'band' | 'louvre';
  seed?: number;
}): Texture {
  const { wall, glass, cols, rows, lit = 0.15, style = 'punched', seed = 1 } = opts;
  const key = `facade:${wall}:${glass}:${cols}:${rows}:${lit}:${style}:${seed}`;
  return make(key, 512, 512, (ctx) => {
    const rnd = seeded(seed);
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, 512, 512);
    // Weathering: rain streaks and grime, the detail that makes plaster read as real
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(60,40,20,${0.02 + rnd() * 0.04})`;
      ctx.fillRect(rnd() * 512, rnd() * 512, 2 + rnd() * 6, 30 + rnd() * 120);
    }
    const cw = 512 / cols, rh = 512 / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const on = rnd() < lit;
        const g = on ? '#FFE3A3' : glass;
        if (style === 'curtain') {
          ctx.fillStyle = on ? g : shade(glass, (rnd() - 0.5) * 0.12);
          ctx.fillRect(c * cw + 1, r * rh + 1, cw - 2, rh - 2);
          ctx.fillStyle = 'rgba(255,255,255,0.10)';
          ctx.fillRect(c * cw + 1, r * rh + 1, cw * 0.35, rh - 2);
        } else if (style === 'band') {
          ctx.fillStyle = on ? g : shade(glass, (rnd() - 0.5) * 0.08);
          ctx.fillRect(c * cw, r * rh + rh * 0.2, cw, rh * 0.55);
        } else if (style === 'louvre') {
          const x = c * cw + cw * 0.2, y = r * rh + rh * 0.2, ww = cw * 0.6, hh = rh * 0.55;
          ctx.fillStyle = '#2B2F36';
          ctx.fillRect(x - 3, y - 3, ww + 6, hh + 6);
          ctx.fillStyle = on ? g : glass;
          ctx.fillRect(x, y, ww, hh);
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 2;
          for (let k = 1; k < 6; k++) {
            ctx.beginPath();
            ctx.moveTo(x, y + (hh * k) / 6);
            ctx.lineTo(x + ww, y + (hh * k) / 6);
            ctx.stroke();
          }
        } else {
          const x = c * cw + cw * 0.22, y = r * rh + rh * 0.18, ww = cw * 0.56, hh = rh * 0.6;
          ctx.fillStyle = shade(wall, -0.18);
          ctx.fillRect(x - 4, y + hh, ww + 8, 6); // sill
          ctx.fillStyle = on ? g : glass;
          ctx.fillRect(x, y, ww, hh);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(x + ww / 2 - 1, y, 2, hh);
          ctx.fillRect(x, y + hh / 2 - 1, ww, 2);
          // Burglar-proof bars on low-rise windows
          ctx.strokeStyle = 'rgba(30,30,35,0.55)';
          ctx.lineWidth = 2;
          for (let k = 1; k < 5; k++) {
            ctx.beginPath();
            ctx.moveTo(x + (ww * k) / 5, y);
            ctx.lineTo(x + (ww * k) / 5, y + hh);
            ctx.stroke();
          }
        }
      }
    }
  });
}

/** Painted or lightbox sign with real text. */
export function signTexture(text: string, bg: string, fg: string, opts: { sub?: string; font?: string; w?: number; h?: number } = {}): Texture {
  const { sub, font = 'Arial Black, Arial, sans-serif', w = 1024, h = 256 } = opts;
  return make(`sign:${text}:${sub}:${bg}:${fg}:${w}x${h}`, w, h, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = fg;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = h * 0.04;
    ctx.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12);
    ctx.globalAlpha = 1;
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = sub ? h * 0.42 : h * 0.55;
    ctx.font = `900 ${size}px ${font}`;
    while (ctx.measureText(text).width > w * 0.88 && size > 10) {
      size -= 4;
      ctx.font = `900 ${size}px ${font}`;
    }
    ctx.fillText(text, w / 2, sub ? h * 0.4 : h / 2);
    if (sub) {
      ctx.font = `600 ${h * 0.18}px Arial, sans-serif`;
      ctx.fillText(sub, w / 2, h * 0.76);
    }
  });
}

/** Corrugated metal roof sheet with rust blooms. */
export function corrugatedTexture(base: string, seed = 3): Texture {
  return make(`corr:${base}:${seed}`, 256, 256, (ctx) => {
    const rnd = seeded(seed);
    for (let x = 0; x < 256; x += 8) {
      const g = ctx.createLinearGradient(x, 0, x + 8, 0);
      g.addColorStop(0, shade(base, -0.08));
      g.addColorStop(0.5, shade(base, 0.08));
      g.addColorStop(1, shade(base, -0.08));
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, 8, 256);
    }
    for (let i = 0; i < 25; i++) {
      ctx.fillStyle = `rgba(110,50,20,${0.1 + rnd() * 0.2})`;
      ctx.beginPath();
      ctx.ellipse(rnd() * 256, rnd() * 256, 6 + rnd() * 20, 4 + rnd() * 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }, true);
}

/** Ground surfaces: interlocking paving, asphalt and laterite. */
export function groundTexture(kind: 'paving' | 'asphalt' | 'laterite' | 'grass', color: string): Texture {
  return make(`ground:${kind}:${color}`, 256, 256, (ctx) => {
    const rnd = seeded(kind.length * 7);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 256);
    if (kind === 'paving') {
      ctx.strokeStyle = shade(color, -0.15);
      ctx.lineWidth = 2;
      for (let y = 0; y < 256; y += 32) {
        for (let x = (y / 32) % 2 ? -16 : 0; x < 256; x += 32) {
          ctx.fillStyle = shade(color, (rnd() - 0.5) * 0.08);
          ctx.fillRect(x + 1, y + 1, 30, 30);
          ctx.strokeRect(x + 1, y + 1, 30, 30);
        }
      }
    } else {
      const n = kind === 'grass' ? 2500 : 1800;
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = shade(color, (rnd() - 0.5) * (kind === 'asphalt' ? 0.18 : 0.25));
        ctx.fillRect(rnd() * 256, rnd() * 256, 2, kind === 'grass' ? 4 : 2);
      }
    }
  }, true);
}

/** Roller shutter for lock-up shops, half open. */
export function shutterTexture(color: string): Texture {
  return make(`shutter:${color}`, 128, 128, (ctx) => {
    for (let y = 0; y < 128; y += 6) {
      ctx.fillStyle = y % 12 ? shade(color, 0.06) : shade(color, -0.08);
      ctx.fillRect(0, y, 128, 6);
    }
  });
}
