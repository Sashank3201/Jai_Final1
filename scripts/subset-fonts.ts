// Subsets the OFL/Apache sources from @fontsource to the glyphs this site sets
// and trims variable axes to the ranges DESIGN.md actually uses.
// Output is committed to src/assets/fonts; rerun after changing the table below.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import subsetFont from 'subset-font';

const require = createRequire(import.meta.url);

type Axes = Record<string, number | { min: number; max: number; default?: number }>;
interface Job {
  out: string;
  src: string;
  axes?: Axes;
}

const ranges: Array<[number, number]> = [
  [0x20, 0x7e], // Basic Latin
  [0xa0, 0xff], // Latin-1 punctuation and accents (résumé, ×, ·, °)
  [0x2010, 0x2027], // dashes, quotes, bullet, ellipsis
  [0x2030, 0x203a],
  [0x2190, 0x2193], // arrows
  [0x2212, 0x2212], // minus
  [0x0394, 0x0394], // Delta
  [0x20ac, 0x20ac],
  [0x2122, 0x2122],
];
const text = ranges
  .flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i)))
  .join('');

const fs = (pkg: string, file: string) => require.resolve(`${pkg}/files/${file}`);

const jobs: Job[] = [
  // 01 Brooklyn Press
  {
    out: 'anybody.woff2',
    src: fs('@fontsource-variable/anybody', 'anybody-latin-standard-normal.woff2'),
    axes: { wght: { min: 700, max: 900 }, wdth: { min: 50, max: 75 } },
  },
  {
    out: 'archivo.woff2',
    src: fs('@fontsource-variable/archivo', 'archivo-latin-wght-normal.woff2'),
    axes: { wght: { min: 400, max: 700 } },
  },
  {
    out: 'permanent-marker.woff2',
    src: fs('@fontsource/permanent-marker', 'permanent-marker-latin-400-normal.woff2'),
  },
  // 02 Wet Dusk
  {
    out: 'bodoni-moda.woff2',
    src: fs('@fontsource-variable/bodoni-moda', 'bodoni-moda-latin-standard-normal.woff2'),
    axes: { wght: { min: 400, max: 600 }, opsz: { min: 28, max: 96 } },
  },
  {
    out: 'bodoni-moda-italic.woff2',
    src: fs('@fontsource-variable/bodoni-moda', 'bodoni-moda-latin-standard-italic.woff2'),
    axes: { wght: { min: 400, max: 600 }, opsz: { min: 28, max: 96 } },
  },
  {
    out: 'newsreader.woff2',
    src: fs('@fontsource-variable/newsreader', 'newsreader-latin-standard-normal.woff2'),
    axes: { wght: { min: 400, max: 600 }, opsz: 16 },
  },
  {
    out: 'newsreader-italic.woff2',
    src: fs('@fontsource-variable/newsreader', 'newsreader-latin-standard-italic.woff2'),
    axes: { wght: { min: 400, max: 600 }, opsz: 16 },
  },
  // 03 Late Edition
  {
    out: 'grenze-gotisch.woff2',
    src: fs('@fontsource-variable/grenze-gotisch', 'grenze-gotisch-latin-wght-normal.woff2'),
    axes: { wght: { min: 600, max: 800 } },
  },
  {
    out: 'stint-ultra-condensed.woff2',
    src: fs('@fontsource/stint-ultra-condensed', 'stint-ultra-condensed-latin-400-normal.woff2'),
  },
  {
    out: 'noticia-text-400.woff2',
    src: fs('@fontsource/noticia-text', 'noticia-text-latin-400-normal.woff2'),
  },
  {
    out: 'noticia-text-400-italic.woff2',
    src: fs('@fontsource/noticia-text', 'noticia-text-latin-400-italic.woff2'),
  },
  {
    out: 'noticia-text-700.woff2',
    src: fs('@fontsource/noticia-text', 'noticia-text-latin-700-normal.woff2'),
  },
  // 04 Screentone
  {
    out: 'jost.woff2',
    src: fs('@fontsource-variable/jost', 'jost-latin-wght-normal.woff2'),
    axes: { wght: { min: 400, max: 800 } },
  },
  {
    out: 'jost-italic.woff2',
    src: fs('@fontsource-variable/jost', 'jost-latin-wght-italic.woff2'),
    axes: { wght: { min: 700, max: 900 } },
  },
  {
    out: 'martian-mono.woff2',
    src: fs('@fontsource-variable/martian-mono', 'martian-mono-latin-standard-normal.woff2'),
    axes: { wght: { min: 400, max: 600 }, wdth: { min: 75, max: 100 } },
  },
];

const outDir = new URL('../src/assets/fonts/', import.meta.url);
let before = 0;
let after = 0;
for (const job of jobs) {
  const input = await readFile(job.src);
  const output = await subsetFont(input, text, {
    targetFormat: 'woff2',
    ...(job.axes ? { variationAxes: job.axes } : {}),
  });
  await writeFile(new URL(job.out, outDir), output);
  before += input.length;
  after += output.length;
  console.log(
    `${job.out.padEnd(32)} ${(input.length / 1024).toFixed(1).padStart(6)} KB -> ${(output.length / 1024).toFixed(1).padStart(6)} KB`,
  );
}
console.log(`total ${(before / 1024).toFixed(1)} KB -> ${(after / 1024).toFixed(1)} KB`);
