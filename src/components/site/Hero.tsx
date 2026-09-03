"use client"

import React, { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { type Benchmark, calculateTimeToSolve } from '@/data/benchmarks';
import { ABOUT_SECTIONS, SITE_TAGLINE } from '@/data/siteCopy';
import { formatDate, formatDurationShort, type GlobalStats } from '@/lib/benchmarkStats';

type KpiProps = {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: boolean;
};

function Kpi({ label, value, hint, accent }: KpiProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4 sm:p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl ${accent ? 'text-brand' : ''}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

type HeroProps = {
  stats: GlobalStats;
  latest: Benchmark | null;
};

export function Hero({ stats, latest }: HeroProps) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const latestGap = latest ? calculateTimeToSolve(latest.release, latest.solved) : null;

  return (
    <section id="top" className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.035)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.035)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_top,black_40%,transparent_75%)]" />
        <div className="absolute left-1/2 top-[-12rem] h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 sm:pt-20">
        <div className="max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            {stats.total} benchmarks tracked
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            How fast does AI catch up with{' '}
            <span className="text-brand">humans</span>?
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {SITE_TAGLINE}. A benchmark is <span className="font-medium text-foreground">h-matched</span> the day an AI
            system reaches the human baseline its authors published.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Kpi
            label="H-matched"
            value={`${stats.solvedCount} / ${stats.total}`}
            hint={`${stats.openCount} open · ${stats.unreportedCount} unreported`}
          />
          <Kpi
            label="Median time to h-match"
            value={stats.survivalMedianYears !== null ? `${stats.survivalMedianYears.toFixed(1)} yrs` : 'n/a'}
            hint="Survival estimate over all benchmarks"
            accent
          />
          <Kpi
            label="Solved within 2 years"
            value={`${Math.round(stats.solvedWithin2yFraction * 100)}%`}
            hint="Share of h-matched benchmarks"
          />
          {latest && (
            <Kpi
              label="Newest h-match"
              value={
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="truncate">{latest.benchmark}</span>
                  {latestGap !== null && (
                    <span className="text-sm font-medium text-muted-foreground">{formatDurationShort(latestGap)}</span>
                  )}
                </span>
              }
              hint={
                <>
                  {latest.solved.model ? `${latest.solved.model} · ` : ''}
                  {formatDate(latest.solved.date)}
                  {latest.url && (
                    <a
                      href={latest.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1.5 inline-flex align-middle text-muted-foreground hover:text-foreground"
                      aria-label={`${latest.benchmark} website`}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </>
              }
            />
          )}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setAboutOpen(open => !open)}
            aria-expanded={aboutOpen}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            What is this and why track it?
            <ChevronDown className={`h-4 w-4 transition-transform ${aboutOpen ? 'rotate-180' : ''}`} />
          </button>
          {aboutOpen && (
            <div className="mt-4 grid gap-4 rounded-xl border border-border/60 bg-card/60 p-5 animate-in fade-in slide-in-from-top-2 duration-200 md:grid-cols-3">
              {ABOUT_SECTIONS.map(section => (
                <div key={section.heading}>
                  <h3 className="text-sm font-semibold">{section.heading}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
