// Lighthouse, mobile and desktop, for each route × strand. Fails below Performance 90 or
// Accessibility 100. Run against `pnpm preview` (scripts/serve.ts compresses like Vercel does).
//   node scripts/lighthouse.ts [baseUrl]
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';

const base = process.argv[2] ?? 'http://localhost:4321';
const targets = ['/?strand=01', '/?strand=03', '/?mode=civilian'];
const chromePath = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const chrome = await launch({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox'] });
let failed = false;
const rows: string[] = [];
try {
  for (const formFactor of ['mobile', 'desktop'] as const) {
    for (const path of targets) {
      const result = await lighthouse(
        base + path,
        {
          port: chrome.port,
          output: 'json',
          logLevel: 'error',
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        },
        formFactor === 'desktop' ? desktopConfig : undefined,
      );
      if (!result) throw new Error(`no result for ${path}`);
      const { categories: c, audits: a } = result.lhr;
      const score = (k: string) => Math.round((c[k]?.score ?? 0) * 100);
      const perf = score('performance');
      const a11y = score('accessibility');
      if (perf < 90 || a11y < 100) failed = true;
      rows.push(
        [
          formFactor.padEnd(8),
          path.padEnd(18),
          `perf ${perf}`,
          `a11y ${a11y}`,
          `bp ${score('best-practices')}`,
          `seo ${score('seo')}`,
          `LCP ${a['largest-contentful-paint']?.displayValue}`,
          `TBT ${a['total-blocking-time']?.displayValue}`,
          `CLS ${a['cumulative-layout-shift']?.displayValue}`,
        ].join('  '),
      );
      for (const [id, audit] of Object.entries(a)) {
        if (
          audit.score !== null &&
          audit.score < 1 &&
          c.accessibility?.auditRefs.some((r) => r.id === id && r.weight > 0)
        ) {
          rows.push(`           a11y fail: ${id} ${audit.title}`);
        }
      }
    }
  }
} finally {
  chrome.kill();
}
console.log(rows.join('\n'));
if (failed) {
  console.error('\nLighthouse budget missed (Performance ≥ 90, Accessibility = 100).');
  process.exit(1);
}
