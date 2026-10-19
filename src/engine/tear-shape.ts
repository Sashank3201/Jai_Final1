// Geometry for the strand tear.
//
// The old page is clipped with a straight inset() that sweeps across the viewport (the cheapest
// clip for the compositor: benchmarked ~2× faster than an animated polygon in Chromium). The
// jagged edge is a torn-paper band that rides the clip line: ragged on both sides, overlapping
// the old page so its straight cut is never visible, with ink fringes along each torn edge.

import { rng } from './random.ts';

/** Direction the tear travels. 'left' sweeps right→left (desk rail); 'up' sweeps bottom→top (phone strip). */
export type TearDirection = 'left' | 'up';

export interface TearOptions {
  width: number;
  height: number;
  /** Teeth along the edge. */
  points: number;
}

export interface TearShape {
  /** inset() clip for the old page at the start (fully visible) and end (fully gone). */
  clipFrom: string;
  clipTo: string;
  /** Band position along the swept axis (px) at start and end; the band is drawn around 0. */
  start: number;
  end: number;
  /** Closed polygon of the torn band, px, relative to the clip line. */
  band: Array<[number, number]>;
  /** Old-side and new-side torn edges, px, relative to the clip line. */
  oldEdge: Array<[number, number]>;
  newEdge: Array<[number, number]>;
}

export function tearShape(seed: number, dir: TearDirection, opts: TearOptions): TearShape {
  const r = rng(seed);
  const n = Math.max(6, Math.round(opts.points));
  const length = dir === 'left' ? opts.height : opts.width;
  const span = dir === 'left' ? opts.width : opts.height;
  // Teeth scale with the viewport so a phone tear is not a hairline and a wall tear not a ribbon.
  const unit = Math.max(6, Math.min(16, Math.min(opts.width, opts.height) / 60));

  const along: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    along.push(
      i === 0 ? -8 : i === n - 1 ? length + 8 : t * length + (r() - 0.5) * (length / n) * 0.8,
    );
  }
  // Old side: shallow, fibrous. New side: deeper teeth with the occasional long splinter.
  const oldDepth = along.map(() => unit * (0.6 + r() * 1.6));
  const newDepth = along.map(() => unit * (1 + r() * 2.4) * (r() < 0.14 ? 2.3 : 1));

  const pt = (a: number, across: number): [number, number] =>
    dir === 'left' ? [across, a] : [a, across];
  const oldEdge = along.map((a, i) => pt(a, -oldDepth[i]!));
  const newEdge = along.map((a, i) => pt(a, newDepth[i]!));
  const band = [...oldEdge, ...[...newEdge].reverse()];

  const maxOld = Math.max(...oldDepth);
  const maxNew = Math.max(...newDepth);
  const start = span + maxOld + 4;
  const end = -(maxNew + 4);

  const inset = (base: number) => {
    const cut = `${+(span - base).toFixed(1)}px`;
    return dir === 'left' ? `inset(0 ${cut} 0 0)` : `inset(0 0 ${cut} 0)`;
  };

  return { clipFrom: inset(start), clipTo: inset(end), start, end, band, oldEdge, newEdge };
}
