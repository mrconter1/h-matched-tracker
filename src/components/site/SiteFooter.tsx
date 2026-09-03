import React from 'react';
import { Github, Globe, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ISSUES_URL = 'https://github.com/mrconter1/h-matched-tracker/issues';

export function Contribute() {
  return (
    <div className="flex h-full flex-col justify-between gap-6 p-5 sm:p-6">
      <div>
        <h3 className="text-base font-semibold">Contribute</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Missing a benchmark, know of a newer score, or think a human baseline is mislabelled? Open an issue with a
          source and it will be added.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild className="flex-1">
          <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
            <Github className="h-4 w-4" />
            Open an issue
          </a>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <a href="mailto:rasmus.lindahl1996@gmail.com">
            <Mail className="h-4 w-4" />
            Email
          </a>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <a href="https://lindahl.works" target="_blank" rel="noopener noreferrer">
            <Globe className="h-4 w-4" />
            Portfolio
          </a>
        </Button>
      </div>
    </div>
  );
}

export function SiteFooter({ updated }: { updated: string }) {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6">
        <p suppressHydrationWarning>Data last updated {updated}</p>
        <p>
          Built by{' '}
          <a href="https://lindahl.works" className="text-foreground underline-offset-4 hover:underline">
            Rasmus Lindahl
          </a>
          . Open source under MIT.
        </p>
      </div>
    </footer>
  );
}
