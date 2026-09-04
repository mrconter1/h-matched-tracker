"use client"

import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, X } from 'lucide-react';

type CopyState = 'idle' | 'copied' | 'error';

/** Clipboard fallback for browsers (or insecure origins) without the async API. */
const legacyCopy = (text: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    if (!document.execCommand('copy')) {
      throw new Error('copy command rejected');
    }
  } finally {
    textarea.remove();
  }
};

type MarkdownExportProps = {
  /** Built lazily so the document is only rendered when a button is pressed. */
  getMarkdown: () => string;
  fileName?: string;
};

export function MarkdownExport({ getMarkdown, fileName = 'h-matched-tracker.md' }: MarkdownExportProps) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const resetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);

  const flash = (state: CopyState) => {
    setCopyState(state);
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopyState('idle'), 2000);
  };

  const handleCopy = async () => {
    const markdown = getMarkdown();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else {
        legacyCopy(markdown);
      }
      flash('copied');
    } catch {
      try {
        legacyCopy(markdown);
        flash('copied');
      } catch {
        flash('error');
      }
    }
  };

  const handleDownload = () => {
    const blob = new Blob([getMarkdown()], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-5">
      <h3 className="heading text-[15px]">Export</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        The whole table as one Markdown document: the summary statistics, the survival table by cohort, both benchmark
        lists, and every per-benchmark note with its references.
      </p>
      <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
        <button
          type="button"
          onClick={handleCopy}
          aria-live="polite"
          className="inline-flex items-center gap-1.5 text-brand underline underline-offset-4"
        >
          {copyState === 'copied' ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copied
            </>
          ) : copyState === 'error' ? (
            <>
              <X className="h-3.5 w-3.5" /> Copy failed
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy to clipboard
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 text-brand underline underline-offset-4"
        >
          <Download className="h-3.5 w-3.5" /> Download .md
        </button>
      </p>
    </div>
  );
}
