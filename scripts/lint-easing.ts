// DESIGN.md §1.2: no CSS keyword easings and no `transition: all`. Every curve is a named token.
import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';

const keyword = /(?<![-\w])(ease|ease-in|ease-out|ease-in-out)(?![-\w])/;
const transitionAll = /transition(-property)?\s*:\s*all\b/;
const problems: string[] = [];

for await (const file of glob('src/**/*.{css,astro,ts}')) {
  const lines = (await readFile(file, 'utf8')).split('\n');
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$|\/\*.*?\*\//g, '');
    if (keyword.test(code) && /(transition|animation|easing|timing)/i.test(code)) {
      problems.push(`${file}:${i + 1}  keyword easing: ${line.trim()}`);
    }
    if (transitionAll.test(code))
      problems.push(`${file}:${i + 1}  transition: all: ${line.trim()}`);
  });
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('easing: every curve is a named token');
