// Client-side strand registry: what to load when a strand becomes active.
// Each strand's runtime (cursor, ambient effects, hero motion) is a separate lazy chunk,
// so a visitor only downloads the code for the strand they are looking at.

import type { StrandId } from './ids.ts';

export interface StrandContext {
  root: HTMLElement;
  /** True when the visitor allows motion. Modules must not animate when false. */
  motion: boolean;
}

export interface StrandModule {
  /** Start the strand's effects. Returns a function that tears them down completely. */
  mount(ctx: StrandContext): () => void;
}

export const loaders: Partial<Record<StrandId, () => Promise<StrandModule>>> = {
  '01': () => import('./01-brooklyn-press/client.ts'),
  '03': () => import('./03-late-edition/client.ts'),
};

/** Faces to warm before a strand's tear: [weight, CSS variable holding the family list]. */
export const faces: Partial<Record<StrandId, Array<[string, string]>>> = {
  '01': [
    ['900', '--font-anybody'],
    ['400', '--font-archivo'],
    ['400', '--font-marker'],
  ],
  '02': [
    ['400', '--font-bodoni'],
    ['400', '--font-newsreader'],
  ],
  '03': [
    ['400', '--font-stint'],
    ['400', '--font-noticia'],
    ['700', '--font-grenze'],
  ],
  '04': [
    ['800', '--font-jost'],
    ['500', '--font-martian'],
  ],
};

/** Settle easing for the end of a tear into each strand (DESIGN.md --ease-settle). */
export const settleEase: Record<string, string> = {
  '01': 'cubic-bezier(0.3, 0.7, 0.2, 1)',
  '02': 'cubic-bezier(0.22, 0.8, 0.3, 1)',
  '03': 'steps(3, jump-none)',
  '04': 'linear(0, 0.42 8%, 0.92 17%, 1.14 25%, 1.06 33%, 0.985 42%, 1.004 55%, 1)',
};

/** Warm a strand's fonts. Safe to call repeatedly; the browser dedupes requests. */
export function warmFonts(id: StrandId): Promise<unknown> {
  const list = faces[id];
  if (!list || !('fonts' in document)) return Promise.resolve();
  const style = getComputedStyle(document.documentElement);
  return Promise.allSettled(
    list.map(([weight, cssVar]) => {
      const family = style.getPropertyValue(cssVar).trim();
      return family ? document.fonts.load(`${weight} 1em ${family}`) : Promise.resolve([]);
    }),
  );
}
