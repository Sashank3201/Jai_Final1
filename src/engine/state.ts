// Reads and persists the visitor's choices. The source of truth at runtime is <html>'s
// data attributes (set first by boot.ts); this module keeps storage and the URL in step.

import { DEFAULT_STRAND, type StrandId } from '../strands/ids.ts';

export type Mode = 'strand' | 'civilian';
export type Motion = 'full' | 'reduced';

const root = () => document.documentElement;

export function strand(): StrandId {
  return (root().dataset.strand as StrandId | undefined) ?? DEFAULT_STRAND;
}
export function mode(): Mode {
  return root().dataset.mode === 'civilian' ? 'civilian' : 'strand';
}
export function motion(): Motion {
  return root().dataset.motion === 'reduced' ? 'reduced' : 'full';
}
/** True when effects should run: strand mode with full motion. */
export function effectsOn(): boolean {
  return mode() === 'strand' && motion() === 'full';
}

export function persist(key: 'strand' | 'mode' | 'motion' | 'sound', value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked: choice lasts for this page view */
  }
}

/** Keep ?strand= in the address bar so a copied link opens in the same strand. */
export function syncUrl(): void {
  const url = new URL(location.href);
  const s = strand();
  if (s === DEFAULT_STRAND || s === '00') url.searchParams.delete('strand');
  else url.searchParams.set('strand', s);
  if (mode() === 'civilian') url.searchParams.set('mode', 'civilian');
  else url.searchParams.delete('mode');
  if (url.href !== location.href) history.replaceState(history.state, '', url);
}

export type EngineEvent =
  | { type: 'strand'; from: StrandId; to: StrandId }
  | { type: 'mode'; mode: Mode }
  | { type: 'motion'; motion: Motion };

export function emit(detail: EngineEvent): void {
  document.dispatchEvent(new CustomEvent('strands:change', { detail }));
}

export function on(fn: (e: EngineEvent) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<EngineEvent>).detail);
  document.addEventListener('strands:change', h);
  return () => document.removeEventListener('strands:change', h);
}
