import React from 'react';
import { formatPercent, formatYears, type GlobalStats } from '@/lib/benchmarkStats';

type Row = { label: string; value: string; note?: string; emphasis?: boolean };

/** The statistics as a two-column table, the way a paper would print them. */
export function StatsGrid({ stats, total }: { stats: GlobalStats; total: number }) {
  const rows: Row[] = [
    {
      label: 'Median interval, survival estimate',
      value: stats.survivalMedianYears !== null ? formatYears(stats.survivalMedianYears) : 'not reached',
      note: `Kaplan-Meier over all ${total} benchmarks; open censored today, unreported at last published score`,
      emphasis: true,
    },
    {
      label: 'Median interval, h-matched only',
      value: formatYears(stats.medianTimeToSolveYears),
      note: 'Biased low: ignores benchmarks not yet h-matched',
    },
    {
      label: 'Mean interval, h-matched only',
      value: formatYears(stats.avgTimeToSolveYears),
      note: 'Biased low for the same reason',
    },
    {
      label: 'Mean interval, released in the last 3 years',
      value: stats.avgTimeToSolveLast3Years !== null ? formatYears(stats.avgTimeToSolveLast3Years) : 'n/a',
      note: 'The most heavily censored subset, and the most often quoted',
    },
    { label: 'Shortest interval', value: formatYears(stats.minTimeToSolveYears) },
    { label: 'Longest interval', value: formatYears(stats.maxTimeToSolveYears) },
    {
      label: 'H-matched within 1 / 2 / 3 years',
      value: `${formatPercent(stats.solvedWithin1yFraction)} / ${formatPercent(stats.solvedWithin2yFraction)} / ${formatPercent(stats.solvedWithin3yFraction)}`,
      note: 'Share of h-matched benchmarks',
    },
    {
      label: 'Longest still open',
      value: stats.longestOpenYears !== null ? formatYears(stats.longestOpenYears) : 'n/a',
      note: 'Since release; unreported benchmarks excluded',
    },
    {
      label: 'H-matched / open / unreported',
      value: `${stats.solvedCount} / ${stats.openCount} / ${stats.unreportedCount}`,
    },
  ];

  return (
    <div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.label} className={index > 0 ? 'border-t border-border' : ''}>
              <th scope="row" className="w-1/2 px-5 py-3 text-left align-top font-normal">
                <span className="block">{row.label}</span>
                {row.note && <span className="mt-0.5 block text-xs text-muted-foreground">{row.note}</span>}
              </th>
              <td
                className={`px-5 py-3 text-right align-top tabular font-medium ${row.emphasis ? 'text-brand' : ''}`}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
