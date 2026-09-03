"use client"

import React, { useMemo } from 'react';
import { benchmarkData } from '@/data/benchmarks';
import { calculateGlobalStats, formatDate, latestSolved } from '@/lib/benchmarkStats';
import { buildBenchmarksMarkdown } from '@/lib/markdown';
import { useMounted } from '@/lib/useMediaQuery';
import { SiteHeader } from '@/components/site/SiteHeader';
import { Hero } from '@/components/site/Hero';
import { Section } from '@/components/site/Section';
import { Contribute, SiteFooter } from '@/components/site/SiteFooter';
import { TimeToSolveChart } from '@/components/charts/TimeToSolveChart';
import { SurvivalChart } from '@/components/charts/SurvivalChart';
import { StatsGrid } from '@/components/StatsGrid';
import { SolvedTable } from '@/components/tables/SolvedTable';
import { UnsolvedTables } from '@/components/tables/UnsolvedTables';
import { MarkdownExport } from '@/components/MarkdownExport';

/**
 * Deterministic "now" for the server render so the first client render matches
 * it byte for byte; after mount the real clock takes over. The newest date in
 * the data is a natural stand-in.
 */
const DATA_HORIZON = benchmarkData.reduce((max, item) => {
  const candidates = [item.release, item.solved.date, item.lastReported].filter((d): d is string => Boolean(d));
  return candidates.reduce((m, d) => (d > m ? d : m), max);
}, '1970-01-01');

export default function BrokenBenchmarks() {
  const mounted = useMounted();
  const now = useMemo(() => (mounted ? new Date() : new Date(DATA_HORIZON)), [mounted]);
  const stats = useMemo(() => calculateGlobalStats(benchmarkData, now), [now]);
  const latest = useMemo(() => latestSolved(benchmarkData), []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero stats={stats} latest={latest} />

      <main className="mx-auto max-w-6xl space-y-14 px-4 pb-20 sm:px-6">
        <Section
          id="trend"
          title="Time from release to h-match"
          description={
            <>
              One point per h-matched benchmark, by release year. The dashed line is a plain linear fit through the
              solved points; it is kept for continuity but ignores the benchmarks still open, so read the survival
              curves below for the honest trend. The highlighted point is the newest h-match.
            </>
          }
        >
          <div className="p-2 sm:p-4">
            <TimeToSolveChart data={benchmarkData} />
          </div>
        </Section>

        <Section
          id="survival"
          title="Share still unsolved, by release cohort"
          description={
            <>
              Kaplan-Meier survival curves. Each line is the share of a cohort&apos;s benchmarks not yet h-matched at a
              given age. Open benchmarks are censored today and unreported ones at their last published score, so a line
              stops where the evidence stops instead of pretending the recent cohorts are finished.
            </>
          }
        >
          <div className="p-2 sm:p-4">
            <SurvivalChart data={benchmarkData} />
          </div>
        </Section>

        <Section
          id="stats"
          title="Across-benchmark statistics"
          description="Aggregate metrics. The survival estimate is the one to quote; the solved-only figures are shown because everyone else quotes those."
        >
          <StatsGrid stats={stats} total={benchmarkData.length} />
        </Section>

        <Section
          id="solved"
          title="H-matched benchmarks"
          description="Every benchmark where an AI system has reached the published human baseline, with who matched it and how strict that baseline was. Sort any column; the info icon opens the source note."
        >
          <SolvedTable data={benchmarkData} />
        </Section>

        <Section
          id="unsolved"
          title="Not yet h-matched"
          description="Two very different groups: benchmarks the field is actively failing, and benchmarks nobody has measured a frontier model on for years."
        >
          <UnsolvedTables data={benchmarkData} now={now} />
        </Section>

        <Section id="export" title="Take it with you">
          <div className="grid divide-y divide-border/60 md:grid-cols-2 md:divide-x md:divide-y-0">
            <MarkdownExport getMarkdown={() => buildBenchmarksMarkdown(benchmarkData, stats, new Date())} />
            <Contribute />
          </div>
        </Section>
      </main>

      <SiteFooter updated={formatDate(now.toISOString())} />
    </div>
  );
}
