import { describe, expect, it } from 'vitest';
import { tearShape } from '../../src/engine/tear-shape.ts';

const dims = { width: 1440, height: 900, points: 30 };

describe('tearShape', () => {
  it('is deterministic for a seed and different across seeds', () => {
    expect(tearShape(42, 'left', dims)).toEqual(tearShape(42, 'left', dims));
    expect(tearShape(42, 'left', dims).band).not.toEqual(tearShape(43, 'left', dims).band);
  });

  for (const dir of ['left', 'up'] as const) {
    it(`${dir}: starts fully showing the old page and ends with it gone`, () => {
      const s = tearShape(7, dir, dims);
      const span = dir === 'left' ? dims.width : dims.height;
      const across = (p: [number, number]) => (dir === 'left' ? p[0] : p[1]);
      // At the start the whole band sits beyond the far edge; at the end, before the near edge.
      expect(Math.min(...s.band.map(across)) + s.start).toBeGreaterThanOrEqual(span);
      expect(Math.max(...s.band.map(across)) + s.end).toBeLessThanOrEqual(0);
      const cut = (clip: string) => Number(/(-?[\d.]+)px/.exec(clip)![1]);
      expect(cut(s.clipFrom)).toBeLessThan(0);
      expect(cut(s.clipTo)).toBeGreaterThan(span);
    });

    it(`${dir}: band is a closed ragged strip covering the full length`, () => {
      const s = tearShape(11, dir, dims);
      const length = dir === 'left' ? dims.height : dims.width;
      const along = (p: [number, number]) => (dir === 'left' ? p[1] : p[0]);
      expect(s.band).toHaveLength(s.oldEdge.length * 2);
      expect(Math.min(...s.oldEdge.map(along))).toBeLessThanOrEqual(0);
      expect(Math.max(...s.oldEdge.map(along))).toBeGreaterThanOrEqual(length);
      const depths = s.newEdge.map((p) => (dir === 'left' ? p[0] : p[1]));
      expect(new Set(depths.map((d) => Math.round(d))).size).toBeGreaterThan(5);
    });
  }
});
