// UI micro-copy per strand (DESIGN.md "Voice" tables). This is site chrome, not your content:
// your bio and case studies live in content/profile.ts and are never rewritten per strand.
//
// Every variant is rendered into the HTML and CSS shows the active one (see <Voice />),
// so a strand switch needs no JS to relabel the chrome and the accessible name always
// matches what is on screen.

import type { PublicStrandId } from './ids.ts';

export type VoiceKey = 'c' | PublicStrandId;

export interface Voice {
  nav: { home: string; work: string; about: string; lab: string; writing: string; contact: string };
  switcherLabel: string;
  civilianOn: string;
  civilianOff: string;
  motionOff: string;
  motionOn: string;
  soundOn: string;
  soundOff: string;
  notFoundTitle: string;
  notFoundBody: string;
  readCase: string;
  skip: string;
  proofLink: string;
}

export const voices: Record<VoiceKey, Voice> = {
  c: {
    nav: {
      home: 'Home',
      work: 'Work',
      about: 'About',
      lab: 'Lab',
      writing: 'Writing',
      contact: 'Contact',
    },
    switcherLabel: 'Strand',
    civilianOn: 'Plain view',
    civilianOff: 'Back to the strands',
    motionOff: 'Pause motion',
    motionOn: 'Resume motion',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    notFoundTitle: 'Page not found',
    notFoundBody: 'There is no page at this address.',
    readCase: 'Read the case study',
    skip: 'Skip to content',
    proofLink: 'See the case study',
  },
  '01': {
    nav: {
      home: 'COVER',
      work: 'ISSUES',
      about: 'ORIGIN',
      lab: 'SCRAPS',
      writing: 'ZINE',
      contact: 'HOLLER',
    },
    switcherLabel: 'REPRINT AS',
    civilianOn: 'STRIP THE INK',
    civilianOff: 'Back to the strands',
    motionOff: 'HOLD STILL',
    motionOn: 'LET IT RUN',
    soundOn: 'TURN IT UP',
    soundOff: 'KILL THE NOISE',
    notFoundTitle: 'MISPRINT',
    notFoundBody: 'This page jammed in the drum. The plates came out blank.',
    readCase: 'READ THE ISSUE',
    skip: 'SKIP TO THE GOOD PART',
    proofLink: 'SEE THE ISSUE',
  },
  '02': {
    nav: {
      home: 'first light',
      work: 'pieces',
      about: 'where i’m from',
      lab: 'sketchbook',
      writing: 'letters',
      contact: 'write back',
    },
    switcherLabel: 'drift to',
    civilianOn: 'dry the page',
    civilianOff: 'Back to the strands',
    motionOff: 'hold still',
    motionOn: 'let it drift',
    soundOn: 'let it ring',
    soundOff: 'hush',
    notFoundTitle: 'washed out',
    notFoundBody: 'this page was left in the rain. the paper is still here; the words ran off it.',
    readCase: 'read slowly',
    skip: 'skip to the words',
    proofLink: 'read the piece',
  },
  '03': {
    nav: {
      home: 'FRONT PAGE',
      work: 'CASE FILES',
      about: 'PROFILE',
      lab: 'THE MORGUE',
      writing: 'COLUMNS',
      contact: 'TIPS LINE',
    },
    switcherLabel: 'CHANGE EDITION',
    civilianOn: 'PLAIN COPY',
    civilianOff: 'Back to the strands',
    motionOff: 'STOP THE PRESSES',
    motionOn: 'RUN THE PRESSES',
    soundOn: 'ROOM TONE',
    soundOff: 'SILENCE',
    notFoundTitle: 'CORRECTION',
    notFoundBody:
      'An earlier edition directed readers to this page. It does not exist. The editors regret the error.',
    readCase: 'READ THE FULL STORY',
    skip: 'SKIP TO THE STORY',
    proofLink: 'FULL STORY',
  },
  '04': {
    nav: {
      home: 'BRIDGE',
      work: 'SORTIES',
      about: 'PILOT FILE',
      lab: 'HANGAR',
      writing: 'LOGS',
      contact: 'OPEN CHANNEL',
    },
    switcherLabel: 'SWITCH FEED',
    civilianOn: 'HUD OFF',
    civilianOff: 'Back to the strands',
    motionOff: 'FREEZE FRAME',
    motionOn: 'RESUME FEED',
    soundOn: 'AUDIO ON',
    soundOff: 'AUDIO OFF',
    notFoundTitle: 'SIGNAL LOST',
    notFoundBody: 'NO TARGET AT THIS ADDRESS. LAST KNOWN POSITION LOGGED. RETURN TO BRIDGE.',
    readCase: 'OPEN SORTIE REPORT',
    skip: 'SKIP TO PAYLOAD',
    proofLink: 'SORTIE REPORT',
  },
};

/** Invented SFX per strand (DESIGN.md lexicons). slop-lint rejects SFX not listed here. */
export const sfxLexicon: Record<PublicStrandId, string[]> = {
  '01': ['SKRAANCH', 'FSSKT', 'VRAMPF', 'KLUNNT', 'GRAZZT', 'BRAKKADUNG'],
  '02': ['shhwaa', 'plihm', 'hwoom', 'tisss', 'ooloo'],
  '03': ['KLAK-TCHK', 'THRUNN', 'SKIK', 'TCHAKK', 'FWUPP'],
  '04': ['ZZAKT', 'VREEEN', 'SHUNKT', 'GZZING', 'TRRRK'],
};
