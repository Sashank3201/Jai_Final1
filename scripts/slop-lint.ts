// Anti-slop and IP checks over the built site (DESIGN.md §1.1, §1.2).
//   node scripts/slop-lint.ts      (run after `astro build`)
import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import { sfxLexicon } from '../src/strands/voice.ts';

const rules: Array<[string, RegExp]> = [
  ['emoji', /\p{Extended_Pictographic}/u],
  ['"Hi, I\'m"', /\bhi,?\s+i['’]m\b/i],
  ['"Let\'s build something amazing"', /let['’]s build something amazing/i],
  ['"passionate about"', /passionate about/i],
  ['"cutting-edge"', /cutting[- ]edge/i],
  ['"leverage"', /\bleverag(e|ing)\b/i],
  ['"fast-paced world"', /fast[- ]paced world/i],
  ['"not just X, but Y"', /\bnot just\b[^.]{1,60}\bbut\b/i],
  ['lorem ipsum', /\blorem\b|\bipsum\b|dolor sit/i],
  ['Inter font', /font-family:[^;}]*\bInter\b/i],
  ['IP: spider', /spider/i],
  ['IP: Earth-NNN', /\bEarth-\d+/i],
  [
    'IP: franchise phrase',
    /canon event|leap of faith|wear the mask|great power|multiverse|spider-sense/i,
  ],
  ['IP: borrowed SFX', /\bTHWIP\b/i],
  ['IP: studio/publisher', /\bMarvel\b|\bSony Pictures\b/i],
  ['film vocabulary in copy', />[^<]*\banomal(y|ies)\b[^<]*</i],
];

const problems: string[] = [];
const files: string[] = [];
for await (const f of glob('dist/**/*.{html,css,js}')) files.push(f);

for (const file of files) {
  const text = await readFile(file, 'utf8');
  // Visible copy only for HTML: drop scripts, styles and attribute noise before phrase checks.
  const body = file.endsWith('.html')
    ? text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')
    : text;
  for (const [name, re] of rules) {
    const target = name.startsWith('Inter') ? text : body;
    const m = re.exec(target);
    if (m)
      problems.push(
        `${file}: ${name} → “${target.slice(Math.max(0, m.index - 30), m.index + 40).replace(/\s+/g, ' ')}”`,
      );
  }
  if (file.endsWith('.css') || file.endsWith('.html')) {
    // Purple/indigo gradients: any gradient with a color stop hued 230–290°.
    for (const g of text.matchAll(/(linear|radial|conic)-gradient\(([^;{}]*)\)/g)) {
      for (const hex of g[2]!.matchAll(/#([0-9a-f]{6})\b/gi)) {
        const [r, gg, b] = [0, 2, 4].map((i) => parseInt(hex[1]!.slice(i, i + 2), 16) / 255) as [
          number,
          number,
          number,
        ];
        const max = Math.max(r, gg, b);
        const min = Math.min(r, gg, b);
        if (max - min < 0.25) continue;
        let h = 0;
        if (max === r) h = ((gg - b) / (max - min)) % 6;
        else if (max === gg) h = (b - r) / (max - min) + 2;
        else h = (r - gg) / (max - min) + 4;
        h = (h * 60 + 360) % 360;
        if (h >= 230 && h <= 290) problems.push(`${file}: purple/indigo gradient stop #${hex[1]}`);
      }
    }
  }
  if (file.endsWith('.html')) {
    const allowed = new Set(
      Object.values(sfxLexicon)
        .flat()
        .map((w) => w.toUpperCase()),
    );
    for (const m of text.matchAll(/class="[^"]*\b\w+__sfx\b[^"]*"[^>]*>([^<]+)</g)) {
      const word = m[1]!.trim().toUpperCase();
      if (!allowed.has(word))
        problems.push(`${file}: SFX "${m[1]}" is not in the DESIGN.md lexicon`);
    }
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`slop-lint: ${files.length} files clean`);
