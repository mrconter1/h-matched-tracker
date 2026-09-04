"use client"

import React, { useMemo } from 'react';
import { benchmarkData } from '@/data/benchmarks';
import { calculateGlobalStats, formatDate, latestSolved } from '@/lib/benchmarkStats';
import { buildBenchmarksMarkdown } from '@/lib/markdown';
import { useMounted } from '@/lib/useMediaQuery';
import { SiteHeader } from '@/components/site/SiteHeader';
import { Hero } from '@/components/site/Hero';
import { Caption, Section } from '@/components/site/Section';
import { Contribute, SiteFooter } from '@/components/site/SiteFooter';
import { TimeToSolveChart } from '@/components/charts/TimeToSolveChart';
import { SurvivalChart } from '@/components/charts/SurvivalChart';
import { StatsGrid } from '@/components/StatsGrid';
import { SolvedTable } from '@/components/tables/SolvedTable';
import { UnsolvedTables } from '@/components/tables/UnsolvedTables';
import { RejectedTable } from '@/components/tables/RejectedTable';
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
  const updated = formatDate(now.toISOString());

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero stats={stats} latest={latest} updated={updated} />

      <main className="mx-auto max-w-4xl space-y-14 px-6 py-14">
        <Section
          id="trend"
          index={1}
          title="Interval by release year"
          description="One point per h-matched benchmark, placed at its release year against the years it then took to reach the human baseline."
        >
          <div className="p-2 sm:p-3">
            <TimeToSolveChart data={benchmarkData} />
          </div>
        </Section>
        <Caption>
          Filled circles are clean h-matches, open circles contested ones, and the larger circle is the most recent.
          The dashed line is an ordinary least-squares fit through the plotted points only. It is shown for continuity
          with earlier versions of this page and should not be read as the trend: it cannot see the benchmarks that are
          still open, which is exactly the bias section 2 corrects.
        </Caption>

        <Section
          id="survival"
          index={2}
          title="Share not yet h-matched, by release cohort"
          description="Kaplan-Meier estimate of the share of each cohort still below its human baseline at a given age."
        >
          <div className="p-2 sm:p-3">
            <SurvivalChart data={benchmarkData} />
          </div>
        </Section>
        <Caption>
          Benchmarks that are still open are censored at today&apos;s date, and unreported ones at the date of their last
          published score, so each curve stops where the evidence stops rather than implying the recent cohorts are
          finished. This is the estimate to read: averaging only the benchmarks that have already been h-matched
          understates the interval, because a benchmark released recently that will take years to fall cannot appear in
          that average yet.
        </Caption>

        <Section
          id="stats"
          index={3}
          title="Summary statistics"
          description="The survival estimate is the figure to quote. The others are included because they are the ones usually cited."
          flush
        >
          <div className="rounded border border-border bg-card">
            <StatsGrid stats={stats} total={benchmarkData.length} />
          </div>
        </Section>

        <Section
          id="solved"
          index={4}
          title="H-matched benchmarks"
          description="Benchmarks an AI system has taken to the published human baseline, with the system that did it and the conditions. Any column sorts; the information icon opens the note and its sources."
          flush
        >
          <div className="rounded border border-border bg-card">
            <SolvedTable data={benchmarkData} />
          </div>
        </Section>

        <Section
          id="unsolved"
          index={5}
          title="Not yet h-matched"
          description="Two different situations, kept apart: benchmarks the field is still failing, and benchmarks nobody has measured a current model on for years."
          flush
        >
          <div className="rounded border border-border bg-card">
            <UnsolvedTables data={benchmarkData} now={now} />
          </div>
        </Section>

        <Section
          id="excluded"
          index={6}
          title="Excluded benchmarks"
          description="Benchmarks considered and left out, with the reason. Checking whether a published human baseline is really a human baseline is most of the work behind this page, so the results are recorded rather than discarded."
          flush
        >
          <div className="rounded border border-border bg-card">
            <RejectedTable />
          </div>
        </Section>

        <Section id="export" index={7} title="Data and corrections" flush>
          <div className="grid rounded border border-border bg-card md:grid-cols-2 md:divide-x md:divide-border">
            <MarkdownExport getMarkdown={() => buildBenchmarksMarkdown(benchmarkData, stats, new Date())} />
            <div className="border-t border-border md:border-t-0">
              <Contribute />
            </div>
          </div>
        </Section>
      </main>

      <SiteFooter updated={updated} />
    </div>
  );
}
