"use client"

import React from 'react';
import { useTheme } from 'next-themes';
import { Github, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMounted } from '@/lib/useMediaQuery';

export const SECTIONS = [
  { id: 'trend', label: 'Trend' },
  { id: 'survival', label: 'Survival' },
  { id: 'stats', label: 'Statistics' },
  { id: 'solved', label: 'H-matched' },
  { id: 'unsolved', label: 'Unsolved' },
  { id: 'export', label: 'Export' },
] as const;

const REPO_URL = 'https://github.com/mrconter1/h-matched-tracker';

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === 'dark';
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="h-9 w-9"
    >
      {/* Render both and let CSS pick, so the first paint never flashes the wrong icon. */}
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex h-7 items-center rounded-md border border-brand/30 bg-brand/10 px-2 text-sm text-brand">
            h-matched
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline">Tracker</span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Sections">
          {SECTIONS.map(section => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="Source on GitHub">
              <Github className="h-4 w-4" />
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
