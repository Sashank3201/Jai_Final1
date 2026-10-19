// Scroll velocity → chromatic aberration. Fast scroll pushes the plates apart; when scrolling
// stops a stiff spring snaps them back. Writes `--abv` (signed, −1…1) on [data-ab] elements only,
// so a scroll frame restyles a handful of headings, not the whole document.

import { subscribe } from './clock.ts';
import { atRest, step, type Spring } from './spring.ts';
import { effectsOn } from './state.ts';

/** px/ms of scroll that maps to full aberration. */
const FULL = 3;

let spring: Spring = { x: 0, v: 0 };
let lastY = 0;
let lastT = 0;
let stop: (() => void) | null = null;
let targets: HTMLElement[] = [];

export function refreshTargets(): void {
  targets = Array.from(document.querySelectorAll<HTMLElement>('[data-ab]'));
}

function write(x: number) {
  const v = x.toFixed(3);
  for (const el of targets) el.style.setProperty('--abv', v);
}

function tick(now: number, dt: number) {
  const y = window.scrollY;
  const elapsed = now - lastT || 16;
  const velocity = (y - lastY) / elapsed;
  lastY = y;
  lastT = now;
  const target = Math.max(-1, Math.min(1, velocity / FULL));
  spring = step(spring, target, dt || 16, 620, 0.9);
  write(spring.x);
  if (target === 0 && atRest(spring, 0)) {
    spring = { x: 0, v: 0 };
    write(0);
    stop?.();
    stop = null;
  }
}

function onScroll() {
  if (stop || !effectsOn()) return;
  lastY = window.scrollY;
  lastT = performance.now();
  stop = subscribe('smooth', tick);
}

export function startVelocity(): void {
  refreshTargets();
  window.addEventListener('scroll', onScroll, { passive: true });
}

export function resetVelocity(): void {
  stop?.();
  stop = null;
  spring = { x: 0, v: 0 };
  write(0);
}
