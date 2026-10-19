import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const cases = [
  { name: 'STRAND-01', url: '/?strand=01' },
  { name: 'STRAND-03 proxy', url: '/?strand=03' },
  { name: 'civilian', url: '/?mode=civilian' },
];

for (const c of cases) {
  test(`axe: home in ${c.name}`, async ({ page }) => {
    await page.goto(c.url);
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const summary = results.violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
    );
    expect(summary).toEqual([]);
  });
}

test('landmarks and heading order', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('main#main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  const levels = await page
    .locator('h1, h2, h3, h4')
    .evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
  for (let i = 1; i < levels.length; i++)
    expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
});

test('decorative layers are hidden from assistive tech', async ({ page }) => {
  await page.goto('/');
  const exposed = await page
    .locator('[data-deco]')
    .evaluateAll((els) =>
      els
        .filter((el) => !el.closest('[aria-hidden="true"]'))
        .map((el) => el.outerHTML.slice(0, 80)),
    );
  expect(exposed).toEqual([]);
});
