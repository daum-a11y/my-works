import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type PageSectionVariant = 'plain' | 'panel';

export interface PageSectionProps extends ComponentPropsWithoutRef<'section'> {
  title: string;
  titleId?: string;
  description?: ReactNode;
  actions?: ReactNode;
  variant?: PageSectionVariant;
}

const PAGE_SECTION_DEFAULTS = {
  variant: 'plain',
} as const;

export function PageSection({
  title,
  titleId,
  description,
  actions,
  className,
  children,
  variant = PAGE_SECTION_DEFAULTS.variant,
  ...props
}: PageSectionProps) {
  return (
    <section className={clsx('krds-page-section', className)} data-variant={variant} {...props}>
      <header className="krds-page-section__header">
        <div>
          <h2 id={titleId} className="krds-page-section__title">
            {title}
          </h2>
          {description ? <div className="krds-page-section__description">{description}</div> : null}
        </div>
        {actions ? <div className="krds-page-section__actions">{actions}</div> : null}
      </header>
      <div className="krds-page-section__body">{children}</div>
    </section>
  );
}
