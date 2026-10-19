// WCAG AA for every text/background pair each strand declares (DESIGN.md §1.3).
import { describe, expect, it } from 'vitest';
import { civilian, strandTokens } from '../../src/strands/tokens.ts';
import { contrast } from './wcag.ts';

describe('strand palettes meet WCAG AA', () => {
  for (const t of Object.values(strandTokens)) {
    for (const pair of t.contrast) {
      const need = pair.large ? 3 : 4.5;
      it(`${t.id} ${t.name}: ${pair.note} (${pair.fg} on ${pair.bg}) ≥ ${need}`, () => {
        expect(contrast(pair.fg, pair.bg)).toBeGreaterThanOrEqual(need);
      });
    }
  }
  for (const pair of civilian.contrast) {
    it(`civilian: ${pair.note} ≥ 4.5`, () => {
      expect(contrast(pair.fg, pair.bg)).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe('semantic text colors are covered by a checked pair', () => {
  for (const t of Object.values(strandTokens)) {
    const pairs = new Set(t.contrast.filter((p) => !p.large).map((p) => `${p.fg}|${p.bg}`));
    const c = t.color;
    const required: Array<[string, string, string]> = [
      ['fg on bg', c.fg, c.bg],
      ['fgDim on bg', c.fgDim, c.bg],
      ['panelFg on panel', c.panelFg, c.panel],
      ['panelFgDim on panel', c.panelFgDim, c.panel],
      ['ink1OnBg on bg', c.ink1OnBg, c.bg],
      ['ink1OnPanel on panel', c.ink1OnPanel, c.panel],
    ];
    for (const [label, fg, bg] of required) {
      it(`${t.id}: ${label}`, () => {
        expect(pairs.has(`${fg}|${bg}`) || contrast(fg, bg) >= 4.5).toBe(true);
        expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
