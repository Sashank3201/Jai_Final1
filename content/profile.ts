// ─────────────────────────────────────────────────────────────────────────────
// content/profile.ts
//
// Every piece of human-written content on the site lives in this file.
// The rest of the codebase reads from it; swapping in your real data touches
// only this file (plus image files you drop into content/media/ and blog posts
// in content/writing/).
//
// Everything wrapped in ph(…) is PLACEHOLDER content: a fictional engineer whose
// details are written to stress-test the layout (a long hyphenated name, a
// three-letter project title, an absurdly long one). Replace ph("…") with "…".
// Run `pnpm content:audit` to list what is left.
// ─────────────────────────────────────────────────────────────────────────────

import { ph } from '../src/lib/ph.ts';
import type { CaseStudy, LabEntry, Profile } from '../src/types/profile.ts';

const fen: CaseStudy = ph({
  slug: 'fen',
  title: 'Fen',
  issue: 1,
  year: '2025',
  role: 'Lead engineer, retrieval and inference',
  context: 'A regional property and casualty insurer, 140 claims adjusters',
  summary:
    'Claims triage over 40,000 policy documents, answered inside the insurer’s own VPC with a 1.2 second p95 ceiling and no data leaving the building.',
  tags: ['RAG', 'hybrid retrieval', 'vLLM', 'AWQ', 'on-prem'],
  featured: true,
  cover: { archetype: 'number', tagline: 'p95 went from 2.8 s to 1.1 s and the PII never left' },
  constraint: {
    headline: 'Nothing leaves the VPC, and adjusters stop waiting at 1.2 seconds',
    body: 'Legal ruled out every hosted model API on day one because claim files carry medical and financial PII. The infrastructure budget was two A10G GPUs, already purchased. Adjusters had timed the old keyword search and told us anything slower than about a second felt broken, so the product owner set a hard p95 of 1.2 seconds measured at the adjuster’s browser.',
    limits: [
      { label: 'Latency ceiling', value: '1.2 s p95, browser to first token' },
      { label: 'Hardware', value: '2 × A10G, 24 GB each' },
      { label: 'Data residency', value: 'Inside the VPC, no external calls' },
      { label: 'Corpus', value: '40,112 policy documents, 9 lines of business' },
    ],
  },
  architecture: {
    caption: 'Request path for a single triage query. Dashed edges run nightly.',
    nodes: [
      { id: 'ui', label: 'Adjuster UI', kind: 'client' },
      { id: 'gw', label: 'Gateway', kind: 'service', note: 'auth, PII-safe logging' },
      { id: 'rw', label: 'Query rewriter', kind: 'model', note: '1.5B, int8' },
      { id: 'ret', label: 'Hybrid retriever', kind: 'service', note: 'BM25 + dense, RRF' },
      { id: 'pg', label: 'Postgres + pgvector', kind: 'store' },
      { id: 'rr', label: 'Reranker', kind: 'model', note: 'MiniLM cross-encoder, top 40' },
      { id: 'gen', label: 'Generator', kind: 'model', note: '8B instruct, AWQ 4-bit, vLLM' },
      { id: 'cite', label: 'Citation check', kind: 'service', note: 'clause IDs must exist' },
      { id: 'fb', label: 'Feedback queue', kind: 'queue' },
      { id: 'ev', label: 'Nightly eval', kind: 'eval', note: '1,200 adjudicated claims' },
    ],
    edges: [
      { from: 'ui', to: 'gw', kind: 'sync' },
      { from: 'gw', to: 'rw', kind: 'sync' },
      { from: 'rw', to: 'ret', kind: 'sync' },
      { from: 'ret', to: 'pg', kind: 'data', label: 'top 200' },
      { from: 'ret', to: 'rr', kind: 'sync', label: 'top 40' },
      { from: 'rr', to: 'gen', kind: 'sync', label: 'top 6' },
      { from: 'gen', to: 'cite', kind: 'sync' },
      { from: 'cite', to: 'ui', kind: 'sync', label: 'stream' },
      { from: 'ui', to: 'fb', kind: 'async', label: 'thumbs + reroutes' },
      { from: 'fb', to: 'ev', kind: 'async' },
    ],
    groups: [
      {
        id: 'vpc',
        label: 'Insurer VPC',
        nodes: ['gw', 'rw', 'ret', 'pg', 'rr', 'gen', 'cite', 'fb', 'ev'],
      },
    ],
  },
  decisions: [
    {
      area: 'Generator',
      chosen: '8B instruct, AWQ 4-bit, served by vLLM',
      why: 'Fit both GPUs with room for 22 concurrent requests and held p95 under the ceiling.',
      rejected: [
        { option: '70B through a hosted API', why: 'PII cannot leave the VPC.' },
        { option: '13B at fp16', why: 'p95 of 1.9 s on the budget hardware.' },
      ],
    },
    {
      area: 'Retrieval',
      chosen: 'BM25 and dense retrieval fused with reciprocal rank fusion',
      why: 'Clause numbers like “4.2(b)” need exact match; claim narratives need paraphrase.',
      rejected: [
        { option: 'Dense only', why: 'Missed 31% of clause-number lookups.' },
        { option: 'BM25 only', why: 'Missed paraphrased damage descriptions.' },
      ],
    },
    {
      area: 'Reranking',
      chosen: 'MiniLM cross-encoder over the top 40',
      why: 'Added 38 ms and lifted clause-in-top-3 by 11 points.',
      rejected: [{ option: 'LLM as reranker', why: 'Added roughly 600 ms at p95.' }],
    },
    {
      area: 'Vector store',
      chosen: 'pgvector inside the existing Postgres',
      why: 'Already security-reviewed. A new database meant a three-month review.',
      rejected: [{ option: 'Dedicated vector database', why: 'Review timeline, not performance.' }],
    },
  ],
  evaluation: {
    summary:
      'The baseline was the system adjusters already used: keyword search plus a 60-rule routing table. I built the eval set from closed claims with known final routing, so the label is what actually happened to the claim, not what an annotator guessed.',
    baselineName: 'Keyword search + routing rules',
    oursName: 'Fen v3',
    set: {
      description: 'Closed claims with a known final routing, double-labelled by senior adjusters.',
      stages: [
        { label: 'Closed claims, 2021–2023', count: 18400 },
        { label: 'Stratified sample by line of business', count: 2000 },
        { label: 'Dropped: no final routing recorded', count: 1712 },
        {
          label: 'Double-labelled, disagreements adjudicated',
          count: 1200,
          note: 'κ = 0.78 before adjudication',
        },
      ],
    },
    metrics: [
      {
        name: 'Routing accuracy',
        baseline: 71.3,
        ours: 86.9,
        unit: '%',
        higherIsBetter: true,
        ci: 1.9,
      },
      {
        name: 'Correct clause in top 3',
        baseline: 54.0,
        ours: 91.2,
        unit: '%',
        higherIsBetter: true,
        ci: 1.6,
      },
      {
        name: 'Fraud-flag escalation recall',
        baseline: 62.0,
        ours: 88.0,
        unit: '%',
        higherIsBetter: true,
        ci: 4.1,
      },
      {
        name: 'Median handling time',
        baseline: 14.2,
        ours: 9.1,
        unit: 'min',
        higherIsBetter: false,
      },
    ],
    slices: [
      { name: 'Auto', baseline: 74.0, ours: 89.5 },
      { name: 'Property', baseline: 70.2, ours: 87.1 },
      { name: 'Liability', baseline: 66.8, ours: 82.4 },
      { name: 'Flood', baseline: 58.9, ours: 84.0 },
    ],
    errors: [
      { category: 'Wrong line of business', count: 61 },
      { category: 'Superseded clause version', count: 47 },
      { category: 'Missed exclusion', count: 38 },
      { category: 'Cited clause does not exist', count: 3 },
    ],
  },
  numbers: {
    p50: {
      value: 420,
      unit: 'ms',
      method: 'Browser to first token, 7-day production window, 61k queries.',
    },
    p95: { value: 1100, unit: 'ms', method: 'Same window and measurement point as p50.' },
    costPer1k: {
      value: 0.38,
      unit: 'USD',
      method: 'Amortised GPU and hosting cost over 36 months at observed volume.',
    },
    accuracyDelta: {
      value: 15.6,
      unit: 'pp',
      method: 'Routing accuracy on the 1,200-claim set vs keyword baseline.',
    },
    throughput: {
      value: 22,
      unit: 'req/s',
      method: 'Sustained load test at p95 ≤ 1.2 s, both GPUs.',
    },
  },
  failure: {
    title: 'The policy changed underneath us',
    body: 'In week five the insurer issued a mid-quarter update to its flood policy. The index held both versions with no notion of which was in force, and the retriever happily served the old clause because it had more historical traffic in the feedback signal. Adjusters caught it before I did.',
    rootCause:
      'No effective-date metadata on chunks, and no eval slice that covered version drift.',
    impact:
      '41 claims routed using a superseded clause over six days. All were re-reviewed; none paid out incorrectly.',
    timeline: {
      detected: 'Day 6, adjuster feedback',
      mitigated: 'Day 6, old version removed',
      fixed: 'Day 9, effective-date filter + drift slice',
    },
  },
  retrospective: {
    body: 'The model choices held up. The data model did not. I treated policy documents as static text when they are versioned legal instruments.',
    changes: [
      'Model document versions and effective dates before writing a retriever.',
      'Build the eval set before choosing any component, and include a slice for every way the corpus changes.',
      'Run in shadow mode for four weeks instead of two.',
    ],
  },
});

const halfstep: CaseStudy = ph({
  slug: 'halfstep',
  title: 'Halfstep',
  issue: 2,
  year: '2024',
  role: 'Inference engineer',
  context: 'A developer-tools startup with an in-editor code completion product',
  summary:
    'Speculative decoding with a distilled draft model cut code-completion p50 from 410 ms to 190 ms on the same 16-GPU fleet, with output quality unchanged by construction.',
  tags: ['speculative decoding', 'distillation', 'vLLM', 'FP8', 'latency'],
  featured: true,
  cover: { archetype: 'splash', tagline: 'Same sixteen GPUs, half the wait' },
  constraint: {
    headline: 'Make it feel instant without buying a single GPU',
    body: 'Completions that arrive after about 200 ms get typed over and never accepted. The fleet was fixed at 16 L4 GPUs for the year, and the team that owned the 7B model would not retrain it.',
    limits: [
      { label: 'Latency target', value: 'p50 under 200 ms' },
      { label: 'Hardware', value: '16 × L4, fixed for 12 months' },
      { label: 'Model', value: '7B code model, frozen' },
      { label: 'Quality', value: 'No drop in exact match or acceptance' },
    ],
  },
  architecture: {
    caption:
      'One completion request. The draft model proposes, the target verifies in a single pass.',
    nodes: [
      { id: 'ed', label: 'Editor plugin', kind: 'client' },
      { id: 'rt', label: 'Edge router', kind: 'service', note: 'debounce, cancel stale' },
      { id: 'srv', label: 'Completion server', kind: 'service', note: 'vLLM, adaptive k' },
      { id: 'dr', label: 'Draft model', kind: 'model', note: '0.5B, distilled on logs' },
      { id: 'tg', label: 'Target model', kind: 'model', note: '7B, FP8' },
      { id: 'kv', label: 'Prefix KV cache', kind: 'store' },
      { id: 'tel', label: 'Telemetry', kind: 'queue', note: 'opt-in acceptance events' },
      { id: 'ev', label: 'Acceptance eval', kind: 'eval' },
    ],
    edges: [
      { from: 'ed', to: 'rt', kind: 'sync' },
      { from: 'rt', to: 'srv', kind: 'sync' },
      { from: 'srv', to: 'dr', kind: 'sync', label: 'propose k' },
      { from: 'dr', to: 'tg', kind: 'sync', label: 'verify' },
      { from: 'tg', to: 'kv', kind: 'data' },
      { from: 'srv', to: 'ed', kind: 'sync', label: 'stream' },
      { from: 'ed', to: 'tel', kind: 'async' },
      { from: 'tel', to: 'ev', kind: 'async' },
    ],
  },
  decisions: [
    {
      area: 'Speculation method',
      chosen: '0.5B draft model distilled on our own accepted completions',
      why: 'Draft acceptance of 71% on held-out repos.',
      rejected: [
        {
          option: 'N-gram prompt lookup',
          why: 'Great on boilerplate, 38% acceptance on novel code.',
        },
        { option: 'Medusa heads', why: 'Required retraining the frozen 7B.' },
      ],
    },
    {
      area: 'Draft length',
      chosen: 'Adaptive k from 2 to 6, driven by rolling acceptance',
      why: 'Fixed k wasted verification passes on low-confidence spans.',
      rejected: [{ option: 'Fixed k = 5', why: 'p95 rose 18% on long novel completions.' }],
    },
    {
      area: 'Precision',
      chosen: 'FP8 target, BF16 draft',
      why: 'FP8 on L4 doubled verification throughput with no measurable quality change.',
      rejected: [{ option: 'INT4 target', why: 'Lost 3.1 points of exact match.' }],
    },
  ],
  evaluation: {
    summary:
      'With greedy verification, speculative decoding cannot change the output, so quality is preserved by construction. I still measured it, because implementation bugs are not bound by theorems. The interesting numbers are latency and whether faster suggestions get accepted more.',
    baselineName: '7B target, no speculation',
    oursName: 'Halfstep',
    set: {
      description: 'Accepted completions from opt-in telemetry, held out by repository.',
      stages: [
        { label: 'Accepted completions, opt-in telemetry', count: 310000 },
        { label: 'Deduplicated by file hash and prefix', count: 96000 },
        { label: 'Repos never seen in draft training', count: 14500 },
        { label: 'Stratified by language and length', count: 5000 },
      ],
    },
    metrics: [
      { name: 'p50 latency', baseline: 410, ours: 190, unit: 'ms', higherIsBetter: false },
      {
        name: 'Tokens per second per GPU',
        baseline: 1850,
        ours: 3900,
        unit: 'tok/s',
        higherIsBetter: true,
      },
      {
        name: 'Suggestion acceptance',
        baseline: 27.4,
        ours: 29.1,
        unit: '%',
        higherIsBetter: true,
        ci: 0.6,
      },
      { name: 'Exact match', baseline: 41.2, ours: 41.2, unit: '%', higherIsBetter: true, ci: 1.3 },
    ],
    slices: [
      { name: 'Python', baseline: 400, ours: 170 },
      { name: 'TypeScript', baseline: 420, ours: 185 },
      { name: 'Go', baseline: 390, ours: 200 },
      { name: 'Rust', baseline: 450, ours: 260 },
      { name: 'SQL', baseline: 380, ours: 150 },
    ],
    errors: [
      { category: 'Fell back to plain decoding', count: 412 },
      { category: 'Cold prefix cache', count: 260 },
      { category: 'Cancelled by newer keystroke', count: 1180 },
    ],
  },
  numbers: {
    p50: {
      value: 190,
      unit: 'ms',
      method: 'Server receive to last token, 14-day production window, 9.2M requests.',
    },
    p95: { value: 340, unit: 'ms', method: 'Same window as p50.' },
    costPer1k: {
      value: 0.021,
      unit: 'USD',
      method: 'Fleet cost divided by served completions over the window.',
    },
    accuracyDelta: {
      value: 1.7,
      unit: 'pp',
      method: 'Suggestion acceptance rate, A/B over 14 days, 50/50 split.',
    },
    throughput: {
      value: 3900,
      unit: 'tok/s/GPU',
      method: 'Steady-state load test at production prompt mix.',
    },
  },
  failure: {
    title: 'Rust ate the speedup',
    body: 'The global p50 looked wonderful on launch day. Rust users got slower. Draft acceptance on Rust was 31%, the adaptive controller kept probing longer drafts, and every rejected draft cost a full verification pass.',
    rootCause:
      'The draft model saw almost no Rust in distillation, and I only watched global latency.',
    impact: 'Rust p95 regressed 22% for one week across roughly 4,000 users.',
    timeline: {
      detected: 'Day 8, per-language dashboard',
      mitigated: 'Day 8, speculation off for Rust',
      fixed: 'Day 19, re-distilled with Rust + per-language k caps',
    },
  },
  retrospective: {
    body: 'Averages hid a language the draft model did not know. Every latency number now ships with a per-language breakdown.',
    changes: [
      'Roll out by language, smallest first.',
      'Gate launch on per-slice p95, never the global figure.',
    ],
  },
});

const disagreed: CaseStudy = ph({
  slug: 'eval-set-disagreed',
  title: 'The Eval Set That Disagreed With The Leaderboard And Was Right About It',
  issue: 3,
  year: '2024',
  role: 'Evaluation lead',
  context: 'A fintech support team summarising regulated customer complaints',
  summary:
    'A vendor model scored four points higher on a public summarisation benchmark. An adversarial set built from 1,600 real tickets showed it dropped 9.4 points on the field that mattered: the action items.',
  tags: ['evaluation', 'LLM-as-judge', 'calibration', 'power analysis'],
  featured: true,
  cover: {
    archetype: 'type',
    tagline: 'Plus four on the leaderboard, minus nine where it counted',
  },
  constraint: {
    headline: 'Two weeks, no labels, and a regulator who reads the summaries',
    body: 'The migration to the new model was scheduled. Complaint summaries feed a regulated workflow where a dropped action item is a compliance breach. There was no labelled data and no internal eval, just the vendor’s benchmark table.',
    limits: [
      { label: 'Time', value: '14 days to a go or no-go' },
      { label: 'Labels', value: 'None at start' },
      { label: 'Reviewers', value: '3 complaint specialists, 6 hours each' },
      { label: 'Detectable effect', value: '3 points at 80% power' },
    ],
  },
  architecture: {
    caption: 'How the eval set was built and scored.',
    nodes: [
      { id: 'wh', label: 'Ticket warehouse', kind: 'store' },
      { id: 'sm', label: 'Stratified sampler', kind: 'service' },
      {
        id: 'pt',
        label: 'Perturbation generator',
        kind: 'model',
        note: 'negations, dates, multi-party',
      },
      { id: 'hq', label: 'Specialist review', kind: 'queue' },
      { id: 'set', label: 'Labelled set', kind: 'store', note: '1,600 items' },
      { id: 'run', label: 'Eval runner', kind: 'eval' },
      { id: 'jd', label: 'Calibrated judge', kind: 'model', note: 'κ = 0.81 vs humans' },
      { id: 'rp', label: 'Go / no-go report', kind: 'client' },
    ],
    edges: [
      { from: 'wh', to: 'sm', kind: 'data' },
      { from: 'sm', to: 'pt', kind: 'sync' },
      { from: 'pt', to: 'hq', kind: 'async' },
      { from: 'hq', to: 'set', kind: 'data' },
      { from: 'set', to: 'run', kind: 'data' },
      { from: 'run', to: 'jd', kind: 'sync' },
      { from: 'jd', to: 'rp', kind: 'sync' },
    ],
  },
  decisions: [
    {
      area: 'Judge',
      chosen: 'LLM judge from a different model family, calibrated on 300 human labels',
      why: 'Agreement with specialists of κ = 0.81, reported alongside every score.',
      rejected: [
        { option: 'ROUGE', why: 'Rewarded copying and could not see a missing action item.' },
        { option: 'Uncalibrated judge', why: 'Preferred its own model family 14% of the time.' },
      ],
    },
    {
      area: 'Set construction',
      chosen: 'Real tickets plus targeted perturbations',
      why: 'Negations, rescheduled dates and multi-party threads are where summaries break.',
      rejected: [{ option: 'Synthetic tickets', why: 'Too clean; both models scored above 97%.' }],
    },
    {
      area: 'Sample size',
      chosen: '1,600 items from a power analysis',
      why: 'Detects a 3-point difference at 80% power.',
      rejected: [
        { option: '200 golden items', why: 'Interval of ±6 points; useless for a 3-point call.' },
      ],
    },
  ],
  evaluation: {
    summary:
      'Here the “baseline” is the incumbent model and “ours” is the candidate the team wanted to adopt. The eval’s job was to find out whether the candidate was safe, and it was not.',
    baselineName: 'Incumbent model',
    oursName: 'Candidate model',
    set: {
      description: 'Real complaint tickets with targeted perturbations, labelled by specialists.',
      stages: [
        { label: 'Closed complaint tickets, 12 months', count: 52000 },
        { label: 'Stratified by product and channel', count: 2400 },
        { label: 'Perturbed variants added', count: 3100 },
        { label: 'Specialist-verified, final set', count: 1600 },
      ],
    },
    metrics: [
      {
        name: 'Action items correct',
        baseline: 88.1,
        ours: 78.7,
        unit: '%',
        higherIsBetter: true,
        ci: 2.0,
      },
      {
        name: 'Negations preserved',
        baseline: 90.2,
        ours: 72.5,
        unit: '%',
        higherIsBetter: true,
        ci: 3.4,
      },
      {
        name: 'Factual consistency',
        baseline: 93.0,
        ours: 94.2,
        unit: '%',
        higherIsBetter: true,
        ci: 1.2,
      },
      { name: 'Public benchmark', baseline: 71.0, ours: 75.1, unit: 'pts', higherIsBetter: true },
    ],
    slices: [
      { name: 'Billing', baseline: 91.0, ours: 86.2 },
      { name: 'Regulated complaints', baseline: 87.4, ours: 74.9 },
      { name: 'Multi-party threads', baseline: 82.3, ours: 69.0 },
      { name: 'Non-English', baseline: 85.0, ours: 80.8 },
    ],
    errors: [
      { category: 'Dropped action item', count: 214 },
      { category: 'Inverted negation', count: 96 },
      { category: 'Wrong owner assigned', count: 41 },
      { category: 'Wrong date', count: 30 },
    ],
  },
  numbers: {
    p50: { value: 900, unit: 'ms', method: 'Judge latency per item, full 1,600-item run.' },
    p95: { value: 2400, unit: 'ms', method: 'Same run as p50.' },
    costPer1k: { value: 1.8, unit: 'USD', method: 'Judge API cost per 1,000 scored items.' },
    accuracyDelta: {
      value: -9.4,
      unit: 'pp',
      method: 'Action items correct, candidate minus incumbent, 1,600 items.',
    },
    throughput: {
      value: 2.4,
      unit: 'items/s',
      method: 'Full run of 1,600 items in 11 minutes, 8 workers.',
    },
  },
  failure: {
    title: 'The judge liked its own family',
    body: 'My first judge came from the same model family as the candidate. It agreed with specialists well enough on the calibration batch, then quietly preferred the candidate’s phrasing on ties. The first report said the migration was safe.',
    rootCause: 'Self-preference bias, and a calibration batch too small to show it.',
    impact:
      'A go recommendation stood for one afternoon before the larger calibration run flagged it.',
    timeline: {
      detected: 'Day 9, second calibration batch',
      mitigated: 'Day 9, report withdrawn',
      fixed: 'Day 10, judge swapped + self-preference check',
    },
  },
  retrospective: {
    body: 'The eval worked because it was built from the workflow’s failure modes, not from what was easy to score. The judge nearly undid that.',
    changes: [
      'Never let a judge share a family with any model it scores.',
      'Build the set before the vendor demo, not after.',
      'Version perturbation recipes like code.',
    ],
  },
});

const bargeIn: CaseStudy = ph({
  slug: 'barge-in',
  title: 'Barge-In',
  issue: 4,
  year: '2023',
  role: 'Speech and dialogue engineer',
  context: 'A network of 30 physiotherapy clinics taking bookings by phone',
  summary:
    'A phone agent that books appointments and lets callers interrupt it. It worked well for native speakers and badly for everyone else until the eval set was rebuilt around who actually calls.',
  tags: ['speech', 'streaming ASR', 'endpointing', 'tool calling', 'fairness'],
  featured: false,
  cover: { archetype: 'panels', tagline: 'It stopped talking whenever you said “um”' },
  constraint: {
    headline: 'Under 800 ms per turn on 8 kHz phone audio, for six cents a minute',
    body: 'Callers hang up when an agent pauses too long or talks over them. Phone audio is narrowband and noisy, the clinics serve a lot of second-language speakers and elderly patients, and the per-minute budget ruled out frontier APIs.',
    limits: [
      { label: 'Turn latency', value: 'End of speech to first audio < 800 ms' },
      { label: 'Audio', value: '8 kHz telephony' },
      { label: 'Budget', value: '$0.06 per call minute' },
      { label: 'Interruptions', value: 'Must stop within 300 ms' },
    ],
  },
  architecture: {
    caption: 'One conversational turn, streaming end to end.',
    nodes: [
      { id: 'ph', label: 'Caller', kind: 'client' },
      { id: 'tg', label: 'Telephony gateway', kind: 'service' },
      { id: 'asr', label: 'Streaming ASR', kind: 'model', note: 'fine-tuned on 52 h of calls' },
      {
        id: 'eot',
        label: 'End-of-turn + barge-in',
        kind: 'model',
        note: 'VAD + semantic classifier',
      },
      { id: 'dm', label: 'Dialogue manager', kind: 'model', note: '8B, constrained tool schema' },
      { id: 'cal', label: 'Clinic calendar API', kind: 'external' },
      { id: 'tts', label: 'Streaming TTS', kind: 'model' },
      { id: 'log', label: 'Call logs', kind: 'store' },
      { id: 'ev', label: 'Slice eval', kind: 'eval' },
    ],
    edges: [
      { from: 'ph', to: 'tg', kind: 'sync' },
      { from: 'tg', to: 'asr', kind: 'sync', label: 'audio' },
      { from: 'asr', to: 'eot', kind: 'sync' },
      { from: 'eot', to: 'dm', kind: 'sync' },
      { from: 'dm', to: 'cal', kind: 'sync', label: 'tool call' },
      { from: 'dm', to: 'tts', kind: 'sync' },
      { from: 'tts', to: 'tg', kind: 'sync', label: 'audio' },
      { from: 'tg', to: 'log', kind: 'async' },
      { from: 'log', to: 'ev', kind: 'async' },
    ],
  },
  decisions: [
    {
      area: 'ASR',
      chosen: 'Streaming model fine-tuned on 52 hours of clinic calls',
      why: 'Word error rate of 9.8% on held-out calls, streaming partials in 120 ms.',
      rejected: [
        { option: 'Large batch model', why: '1.6 s latency per turn.' },
        { option: 'Vendor default streaming model', why: '19% WER on second-language callers.' },
      ],
    },
    {
      area: 'End of turn',
      chosen: 'VAD plus a small semantic end-of-turn classifier',
      why: 'Lets slow speakers pause mid-sentence without being cut off.',
      rejected: [{ option: 'Fixed 700 ms silence', why: 'Cut off 1 in 5 elderly callers.' }],
    },
    {
      area: 'Dialogue model',
      chosen: '8B model with a constrained tool-call grammar',
      why: 'Never produced an invalid booking call in 4,000 test turns.',
      rejected: [{ option: 'Frontier API', why: '$0.11 per minute, nearly double the budget.' }],
    },
  ],
  evaluation: {
    summary:
      'The first eval set was recorded by the team and a handful of friends. It said the agent was ready. The second was sampled from real calls and sliced by who was calling, and it told a different story.',
    baselineName: 'Previous touch-tone menu',
    oursName: 'Barge-In agent',
    set: {
      description: 'Real calls, consented and sampled by caller group.',
      stages: [
        { label: 'Consented calls, 8 weeks', count: 9800 },
        { label: 'Sampled by caller group', count: 1400 },
        { label: 'Transcribed and outcome-labelled', count: 1250 },
        { label: 'Final set after audio-quality filter', count: 1100 },
      ],
    },
    metrics: [
      {
        name: 'Booked without a human',
        baseline: 34.0,
        ours: 71.0,
        unit: '%',
        higherIsBetter: true,
        ci: 2.7,
      },
      { name: 'Wrong slot booked', baseline: 2.1, ours: 1.4, unit: '%', higherIsBetter: false },
      { name: 'Caller abandonment', baseline: 18.0, ours: 9.5, unit: '%', higherIsBetter: false },
    ],
    slices: [
      { name: 'Native speakers', baseline: 38.0, ours: 78.0 },
      { name: 'Second-language speakers', baseline: 29.0, ours: 66.0 },
      { name: 'Callers over 70', baseline: 31.0, ours: 64.0 },
      { name: 'Noisy lines', baseline: 33.0, ours: 61.0 },
    ],
    errors: [
      { category: 'Hesitation read as interruption', count: 72 },
      { category: 'Date misheard', count: 44 },
      { category: 'Caller asked for a human', count: 120 },
    ],
  },
  numbers: {
    p50: {
      value: 610,
      unit: 'ms',
      method: 'End of caller speech to first agent audio, 30 days, 41k turns.',
    },
    p95: { value: 980, unit: 'ms', method: 'Same window as p50.' },
    costPer1k: { value: 2.4, unit: 'USD', method: 'Per 1,000 turns, ASR + LLM + TTS + telephony.' },
    accuracyDelta: {
      value: 37,
      unit: 'pp',
      method: 'Bookings completed without a human vs the touch-tone menu.',
    },
    throughput: {
      value: 120,
      unit: 'calls',
      method: 'Concurrent calls sustained in load test at p95 < 1 s.',
    },
  },
  failure: {
    title: 'It heard accents as interruptions',
    body: 'The barge-in detector was trained mostly on native-speaker audio. Hesitation sounds common in several accents crossed its threshold, so the agent stopped mid-sentence, waited, and started over. Callers thought it was broken and hung up.',
    rootCause: 'Training and eval audio did not represent the people who call clinics.',
    impact:
      'Second-language callers abandoned at three times the native-speaker rate for two weeks.',
    timeline: {
      detected: 'Week 2, abandonment by caller group',
      mitigated: 'Week 2, threshold raised',
      fixed: 'Week 5, retrained on 12 h of second-language audio',
    },
  },
  retrospective: {
    body: 'I measured the system on the people who were easy to record. The fix was data, and it should have been the plan from the start.',
    changes: [
      'Build eval slices from the caller population before collecting training audio.',
      'Budget for diverse audio up front rather than after launch.',
    ],
  },
});

const lab: LabEntry[] = ph([
  {
    slug: 'tear-engine',
    title: 'The tear on this site',
    year: '2026',
    blurb:
      'How the strand switch works: a View Transition snapshot, a jagged polygon clip regenerated per switch, and an interrupt model that never blocks input.',
    kind: 'experiment',
  },
  {
    slug: 'kvwatch',
    title: 'kvwatch',
    year: '2025',
    blurb:
      'A terminal view of per-request KV-cache use in vLLM. Built to find out why p95 spiked at exactly 22 concurrent users.',
    kind: 'open-source',
    repo: 'https://github.com/example/kvwatch',
  },
  {
    slug: 'judge-drift',
    title: 'Judge drift',
    year: '2025',
    blurb:
      'Scoring the same 500 summaries with six judge-model versions over a year. Agreement with humans moved by up to 11 points between minor versions.',
    kind: 'experiment',
  },
  {
    slug: 'tokenbudget',
    title: 'tokenbudget',
    year: '2024',
    blurb:
      'Per-request token budgets that truncate retrieved context by rank instead of by position.',
    kind: 'tool',
    repo: 'https://github.com/example/tokenbudget',
  },
  {
    slug: 'p95-talk',
    title: 'What a p95 hides',
    year: '2024',
    blurb: 'Twenty minutes on slicing latency by user group, with the Rust story from Halfstep.',
    kind: 'talk',
    href: 'https://example.com/talks/p95',
  },
  {
    slug: 'halftone-glsl',
    title: 'Halftone in 40 lines',
    year: '2023',
    blurb:
      'A rotated-grid halftone shader with dot gain, written to understand why newsprint photos look the way they do.',
    kind: 'experiment',
  },
]);

export const profile: Profile = {
  site: {
    url: ph('https://example.com'),
    title: ph('Mara Lindqvist-Okafor, AI engineer'),
    description: ph(
      'Inference and evaluation work by Mara Lindqvist-Okafor: case studies with the latency, cost and eval numbers attached.',
    ),
    locale: 'en',
  },

  person: {
    name: ph('Mara Lindqvist-Okafor'),
    shortName: ph('Mara'),
    role: ph('AI engineer'),
    location: ph('Lisbon, Portugal'),
    email: ph('hello@example.com'),
    availability: ph('Taking on one inference or evaluation engagement from January 2027.'),
  },

  pitch: {
    kicker: ph('AI engineer · inference and evaluation · Lisbon'),
    statement: ph('Latency is a design brief.'),
    body: ph(
      'I build retrieval and inference systems that answer inside a fixed latency budget, then write the eval set that proves they still work six months later. Most recently I cut p95 on an insurer’s claims-triage pipeline from 2.8 s to 1.1 s without moving any PII out of their VPC.',
    ),
    proofPoints: ph([
      { figure: '1.1 s', label: 'p95, claims triage', caseStudy: 'fen' },
      {
        figure: '−9.4 pts',
        label: 'regression caught before launch',
        caseStudy: 'eval-set-disagreed',
      },
    ]),
    marginNote: ph('held up on the adversarial set too'),
  },

  links: ph([
    { label: 'Email', href: 'mailto:hello@example.com', kind: 'email' },
    { label: 'GitHub', href: 'https://github.com/example', kind: 'github' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/example', kind: 'linkedin' },
    { label: 'Hugging Face', href: 'https://huggingface.co/example', kind: 'huggingface' },
  ]),

  about: {
    intro: ph(
      'I came to machine learning through search relevance, which taught me early that a model is only as good as the measurement around it. I have spent the last four years on the unglamorous half of LLM products: making them fast enough to use and proving they are right often enough to trust.',
    ),
    timeline: ph([
      {
        when: '2009',
        title: 'The text-message bot',
        body: 'Wrote a Markov-chain bot that answered my sister’s texts. She noticed in four minutes. First lesson in evaluation.',
        sfx: 'BZZRT',
      },
      {
        when: '2013',
        title: 'Computer science and linguistics',
        body: 'A joint degree in Gothenburg, mostly so I could spend a thesis year on why parsers fail on spoken language.',
      },
      {
        when: '2016',
        title: 'Search relevance',
        body: 'Ranking hotels for a travel site. Learned to distrust offline metrics that nobody had checked against bookings.',
      },
      {
        when: '2018',
        title: 'Ranking models in production',
        body: 'Moved ranking from hand-tuned rules to learned models. Built my first holdout set by hand and found three label bugs in it.',
      },
      {
        when: '2020',
        title: 'Summarisation pipelines',
        body: 'Abstractive summaries for support tickets, before the term LLM was in every job ad.',
      },
      {
        when: '2022',
        title: 'Inference at a dev-tools startup',
        body: 'Code completion latency, speculative decoding, and the week Rust users got slower.',
        sfx: 'VRAMPF',
      },
      {
        when: '2024',
        title: 'Independent',
        body: 'Inference and evaluation engagements for teams that need both numbers to hold up.',
      },
    ]),
    now: ph(
      'Writing a small book chapter on eval-set construction, and running a shadow-mode trial of a speech agent for a hospital switchboard.',
    ),
    skills: ph([
      {
        label: 'Inference',
        items: [
          'vLLM',
          'TensorRT-LLM',
          'speculative decoding',
          'quantisation (AWQ, FP8)',
          'KV-cache tuning',
        ],
      },
      {
        label: 'Retrieval',
        items: ['hybrid BM25 + dense', 'rerankers', 'pgvector', 'chunking and versioning'],
      },
      {
        label: 'Evaluation',
        items: ['eval-set design', 'LLM-as-judge calibration', 'power analysis', 'slice analysis'],
      },
      { label: 'Speech', items: ['streaming ASR', 'endpointing', 'TTS latency'] },
      {
        label: 'Languages',
        items: ['Python', 'TypeScript', 'Rust (enough to be dangerous)', 'SQL'],
      },
    ]),
  },

  work: [fen, halfstep, disagreed, bargeIn],

  lab,

  resume: {
    summary: ph(
      'AI engineer focused on LLM inference performance and evaluation. Ten years shipping ranking, retrieval and language systems to production.',
    ),
    roles: ph([
      {
        org: 'Independent',
        title: 'AI engineer, inference and evaluation',
        start: '2024',
        end: 'Present',
        location: 'Lisbon',
        highlights: [
          'Cut claims-triage p95 from 2.8 s to 1.1 s on two A10G GPUs inside an insurer’s VPC.',
          'Built a 1,600-item adversarial eval that stopped a model migration with a 9.4-point regression.',
        ],
      },
      {
        org: 'A developer-tools startup',
        title: 'Senior inference engineer',
        start: '2022',
        end: '2024',
        location: 'Remote',
        highlights: [
          'Halved code-completion p50 (410 to 190 ms) with speculative decoding on a fixed 16-GPU fleet.',
          'Introduced per-language latency gates after a Rust regression.',
        ],
      },
      {
        org: 'A customer-support software company',
        title: 'Machine learning engineer',
        start: '2020',
        end: '2022',
        location: 'Stockholm',
        highlights: ['Shipped ticket summarisation to 2,000 support agents.'],
      },
      {
        org: 'A travel marketplace',
        title: 'Search relevance engineer',
        start: '2016',
        end: '2020',
        location: 'Amsterdam',
        highlights: ['Moved hotel ranking from rules to learned models; +3.2% bookings in A/B.'],
      },
    ]),
    education: ph([
      { school: 'University of Gothenburg', degree: 'MSc, Language Technology', year: '2016' },
      {
        school: 'University of Gothenburg',
        degree: 'BSc, Computer Science and Linguistics',
        year: '2014',
      },
    ]),
  },

  contact: {
    intro: ph(
      'Tell me your latency budget and what happens when the model is wrong. I will tell you whether I can help.',
    ),
    responseNote: ph(
      'I reply within two working days. If it is a no, I will say so and suggest someone better suited.',
    ),
    calendarUrl: ph('https://cal.example.com/mara/30min'),
  },
};
