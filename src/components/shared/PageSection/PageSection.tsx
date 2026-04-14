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
    <section className={className} data-variant={variant} {...props}>
      <div className={clsx('page-title-wrap', { between: Boolean(actions) })}>
        <div>
          <h2 id={titleId} className="h-tit">
            {title}
          </h2>
          {description ? <div>{description}</div> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
