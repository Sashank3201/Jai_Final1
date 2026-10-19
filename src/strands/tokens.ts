// Design tokens per strand. Mirrors DESIGN.md §3–6; `pnpm tokens:check` fails on drift.
// scripts/build-tokens.ts turns this into src/styles/tokens.generated.css.
//
// Components only read the semantic custom properties (--bg, --fg, --font-display, --ease-move…).
// Each strand maps those semantics onto its own palette, faces and curves.

import type { StrandId } from './ids.ts';

export interface Semantic {
  /** Page ground and its text. */
  bg: string;
  fg: string;
  fgDim: string;
  /** Panel stock and its text. */
  panel: string;
  panelFg: string;
  panelFgDim: string;
  /** Two inks/plates used for misregistration, aberration and accents. */
  ink1: string;
  ink2: string;
  /** Ink colors safe for text on the page ground. */
  ink1OnBg: string;
  ink2OnBg: string;
  /** Ink colors safe for text on panels. */
  ink1OnPanel: string;
  ink2OnPanel: string;
  rule: string;
  focus1: string;
  focus2: string;
}

export interface StrandTokens {
  id: StrandId;
  name: string;
  themeColor: string;
  palette: Record<string, string>;
  color: Semantic;
  font: { display: string; text: string; accent: string; hud: string };
  ease: Record<string, string> & { snap: string; move: string; wipe: string; settle: string };
  dur: { snap: string; move: string; wipe: string };
  /** Type scale: fs0…fs6 then splash. */
  fs: [string, string, string, string, string, string, string, string];
  space: number[];
  gutter: string;
  columns: { phone: number; tablet: number; desk: number; wall: number };
  /** Text/background pairs checked for WCAG AA by tests/unit/contrast.test.ts. */
  contrast: Array<{ fg: string; bg: string; large?: boolean; note: string }>;
}

const brooklyn: StrandTokens = {
  id: '01',
  name: 'Brooklyn Press',
  themeColor: '#0C0A12',
  palette: {
    paper: '#0C0A12',
    stock: '#EFE6D2',
    inkMagenta: '#FF2E88',
    inkCyan: '#00E5FF',
    text: '#EFE6D2',
    textDim: '#A79C8C',
    inkBlack: '#0C0A12',
    pressMagenta: '#B8005A',
    pressCyan: '#00606E',
    stockDim: '#5E5548',
  },
  color: {
    bg: '#0C0A12',
    fg: '#EFE6D2',
    fgDim: '#A79C8C',
    panel: '#EFE6D2',
    panelFg: '#0C0A12',
    panelFgDim: '#5E5548',
    ink1: '#FF2E88',
    ink2: '#00E5FF',
    ink1OnBg: '#FF2E88',
    ink2OnBg: '#00E5FF',
    ink1OnPanel: '#B8005A',
    ink2OnPanel: '#00606E',
    rule: '#EFE6D2',
    focus1: '#FF2E88',
    focus2: '#00E5FF',
  },
  font: {
    display: 'var(--font-anybody)',
    text: 'var(--font-archivo)',
    accent: 'var(--font-marker)',
    hud: 'var(--font-archivo)',
  },
  ease: {
    squeegee: 'cubic-bezier(0.83, 0, 0.17, 1)',
    plateSlam: 'cubic-bezier(0.7, 0, 0.84, 0)',
    inkKick: 'cubic-bezier(0.2, 1.4, 0.4, 1)',
    snap: 'cubic-bezier(0.2, 1.4, 0.4, 1)',
    move: 'cubic-bezier(0.83, 0, 0.17, 1)',
    wipe: 'cubic-bezier(0.83, 0, 0.17, 1)',
    settle: 'cubic-bezier(0.3, 0.7, 0.2, 1)',
  },
  dur: { snap: '120ms', move: '320ms', wipe: '540ms' },
  fs: [
    '1.125rem',
    '1.4rem',
    '1.75rem',
    '2.2rem',
    '2.75rem',
    'clamp(3.5rem, 9vw, 7rem)',
    'clamp(4.5rem, 14vw, 13rem)',
    'clamp(10rem, 40vw, 36rem)',
  ],
  space: [4, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64, 96],
  gutter: '12px',
  columns: { phone: 4, tablet: 8, desk: 12, wall: 12 },
  contrast: [
    { fg: '#EFE6D2', bg: '#0C0A12', note: 'text on night stock' },
    { fg: '#A79C8C', bg: '#0C0A12', note: 'dim text on night stock' },
    { fg: '#FF2E88', bg: '#0C0A12', note: 'magenta ink on night' },
    { fg: '#00E5FF', bg: '#0C0A12', note: 'cyan ink on night' },
    { fg: '#0C0A12', bg: '#EFE6D2', note: 'ink on cream' },
    { fg: '#5E5548', bg: '#EFE6D2', note: 'dim ink on cream' },
    { fg: '#B8005A', bg: '#EFE6D2', note: 'press magenta on cream' },
    { fg: '#00606E', bg: '#EFE6D2', note: 'press cyan on cream' },
  ],
};

const wetDusk: StrandTokens = {
  id: '02',
  name: 'Wet Dusk',
  themeColor: '#FFD9E8',
  palette: {
    paper: '#FBF6EF',
    blush: '#FFD9E8',
    teal: '#9FE3DA',
    lavender: '#D9CCF2',
    ink: '#2E1F3A',
    inkSoft: '#5B4A68',
    inkRose: '#7A2F5E',
  },
  color: {
    bg: '#FBF6EF',
    fg: '#2E1F3A',
    fgDim: '#5B4A68',
    panel: '#FFD9E8',
    panelFg: '#2E1F3A',
    panelFgDim: '#5B4A68',
    ink1: '#FFD9E8',
    ink2: '#9FE3DA',
    ink1OnBg: '#7A2F5E',
    ink2OnBg: '#2E1F3A',
    ink1OnPanel: '#7A2F5E',
    ink2OnPanel: '#2E1F3A',
    rule: '#5B4A68',
    focus1: '#2E1F3A',
    focus2: '#9FE3DA',
  },
  font: {
    display: 'var(--font-bodoni)',
    text: 'var(--font-newsreader)',
    accent: 'var(--font-bodoni)',
    hud: 'var(--font-newsreader)',
  },
  ease: {
    seep: 'cubic-bezier(0.32, 0, 0.15, 1)',
    bloom: 'cubic-bezier(0.16, 1, 0.3, 1)',
    float: 'cubic-bezier(0.37, 0, 0.63, 1)',
    snap: 'cubic-bezier(0.16, 1, 0.3, 1)',
    move: 'cubic-bezier(0.32, 0, 0.15, 1)',
    wipe: 'cubic-bezier(0.16, 1, 0.3, 1)',
    settle: 'cubic-bezier(0.22, 0.8, 0.3, 1)',
  },
  dur: { snap: '240ms', move: '700ms', wipe: '1200ms' },
  fs: [
    '1.1875rem',
    '1.58rem',
    '2.1rem',
    '2.8rem',
    '3.75rem',
    'clamp(3.5rem, 7vw, 6.5rem)',
    'clamp(4rem, 10vw, 9rem)',
    'clamp(8rem, 30vw, 26rem)',
  ],
  space: [8, 13, 21, 34, 55, 89, 144],
  gutter: '48px',
  columns: { phone: 2, tablet: 4, desk: 6, wall: 6 },
  contrast: [
    { fg: '#2E1F3A', bg: '#FBF6EF', note: 'ink on paper' },
    { fg: '#2E1F3A', bg: '#FFD9E8', note: 'ink on blush' },
    { fg: '#2E1F3A', bg: '#9FE3DA', note: 'ink on teal' },
    { fg: '#2E1F3A', bg: '#D9CCF2', note: 'ink on lavender (drift worst case)' },
    { fg: '#5B4A68', bg: '#FBF6EF', note: 'soft ink on paper' },
    { fg: '#5B4A68', bg: '#FFD9E8', note: 'soft ink on blush' },
    { fg: '#5B4A68', bg: '#9FE3DA', note: 'soft ink on teal' },
    { fg: '#5B4A68', bg: '#D9CCF2', note: 'soft ink on lavender' },
    { fg: '#7A2F5E', bg: '#FFD9E8', note: 'rose ink on blush' },
    { fg: '#7A2F5E', bg: '#D9CCF2', note: 'rose ink on lavender' },
    { fg: '#7A2F5E', bg: '#9FE3DA', note: 'rose ink on teal' },
  ],
};

const lateEdition: StrandTokens = {
  id: '03',
  name: 'Late Edition',
  themeColor: '#111111',
  palette: {
    paper: '#EFEDE6',
    ink: '#111111',
    inkGrey: '#5C5C5C',
    night: '#111111',
    nightText: '#EFEDE6',
    nightGrey: '#9A9A9A',
    spot: '#C41E14',
  },
  color: {
    bg: '#EFEDE6',
    fg: '#111111',
    fgDim: '#5C5C5C',
    panel: '#111111',
    panelFg: '#EFEDE6',
    panelFgDim: '#9A9A9A',
    ink1: '#111111',
    ink2: '#5C5C5C',
    ink1OnBg: '#111111',
    ink2OnBg: '#5C5C5C',
    ink1OnPanel: '#EFEDE6',
    ink2OnPanel: '#9A9A9A',
    rule: '#111111',
    focus1: '#111111',
    focus2: '#EFEDE6',
  },
  font: {
    display: 'var(--font-stint)',
    text: 'var(--font-noticia)',
    accent: 'var(--font-grenze)',
    hud: 'var(--font-noticia)',
  },
  ease: {
    cut: 'steps(1, jump-end)',
    shutter: 'steps(4, jump-none)',
    ratchet: 'steps(6, end)',
    snap: 'steps(1, jump-end)',
    move: 'steps(4, jump-none)',
    wipe: 'steps(4, jump-none)',
    settle: 'steps(3, jump-none)',
  },
  dur: { snap: '80ms', move: '240ms', wipe: '320ms' },
  fs: [
    '1.0625rem',
    '1.275rem',
    '1.53rem',
    '1.84rem',
    '2.2rem',
    'clamp(3rem, 8vw, 6.5rem)',
    'clamp(4rem, 12vw, 10rem)',
    'clamp(9rem, 34vw, 30rem)',
  ],
  space: [4, 6, 8, 12, 16, 20, 24, 32, 48],
  gutter: '16px',
  columns: { phone: 2, tablet: 4, desk: 6, wall: 8 },
  contrast: [
    { fg: '#111111', bg: '#EFEDE6', note: 'ink on newsprint' },
    { fg: '#5C5C5C', bg: '#EFEDE6', note: 'grey on newsprint' },
    { fg: '#C41E14', bg: '#EFEDE6', note: 'spot on newsprint' },
    { fg: '#EFEDE6', bg: '#111111', note: 'paper on shadow' },
    { fg: '#9A9A9A', bg: '#111111', note: 'grey on shadow' },
    { fg: '#C41E14', bg: '#111111', large: true, note: 'spot on shadow, large only' },
  ],
};

const screentone: StrandTokens = {
  id: '04',
  name: 'Screentone',
  themeColor: '#FFFFFF',
  palette: {
    paper: '#FFFFFF',
    line: '#000000',
    hotPink: '#FF4FA3',
    cyan: '#00E1FF',
    pinkText: '#C2185B',
    hud: '#0A0A0A',
    lineDim: '#5A5A5A',
  },
  color: {
    bg: '#FFFFFF',
    fg: '#000000',
    fgDim: '#5A5A5A',
    panel: '#0A0A0A',
    panelFg: '#FFFFFF',
    panelFgDim: '#00E1FF',
    ink1: '#FF4FA3',
    ink2: '#00E1FF',
    ink1OnBg: '#C2185B',
    ink2OnBg: '#000000',
    ink1OnPanel: '#FF4FA3',
    ink2OnPanel: '#00E1FF',
    rule: '#000000',
    focus1: '#000000',
    focus2: '#FF4FA3',
  },
  font: {
    display: 'var(--font-jost)',
    text: 'var(--font-jost)',
    accent: 'var(--font-martian)',
    hud: 'var(--font-martian)',
  },
  ease: {
    smash: 'cubic-bezier(0.05, 0.9, 0.1, 1)',
    overshootSnap: 'linear(0, 0.42 8%, 0.92 17%, 1.14 25%, 1.06 33%, 0.985 42%, 1.004 55%, 1)',
    lock: 'cubic-bezier(0.9, 0, 0.1, 1)',
    snap: 'cubic-bezier(0.05, 0.9, 0.1, 1)',
    move: 'linear(0, 0.42 8%, 0.92 17%, 1.14 25%, 1.06 33%, 0.985 42%, 1.004 55%, 1)',
    wipe: 'cubic-bezier(0.05, 0.9, 0.1, 1)',
    settle: 'linear(0, 0.42 8%, 0.92 17%, 1.14 25%, 1.06 33%, 0.985 42%, 1.004 55%, 1)',
  },
  dur: { snap: '90ms', move: '260ms', wipe: '380ms' },
  fs: [
    '1.125rem',
    '1.5rem',
    '2rem',
    '2.66rem',
    '3.55rem',
    'clamp(4rem, 11vw, 10rem)',
    'clamp(4.5rem, 13vw, 12rem)',
    'clamp(10rem, 42vw, 38rem)',
  ],
  space: [8, 12, 16, 24, 32, 40, 56, 72, 96],
  gutter: '16px',
  columns: { phone: 4, tablet: 8, desk: 12, wall: 12 },
  contrast: [
    { fg: '#000000', bg: '#FFFFFF', note: 'line on paper' },
    { fg: '#5A5A5A', bg: '#FFFFFF', note: 'dim line on paper' },
    { fg: '#C2185B', bg: '#FFFFFF', note: 'pink text on paper' },
    { fg: '#000000', bg: '#FF4FA3', note: 'line on hot pink fill' },
    { fg: '#000000', bg: '#00E1FF', note: 'line on cyan fill' },
    { fg: '#FFFFFF', bg: '#0A0A0A', note: 'white on HUD' },
    { fg: '#00E1FF', bg: '#0A0A0A', note: 'cyan on HUD' },
    { fg: '#FF4FA3', bg: '#0A0A0A', note: 'pink on HUD' },
    { fg: '#FF4FA3', bg: '#FFFFFF', large: true, note: 'hot pink display on paper, large only' },
  ],
};

export const strandTokens: Record<Exclude<StrandId, '00'>, StrandTokens> = {
  '01': brooklyn,
  '02': wetDusk,
  '03': lateEdition,
  '04': screentone,
};

/** Civilian mode = the base layer. DESIGN.md §9. */
export const civilian = {
  bg: '#FFFFFF',
  fg: '#111111',
  fgDim: '#4A4A4A',
  link: '#0B4FD8',
  contrast: [
    { fg: '#111111', bg: '#FFFFFF', note: 'civilian text' },
    { fg: '#4A4A4A', bg: '#FFFFFF', note: 'civilian secondary' },
    { fg: '#0B4FD8', bg: '#FFFFFF', note: 'civilian link' },
  ],
} as const;

/** The tear, shared by every strand. DESIGN.md §2.5. */
export const tear = {
  chargeMs: 160,
  tearMs: 500,
  settleMs: 140,
  easeCharge: 'cubic-bezier(0.7, 0, 0.9, 0.4)',
  easeTear: 'cubic-bezier(0.76, 0, 0.24, 1)',
  easeFade: 'cubic-bezier(0.4, 0, 0.6, 1)',
  fadeMs: 240,
  points: [26, 40] as const,
} as const;
