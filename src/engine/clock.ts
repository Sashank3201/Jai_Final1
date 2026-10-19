// One requestAnimationFrame loop with frame-rate tiers (DESIGN.md §2.4).
//   twos   12 fps  chunky, hand-animated feel: display plates, SFX, counters
//   ones   24 fps  film grain, speed lines
//   smooth every frame: drift, springs
// A tier subscriber only runs when its frame boundary is crossed, so a "twos" animation
// genuinely updates twelve times a second regardless of the display's refresh rate.

export type Tier = 'twos' | 'ones' | 'smooth';
type Tick = (now: number, dt: number) => void;

const period: Record<Tier, number> = { twos: 1000 / 12, ones: 1000 / 24, smooth: 0 };

interface Sub {
  tier: Tier;
  fn: Tick;
  last: number;
  slot: number;
}

const subs = new Set<Sub>();
let raf = 0;

/** Index of the frame slot `now` falls in for a tier. Exported for tests. */
export function slotOf(now: number, tier: Tier): number {
  return tier === 'smooth' ? now : Math.floor(now / period[tier]);
}

function frame(now: number) {
  raf = 0;
  for (const s of subs) {
    const slot = slotOf(now, s.tier);
    if (s.tier !== 'smooth' && slot === s.slot) continue;
    const dt = s.last ? now - s.last : 0;
    s.slot = slot;
    s.last = now;
    s.fn(now, dt);
  }
  if (subs.size && !document.hidden) raf = requestAnimationFrame(frame);
}

export function subscribe(tier: Tier, fn: Tick): () => void {
  const sub: Sub = { tier, fn, last: 0, slot: -1 };
  subs.add(sub);
  if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
  return () => {
    subs.delete(sub);
    if (!subs.size && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && subs.size && !raf) {
      for (const s of subs) s.last = 0;
      raf = requestAnimationFrame(frame);
    }
  });
}
