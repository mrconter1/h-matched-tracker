"use client"

import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { calculateTimeToSolve, type Benchmark } from '@/data/benchmarks';
import { BenchmarkName, DateCell, IntervalCell, MatchedByCell } from './BenchmarkBits';
import { cn } from '@/lib/utils';

type SortKey = 'benchmark' | 'release' | 'solved' | 'timeToSolve';
type SortState = { key: SortKey; direction: 'asc' | 'desc' };

const comparators: Record<SortKey, (a: Benchmark, b: Benchmark) => number> = {
  benchmark: (a, b) => a.benchmark.localeCompare(b.benchmark),
  release: (a, b) => new Date(a.release).getTime() - new Date(b.release).getTime(),
  solved: (a, b) => new Date(a.solved.date as string).getTime() - new Date(b.solved.date as string).getTime(),
  timeToSolve: (a, b) => calculateTimeToSolve(a.release, a.solved) - calculateTimeToSolve(b.release, b.solved),
};

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === sortKey;
  const Icon = active ? (sort.direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <th
      scope="col"
      className={cn('px-4 py-2 text-left', className)}
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn('label inline-flex items-center gap-1 transition-colors hover:text-foreground', active && 'text-foreground')}
      >
        {label}
        <Icon className="h-3 w-3 opacity-60" />
      </button>
    </th>
  );
}

export function SolvedTable({ data }: { data: Benchmark[] }) {
  const [sort, setSort] = useState<SortState>({ key: 'solved', direction: 'desc' });
  const [query, setQuery] = useState('');

  const all = useMemo(() => data.filter(item => item.solved.date !== null), [data]);
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = all.filter(
      item =>
        needle === '' ||
        item.benchmark.toLowerCase().includes(needle) ||
        (item.solved.model ?? '').toLowerCase().includes(needle)
    );
    const cmp = comparators[sort.key];
    return filtered.sort((a, b) => (sort.direction === 'asc' ? cmp(a, b) : cmp(b, a)));
  }, [all, sort, query]);

  const onSort = (key: SortKey) =>
    setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

  return (
    <div>
      <div className="flex items-baseline gap-3 border-b border-border px-4 py-2.5">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter by benchmark or model"
          className="h-7 w-full max-w-xs border-b border-transparent bg-transparent text-sm outline-none placeholder:text-muted-foreground focus:border-border"
        />
        <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular">
          {rows.length} of {all.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <SortHeader label="Benchmark" sortKey="benchmark" sort={sort} onSort={onSort} className="min-w-[200px]" />
              <SortHeader label="Released" sortKey="release" sort={sort} onSort={onSort} />
              <SortHeader label="H-matched" sortKey="solved" sort={sort} onSort={onSort} />
              <th scope="col" className="label px-4 py-2 text-left">By</th>
              <SortHeader label="Interval" sortKey="timeToSolve" sort={sort} onSort={onSort} />
            </tr>
          </thead>
          <tbody>
            {rows.map(item => (
              <tr key={item.benchmark} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                <td className="px-4 py-2.5 align-top">
                  <BenchmarkName item={item} />
                </td>
                <td className="px-4 py-2.5 align-top">
                  <DateCell iso={item.release} />
                </td>
                <td className="px-4 py-2.5 align-top">
                  <DateCell iso={item.solved.date} />
                </td>
                <td className="px-4 py-2.5 align-top">
                  <MatchedByCell item={item} />
                </td>
                <td className="px-4 py-2.5 align-top">
                  <IntervalCell years={calculateTimeToSolve(item.release, item.solved)} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Nothing matches &quot;{query}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
