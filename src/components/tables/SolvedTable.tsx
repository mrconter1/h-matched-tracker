"use client"

import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { calculateTimeToSolve, type Benchmark } from '@/data/benchmarks';
import { BenchmarkName, DateTag, MatchedBy, TimeToSolveBadges } from './BenchmarkBits';
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
  const Icon = active ? (sort.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSort(sortKey)}
        className={cn('-ml-3 h-8 gap-1.5 px-3 text-xs font-medium uppercase tracking-wider', active ? 'text-foreground' : 'text-muted-foreground')}
        aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        {label}
        <Icon className="h-3.5 w-3.5" />
      </Button>
    </TableHead>
  );
}

export function SolvedTable({ data }: { data: Benchmark[] }) {
  const [sort, setSort] = useState<SortState>({ key: 'solved', direction: 'desc' });
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = data.filter(
      item =>
        item.solved.date !== null &&
        (needle === '' ||
          item.benchmark.toLowerCase().includes(needle) ||
          (item.solved.model ?? '').toLowerCase().includes(needle))
    );
    const cmp = comparators[sort.key];
    return filtered.sort((a, b) => (sort.direction === 'asc' ? cmp(a, b) : cmp(b, a)));
  }, [data, sort, query]);

  const onSort = (key: SortKey) =>
    setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3 sm:px-5">
        <label className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter by benchmark or model"
            className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </label>
        <span className="ml-auto text-xs text-muted-foreground">
          {rows.length} of {data.filter(i => i.solved.date !== null).length}
        </span>
      </div>

      <Table>
        <TableHeader className="[&_tr]:border-border/60">
          <TableRow className="hover:bg-transparent">
            <SortHeader label="Benchmark" sortKey="benchmark" sort={sort} onSort={onSort} className="min-w-[220px]" />
            <SortHeader label="Released" sortKey="release" sort={sort} onSort={onSort} />
            <SortHeader label="H-matched" sortKey="solved" sort={sort} onSort={onSort} />
            <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">H-matched by</TableHead>
            <SortHeader label="Gap" sortKey="timeToSolve" sort={sort} onSort={onSort} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(item => (
            <TableRow key={item.benchmark} className="border-border/60 hover:bg-muted/40">
              <TableCell className="py-3">
                <BenchmarkName item={item} />
              </TableCell>
              <TableCell className="py-3">
                <DateTag iso={item.release} />
              </TableCell>
              <TableCell className="py-3">
                <DateTag iso={item.solved.date} />
              </TableCell>
              <TableCell className="py-3">
                <MatchedBy item={item} />
              </TableCell>
              <TableCell className="py-3">
                <TimeToSolveBadges years={calculateTimeToSolve(item.release, item.solved)} />
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                Nothing matches &quot;{query}&quot;.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
