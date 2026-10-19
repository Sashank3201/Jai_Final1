// Screenshot matrix: strands × breakpoints (× reduced motion, civilian), plus a contact sheet.
//   node scripts/qa-shots.ts [strands=01,03] [outDir=qa/shots]
// Needs a server on :4321 (pnpm preview). ?seed=1 keeps every seeded visual identical between runs.
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const strands = (process.argv[2] ?? '01,03').split(',');
const outDir = process.argv[3] ?? 'qa/shots';
const widths: Array<[number, number]> = [
  [375, 812],
  [768, 1024],
  [1440, 900],
  [2560, 1440],
];
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const shots: Array<{ file: string; label: string }> = [];
const errors: string[] = [];

async function shoot(query: string, label: string, w: number, h: number, reduced = false) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${label} ${w}: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`${label} ${w}: ${m.text()}`));
  await page.goto(`http://localhost:4321/?seed=1&${query}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const file = `${outDir}/${label}-${w}.png`;
  await page.screenshot({ path: file });
  shots.push({ file, label: `${label} · ${w}` });
  await ctx.close();
}

for (const s of strands)
  for (const [w, h] of widths) await shoot(`strand=${s}`, `strand-${s}`, w, h);
for (const s of strands) await shoot(`strand=${s}`, `strand-${s}-reduced`, 375, 812, true);
for (const [w, h] of [widths[0]!, widths[2]!]) await shoot('mode=civilian', 'civilian', w, h);
await browser.close();

// Contact sheet: every shot scaled to 360px tall, wrapped into rows of six.
const tileH = 360;
const tiles = await Promise.all(
  shots.map(async (s) => {
    const { data, info } = await sharp(s.file)
      .resize({ height: tileH })
      .png()
      .toBuffer({ resolveWithObject: true });
    return { ...s, buffer: data, width: info.width };
  }),
);
const perRow = 6;
const rows: (typeof tiles)[] = [];
for (let i = 0; i < tiles.length; i += perRow) rows.push(tiles.slice(i, i + perRow));
const gap = 16;
const labelH = 28;
const sheetW = Math.max(...rows.map((r) => r.reduce((a, t) => a + t.width + gap, gap)));
const sheetH = rows.length * (tileH + labelH + gap) + gap;
const composites: sharp.OverlayOptions[] = [];
rows.forEach((row, ri) => {
  let x = gap;
  const y = gap + ri * (tileH + labelH + gap);
  for (const t of row) {
    composites.push({ input: t.buffer, left: x, top: y + labelH });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${t.width}" height="${labelH}"><text x="0" y="20" font-family="monospace" font-size="16" fill="#111">${t.label}</text></svg>`;
    composites.push({ input: Buffer.from(svg), left: x, top: y });
    x += t.width + gap;
  }
});
await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: '#f2f2f2' } })
  .composite(composites)
  .png()
  .toFile(`${outDir}/contact-sheet.png`);

console.log(`${shots.length} screenshots + ${outDir}/contact-sheet.png`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
