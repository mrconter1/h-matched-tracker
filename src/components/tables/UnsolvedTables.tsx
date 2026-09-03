"use client"

import React from 'react';
import { getStatus, type Benchmark } from '@/data/benchmarks';
import { formatDurationShort } from '@/lib/benchmarkStats';
import { BenchmarkName, DateCell, HumanBaselineCell } from './BenchmarkBits';

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

const newestFirst = (a: Benchmark, b: Benchmark) => new Date(b.release).getTime() - new Date(a.release).getTime();

function Group({
  title,
  blurb,
  items,
  thirdHeader,
  thirdCell,
}: {
  title: string;
  blurb: string;
  items: Benchmark[];
  thirdHeader: string;
  thirdCell: (item: Benchmark) => React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 border-b border-border px-4 py-2.5">
        <div className="max-w-2xl">
          <h3 className="heading text-[15px]">{title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{blurb}</p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground tabular">{items.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="label px-4 py-2 text-left min-w-[200px]">Benchmark</th>
              <th scope="col" className="label px-4 py-2 text-left">Released</th>
              <th scope="col" className="label px-4 py-2 text-left">{thirdHeader}</th>
              <th scope="col" className="label px-4 py-2 text-left">Human baseline</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.benchmark} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                <td className="px-4 py-2.5 align-top"><BenchmarkName item={item} /></td>
                <td className="px-4 py-2.5 align-top"><DateCell iso={item.release} /></td>
                <td className="px-4 py-2.5 align-top">{thirdCell(item)}</td>
                <td className="px-4 py-2.5 align-top"><HumanBaselineCell item={item} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function UnsolvedTables({ data, now }: { data: Benchmark[]; now: Date }) {
  const open = data.filter(item => getStatus(item) === 'open').sort(newestFirst);
  const unreported = data.filter(item => getStatus(item) === 'unreported').sort(newestFirst);

  return (
    <div className="divide-y divide-border">
      {open.length > 0 && (
        <Group
          title="Open"
          blurb="Below the human baseline, and labs still publish scores on them."
          items={open}
          thirdHeader="Open for"
          thirdCell={item => (
            <span className="tabular whitespace-nowrap text-muted-foreground">
              {formatDurationShort((now.getTime() - new Date(item.release).getTime()) / YEAR_MS)}
            </span>
          )}
        />
      )}
      {unreported.length > 0 && (
        <Group
          title="Unreported"
          blurb="No published frontier-model score for about two years. Status unknown: a reporting gap, not evidence that they are hard."
          items={unreported}
          thirdHeader="Last reported"
          thirdCell={item =>
            item.lastReported ? (
              <DateCell iso={item.lastReported} />
            ) : (
              <span className="text-muted-foreground">unknown</span>
            )
          }
        />
      )}
    </div>
  );
}
