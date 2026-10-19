// Lists every value in content/profile.ts still wrapped in ph(), i.e. still placeholder content.
//   node scripts/content-audit.ts
import { readFile } from 'node:fs/promises';

const file = 'content/profile.ts';
const lines = (await readFile(file, 'utf8')).split('\n');
const hits = lines.flatMap((line, i) =>
  /\bph\(/.test(line) && !line.includes('import') && !line.trim().startsWith('//')
    ? [`${file}:${i + 1}  ${line.trim().slice(0, 96)}`]
    : [],
);

if (!hits.length) {
  console.log('content: no placeholders left. Ready to ship.');
} else {
  console.log(`content: ${hits.length} placeholder value(s) left to replace:\n`);
  console.log(hits.join('\n'));
  console.log('\nReplace ph("…") with "…" (or the whole ph({…}) object) as you fill each one in.');
}
