import React from 'react';
import { cn } from '@/lib/utils';

type SectionProps = {
  id: string;
  title: string;
  description?: React.ReactNode;
  /** Right-aligned controls next to the title (filters, toggles). */
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

/** One page section: anchor target, heading row, and a bordered panel for the content. */
export function Section({ id, title, description, actions, className, children }: SectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-20', className)}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
          {description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <div className="rounded-xl border border-border/60 bg-card shadow-sm">{children}</div>
    </section>
  );
}
