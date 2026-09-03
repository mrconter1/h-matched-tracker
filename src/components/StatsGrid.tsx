import React from 'react';
import { formatPercent, formatYears, type GlobalStats } from '@/lib/benchmarkStats';

type Tile = { label: string; value: string; hint?: string; emphasis?: boolean };

function StatTile({ label, value, hint, emphasis }: Tile) {
  return (
    <div className="p-4 sm:p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-xl font-semibold tabular-nums tracking-tight ${emphasis ? 'text-brand' : ''}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function StatsGrid({ stats, total }: { stats: GlobalStats; total: number }) {
  const tiles: Tile[] = [
    {
      label: 'Median time to h-match',
      value: stats.survivalMedianYears !== null ? formatYears(stats.survivalMedianYears) : 'Not reached',
      hint: `Survival estimate, all ${total} benchmarks`,
      emphasis: true,
    },
    {
      label: 'Median (solved only)',
      value: formatYears(stats.medianTimeToSolveYears),
      hint: 'Biased low - ignores censoring',
    },
    {
      label: 'Average (solved only)',
      value: formatYears(stats.avgTimeToSolveYears),
      hint: 'Biased low - ignores censoring',
    },
    {
      label: 'Average, released last 3 yrs',
      value: stats.avgTimeToSolveLast3Years !== null ? formatYears(stats.avgTimeToSolveLast3Years) : 'N/A',
      hint: 'Solved only; the most censored subset',
    },
    { label: 'Shortest gap', value: formatYears(stats.minTimeToSolveYears) },
    { label: 'Longest gap', value: formatYears(stats.maxTimeToSolveYears) },
    {
      label: 'H-matched within 1 / 2 / 3 yrs',
      value: `${formatPercent(stats.solvedWithin1yFraction)} / ${formatPercent(stats.solvedWithin2yFraction)} / ${formatPercent(stats.solvedWithin3yFraction)}`,
      hint: 'Share of h-matched benchmarks',
    },
    {
      label: 'Longest open',
      value: stats.longestOpenYears !== null ? formatYears(stats.longestOpenYears) : 'N/A',
      hint: 'Since release; unreported excluded',
    },
    {
      label: 'Status split',
      value: `${stats.solvedCount} · ${stats.openCount} · ${stats.unreportedCount}`,
      hint: 'h-matched · open · unreported',
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 divide-x divide-y divide-border/60 md:grid-cols-3 [&>*:nth-child(-n+2)]:border-t-0 md:[&>*:nth-child(-n+3)]:border-t-0 [&>*:nth-child(2n+1)]:border-l-0 md:[&>*:nth-child(2n+1)]:border-l md:[&>*:nth-child(3n+1)]:border-l-0">
        {tiles.map(tile => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </div>
      <p className="border-t border-border/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground sm:px-5">
        &quot;Solved only&quot; figures average the h-matched benchmarks and are biased low: a recent benchmark that will
        take years to solve cannot be in the solved set yet. The survival estimate is Kaplan-Meier over every benchmark,
        with open ones censored today and unreported ones at their last published score.
      </p>
    </div>
  );
}
