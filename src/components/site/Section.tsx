import React from 'react';
import { cn } from '@/lib/utils';

type SectionProps = {
  id: string;
  /** Section number, printed before the title like a paper. */
  index?: number;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Bleed the content to the section edges (tables); otherwise it is inset. */
  flush?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Section({ id, index, title, description, actions, flush, className, children }: SectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-16', className)}>
      <div className="mb-5 flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <h2 className="heading text-xl">
            {index !== undefined && <span className="mr-2 text-muted-foreground tabular">{index}.</span>}
            {title}
          </h2>
          {description && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <div className={cn(!flush && 'rounded border border-border bg-card')}>{children}</div>
    </section>
  );
}

/** Caption under a figure or table, in the small print of a paper. */
export function Caption({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{children}</p>;
}
