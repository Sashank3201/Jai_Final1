// Client entry. Loaded once by Base.astro; ClientRouter keeps this document alive across
// navigations, so everything here is set up exactly once and re-scanned on each page load.

import { isPublicStrandId } from '../strands/ids.ts';
import { loaders, warmFonts } from '../strands/registry.ts';
import { announce } from './announce.ts';
import * as state from './state.ts';
import { requestStrand } from './transition.ts';
import { refreshTargets, resetVelocity, startVelocity } from './velocity.ts';

const root = document.documentElement;

// ── strand modules ──────────────────────────────────────────────────────────
let unmount: (() => void) | null = null;
let mountedFor = '';
let mountToken = 0;

async function mountStrand() {
  const key = `${state.strand()}|${state.mode()}|${state.motion()}`;
  if (key === mountedFor) return;
  mountedFor = key;
  const token = ++mountToken;
  unmount?.();
  unmount = null;
  if (state.mode() === 'civilian') return;
  const load = loaders[state.strand()];
  if (!load) return;
  const mod = await load();
  if (token !== mountToken) return; // a newer strand won the race
  unmount = mod.mount({ root, motion: state.motion() === 'full' });
}

// ── switcher ────────────────────────────────────────────────────────────────
function syncSwitcher() {
  const current = state.strand();
  for (const input of document.querySelectorAll<HTMLInputElement>('input[name="strand"]')) {
    input.checked = input.value === current;
  }
}

function wireSwitcher() {
  document.addEventListener('change', (e) => {
    const input = e.target;
    if (!(input instanceof HTMLInputElement) || input.name !== 'strand') return;
    if (!isPublicStrandId(input.value)) return;
    const origin = window.innerWidth < 600 ? 'strip' : 'rail';
    requestStrand(input.value, origin);
  });
  // Warm a strand's fonts and code as soon as the visitor shows intent.
  const warm = (e: Event) => {
    const label = (e.target as Element | null)?.closest?.('[data-strand-option]');
    const id = label?.getAttribute('data-strand-option');
    if (!id || !isPublicStrandId(id)) return;
    void warmFonts(id);
    void loaders[id]?.();
  };
  document.addEventListener('pointerover', warm, { passive: true });
  document.addEventListener('focusin', warm);
  document.addEventListener('touchstart', warm, { passive: true });
  // Mid-tear, the browser hit-tests the root element, not what is under the pointer, so the
  // switcher cannot be clicked. Hit-test it ourselves so a second switch can interrupt the first.
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (!root.dataset.vt) return;
      for (const label of document.querySelectorAll<HTMLElement>('[data-strand-option]')) {
        const r = label.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
          continue;
        const id = label.dataset.strandOption;
        const input = label.querySelector('input');
        if (!id || !isPublicStrandId(id) || !input) return;
        input.checked = true;
        requestStrand(id, window.innerWidth < 600 ? 'strip' : 'rail');
        return;
      }
    },
    true,
  );
  // The switcher form exists for no-JS visitors; with JS the change handler does the work.
  document.addEventListener('submit', (e) => {
    if ((e.target as Element).matches('.switcher')) e.preventDefault();
  });
}

// ── toggles ─────────────────────────────────────────────────────────────────
function syncToggles() {
  // The civilian button is an action ("strip the ink" / "back to the strands"), not a toggle
  // with a fixed label, so it carries no aria-pressed. Motion keeps one label and a pressed state.
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-toggle="motion"]')) {
    b.setAttribute('aria-pressed', String(state.motion() === 'reduced'));
  }
}

function withFade(update: () => void) {
  if (state.motion() === 'full' && typeof document.startViewTransition === 'function') {
    root.dataset.vt = 'fade';
    const vt = document.startViewTransition(update);
    void vt.finished.finally(() => delete root.dataset.vt);
  } else {
    update();
  }
}

function wireToggles() {
  document.addEventListener('click', (e) => {
    const button = (e.target as Element | null)?.closest?.('[data-toggle]');
    if (!(button instanceof HTMLButtonElement)) return;
    const kind = button.dataset.toggle;
    if (kind === 'civilian') {
      const next: state.Mode = state.mode() === 'civilian' ? 'strand' : 'civilian';
      withFade(() => {
        root.dataset.mode = next;
        state.persist('mode', next);
        state.syncUrl();
        syncToggles();
      });
      announce(
        next === 'civilian'
          ? 'Civilian mode. Plain document view.'
          : `Back to strand ${state.strand()}.`,
      );
      state.emit({ type: 'mode', mode: next });
    } else if (kind === 'motion') {
      const next: state.Motion = state.motion() === 'full' ? 'reduced' : 'full';
      root.dataset.motion = next;
      state.persist('motion', next);
      syncToggles();
      if (next === 'reduced') resetVelocity();
      announce(next === 'reduced' ? 'Motion paused.' : 'Motion on.');
      state.emit({ type: 'motion', motion: next });
    }
  });
}

// ── navigation (ClientRouter) ───────────────────────────────────────────────
const CARRIED = ['data-strand', 'data-mode', 'data-motion', 'data-cursor'];

function wireNavigation() {
  document.addEventListener('astro:before-swap', (e) => {
    const next = (e as Event & { newDocument: Document }).newDocument.documentElement;
    for (const attr of CARRIED) {
      const v = root.getAttribute(attr);
      if (v === null) next.removeAttribute(attr);
      else next.setAttribute(attr, v);
    }
  });
  document.addEventListener('astro:page-load', () => {
    refreshTargets();
    syncSwitcher();
    syncToggles();
    state.syncUrl();
    document.dispatchEvent(new CustomEvent('strands:page'));
  });
}

// ── boot ────────────────────────────────────────────────────────────────────
function init() {
  wireSwitcher();
  wireToggles();
  wireNavigation();
  startVelocity();
  syncSwitcher();
  syncToggles();
  state.on((e) => {
    if (e.type === 'strand') syncSwitcher();
    void mountStrand();
  });
  // Follow the OS setting live unless the visitor chose explicitly on this site.
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (q) => {
    let explicit: string | null = null;
    try {
      explicit = localStorage.getItem('motion');
    } catch {
      /* storage blocked */
    }
    if (explicit) return;
    root.dataset.motion = q.matches ? 'reduced' : 'full';
    syncToggles();
    state.emit({ type: 'motion', motion: state.motion() });
  });
  void mountStrand();
}

init();
