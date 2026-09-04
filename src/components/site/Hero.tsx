"use client"

import React, { useState } from 'react';
import { type Benchmark, calculateTimeToSolve } from '@/data/benchmarks';
import { ABOUT_SECTIONS } from '@/data/siteCopy';
import { formatDate, formatDurationShort, type GlobalStats } from '@/lib/benchmarkStats';

type HeroProps = {
  stats: GlobalStats;
  latest: Benchmark | null;
  updated: string;
};

/** Title block, abstract, and a rule of key figures. Deliberately text-first. */
export function Hero({ stats, latest, updated }: HeroProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const latestGap = latest ? calculateTimeToSolve(latest.release, latest.solved) : null;

  const figures: { label: string; value: string }[] = [
    { label: 'Benchmarks', value: String(stats.total) },
    { label: 'H-matched', value: String(stats.solvedCount) },
    { label: 'Open', value: String(stats.openCount) },
    { label: 'Unreported', value: String(stats.unreportedCount) },
    {
      label: 'Median interval',
      value: stats.survivalMedianYears !== null ? `${stats.survivalMedianYears.toFixed(2)} yr` : 'n/a',
    },
  ];

  return (
    <header id="top" className="border-b border-border">
      <div className="mx-auto max-w-4xl px-6 pb-10 pt-14 sm:pt-20">
        <p className="label mb-3">h-matched tracker</p>
        <h1 className="heading text-3xl leading-tight sm:text-4xl">
          Time from benchmark release to human-level AI performance
        </h1>

        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          A benchmark is <em className="text-foreground not-italic font-medium">h-matched</em> on the date an AI system
          first reaches the human baseline its authors published. This page records that interval for every benchmark
          with a measured human baseline, and shows what it is doing over time. Benchmarks whose &quot;human baseline&quot;
          turns out to be an estimated ceiling, a passing threshold, or a model&apos;s own score are excluded.
        </p>

        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-y border-border py-4">
          {figures.map(figure => (
            <div key={figure.label}>
              <dt className="label">{figure.label}</dt>
              <dd className="tabular mt-0.5 text-lg font-medium">{figure.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <span suppressHydrationWarning>Updated {updated}</span>
          {latest && (
            <span>
              Most recent h-match: <span className="text-foreground">{latest.benchmark}</span>
              {latest.solved.model ? `, ${latest.solved.model}` : ''}
              {latestGap !== null ? `, after ${formatDurationShort(latestGap)}` : ''} (
              {formatDate(latest.solved.date)})
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setNotesOpen(open => !open)}
          aria-expanded={notesOpen}
          className="mt-6 text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          {notesOpen ? 'Hide notes on method' : 'Notes on method'}
        </button>
        {notesOpen && (
          <div className="mt-4 space-y-4 border-l-2 border-border pl-5 text-sm leading-relaxed text-muted-foreground">
            {ABOUT_SECTIONS.map(section => (
              <div key={section.heading}>
                <h2 className="heading text-[15px] text-foreground">{section.heading}</h2>
                <p className="mt-1">{section.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
