// STRAND-01 runtime: misregistered cursor, ink stamps, and the hero plates on twos.

import { subscribe } from '../../engine/clock.ts';
import type { StrandContext } from '../registry.ts';

const HOT =
  'a, button, label, summary, [role="button"], input[type="radio"], input[type="checkbox"]';

function mountCursor(root: HTMLElement, motion: boolean): () => void {
  const fine = matchMedia('(pointer: fine) and (hover: hover)').matches;
  const layer = document.createElement('div');
  layer.className = 'stamps';
  layer.setAttribute('aria-hidden', 'true');
  layer.dataset.deco = '';
  document.body.append(layer);

  const stamp = (x: number, y: number, touch: boolean) => {
    if (!motion) return;
    const s = document.createElement('span');
    s.className = touch ? 'stamp stamp--touch' : 'stamp';
    s.style.translate = `${x}px ${y}px`;
    s.addEventListener('animationend', () => s.remove(), { once: true });
    layer.append(s);
  };

  let cursor: HTMLElement | null = null;
  let spread = 0;
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  let stopDecay: (() => void) | null = null;

  const decay = (_now: number, dt: number) => {
    spread *= Math.pow(0.0025, (dt || 16) / 1000);
    cursor?.style.setProperty('--spread', spread.toFixed(2));
    if (spread < 0.05) {
      spread = 0;
      cursor?.style.setProperty('--spread', '0');
      stopDecay?.();
      stopDecay = null;
    }
  };

  const move = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || !cursor) return;
    cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    cursor.dataset.on = '';
    if (!motion) return;
    const dt = e.timeStamp - lastT || 16;
    const speed = Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt;
    lastX = e.clientX;
    lastY = e.clientY;
    lastT = e.timeStamp;
    spread = Math.min(10, Math.max(spread, speed * 4));
    cursor.style.setProperty('--spread', spread.toFixed(2));
    if (!stopDecay) stopDecay = subscribe('smooth', decay);
  };
  const over = (e: PointerEvent) => {
    if (!cursor) return;
    const hot = (e.target as Element | null)?.closest?.(HOT);
    if (hot) cursor.dataset.hot = '';
    else delete cursor.dataset.hot;
  };
  const leave = () => cursor && delete cursor.dataset.on;
  const down = (e: PointerEvent) => stamp(e.clientX, e.clientY, e.pointerType !== 'mouse');

  if (fine) {
    cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.dataset.deco = '';
    cursor.innerHTML =
      '<span class="cursor__ring cursor__ring--a"></span><span class="cursor__ring cursor__ring--b"></span><span class="cursor__dot"></span>';
    document.body.append(cursor);
    root.dataset.cursor = '01';
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
  }
  window.addEventListener('pointerdown', down, { passive: true });

  return () => {
    window.removeEventListener('pointermove', move);
    document.removeEventListener('pointerover', over);
    document.documentElement.removeEventListener('pointerleave', leave);
    window.removeEventListener('pointerdown', down);
    stopDecay?.();
    cursor?.remove();
    layer.remove();
    if (root.dataset.cursor === '01') delete root.dataset.cursor;
  };
}

/**
 * Hero plates on twos: the off-register plate boils by a pixel twelve times a second and drifts
 * into register as the hero scrolls away (the resolve mechanic).
 */
function mountPlates(): () => void {
  let heroes: HTMLElement[] = [];
  let visible = new Set<HTMLElement>();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) visible.add(e.target as HTMLElement);
      else visible.delete(e.target as HTMLElement);
    }
  });
  const scan = () => {
    io.disconnect();
    visible = new Set();
    heroes = Array.from(document.querySelectorAll<HTMLElement>('[data-resolve]'));
    heroes.forEach((h) => io.observe(h));
  };
  scan();
  document.addEventListener('strands:page', scan);

  const tick = () => {
    for (const hero of visible) {
      const range = Math.max(1, hero.offsetHeight * 0.55);
      const p = Math.min(1, Math.max(0, (window.scrollY - hero.offsetTop) / range));
      hero.style.setProperty('--resolve', p.toFixed(3));
      hero.style.setProperty('--boil-x', `${((Math.random() - 0.5) * 1.6).toFixed(2)}px`);
      hero.style.setProperty('--boil-y', `${((Math.random() - 0.5) * 1.2).toFixed(2)}px`);
    }
  };
  const stop = subscribe('twos', tick);

  return () => {
    stop();
    io.disconnect();
    document.removeEventListener('strands:page', scan);
    for (const h of heroes) {
      h.style.removeProperty('--resolve');
      h.style.removeProperty('--boil-x');
      h.style.removeProperty('--boil-y');
    }
  };
}

export function mount({ root, motion }: StrandContext): () => void {
  const offs = [mountCursor(root, motion)];
  if (motion) offs.push(mountPlates());
  return () => offs.forEach((off) => off());
}
