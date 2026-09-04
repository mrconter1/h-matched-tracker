/**
 * Benchmarks considered for the tracker and rejected, with the reason.
 *
 * The tracker needs one thing: a published human score, measured on the same
 * metric and split that models are scored on. A surprising number of widely
 * quoted "human baselines" are not that. Three of the entries below are a
 * model's own score being passed around as the human number, and one of those
 * was live on this site until it was checked.
 *
 * This list is published because the checking is the expensive part, and
 * because it explains the tracker's omissions without anyone having to ask.
 */

export type RejectionReason =
  /** The quoted "human baseline" is actually a model's score. */
  | 'model-score'
  /** Inter-annotator agreement, not human task performance. */
  | 'agreement'
  /** A pass mark or policy cutoff, not measured human performance. */
  | 'threshold'
  /** An estimated or theoretical ceiling nobody measured. */
  | 'ceiling'
  /** The number does not appear in the cited source at all. */
  | 'unsourced'
  /** The human and model numbers are not the same measurement. */
  | 'metric-mismatch'
  /** The benchmark's own authors checking their own data. */
  | 'self-assessed'
  /** A rank or percentile against a live population, not a fixed score. */
  | 'percentile'
  /** No human baseline is published at all. */
  | 'none'
  /** Real baseline, but the benchmark does not fit the release-to-match model. */
  | 'out-of-scope';

export const REJECTION_LABELS: Record<RejectionReason, string> = {
  'model-score': "a model's score",
  agreement: 'annotator agreement',
  threshold: 'a pass mark',
  ceiling: 'an estimated ceiling',
  unsourced: 'not in the source',
  'metric-mismatch': 'different measurement',
  'self-assessed': 'authors marking own work',
  percentile: 'a percentile',
  none: 'no human baseline',
  'out-of-scope': 'out of scope',
};

export type RejectedBenchmark = {
  benchmark: string;
  reason: RejectionReason;
  /** The number people quote as the human baseline, when there is one. */
  quoted?: string;
  /** What it actually is. One or two sentences, plainly. */
  detail: string;
  sourceUrl?: string;
};

export const rejectedBenchmarks: RejectedBenchmark[] = [
  {
    benchmark: 'HallusionBench',
    reason: 'model-score',
    quoted: '65.28%',
    detail:
      "The paper's Table 2 gives two rows per model, labelled Human and GPT4-Assisted. Those are the two ways GPT-4V's free-text answers were graded, not two contestants: 65.28 is GPT-4V's own all-accuracy under GPT-4-assisted grading. The paper publishes no human baseline. This entry was live on this tracker until September 2026.",
    sourceUrl: 'https://arxiv.org/abs/2310.14566',
  },
  {
    benchmark: 'OCRBench v2',
    reason: 'model-score',
    quoted: 'various',
    detail:
      'The figures circulating as human baselines are InternVL3-14B scores, mislabelled by a downstream aggregator and repeated from there.',
    sourceUrl: 'https://arxiv.org/abs/2501.00321',
  },
  {
    benchmark: 'ChartQA',
    reason: 'agreement',
    detail:
      'Reports inter-annotator agreement, which measures whether two people give the same answer, not whether either is right. It is widely quoted as a human baseline anyway.',
    sourceUrl: 'https://arxiv.org/abs/2203.10244',
  },
  {
    benchmark: 'LAMBADA',
    reason: 'unsourced',
    quoted: '~86%',
    detail:
      "The paper contains no measured human accuracy. Its only human-related number describes how many candidate passages were discarded during dataset construction. The circulating 86% looks like a rounding of GPT-3's own 86.4%.",
    sourceUrl: 'https://arxiv.org/abs/1606.06031',
  },
  {
    benchmark: 'MedQA (USMLE)',
    reason: 'threshold',
    quoted: '~60%',
    detail:
      'That is the USMLE pass/fail policy cutoff, not measured human accuracy. The paper explicitly declines to give a human baseline, citing high variance among examinees.',
    sourceUrl: 'https://arxiv.org/abs/2009.13081',
  },
  {
    benchmark: 'DocVQA',
    reason: 'metric-mismatch',
    quoted: '94.36 ANLS',
    detail:
      'The paper reports two human numbers: 0.981 ANLS and 94.36% accuracy. The 94.36 figure is the accuracy one, routinely quoted against model ANLS scores. Compared correctly, the best systems are around 0.971 ANLS and the benchmark is not yet h-matched.',
    sourceUrl: 'https://arxiv.org/abs/2007.00398',
  },
  {
    benchmark: 'BigCodeBench',
    reason: 'self-assessed',
    quoted: '97%',
    detail:
      "Eleven of the paper's own annotators solved 33 of the tasks they had just written, as a data-quality check. It is not an independent measurement of human ability, and it covers a fraction of the benchmark.",
    sourceUrl: 'https://arxiv.org/abs/2406.15877',
  },
  {
    benchmark: 'COCO Captions',
    reason: 'metric-mismatch',
    quoted: '0.854 CIDEr-D',
    detail:
      'The baseline is a leave-one-out n-gram score for held-out reference captions, not measured human quality. Machines passed it in 2015 while the same project’s human judges still preferred human captions, which is the clearest example on this list of a metric being beaten without the claim behind it holding.',
    sourceUrl: 'https://arxiv.org/abs/1504.00325',
  },
  {
    benchmark: 'TextCaps',
    reason: 'metric-mismatch',
    quoted: '125.5 CIDEr',
    detail: 'Same leave-one-out CIDEr construction as COCO Captions, and the same objection.',
    sourceUrl: 'https://arxiv.org/abs/2003.12462',
  },
  {
    benchmark: 'CodeElo / CodeContests',
    reason: 'percentile',
    detail:
      'The human comparison is a rank in the live Codeforces rating distribution. There is no fixed score to cross, and the bar moves as the population does, so a date of first match is not well defined.',
    sourceUrl: 'https://arxiv.org/abs/2501.01257',
  },
  {
    benchmark: 'ARC-AGI-2',
    reason: 'ceiling',
    detail:
      'Several incompatible human figures circulate, from a panel measure where a task counts as solved if any of about ten testers gets it, down to a recomputed individual average near 53%. Until the intended baseline is settled the interval cannot be computed.',
    sourceUrl: 'https://arcprize.org/arc-agi/2',
  },
  {
    benchmark: 'Windows Agent Arena',
    reason: 'ceiling',
    quoted: '74.5%',
    detail:
      'Reported from a single casual user over roughly ninety minutes. Too thin to treat as a population baseline, though the benchmark is otherwise a good fit.',
    sourceUrl: 'https://arxiv.org/abs/2409.08264',
  },
  {
    benchmark: 'MLE-bench',
    reason: 'out-of-scope',
    detail:
      'The human reference is Kaggle medal thresholds across 75 separate competitions. Real and meaningful, but it is 75 baselines on 75 metrics rather than one number to cross.',
    sourceUrl: 'https://arxiv.org/abs/2410.07095',
  },
  {
    benchmark: 'BrowseComp',
    reason: 'threshold',
    quoted: '29.2%',
    detail:
      'A bounded-effort solve rate: what trainers managed within a few hours, not what people can do. It was passed almost immediately, which says more about the bar than the systems.',
    sourceUrl: 'https://openai.com/index/browsecomp/',
  },
  {
    benchmark: 'AGIEval',
    reason: 'out-of-scope',
    detail:
      'Publishes per-exam figures for average and top test-takers rather than one baseline, so which number counts as human level is a choice the tracker would be making, not the paper.',
    sourceUrl: 'https://arxiv.org/abs/2304.06364',
  },
  {
    benchmark: 'HLE, SWE-bench, MMLU-Pro, RULER, TAU-bench, miniF2F and others',
    reason: 'none',
    detail:
      'Checked and no human baseline is published. Also in this group: ARC, SNLI, MultiNLI, XNLI, HumanEval, MBPP, APPS, DS-1000, AI2D, DVQA, WikiTableQuestions, MMStar, SEED-Bench, MME, MVBench, Video-MME, ActivityNet-QA, NarrativeQA, CNN/DailyMail and XSum. Numbers circulate for several of them; none trace to a paper.',
  },
];

/** Grouped for display, most interesting failure mode first. */
export const REJECTION_ORDER: RejectionReason[] = [
  'model-score',
  'agreement',
  'unsourced',
  'threshold',
  'metric-mismatch',
  'self-assessed',
  'ceiling',
  'percentile',
  'out-of-scope',
  'none',
];
