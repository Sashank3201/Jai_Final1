// Pre-renders the small texture tiles the strands use, so nothing runs feTurbulence or noise at
// runtime. Deterministic (seeded); output is committed to public/textures/.
//   node scripts/generate-textures.ts
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { rng } from '../src/engine/random.ts';

const out = new URL('../public/textures/', import.meta.url);

async function png(name: string, w: number, h: number, data: Uint8ClampedArray) {
  const file = new URL(name, out);
  await mkdir(new URL('.', file), { recursive: true });
  await sharp(Buffer.from(data.buffer), { raw: { width: w, height: h, channels: 4 } })
    .png({ compressionLevel: 9, palette: true, colors: 16 })
    .toFile(file.pathname);
  console.log(`wrote public/textures/${name}`);
}

function plot(
  d: Uint8ClampedArray,
  w: number,
  h: number,
  x: number,
  y: number,
  rgb: number[],
  a: number,
) {
  const xi = ((Math.round(x) % w) + w) % w;
  const yi = ((Math.round(y) % h) + h) % h;
  const i = (yi * w + xi) * 4;
  const prev = d[i + 3]!;
  d[i] = rgb[0]!;
  d[i + 1] = rgb[1]!;
  d[i + 2] = rgb[2]!;
  d[i + 3] = Math.min(255, prev + a);
}

function disc(
  d: Uint8ClampedArray,
  w: number,
  h: number,
  cx: number,
  cy: number,
  r: number,
  rgb: number[],
  a: number,
) {
  for (let y = -Math.ceil(r); y <= Math.ceil(r); y++)
    for (let x = -Math.ceil(r); x <= Math.ceil(r); x++)
      if (x * x + y * y <= r * r) plot(d, w, h, cx + x, cy + y, rgb, a);
}

/** Paper fiber on night stock: sparse light specks and short fibers. Tiles seamlessly. */
async function fiber() {
  const w = 256;
  const h = 256;
  const d = new Uint8ClampedArray(w * h * 4);
  const r = rng(101);
  const cream = [239, 230, 210];
  for (let i = 0; i < 2600; i++) plot(d, w, h, r() * w, r() * h, cream, 6 + r() * 16);
  for (let i = 0; i < 70; i++) {
    let x = r() * w;
    let y = r() * h;
    const len = 6 + r() * 16;
    let ang = r() * Math.PI * 2;
    for (let s = 0; s < len; s++) {
      plot(d, w, h, x, y, cream, 10 + r() * 10);
      ang += (r() - 0.5) * 0.5;
      x += Math.cos(ang);
      y += Math.sin(ang);
    }
  }
  await png('01/fiber.png', w, h, d);
}

/**
 * Spray-can overspray, as an alpha mask stretched over a box 56px larger than the panel it
 * surrounds. Speckle density peaks at the panel edge and falls off outward.
 */
async function spray(seed: number, name: string) {
  const w = 512;
  const h = 512;
  const d = new Uint8ClampedArray(w * h * 4);
  const r = rng(seed);
  const inner = 0.09;
  for (let i = 0; i < 26000; i++) {
    const x = r();
    const y = r();
    const dx = Math.max(inner - x, x - (1 - inner), 0);
    const dy = Math.max(inner - y, y - (1 - inner), 0);
    const dist = Math.hypot(dx, dy) / inner;
    if (dist === 0 || dist > 1) continue;
    if (r() > (1 - dist) ** 1.6) continue;
    disc(d, w, h, x * w, y * h, 0.5 + r() * r() * 2.2, [0, 0, 0], 255);
  }
  await png(name, w, h, d);
}

await fiber();
await spray(7, '01/spray-a.png');
await spray(19, '01/spray-b.png');
