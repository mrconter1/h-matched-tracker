import React from 'react';

const ISSUES_URL = 'https://github.com/mrconter1/h-matched-tracker/issues';

export function Contribute() {
  return (
    <div className="p-5">
      <h3 className="heading text-[15px]">Corrections</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        Missing a benchmark, know of a newer score, or think a human baseline is mislabelled? Open an issue with a
        source and it will be added. Baselines that turn out to be estimated ceilings, passing thresholds, or a
        model&apos;s own score get removed, so those reports are welcome too.
      </p>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <a
          href={ISSUES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand underline underline-offset-4"
        >
          Open an issue
        </a>
        <a href="mailto:rasmus.lindahl1996@gmail.com" className="text-brand underline underline-offset-4">
          Email
        </a>
        <a
          href="https://lindahl.works"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand underline underline-offset-4"
        >
          Portfolio
        </a>
      </p>
    </div>
  );
}

export function SiteFooter({ updated }: { updated: string }) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-4xl flex-col gap-1 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p suppressHydrationWarning>Updated {updated}</p>
        <p>
          Compiled by{' '}
          <a href="https://lindahl.works" className="text-foreground underline underline-offset-4">
            Rasmus Lindahl
          </a>
          . Source and data under MIT.
        </p>
      </div>
    </footer>
  );
}
