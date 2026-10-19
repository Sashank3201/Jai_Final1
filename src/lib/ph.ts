// Placeholder tagging for content/profile.ts.
//
// Wrap any value that still needs your real data in ph(). It returns the value unchanged,
// so types stay exact, and records it so that:
//   - dev builds hatch-outline unfilled content on the page (see `phAttr`),
//   - `pnpm content:audit` lists what is left,
//   - every page is marked noindex while any remain (see Base.astro),
//   - a Vercel production build refuses to ship once site.url is your real domain but other
//     placeholders remain, i.e. a real launch with made-up content (override: ALLOW_PLACEHOLDERS=1).
// When you swap in real data, replace `ph("…")` with `"…"`.

const registry = new Set<unknown>();

export function ph<T>(value: T): T {
  registry.add(value);
  return value;
}

export function isPlaceholder(value: unknown): boolean {
  return registry.has(value);
}

export function placeholderCount(): number {
  return registry.size;
}

/** Spread onto an element: `<p {...phAttr(text)}>`. Marks it in dev builds only. */
export function phAttr(...values: unknown[]): Record<string, string> {
  if (!import.meta.env?.DEV) return {};
  return values.some(isPlaceholder) ? { 'data-ph': '' } : {};
}

export interface LaunchCheck {
  /** VERCEL_ENV: 'production', 'preview', 'development' or unset. */
  env: string | undefined;
  /** ALLOW_PLACEHOLDERS=1 */
  allow: boolean;
  siteIsPlaceholder: boolean;
  count: number;
}

/**
 * Block a production build only when it looks like a real launch: site.url is your real domain
 * while other placeholders remain. While site.url is still a placeholder, a production build is
 * a preview of the design and goes out noindexed.
 */
export function launchBlocked({ env, allow, siteIsPlaceholder, count }: LaunchCheck): boolean {
  return env === 'production' && !allow && !siteIsPlaceholder && count > 0;
}

/** The origin to build against: site.url once it is real, otherwise this Vercel deployment's. */
export function siteOrigin(
  siteUrl: string,
  siteIsPlaceholder: boolean,
  env: Record<string, string | undefined>,
): string {
  if (!siteIsPlaceholder) return siteUrl;
  const host = env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL;
  return host ? `https://${host}` : siteUrl;
}
