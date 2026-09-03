import { BASELINE_LABELS, calculateTimeToSolve, formatScore, getStatus, type Benchmark } from '@/data/benchmarks';
import { ABOUT_SECTIONS, SITE_TAGLINE, SITE_TITLE, SITE_URL } from '@/data/siteCopy';
import { survivalByCohort, type SurvivalPoint } from '@/lib/survival';
import { REJECTION_LABELS, REJECTION_ORDER, rejectedBenchmarks } from '@/data/rejected';

/**
 * The subset of the across-benchmark statistics the export needs. Structurally
 * compatible with the GlobalStats the page already computes.
 */
export type ExportStats = {
  solvedCount: number;
  openCount: number;
  unreportedCount: number;
  avgTimeToSolveYears: number;
  avgTimeToSolveLast3Years: number | null;
  medianTimeToSolveYears: number;
  minTimeToSolveYears: number;
  maxTimeToSolveYears: number;
  solvedWithin1yFraction: number;
  solvedWithin2yFraction: number;
  solvedWithin3yFraction: number;
  longestOpenYears: number | null;
  survivalMedianYears: number | null;
};

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&nbsp;': ' ',
};

/** Source notes are stored as HTML, so flatten them back to plain text. */
const toPlainText = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, entity => HTML_ENTITIES[entity.toLowerCase()] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();

const escapeCell = (text: string) => text.replace(/\|/g, '\\|');

const formatYears = (years: number) => `${years.toFixed(2)} years`;

const formatPercent = (fraction: number) => `${(fraction * 100).toFixed(1)}%`;

const yearsSince = (releaseDate: string, now: Date) => {
  const diffTime = now.getTime() - new Date(releaseDate).getTime();
  return diffTime / (1000 * 60 * 60 * 24 * 365.25);
};

/** e.g. "83.7% (small sample, n=9)" - the number alone hides how strict the bar was. */
const humanCell = (item: Benchmark) => {
  if (!item.human) return '-';
  const who = [BASELINE_LABELS[item.human.baselineType], item.human.n ? `n=${item.human.n}` : '']
    .filter(Boolean)
    .join(', ');
  return `${formatScore(item.human.score, item.human.unit)} (${who})`;
};

const links = (item: Benchmark) => {
  const parts: string[] = [];
  if (item.url) parts.push(`[site](${item.url})`);
  if (item.paperUrl) parts.push(`[paper](${item.paperUrl})`);
  return parts.length > 0 ? parts.join(' · ') : '-';
};

const SURVIVAL_AGES = [0.5, 1, 2, 3, 5];

const survivalAt = (points: SurvivalPoint[], t: number): number | null => {
  const last = points[points.length - 1];
  if (t > last.t) return null;
  let s = 1;
  for (const point of points) {
    if (point.t <= t) s = point.s;
    else break;
  }
  return s;
};

const survivalTable = (data: Benchmark[], now: Date) =>
  table(
    ['Cohort', 'n', 'Solved', ...SURVIVAL_AGES.map(age => `Unsolved at ${age}y`), 'Median'],
    survivalByCohort(data, now).map(cohort => [
      cohort.label,
      String(cohort.curve.n),
      String(cohort.curve.events),
      ...SURVIVAL_AGES.map(age => {
        const s = survivalAt(cohort.curve.points, age);
        return s === null ? 'no data yet' : formatPercent(s);
      }),
      cohort.curve.median !== null ? formatYears(cohort.curve.median) : 'not reached',
    ])
  );

const statusLine = (item: Benchmark) => {
  switch (getStatus(item)) {
    case 'solved':
      return `h-matched ${item.solved.date}`;
    case 'unreported':
      return item.lastReported
        ? `unreported since ${item.lastReported} (status unknown)`
        : 'unreported (status unknown)';
    default:
      return 'open';
  }
};

const table = (headers: string[], rows: string[][]) =>
  [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map(row => `| ${row.join(' | ')} |`),
  ].join('\n');

/**
 * Renders the whole tracker - intro, statistics, both benchmark tables and the
 * per-benchmark source notes - as a single structured Markdown document.
 */
export const buildBenchmarksMarkdown = (
  data: Benchmark[],
  stats: ExportStats,
  now: Date = new Date()
): string => {
  const exportedOn = now.toISOString().slice(0, 10);

  const solved = data
    .filter(item => item.solved.date !== null)
    .sort((a, b) => new Date(a.release).getTime() - new Date(b.release).getTime());

  const newestFirst = (a: Benchmark, b: Benchmark) =>
    new Date(b.release).getTime() - new Date(a.release).getTime();
  const open = data.filter(item => getStatus(item) === 'open').sort(newestFirst);
  const unreported = data.filter(item => getStatus(item) === 'unreported').sort(newestFirst);

  const sections: string[] = [];

  sections.push(
    [
      `# ${SITE_TITLE}`,
      '',
      `> ${SITE_TAGLINE}.`,
      '',
      `- Source: ${SITE_URL}`,
      `- Exported: ${exportedOn}`,
      `- Benchmarks tracked: ${data.length} (${stats.solvedCount} h-matched, ${stats.openCount} open, ${stats.unreportedCount} unreported)`,
      '',
      'All dates are ISO 8601 (UTC). "Time to h-matched" is the gap between a',
      "benchmark's release and the date AI reached human-level performance on it;",
      'a negative value means the benchmark was already h-matched when it shipped.',
      '"Unreported" benchmarks have had no published frontier-model score for about',
      'two years: their true status is unknown, which is a reporting gap rather than',
      'evidence that they are hard.',
    ].join('\n')
  );

  sections.push(
    ['## About', '', ...ABOUT_SECTIONS.map(s => `### ${s.heading}\n\n${s.body}\n`)].join('\n').trimEnd()
  );

  sections.push(
    [
      '## Across-benchmark statistics',
      '',
      '"Solved only" figures average the h-matched benchmarks and are biased low, because a',
      'recent benchmark that will take years to solve cannot be in the solved set yet. The',
      'survival estimate is Kaplan-Meier over every benchmark: open ones are censored today,',
      'unreported ones at their last published score.',
      '',
      table(
        ['Metric', 'Value'],
        [
          [
            'Median time to h-matched (survival estimate, all benchmarks)',
            stats.survivalMedianYears !== null ? formatYears(stats.survivalMedianYears) : 'not reached',
          ],
          ['Median time to h-matched (solved only)', formatYears(stats.medianTimeToSolveYears)],
          ['Average time to h-matched (solved only)', formatYears(stats.avgTimeToSolveYears)],
          [
            'Average time to h-matched (released in the last 3 years, solved only)',
            stats.avgTimeToSolveLast3Years !== null ? formatYears(stats.avgTimeToSolveLast3Years) : 'N/A',
          ],
          ['Shortest time to h-matched', formatYears(stats.minTimeToSolveYears)],
          ['Longest time to h-matched', formatYears(stats.maxTimeToSolveYears)],
          ['H-matched within 1 year', `${formatPercent(stats.solvedWithin1yFraction)} of h-matched benchmarks`],
          ['H-matched within 2 years', `${formatPercent(stats.solvedWithin2yFraction)} of h-matched benchmarks`],
          ['H-matched within 3 years', `${formatPercent(stats.solvedWithin3yFraction)} of h-matched benchmarks`],
          [
            'Longest open (since release, unreported excluded)',
            stats.longestOpenYears !== null ? formatYears(stats.longestOpenYears) : 'N/A',
          ],
        ]
      ),
      '',
      '### Survival by release cohort',
      '',
      'Share of each cohort still not h-matched at a given age (Kaplan-Meier).',
      '',
      survivalTable(data, now),
    ].join('\n')
  );

  sections.push(
    [
      '## H-matched benchmarks',
      '',
      'Chronological list of AI benchmarks where human-level performance has been achieved.',
      '',
      table(
        ['Benchmark', 'Released', 'H-matched', 'Time to h-matched', 'H-matched by', 'Score', 'Human baseline', 'Links'],
        solved.map(item => [
          escapeCell(item.benchmark),
          item.release,
          item.solved.date as string,
          formatYears(calculateTimeToSolve(item.release, item.solved)),
          escapeCell(
            [item.solved.model ?? 'unattributed', item.solved.contested ? '(contested)' : '', item.solved.conditions ? `- ${item.solved.conditions}` : '']
              .filter(Boolean)
              .join(' ')
          ),
          item.solved.score !== undefined ? formatScore(item.solved.score, item.human?.unit) : '-',
          humanCell(item),
          links(item),
        ])
      ),
    ].join('\n')
  );

  if (open.length > 0) {
    sections.push(
      [
        '## Open benchmarks',
        '',
        'Benchmarks where AI has not yet reached human-level performance and labs still report scores.',
        '',
        table(
          ['Benchmark', 'Released', 'Open for', 'Human baseline', 'Links'],
          open.map(item => [
            escapeCell(item.benchmark),
            item.release,
            formatYears(yearsSince(item.release, now)),
            humanCell(item),
            links(item),
          ])
        ),
      ].join('\n')
    );
  }

  if (unreported.length > 0) {
    sections.push(
      [
        '## Unreported benchmarks',
        '',
        'No published frontier-model score for about two years. Status unknown.',
        '',
        table(
          ['Benchmark', 'Released', 'Last reported', 'Human baseline', 'Links'],
          unreported.map(item => [
            escapeCell(item.benchmark),
            item.release,
            item.lastReported ?? 'unknown',
            humanCell(item),
            links(item),
          ])
        ),
      ].join('\n')
    );
  }

  const notes = [...solved, ...open, ...unreported].filter(item => item.solved.source);
  if (notes.length > 0) {
    sections.push(
      [
        '## Notes and sources',
        '',
        ...notes.map(item => {
          const source = item.solved.source!;
          const references = source.references.map((ref, index) => `${index + 1}. ${ref.url}`);
          return [
            `### ${item.benchmark}`,
            '',
            `Released ${item.release} · ${statusLine(item)}`,
            '',
            toPlainText(source.text),
            '',
            ...(references.length > 0 ? ['Sources:', '', ...references, ''] : []),
          ].join('\n');
        }),
      ]
        .join('\n')
        .trimEnd()
    );
  }

  const rejected = REJECTION_ORDER.flatMap(reason => rejectedBenchmarks.filter(item => item.reason === reason));
  if (rejected.length > 0) {
    sections.push(
      [
        '## Excluded benchmarks',
        '',
        'Considered and left out. A benchmark qualifies only with a published human score measured on the',
        "same metric and split that models are scored on; these do not have one. Note how many are a model's",
        'own score being circulated as the human number.',
        '',
        table(
          ['Benchmark', 'Quoted as', 'What the number is', 'Why'],
          rejected.map(item => [
            escapeCell(item.benchmark),
            item.quoted ? escapeCell(item.quoted) : '-',
            REJECTION_LABELS[item.reason],
            escapeCell(item.detail),
          ])
        ),
      ].join('\n')
    );
  }

  sections.push(`Created by Rasmus Lindahl · ${SITE_URL}`);

  return `${sections.join('\n\n')}\n`;
};
