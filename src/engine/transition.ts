// THE TEAR (DESIGN.md §2.5). Charge → tear → settle, under 900 ms, never blocking input.
//
//   charge  0–160 ms   --ab ramps 0→1, plates fly apart; the target strand's fonts load
//   tear    ~180–680   View Transition: the old page (snapshotted mid-aberration) is cut away by a
//                      clip sweeping from the switcher, a ragged torn-paper band riding the cut;
//                      the new strand re-typesets live underneath
//   settle  ~680–820   --ab returns to 0 on the target strand's own settle curve
// The ~20 ms between charge and tear is the browser taking its snapshot.
//
// Interrupts: a request made mid-tear becomes the next target (requests collapse to the latest),
// running animations jump to 6× speed, and the next tear starts from whatever is on screen.

import { strandName, type StrandId } from '../strands/ids.ts';
import { settleEase, warmFonts } from '../strands/registry.ts';
import { announce } from './announce.ts';
import { hash } from './random.ts';
import * as state from './state.ts';
import { tearShape, type TearDirection, type TearShape } from './tear-shape.ts';

export type Origin = 'rail' | 'strip' | 'key';

const CHARGE = 160;
const TEAR = 500;
const SETTLE = 140;
const FADE = 240;
const EASE_CHARGE = 'cubic-bezier(0.7, 0, 0.9, 0.4)';
const EASE_TEAR = 'cubic-bezier(0.76, 0, 0.24, 1)';
const SPEEDUP = 6;

interface Request {
  to: StrandId;
  origin: Origin;
}

let running = false;
let queued: Request | null = null;
let hurry: () => void = () => {};
let hurried: Promise<void> = Promise.resolve();
let switches = 0;

/** Timestamps of every switch request, newest last. Read by the secrets module. */
export const intents: number[] = [];

const root = () => document.documentElement;
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function seedFor(): number {
  const fixed = new URLSearchParams(location.search).get('seed');
  return fixed ? hash(`${fixed}:${switches}`) : (Math.random() * 2 ** 32) >>> 0;
}

/** Ask for a strand. Never blocks: mid-tear requests are queued and the tear is hurried. */
export function requestStrand(to: StrandId, origin: Origin = 'key'): void {
  intents.push(performance.now());
  if (intents.length > 20) intents.shift();
  document.dispatchEvent(new CustomEvent('strands:intent', { detail: { to } }));
  if (running) {
    queued = { to, origin };
    speedUp();
    return;
  }
  void start({ to, origin });
}

async function start(req: Request): Promise<void> {
  if (req.to === state.strand()) return;
  running = true;
  hurried = new Promise<void>((r) => (hurry = r));
  try {
    await run(req);
  } finally {
    running = false;
    const next = queued;
    queued = null;
    if (next) void start(next);
  }
}

function speedUp() {
  hurry();
  for (const a of document.getAnimations()) {
    const effect = a.effect as KeyframeEffect | null;
    if (a.id.startsWith('tear') || effect?.pseudoElement?.startsWith('::view-transition')) {
      a.playbackRate = SPEEDUP;
    }
  }
}

/** Resolves after `ms`, or immediately once the tear is hurried. */
function phase(ms: number): Promise<void> {
  return Promise.race([wait(ms), hurried]);
}

function apply(to: StrandId) {
  const from = state.strand();
  root().dataset.strand = to;
  if (to !== '00') state.persist('strand', to);
  state.syncUrl();
  const theme = document.querySelector('meta[name="theme-color"]');
  const color = getComputedStyle(root()).getPropertyValue('--bg').trim();
  if (theme && color) theme.setAttribute('content', color);
  state.emit({ type: 'strand', from, to });
  announce(`Strand ${to}, ${strandName(to)}.`);
}

interface Anchor {
  el: HTMLElement;
  top: number;
}

/** The section the reader is looking at, so a reflowing layout doesn't lose their place. */
function captureAnchor(): Anchor | null {
  if (window.scrollY < 4) return null;
  for (const el of document.querySelectorAll<HTMLElement>('[data-anchor]')) {
    const r = el.getBoundingClientRect();
    if (r.bottom > window.innerHeight * 0.25) return { el, top: r.top };
  }
  return null;
}

function restoreAnchor(a: Anchor | null) {
  if (!a) return;
  const delta = a.el.getBoundingClientRect().top - a.top;
  if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: 'instant' });
}

const SVG = 'http://www.w3.org/2000/svg';

/** The torn-paper band that rides the clip line. Lives only in the new DOM, named for the VT. */
function buildEdge(shape: TearShape, dir: TearDirection): HTMLElement {
  const host = document.createElement('div');
  host.className = 'tear-edge';
  host.dataset.dir = dir;
  host.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
  const pts = (list: Array<[number, number]>) =>
    list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const draw = (tag: 'polygon' | 'polyline', cls: string, list: Array<[number, number]>) => {
    const el = document.createElementNS(SVG, tag);
    el.setAttribute('points', pts(list));
    el.setAttribute('class', cls);
    svg.append(el);
  };
  draw('polyline', 'fuzz', shape.oldEdge);
  draw('polyline', 'fuzz', shape.newEdge);
  draw('polygon', 'paper', shape.band);
  draw('polyline', 'ink-old', shape.oldEdge);
  draw('polyline', 'ink-new', shape.newEdge);
  host.append(svg);
  return host;
}

async function run({ to, origin }: Request): Promise<void> {
  const el = root();
  const canVT = typeof document.startViewTransition === 'function';
  switches++;
  performance.mark('tear:start');

  if (state.motion() === 'reduced' || state.mode() === 'civilian') {
    // Reduced motion: a plain opacity crossfade. No aberration, no tear.
    if (!canVT || state.mode() === 'civilian') {
      apply(to);
    } else {
      el.dataset.vt = 'fade';
      const vt = document.startViewTransition(() => apply(to));
      await Promise.race([vt.finished.catch(() => {}), wait(FADE + 200)]);
      delete el.dataset.vt;
    }
    performance.measure('strand-tear', 'tear:start');
    return;
  }

  // ── charge ───────────────────────────────────────────────────────────────
  el.dataset.vt = 'strand';
  const charge = el.animate([{ '--ab': 0 }, { '--ab': 1 }], {
    duration: CHARGE,
    easing: EASE_CHARGE,
    fill: 'forwards',
    id: 'tear-charge',
  });
  // Fonts get the charge window to arrive; a late swap hides under the aberration.
  void warmFonts(to);
  await phase(CHARGE);
  performance.mark('tear:charged');

  if (!canVT) {
    // No View Transitions: hard cut, then the settle.
    apply(to);
  } else {
    // ── tear ─────────────────────────────────────────────────────────────────
    const dir: TearDirection = origin === 'strip' ? 'up' : 'left';
    const seed = seedFor();
    const shape = tearShape(seed, dir, {
      width: window.innerWidth,
      height: window.innerHeight,
      points: 26 + (seed % 14),
    });
    const edge = buildEdge(shape, dir);
    const anchor = captureAnchor();
    const vt = document.startViewTransition(() => {
      apply(to);
      document.body.append(edge);
      el.dataset.typeset = '';
      restoreAnchor(anchor);
    });
    const running: Animation[] = [];
    try {
      await vt.ready;
      performance.mark('tear:ready');
      const axis = dir === 'left' ? 'X' : 'Y';
      const px = (v: number) => `translate${axis}(${v.toFixed(1)}px)`;
      const timing: KeyframeAnimationOptions = {
        duration: TEAR,
        easing: EASE_TEAR,
        fill: 'both',
      };
      running.push(
        el.animate(
          { clipPath: [shape.clipFrom, shape.clipTo] },
          { ...timing, id: 'tear-clip', pseudoElement: '::view-transition-old(root)' },
        ),
        el.animate(
          { transform: [px(shape.start), px(shape.end)] },
          { ...timing, id: 'tear-edge', pseudoElement: '::view-transition-group(tear-edge)' },
        ),
      );
      if (queued) speedUp();
      await vt.finished;
      performance.mark('tear:torn');
    } catch {
      // Skipped (e.g. a page navigation started): the DOM is already in the new strand.
    } finally {
      // Pseudo-element animations outlive their pseudo-elements unless cancelled.
      for (const a of running) a.cancel();
      edge.remove();
    }
  }
  delete el.dataset.vt;

  // ── settle ─────────────────────────────────────────────────────────────────
  charge.cancel();
  const settle = el.animate([{ '--ab': 1 }, { '--ab': 0 }], {
    duration: SETTLE,
    easing: settleEase[to] ?? EASE_TEAR,
    id: 'tear-settle',
  });
  if (queued) settle.playbackRate = SPEEDUP;
  await settle.finished.catch(() => {});
  delete el.dataset.typeset;
  performance.measure('strand-tear', 'tear:start');
}
