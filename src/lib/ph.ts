// Placeholder tagging for content/profile.ts.
//
// Wrap any value that still needs your real data in ph(). It returns the value unchanged,
// so types stay exact, and records it so that:
//   - dev builds hatch-outline unfilled content on the page (see `phAttr`),
//   - `pnpm content:audit` lists what is left,
//   - a Vercel production build refuses to ship while any remain (override: ALLOW_PLACEHOLDERS=1).
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
