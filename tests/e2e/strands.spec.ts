import { expect, test, type Page } from '@playwright/test';

const html = (page: Page) => page.locator('html');
const pick = (page: Page, id: string) => page.locator(`[data-strand-option="${id}"]`);
const settled = (page: Page, id: string) =>
  page.waitForFunction(
    (s) =>
      document.documentElement.dataset.strand === s &&
      !document.documentElement.dataset.vt &&
      !document.documentElement.hasAttribute('data-typeset'),
    id,
  );

test.beforeEach(async ({ page }) => {
  await page.goto('/?seed=1');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/?seed=1');
});

test('defaults to STRAND-01 with a clean URL', async ({ page }) => {
  await expect(html(page)).toHaveAttribute('data-strand', '01');
  await expect(html(page)).toHaveAttribute('data-mode', 'strand');
  expect(new URL(page.url()).searchParams.get('strand')).toBeNull();
});

test('?strand= opens pre-collapsed and persists without the param', async ({ page }) => {
  await page.goto('/?strand=03');
  await expect(html(page)).toHaveAttribute('data-strand', '03');
  await expect(page.locator('input[name="strand"][value="03"]')).toBeChecked();
  await page.goto('/');
  await expect(html(page)).toHaveAttribute('data-strand', '03');
  expect(new URL(page.url()).searchParams.get('strand')).toBe('03');
});

test('an unknown strand falls back to the default', async ({ page }) => {
  await page.goto('/?strand=99');
  await expect(html(page)).toHaveAttribute('data-strand', '01');
});

test('switching tears into the new strand, updates URL, theme and live region', async ({
  page,
}) => {
  await pick(page, '03').click();
  await settled(page, '03');
  expect(new URL(page.url()).searchParams.get('strand')).toBe('03');
  await expect(page.locator('#live')).toHaveText(/Strand 03, Late Edition/);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', /#efede6/i);
  await expect(page.locator('.tear-edge')).toHaveCount(0);
  const ms = await page.evaluate(
    () => performance.getEntriesByName('strand-tear').at(-1)!.duration,
  );
  test.info().annotations.push({ type: 'tear-ms', description: String(Math.round(ms)) });
  // Designed budget is 820 ms + snapshot. CI renders on the CPU (no GPU), which stretches every
  // frame, so the gate here is looser than the on-device target.
  expect(ms).toBeLessThan(1400);
});

test('rapid switches never block and end on the last request', async ({ page }) => {
  await page.evaluate(() => {
    (window as unknown as { n: number }).n = 0;
    document.addEventListener('strands:intent', () => (window as unknown as { n: number }).n++);
  });
  for (const id of ['03', '01', '03', '01', '03']) {
    await pick(page, id).click({ force: true });
    await page.waitForTimeout(90);
  }
  await settled(page, '03');
  expect(await page.evaluate(() => (window as unknown as { n: number }).n)).toBe(5);
  const leftovers = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter(
          (a) => a.id.startsWith('tear') || (a.effect as KeyframeEffect | null)?.pseudoElement,
        ).length,
  );
  expect(leftovers).toBe(0);
  await expect(page.locator('.tear-edge')).toHaveCount(0);
});

test('keyboard: skip link first, switcher reachable, arrows change strand', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'keyboard pass runs on desk');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();
  const radio = page.locator('input[name="strand"]:checked');
  for (let i = 0; i < 8 && !(await radio.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Tab');
  }
  await expect(radio).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await settled(page, '03');
  await expect(page.locator('input[name="strand"][value="03"]')).toBeFocused();
});

test('civilian mode: plain document, persists, and returns', async ({ page }) => {
  await page.locator('[data-toggle="civilian"]').click();
  await expect(html(page)).toHaveAttribute('data-mode', 'civilian');
  await expect(page.locator('.switcher')).toBeHidden();
  await expect(page.locator('[data-toggle="civilian"]')).toHaveText('Back to the strands', {
    useInnerText: true,
  });
  const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(font).toMatch(/apple-system|Segoe UI|Roboto|Arial/);
  await page.reload();
  await expect(html(page)).toHaveAttribute('data-mode', 'civilian');
  expect(new URL(page.url()).searchParams.get('mode')).toBe('civilian');
  await page.locator('[data-toggle="civilian"]').click();
  await expect(html(page)).toHaveAttribute('data-mode', 'strand');
});

test('print is civilian by construction', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  const s = await page.evaluate(() => ({
    font: getComputedStyle(document.body).fontFamily,
    bg: getComputedStyle(document.body).backgroundColor,
    deco: [...document.querySelectorAll('[data-deco]')].every(
      (el) => getComputedStyle(el).display === 'none',
    ),
    chrome: getComputedStyle(document.querySelector('.chrome')!).display,
  }));
  expect(s.font).toMatch(/apple-system|Segoe UI|Roboto|Arial/);
  expect(s.bg).toBe('rgb(255, 255, 255)');
  expect(s.deco).toBe(true);
  expect(s.chrome).toBe('none');
});

test('hold still pauses motion and is a pressed toggle', async ({ page }) => {
  const b = page.locator('[data-toggle="motion"]');
  await b.click();
  await expect(b).toHaveAttribute('aria-pressed', 'true');
  await expect(html(page)).toHaveAttribute('data-motion', 'reduced');
  const sfx = await page.locator('.hero__sfx').evaluate((el) => getComputedStyle(el).animationName);
  expect(sfx).toBe('none');
});

test.describe('prefers-reduced-motion', () => {
  test('no tear, no aberration, no cursor, opacity only', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await expect(html(page)).toHaveAttribute('data-motion', 'reduced');
    await page.mouse.move(400, 400);
    await expect(page.locator('.cursor')).toHaveCount(
      await page.evaluate(() => (matchMedia('(pointer: fine)').matches ? 1 : 0)),
    );
    await page.evaluate(() => {
      const seen = new Set<string>();
      (window as unknown as { seen: Set<string> }).seen = seen;
      const tick = () => {
        for (const a of document.getAnimations()) {
          const effect = a.effect as KeyframeEffect | null;
          for (const k of effect?.getKeyframes() ?? []) {
            for (const prop of Object.keys(k))
              if (!['offset', 'easing', 'composite', 'computedOffset'].includes(prop))
                seen.add(prop);
          }
          if (a instanceof CSSAnimation) seen.add(`css:${a.animationName}`);
        }
        requestAnimationFrame(tick);
      };
      tick();
    });
    await pick(page, '03').click();
    await settled(page, '03');
    const seen = await page.evaluate(() => [...(window as unknown as { seen: Set<string> }).seen]);
    expect(
      seen.filter((p) => !['opacity', 'css:vt-fade-in', 'css:vt-fade-out'].includes(p)),
    ).toEqual([]);
    const ab = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ab').trim(),
    );
    expect(Number(ab)).toBe(0);
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(200);
    const abv = await page
      .locator('#hero-name')
      .evaluate((el) => getComputedStyle(el).getPropertyValue('--abv').trim());
    expect(Number(abv || 0)).toBe(0);
  });
});
