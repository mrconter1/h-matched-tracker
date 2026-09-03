"use client"

import React from 'react';
import { useTheme } from 'next-themes';
import { Github, Moon, Sun } from 'lucide-react';
import { useMounted } from '@/lib/useMediaQuery';

export const SECTIONS = [
  { id: 'trend', label: 'Trend' },
  { id: 'survival', label: 'Survival' },
  { id: 'stats', label: 'Statistics' },
  { id: 'solved', label: 'H-matched' },
  { id: 'unsolved', label: 'Unsolved' },
  { id: 'export', label: 'Data' },
] as const;

const REPO_URL = 'https://github.com/mrconter1/h-matched-tracker';

function IconLink({ label, href, children }: { label: string; href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </a>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === 'dark';
  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {/* Both render; CSS picks, so the first paint never shows the wrong icon. */}
      <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
    </button>
  );
}

export function SiteHeader() {
  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-11 max-w-4xl items-center justify-between gap-4 px-6">
        <a href="#top" className="heading text-sm tracking-tight">
          h-matched
        </a>

        <nav className="hidden items-center gap-4 md:flex" aria-label="Sections">
          {SECTIONS.map(section => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-0.5">
          <IconLink label="Source on GitHub" href={REPO_URL}>
            <Github className="h-3.5 w-3.5" />
          </IconLink>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
