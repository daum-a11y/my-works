import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type PageSectionVariant = 'plain' | 'panel';

export interface PageSectionProps extends ComponentPropsWithoutRef<'section'> {
  title: string;
  actions?: ReactNode;
  variant?: PageSectionVariant;
}

const PAGE_SECTION_DEFAULTS = {
  variant: 'plain',
} as const;

export function PageSection({
  title,
  actions,
  className,
  children,
  variant = PAGE_SECTION_DEFAULTS.variant,
  ...props
}: PageSectionProps) {
  return (
    <section className={clsx('page-section', `page-section--${variant}`, className)} {...props}>
      <header className="page-section__header">
        <div className="page-section__heading">
          <h2>{title}</h2>
        </div>
        {actions ? <div className="page-section__actions">{actions}</div> : null}
      </header>
      <div className="page-section__content">{children}</div>
    </section>
  );
}
