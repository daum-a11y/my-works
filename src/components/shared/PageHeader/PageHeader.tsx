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
    <header className={clsx('page-header', `page-header--${align}`, className)} {...props}>
      <div className="page-header__main">
        {kicker ? <p className="page-header__kicker">{kicker}</p> : null}
        <h1 className="page-header__title">{title}</h1>
        {description ? <div className="page-header__description">{description}</div> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}
