"use client"

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current);
    }
  }, []);

  const flash = (state: CopyState) => {
    setCopyState(state);
    if (resetTimer.current !== null) {
      window.clearTimeout(resetTimer.current);
    }
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
    <Card className="mt-6 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-2xl">Export</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <p className="text-muted-foreground text-lg leading-relaxed">
            Take the whole tracker with you as structured Markdown - statistics, both
            benchmark tables and every source note. Handy for pasting into notes or
            feeding to a language model.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1"
              variant="default"
              onClick={handleCopy}
              aria-live="polite"
            >
              {copyState === 'copied' ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied to clipboard
                </>
              ) : copyState === 'error' ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Copy failed
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy as Markdown
                </>
              )}
            </Button>

            <Button
              className="flex-1"
              variant="outline"
              onClick={handleDownload}
            >
              <Download className="mr-2 h-4 w-4" />
              Download .md
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
