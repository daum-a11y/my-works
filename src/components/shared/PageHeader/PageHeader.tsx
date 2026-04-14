import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type PageHeaderAlign = 'start' | 'center';

export interface PageHeaderProps extends ComponentPropsWithoutRef<'header'> {
  title: string;
  kicker?: string;
  description?: ReactNode;
  actions?: ReactNode;
  align?: PageHeaderAlign;
}

const PAGE_HEADER_DEFAULTS = {
  align: 'start',
} as const;

export function PageHeader({
  title,
  kicker,
  description,
  actions,
  className,
  align = PAGE_HEADER_DEFAULTS.align,
  ...props
}: PageHeaderProps) {
  return (
    <header className={clsx('krds-page-header', className)} data-align={align} {...props}>
      <div className="krds-page-header__text">
        {kicker ? <p className="krds-page-header__kicker">{kicker}</p> : null}
        <h1 className="krds-page-header__title">{title}</h1>
        {description ? <div className="krds-page-header__description">{description}</div> : null}
      </div>
      {actions ? <div className="krds-page-header__actions">{actions}</div> : null}
    </header>
  );
}
