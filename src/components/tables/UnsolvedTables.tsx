"use client"

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStatus, type Benchmark } from '@/data/benchmarks';
import { formatDurationShort } from '@/lib/benchmarkStats';
import { BenchmarkName, DateTag, HumanBaselineTag } from './BenchmarkBits';

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

const newestFirst = (a: Benchmark, b: Benchmark) => new Date(b.release).getTime() - new Date(a.release).getTime();

const Head = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <TableHead className={`text-xs font-medium uppercase tracking-wider text-muted-foreground ${className ?? ''}`}>{children}</TableHead>
);

function OpenTable({ items, now }: { items: Benchmark[]; now: Date }) {
  return (
    <Table>
      <TableHeader className="[&_tr]:border-border/60">
        <TableRow className="hover:bg-transparent">
          <Head className="min-w-[220px]">Benchmark</Head>
          <Head>Released</Head>
          <Head>Open for</Head>
          <Head>Human baseline</Head>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(item => (
          <TableRow key={item.benchmark} className="border-border/60 hover:bg-muted/40">
            <TableCell className="py-3"><BenchmarkName item={item} /></TableCell>
            <TableCell className="py-3"><DateTag iso={item.release} /></TableCell>
            <TableCell className="py-3 font-mono text-xs text-muted-foreground">
              {formatDurationShort((now.getTime() - new Date(item.release).getTime()) / YEAR_MS)}
            </TableCell>
            <TableCell className="py-3"><HumanBaselineTag item={item} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function UnreportedTable({ items }: { items: Benchmark[] }) {
  return (
    <Table>
      <TableHeader className="[&_tr]:border-border/60">
        <TableRow className="hover:bg-transparent">
          <Head className="min-w-[220px]">Benchmark</Head>
          <Head>Released</Head>
          <Head>Last reported</Head>
          <Head>Human baseline</Head>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(item => (
          <TableRow key={item.benchmark} className="border-border/60 hover:bg-muted/40">
            <TableCell className="py-3"><BenchmarkName item={item} /></TableCell>
            <TableCell className="py-3"><DateTag iso={item.release} /></TableCell>
            <TableCell className="py-3">
              {item.lastReported ? (
                <DateTag iso={item.lastReported} />
              ) : (
                <span className="inline-block rounded-md bg-muted/60 px-2 py-1 font-mono text-xs text-muted-foreground">unknown</span>
              )}
            </TableCell>
            <TableCell className="py-3"><HumanBaselineTag item={item} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function UnsolvedTables({ data, now }: { data: Benchmark[]; now: Date }) {
  const open = data.filter(item => getStatus(item) === 'open').sort(newestFirst);
  const unreported = data.filter(item => getStatus(item) === 'unreported').sort(newestFirst);

  return (
    <div className="divide-y divide-border/60">
      {open.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between gap-4 px-4 py-3 sm:px-5">
            <div>
              <h3 className="text-sm font-semibold">Open</h3>
              <p className="text-xs text-muted-foreground">Below the human baseline, and labs still report scores on them.</p>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{open.length}</span>
          </div>
          <OpenTable items={open} now={now} />
        </div>
      )}
      {unreported.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between gap-4 px-4 py-3 sm:px-5">
            <div>
              <h3 className="text-sm font-semibold">Unreported</h3>
              <p className="text-xs text-muted-foreground">
                No published frontier-model score for about two years. Status unknown - a reporting gap, not evidence that
                they are hard.
              </p>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{unreported.length}</span>
          </div>
          <UnreportedTable items={unreported} />
        </div>
      )}
    </div>
  );
}
