"use client"

import React from 'react';
import { ExternalLink, FileText, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BASELINE_LABELS, formatScore, type Benchmark } from '@/data/benchmarks';
import { formatDate, toDuration } from '@/lib/benchmarkStats';
import { cn } from '@/lib/utils';

export function DateTag({ iso, className }: { iso: string | null; className?: string }) {
  return (
    <span className={cn('inline-block whitespace-nowrap rounded-md bg-muted/60 px-2 py-1 font-mono text-xs text-muted-foreground', className)}>
      {formatDate(iso)}
    </span>
  );
}

export function BenchmarkLinks({ item }: { item: Benchmark }) {
  return (
    <span className="inline-flex items-center gap-1">
      {item.url && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Website"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="sr-only">{item.benchmark} website</span>
        </a>
      )}
      {item.paperUrl && (
        <a
          href={item.paperUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Paper"
        >
          <FileText className="h-3.5 w-3.5" />
          <span className="sr-only">{item.benchmark} paper</span>
        </a>
      )}
    </span>
  );
}

/** The note behind a row: source text (stored as HTML) plus its references. */
export function SourceNote({ item }: { item: Benchmark }) {
  const source = item.solved.source;
  if (!source) return null;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={`Notes and sources for ${item.benchmark}`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-[420px] p-4" sideOffset={6}>
          <div className="space-y-3">
            <div className="text-sm leading-relaxed [&_sup]:text-[10px] [&_sup]:text-muted-foreground" dangerouslySetInnerHTML={{ __html: source.text }} />
            {source.references.length > 0 && (
              <ol className="space-y-1 border-t border-border/60 pt-2 text-xs">
                {source.references.map((ref, index) => (
                  <li key={ref.url} className="flex gap-2">
                    <span className="text-muted-foreground">[{index + 1}]</span>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand hover:underline"
                    >
                      {new URL(ref.url).hostname.replace('www.', '')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function BenchmarkName({ item }: { item: Benchmark }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-medium">{item.benchmark}</span>
      <BenchmarkLinks item={item} />
      <SourceNote item={item} />
    </div>
  );
}

export function ContestedBadge() {
  return (
    <span
      className="inline-flex items-center rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400"
      title="The h-match is disputed or the bar was unusually lenient - see the note"
    >
      contested
    </span>
  );
}

export function HumanBaselineTag({ item }: { item: Benchmark }) {
  if (!item.human) return <span className="text-xs text-muted-foreground">n/a</span>;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
      <span className="rounded-md bg-brand/10 px-2 py-0.5 font-mono text-xs font-medium text-brand">
        {formatScore(item.human.score, item.human.unit)}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {BASELINE_LABELS[item.human.baselineType]}
        {item.human.n ? ` · n=${item.human.n}` : ''}
      </span>
    </span>
  );
}

/** "Model - 86.6% vs 83.7%" with the baseline type and conditions underneath. */
export function MatchedBy({ item }: { item: Benchmark }) {
  const { model, score, conditions, contested } = item.solved;
  const human = item.human;
  return (
    <div className="flex min-w-[200px] flex-col gap-0.5">
      <span className="flex flex-wrap items-center gap-1.5 text-sm">
        {model ?? <span className="text-muted-foreground">Unattributed</span>}
        {contested && <ContestedBadge />}
      </span>
      {(score !== undefined || human) && (
        <span className="font-mono text-xs text-muted-foreground">
          {score !== undefined && <span className="text-foreground">{formatScore(score, human?.unit)}</span>}
          {score !== undefined && human && ' vs '}
          {human && (
            <>
              {formatScore(human.score, human.unit)}
              <span className="ml-1.5 text-[10px] uppercase tracking-wide opacity-70">
                {BASELINE_LABELS[human.baselineType]}
                {human.n ? ` n=${human.n}` : ''}
              </span>
            </>
          )}
        </span>
      )}
      {conditions && <span className="text-[11px] text-muted-foreground">{conditions}</span>}
    </div>
  );
}

export function TimeToSolveBadges({ years }: { years: number }) {
  const d = toDuration(years);
  if (d.isUnsolved) return <span className="text-xs text-muted-foreground">-</span>;
  if (d.isNegative) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 font-mono text-xs text-red-500">
        -{d.days}d
        <span className="text-[10px] uppercase tracking-wide opacity-80">before release</span>
      </span>
    );
  }
  const parts = [
    d.wholeYears > 0 && { value: d.wholeYears, unit: d.wholeYears === 1 ? 'year' : 'years', tone: 'bg-brand/15 text-brand' },
    d.months > 0 && { value: d.months, unit: d.months === 1 ? 'month' : 'months', tone: 'bg-brand/10 text-brand/90' },
    d.days > 0 && { value: d.days, unit: d.days === 1 ? 'day' : 'days', tone: 'bg-brand/5 text-brand/80' },
  ].filter(Boolean) as { value: number; unit: string; tone: string }[];
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {parts.map(part => (
        <span key={part.unit} className={cn('inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs tabular-nums', part.tone)}>
          {part.value} {part.unit}
        </span>
      ))}
    </span>
  );
}
