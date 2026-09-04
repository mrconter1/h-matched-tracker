"use client"

import React from 'react';
import { ExternalLink } from 'lucide-react';
import {
  REJECTION_LABELS,
  REJECTION_ORDER,
  rejectedBenchmarks,
  type RejectedBenchmark,
} from '@/data/rejected';

function Row({ item }: { item: RejectedBenchmark }) {
  return (
    <tr className="border-b border-border/60 last:border-0 align-top hover:bg-muted/40">
      <td className="px-4 py-3">
        <span className="flex items-baseline gap-1.5">
          <span className="font-medium">{item.benchmark}</span>
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Source"
              className="inline-flex translate-y-px text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </span>
        {item.quoted && (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            quoted as <span className="tabular text-foreground">{item.quoted}</span>
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="whitespace-nowrap text-xs text-muted-foreground">{REJECTION_LABELS[item.reason]}</span>
      </td>
      <td className="px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">{item.detail}</td>
    </tr>
  );
}

export function RejectedTable() {
  const byReason = REJECTION_ORDER.flatMap(reason => rejectedBenchmarks.filter(item => item.reason === reason));
  const modelScoreCount = rejectedBenchmarks.filter(item => item.reason === 'model-score').length;

  return (
    <div>
      <p className="border-b border-border px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
        A benchmark earns a place on this tracker by publishing a human score measured on the same metric and split
        that models are scored on. These did not.{' '}
        <span className="text-foreground">
          In {modelScoreCount} cases the number circulating as the human baseline is a model&apos;s own score
        </span>
        , and one of those was live on this page until it was checked.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="label px-4 py-2 text-left min-w-[190px]">Benchmark</th>
              <th scope="col" className="label px-4 py-2 text-left">What the number is</th>
              <th scope="col" className="label px-4 py-2 text-left">Detail</th>
            </tr>
          </thead>
          <tbody>
            {byReason.map(item => (
              <Row key={item.benchmark} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
