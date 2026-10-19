// Runs inline and blocking in <head>, before first paint, so the wrong strand never flashes.
// Base.astro serialises this function with Function#toString, so it must stay self-contained:
// no imports, no closures over module scope, nothing but browser globals and `cfg`.

export interface BootConfig {
  /** Strand used when neither the URL nor storage names one. */
  def: string;
  /** Strands a visitor can be in right now. */
  available: string[];
  /** meta theme-color per strand. */
  theme: Record<string, string>;
}

export function boot(cfg: BootConfig): void {
  const root = document.documentElement;
  const query = new URLSearchParams(location.search);
  const read = (k: string): string | null => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  };
  const write = (k: string, v: string): void => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* storage blocked: the choice lasts for this page view only */
    }
  };

  let strand = query.get('strand');
  if (strand && cfg.available.indexOf(strand) >= 0) write('strand', strand);
  else strand = read('strand');
  if (!strand || cfg.available.indexOf(strand) < 0) strand = cfg.def;
  root.setAttribute('data-strand', strand);

  let mode = query.get('mode');
  if (mode === 'civilian' || mode === 'strand') write('mode', mode);
  else mode = read('mode');
  root.setAttribute('data-mode', mode === 'civilian' ? 'civilian' : 'strand');

  const motion = read('motion');
  const osReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.setAttribute(
    'data-motion',
    motion === 'full' || motion === 'reduced' ? motion : osReduce ? 'reduced' : 'full',
  );

  const theme = document.querySelector('meta[name="theme-color"]');
  const color = cfg.theme[strand];
  if (theme && mode !== 'civilian' && color) theme.setAttribute('content', color);
}
