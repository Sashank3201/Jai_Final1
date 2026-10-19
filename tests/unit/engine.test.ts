import { describe, expect, it } from 'vitest';
import { slotOf } from '../../src/engine/clock.ts';
import { hash, rng } from '../../src/engine/random.ts';
import { atRest, step } from '../../src/engine/spring.ts';
import { settleEase } from '../../src/strands/registry.ts';
import { strandTokens } from '../../src/strands/tokens.ts';
import { sfxLexicon, voices } from '../../src/strands/voice.ts';

describe('clock tiers', () => {
  it('twos changes slot exactly 12 times a second', () => {
    const slots = new Set<number>();
    for (let t = 0; t < 1000; t += 1000 / 144) slots.add(slotOf(t, 'twos'));
    expect(slots.size).toBe(12);
  });
  it('ones changes slot 24 times a second', () => {
    const slots = new Set<number>();
    for (let t = 0; t < 1000; t += 1000 / 240) slots.add(slotOf(t, 'ones'));
    expect(slots.size).toBe(24);
  });
});

describe('spring', () => {
  it('settles on its target without overshooting when critically damped', () => {
    let s = { x: 0, v: 0 };
    let max = 0;
    for (let i = 0; i < 120; i++) {
      s = step(s, 1, 16);
      max = Math.max(max, s.x);
    }
    expect(max).toBeLessThanOrEqual(1.0001);
    expect(atRest(s, 1, 0.01)).toBe(true);
  });
  it('survives a huge dt from a backgrounded tab', () => {
    const s = step({ x: 0, v: 0 }, 1, 5000);
    expect(Number.isFinite(s.x)).toBe(true);
    expect(Math.abs(s.x)).toBeLessThan(10);
  });
});

describe('seeded randomness', () => {
  it('repeats for a seed', () => {
    const a = rng(hash('x'));
    const b = rng(hash('x'));
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('registry mirrors tokens', () => {
  for (const t of Object.values(strandTokens)) {
    it(`${t.id} settle easing matches tokens.ts`, () => {
      expect(settleEase[t.id]).toBe(t.ease.settle);
    });
  }
});

describe('voice', () => {
  it('every strand fills every key', () => {
    const shape = (o: object): string[] =>
      Object.entries(o).flatMap(([k, v]) =>
        typeof v === 'object' ? shape(v).map((s) => `${k}.${s}`) : [k],
      );
    const ref = shape(voices.c).sort();
    for (const v of Object.values(voices)) expect(shape(v).sort()).toEqual(ref);
    for (const v of Object.values(voices))
      for (const s of Object.values(v.nav)) expect(s.trim()).not.toBe('');
  });
  it('SFX lexicon avoids borrowed comic words', () => {
    const banned =
      /^(BAM|POW|KAPOW|ZAP|WHAM|BOOM|THWACK|SMASH|CRASH|BANG|WHOOSH|SWOOSH|THWIP|KABOOM|SNIKT|BAMF|BIFF|ZOWIE)$/i;
    for (const words of Object.values(sfxLexicon))
      for (const w of words) expect(w).not.toMatch(banned);
  });
});
