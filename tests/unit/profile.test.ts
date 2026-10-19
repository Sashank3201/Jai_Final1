import { describe, expect, it } from 'vitest';
import { profile } from '../../content/profile.ts';

describe('content/profile.ts', () => {
  it('every case-study number says how it was measured', () => {
    for (const c of profile.work) {
      for (const [k, m] of Object.entries(c.numbers)) {
        expect(m.method.trim().length, `${c.slug}.${k}`).toBeGreaterThan(10);
      }
    }
  });
  it('case studies carry the full template', () => {
    for (const c of profile.work) {
      expect(c.decisions.length).toBeGreaterThan(0);
      for (const d of c.decisions)
        expect(d.rejected.length, `${c.slug} ${d.area}`).toBeGreaterThan(0);
      expect(c.evaluation.set.stages.length).toBeGreaterThan(1);
      expect(c.evaluation.metrics.length).toBeGreaterThan(0);
      expect(c.failure.body.length).toBeGreaterThan(40);
      expect(c.retrospective.changes.length).toBeGreaterThan(0);
      const ids = new Set(c.architecture.nodes.map((n) => n.id));
      for (const e of c.architecture.edges) {
        expect(ids.has(e.from) && ids.has(e.to), `${c.slug} ${e.from}->${e.to}`).toBe(true);
      }
    }
  });
  it('slugs and issue numbers are unique', () => {
    expect(new Set(profile.work.map((c) => c.slug)).size).toBe(profile.work.length);
    expect(new Set(profile.work.map((c) => c.issue)).size).toBe(profile.work.length);
  });
  it('proof points point at real case studies', () => {
    const slugs = new Set(profile.work.map((c) => c.slug));
    for (const p of profile.pitch.proofPoints) expect(slugs.has(p.caseStudy)).toBe(true);
  });
  it('margin note fits the margin', () => {
    expect(profile.pitch.marginNote.length).toBeLessThanOrEqual(50);
  });
});
