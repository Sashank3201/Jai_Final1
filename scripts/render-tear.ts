// Frame-accurate render of the strand tear, independent of how fast this machine composites.
// Steps every animation of the tear by hand at 60 fps and screenshots each frame, then encodes
// MP4s (real speed and quarter speed) with ffmpeg.
//   node scripts/render-tear.ts <from> <to> <desk|phone> [outDir]
// Needs a server on :4321 (pnpm preview) and ffmpeg on PATH.
import { execFileSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { chromium, devices } from '@playwright/test';

const [from = '01', to = '03', form = 'desk', outDir = 'qa/render'] = process.argv.slice(2);
const FRAME = 1000 / 60;
const frames = `${outDir}/${form}-${from}-${to}`;
await rm(frames, { recursive: true, force: true });
await mkdir(frames, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext(
  form === 'phone'
    ? { ...devices['iPhone 14'], deviceScaleFactor: 2 }
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
);
const page = await context.newPage();
await page.goto(`http://localhost:4321/?seed=7&strand=${from}`);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);

// Hold the engine's charge timer so we decide when the snapshot happens.
await page.evaluate(() => {
  const real = window.setTimeout.bind(window);
  const held: Array<() => void> = [];
  (window as unknown as { __release: () => void }).__release = () =>
    held.splice(0).forEach((f) => f());
  window.setTimeout = ((fn: () => void, ms?: number, ...rest: unknown[]) => {
    if (ms === 160) {
      held.push(fn);
      return 0;
    }
    return real(fn, ms, ...rest);
  }) as typeof window.setTimeout;
});

let n = 0;
const shot = async (times = 1) => {
  for (let i = 0; i < times; i++) {
    await page.screenshot({ path: `${frames}/f${String(n++).padStart(4, '0')}.png` });
  }
};
const step = (ids: RegExp, t: number) =>
  page.evaluate(
    ([src, time]) => {
      const re = new RegExp(src as string);
      for (const a of document.getAnimations()) {
        const name = a.id || (a as CSSAnimation).animationName || '';
        if (!re.test(name)) continue;
        a.pause();
        a.currentTime = time as number;
      }
    },
    [ids.source, t] as const,
  );

await shot(20); // hold on the start frame

const option = page.locator(`[data-strand-option="${to}"]`);
if (form === 'phone') await option.tap();
else await option.click();

// charge
await page.waitForFunction(() => document.getAnimations().some((a) => a.id === 'tear-charge'));
for (let t = 0; t <= 160; t += FRAME) {
  await step(/^tear-charge$/, t);
  await shot();
}
await step(/^tear-charge$/, 160);
await page.evaluate(() => (window as unknown as { __release: () => void }).__release());

// tear
await page.waitForFunction(() => document.getAnimations().some((a) => a.id === 'tear-clip'));
for (let t = 0; t <= 500; t += FRAME) {
  await step(/^(tear-clip|tear-edge|ink01-slam)$/, t);
  await shot();
}
await step(/^(tear-clip|tear-edge|ink01-slam)$/, 500);
await page.evaluate(() => {
  for (const a of document.getAnimations())
    if (a.id.startsWith('tear-') && a.id !== 'tear-charge') a.play();
});

// settle
await page.waitForFunction(() => document.getAnimations().some((a) => a.id === 'tear-settle'));
for (let t = 0; t <= 140; t += FRAME) {
  await step(/^tear-settle$/, t);
  await shot();
}
await page.evaluate(() =>
  document.getAnimations().forEach((a) => a.id === 'tear-settle' && a.play()),
);
await page.waitForTimeout(300);
await shot(40); // hold on the end frame
await browser.close();

const base = `${outDir}/tear-${form}-${from}-to-${to}`;
const encode = (rate: number, out: string) =>
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-framerate',
    String(rate),
    '-i',
    `${frames}/f%04d.png`,
    '-vf',
    'pad=ceil(iw/2)*2:ceil(ih/2)*2',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '20',
    out,
  ]);
encode(60, `${base}.mp4`);
encode(15, `${base}-quarter-speed.mp4`);
console.log(`${n} frames → ${base}.mp4, ${base}-quarter-speed.mp4`);
