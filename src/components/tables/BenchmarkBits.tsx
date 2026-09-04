"use client"

import React from 'react';
import { ExternalLink, FileText, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BASELINE_LABELS, formatScore, type Benchmark } from '@/data/benchmarks';
import { formatDate, toDuration } from '@/lib/benchmarkStats';
import { cn } from '@/lib/utils';

export function DateCell({ iso, className }: { iso: string | null; className?: string }) {
  return <span className={cn('tabular whitespace-nowrap text-muted-foreground', className)}>{formatDate(iso)}</span>;
}

function IconLink({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className="inline-flex text-muted-foreground/70 transition-colors hover:text-foreground"
    >
      {children}
    </a>
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
            className="inline-flex text-muted-foreground/70 transition-colors hover:text-foreground"
            aria-label={`Notes and sources for ${item.benchmark}`}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-[440px] rounded border p-4" sideOffset={6}>
          <div className="space-y-3">
            <div
              className="text-[13px] leading-relaxed [&_sup]:text-[10px] [&_sup]:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: source.text }}
            />
            {source.references.length > 0 && (
              <ol className="space-y-1 border-t border-border pt-2 text-xs">
                {source.references.map((ref, index) => (
                  <li key={ref.url} className="flex gap-2">
                    <span className="text-muted-foreground tabular">[{index + 1}]</span>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand underline underline-offset-2"
                    >
                      {new URL(ref.url).hostname.replace('www.', '')}
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
    <span className="flex items-baseline gap-1.5">
      <span className="font-medium">{item.benchmark}</span>
      <span className="inline-flex translate-y-px items-center gap-1">
        {item.url && (
          <IconLink href={item.url} title="Website">
            <ExternalLink className="h-3 w-3" />
          </IconLink>
        )}
        {item.paperUrl && (
          <IconLink href={item.paperUrl} title="Paper">
            <FileText className="h-3 w-3" />
          </IconLink>
        )}
        <SourceNote item={item} />
      </span>
    </span>
  );
}

export function ContestedMark() {
  return (
    <abbr
      title="The h-match is disputed, or the bar was unusually lenient - see the note"
      className="ml-1 cursor-help align-super text-[10px] font-medium uppercase tracking-wide text-muted-foreground no-underline"
    >
      contested
    </abbr>
  );
}

export function HumanBaselineCell({ item }: { item: Benchmark }) {
  if (!item.human) return <span className="text-muted-foreground">n/a</span>;
  return (
    <span className="whitespace-nowrap">
      <span className="tabular">{formatScore(item.human.score, item.human.unit)}</span>
      <span className="ml-1.5 text-xs text-muted-foreground">
        {BASELINE_LABELS[item.human.baselineType]}
        {item.human.n ? `, n=${item.human.n}` : ''}
      </span>
    </span>
  );
}

/** Model, its score against the human number, and the conditions. */
export function MatchedByCell({ item }: { item: Benchmark }) {
  const { model, score, conditions, contested } = item.solved;
  const human = item.human;
  return (
    <span className="block min-w-[190px]">
      <span className="block">
        {model ?? <span className="text-muted-foreground">unattributed</span>}
        {contested && <ContestedMark />}
      </span>
      {(score !== undefined || human) && (
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {score !== undefined && <span className="tabular text-foreground">{formatScore(score, human?.unit)}</span>}
          {score !== undefined && human && ' vs '}
          {human && <span className="tabular">{formatScore(human.score, human.unit)}</span>}
          {conditions && <span className="block">{conditions}</span>}
        </span>
      )}
    </span>
  );
}

/** "1 yr 10 mo" - plain text, no coloured pills. */
export function IntervalCell({ years }: { years: number }) {
  const d = toDuration(years);
  if (d.isUnsolved) return <span className="text-muted-foreground">-</span>;
  if (d.isNegative) {
    return (
      <span className="tabular whitespace-nowrap">
        -{d.days} d<span className="ml-1 text-xs text-muted-foreground">before release</span>
      </span>
    );
  }
  const parts: string[] = [];
  if (d.wholeYears > 0) parts.push(`${d.wholeYears} yr`);
  if (d.months > 0) parts.push(`${d.months} mo`);
  if (parts.length === 0) parts.push(`${d.days} d`);
  return <span className="tabular whitespace-nowrap">{parts.join(' ')}</span>;
}
