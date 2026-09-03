import { calculateTimeToSolve, type Benchmark } from '@/data/benchmarks';
import { ABOUT_SECTIONS, SITE_TAGLINE, SITE_TITLE, SITE_URL } from '@/data/siteCopy';

/**
 * The subset of the across-benchmark statistics the export needs. Structurally
 * compatible with the GlobalStats the page already computes.
 */
export type ExportStats = {
  solvedCount: number;
  unsolvedCount: number;
  avgTimeToSolveYears: number;
  avgTimeToSolveLast3Years: number | null;
  medianTimeToSolveYears: number;
  minTimeToSolveYears: number;
  maxTimeToSolveYears: number;
  solvedWithin1yFraction: number;
  solvedWithin2yFraction: number;
  solvedWithin3yFraction: number;
  longestUnsolvedYears: number | null;
  timeToSolveSlopeYearsPerReleaseYear: number;
  timeToSolveR2: number;
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

const links = (item: Benchmark) => {
  const parts: string[] = [];
  if (item.url) parts.push(`[site](${item.url})`);
  if (item.paperUrl) parts.push(`[paper](${item.paperUrl})`);
  return parts.length > 0 ? parts.join(' · ') : '-';
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

  const unsolved = data
    .filter(item => item.solved.date === null)
    .sort((a, b) => new Date(b.release).getTime() - new Date(a.release).getTime());

  const sections: string[] = [];

  sections.push(
    [
      `# ${SITE_TITLE}`,
      '',
      `> ${SITE_TAGLINE}.`,
      '',
      `- Source: ${SITE_URL}`,
      `- Exported: ${exportedOn}`,
      `- Benchmarks tracked: ${data.length} (${stats.solvedCount} h-matched, ${stats.unsolvedCount} unsolved)`,
      '',
      'All dates are ISO 8601 (UTC). "Time to h-matched" is the gap between a',
      "benchmark's release and the date AI reached human-level performance on it;",
      'a negative value means the benchmark was already h-matched when it shipped.',
    ].join('\n')
  );

  sections.push(
    ['## About', '', ...ABOUT_SECTIONS.map(s => `### ${s.heading}\n\n${s.body}\n`)].join('\n').trimEnd()
  );

  sections.push(
    [
      '## Across-benchmark statistics',
      '',
      'Aggregate metrics computed over all h-matched benchmarks.',
      '',
      table(
        ['Metric', 'Value'],
        [
          [
            'Average time to h-matched (benchmarks released in the last 3 years)',
            stats.avgTimeToSolveLast3Years !== null ? formatYears(stats.avgTimeToSolveLast3Years) : 'N/A',
          ],
          ['Average time to h-matched', formatYears(stats.avgTimeToSolveYears)],
          ['Median time to h-matched', formatYears(stats.medianTimeToSolveYears)],
          ['Shortest time to h-matched', formatYears(stats.minTimeToSolveYears)],
          ['Longest time to h-matched', formatYears(stats.maxTimeToSolveYears)],
          ['H-matched within 1 year', `${formatPercent(stats.solvedWithin1yFraction)} of h-matched benchmarks`],
          ['H-matched within 2 years', `${formatPercent(stats.solvedWithin2yFraction)} of h-matched benchmarks`],
          ['H-matched within 3 years', `${formatPercent(stats.solvedWithin3yFraction)} of h-matched benchmarks`],
          [
            'Longest unsolved (since release)',
            stats.longestUnsolvedYears !== null ? formatYears(stats.longestUnsolvedYears) : 'N/A',
          ],
          [
            'Trend slope',
            `${stats.timeToSolveSlopeYearsPerReleaseYear.toFixed(3)} years per release year (R² = ${stats.timeToSolveR2.toFixed(2)})`,
          ],
        ]
      ),
    ].join('\n')
  );

  sections.push(
    [
      '## H-matched benchmarks',
      '',
      'Chronological list of AI benchmarks where human-level performance has been achieved.',
      '',
      table(
        ['Benchmark', 'Released', 'H-matched', 'Time to h-matched', 'Links'],
        solved.map(item => [
          escapeCell(item.benchmark),
          item.release,
          item.solved.date as string,
          formatYears(calculateTimeToSolve(item.release, item.solved)),
          links(item),
        ])
      ),
    ].join('\n')
  );

  if (unsolved.length > 0) {
    sections.push(
      [
        '## Unsolved benchmarks',
        '',
        'Benchmarks where AI has not yet reached human-level performance.',
        '',
        table(
          ['Benchmark', 'Released', 'Unsolved for', 'Links'],
          unsolved.map(item => [
            escapeCell(item.benchmark),
            item.release,
            formatYears(yearsSince(item.release, now)),
            links(item),
          ])
        ),
      ].join('\n')
    );
  }

  const notes = [...solved, ...unsolved].filter(item => item.solved.source);
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
            `Released ${item.release} · ${
              item.solved.date ? `h-matched ${item.solved.date}` : 'not yet h-matched'
            }`,
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

  sections.push(`Created by Rasmus Lindahl · ${SITE_URL}`);

  return `${sections.join('\n\n')}\n`;
};
