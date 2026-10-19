// Shape of content/profile.ts. Every piece of human-written content on the site
// is typed here. Components never hold copy of their own; they read a Profile.

/** A file in content/media/, referenced by path relative to that folder. */
export interface MediaRef {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export type LinkKind =
  | 'email'
  | 'github'
  | 'linkedin'
  | 'scholar'
  | 'huggingface'
  | 'x'
  | 'bluesky'
  | 'calendar'
  | 'other';

export interface Link {
  label: string;
  href: string;
  kind: LinkKind;
}

/** A number on the site must say how it was measured. */
export interface Metric {
  value: number;
  unit: string;
  /** How this was measured: load profile, sample size, window, tooling. Required. */
  method: string;
}

export interface Site {
  /** Absolute origin used for canonical URLs, OG images and JSON-LD, e.g. https://example.com */
  url: string;
  title: string;
  description: string;
  locale: string;
}

export interface Person {
  name: string;
  /** Used where the full name will not fit: chrome, toasts. */
  shortName: string;
  role: string;
  location: string;
  email: string;
  /** One line on what you are open to right now. */
  availability: string;
  headshot?: MediaRef;
}

export interface ProofPoint {
  /** Large figure, as displayed, e.g. "1.1 s". */
  figure: string;
  /** What the figure is, e.g. "p95, claims triage". */
  label: string;
  /** Slug of the case study that backs it up. */
  caseStudy: string;
}

export interface Pitch {
  /** Short line above the name. */
  kicker: string;
  /** The one sentence you want remembered. Set very large. */
  statement: string;
  /** Two or three sentences that expand on it. */
  body: string;
  proofPoints: ProofPoint[];
  /** Hand-written margin note beside the hero. Keep it under 50 characters. */
  marginNote: string;
}

export interface TimelinePanel {
  /** Year or range, as displayed. */
  when: string;
  title: string;
  body: string;
  /** Optional invented sound word lettered into the panel. */
  sfx?: string;
}

export interface About {
  intro: string;
  timeline: TimelinePanel[];
  /** What you are working on now. */
  now: string;
  /** Plain list for the résumé and civilian mode. No percentages, no bars. */
  skills: SkillGroup[];
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export type CoverArchetype = 'splash' | 'panels' | 'number' | 'diagram' | 'type';

export type ArchNodeKind = 'client' | 'service' | 'model' | 'store' | 'queue' | 'eval' | 'external';

export interface ArchNode {
  id: string;
  label: string;
  kind: ArchNodeKind;
  /** One short line shown under the label. */
  note?: string;
}

export interface ArchEdge {
  from: string;
  to: string;
  label?: string;
  kind?: 'sync' | 'async' | 'data';
}

export interface ArchGroup {
  id: string;
  label: string;
  nodes: string[];
}

export interface Decision {
  /** What was being decided, e.g. "Retriever". */
  area: string;
  chosen: string;
  why: string;
  rejected: Array<{ option: string; why: string }>;
}

export interface EvalMetric {
  name: string;
  baseline: number;
  ours: number;
  unit: string;
  higherIsBetter: boolean;
  /** 95% interval half-width on `ours`, same unit, if you computed one. */
  ci?: number;
}

export interface Evaluation {
  /** How you knew it worked, in a paragraph. */
  summary: string;
  baselineName: string;
  oursName: string;
  /** Eval-set construction, as a funnel from raw pool to final set. */
  set: {
    description: string;
    stages: Array<{ label: string; count: number; note?: string }>;
  };
  metrics: EvalMetric[];
  /** Per-slice results on the headline metric. */
  slices: Array<{ name: string; baseline: number; ours: number }>;
  /** Error taxonomy on the final system, counts out of the eval set. */
  errors: Array<{ category: string; count: number }>;
}

export interface Numbers {
  p50: Metric;
  p95: Metric;
  costPer1k: Metric;
  accuracyDelta: Metric;
  throughput: Metric;
}

export interface Failure {
  title: string;
  body: string;
  rootCause: string;
  impact: string;
  timeline: { detected: string; mitigated: string; fixed: string };
}

export interface CaseStudy {
  slug: string;
  title: string;
  /** Issue number on the rack. */
  issue: number;
  year: string;
  role: string;
  /** Who it was for, described without naming anyone you can't name. */
  context: string;
  summary: string;
  tags: string[];
  featured: boolean;
  cover: { archetype: CoverArchetype; tagline: string };
  constraint: { headline: string; body: string; limits: Array<{ label: string; value: string }> };
  architecture: { caption: string; nodes: ArchNode[]; edges: ArchEdge[]; groups?: ArchGroup[] };
  decisions: Decision[];
  evaluation: Evaluation;
  numbers: Numbers;
  failure: Failure;
  retrospective: { body: string; changes: string[] };
  demo?: { kind: 'iframe' | 'video'; src: string; title: string; aspect: string };
  beforeAfter?: { before: MediaRef; after: MediaRef; caption: string };
}

export interface LabEntry {
  slug: string;
  title: string;
  year: string;
  blurb: string;
  kind: 'experiment' | 'tool' | 'open-source' | 'talk';
  href?: string;
  repo?: string;
}

export interface Role {
  org: string;
  title: string;
  start: string;
  end: string;
  location: string;
  highlights: string[];
}

export interface Education {
  school: string;
  degree: string;
  year: string;
}

export interface Resume {
  summary: string;
  roles: Role[];
  education: Education[];
}

export interface Contact {
  intro: string;
  /** What happens after someone writes. */
  responseNote: string;
  calendarUrl?: string;
}

export interface Profile {
  site: Site;
  person: Person;
  pitch: Pitch;
  links: Link[];
  about: About;
  work: CaseStudy[];
  lab: LabEntry[];
  resume: Resume;
  contact: Contact;
}
