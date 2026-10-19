// Bytes a first visit to each page actually downloads (gzip and brotli), plus lazy chunks.
//   node scripts/size-report.ts   (run after `astro build`)
import { readFile, stat } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
const sizes = async (file: string) => {
  const buf = await readFile(file);
  return {
    raw: buf.length,
    gz: gzipSync(buf, { level: 9 }).length,
    br: brotliCompressSync(buf).length,
  };
};

async function importsOf(file: string, seen: Set<string>) {
  if (seen.has(file)) return;
  seen.add(file);
  const src = await readFile(file, 'utf8');
  // Static imports only: dynamic import() chunks are lazy and reported separately.
  for (const m of src.matchAll(
    /(?:^|[;}\n])\s*import\s*(?:[\w*{}\s,$]+from\s*)?["']\.\/([^"']+)["']/g,
  )) {
    await importsOf(`dist/_astro/${m[1]}`, seen);
  }
}

for await (const page of glob('dist/**/index.html')) {
  const html = await readFile(page, 'utf8');
  const scripts = new Set<string>();
  for (const m of html.matchAll(/<script[^>]+src="\/(_astro\/[^"]+\.js)"/g))
    await importsOf(`dist/${m[1]}`, scripts);
  const css = [
    ...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="\/(_astro\/[^"]+\.css)"/g),
  ].map((m) => `dist/${m[1]}`);
  const inlineCss = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
    .map((m) => m[1]!)
    .join('');
  const inlineJs = [...html.matchAll(/<script(?![^>]+src)[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1]!)
    .join('');
  let js = { raw: 0, gz: 0, br: 0 };
  for (const f of scripts) {
    const s = await sizes(f);
    js = { raw: js.raw + s.raw, gz: js.gz + s.gz, br: js.br + s.br };
  }
  let cssT = { raw: 0, gz: 0, br: 0 };
  for (const f of css) {
    const s = await sizes(f);
    cssT = { raw: cssT.raw + s.raw, gz: cssT.gz + s.gz, br: cssT.br + s.br };
  }
  const htmlS = await sizes(page);
  console.log(`\n${page.replace('dist', '') || '/'}`);
  console.log(
    `  HTML            ${kb(htmlS.gz)} gz  (${kb(htmlS.raw)} raw; inline CSS ${kb(inlineCss.length)}, inline JS ${kb(inlineJs.length)} raw)`,
  );
  console.log(`  JS (initial)    ${kb(js.gz)} gz / ${kb(js.br)} br  (${scripts.size} files)`);
  console.log(`  CSS (external)  ${kb(cssT.gz)} gz / ${kb(cssT.br)} br`);
}

console.log('\nLazy chunks (loaded only when needed):');
for await (const f of glob('dist/_astro/*.js')) {
  if (!/client\.|watercolor|anomaly|sound/.test(f)) continue;
  const s = await sizes(f);
  const src = await readFile(f, 'utf8');
  const label = src.includes('stamps')
    ? 'STRAND-01 runtime'
    : src.length < 200
      ? 'STRAND-03 proxy runtime'
      : '';
  console.log(`  ${f.replace('dist/_astro/', '').padEnd(28)} ${kb(s.gz)} gz  ${label}`);
}
const fonts: string[] = [];
for await (const f of glob('dist/_astro/fonts/*.woff2')) fonts.push(f);
let total = 0;
for (const f of fonts) total += (await stat(f)).size;
console.log(
  `\nFonts: ${fonts.length} files, ${kb(total)} total across all strands (a visitor fetches only the active strand's)`,
);
