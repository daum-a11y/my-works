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
    <header
      className={clsx('page-title-wrap', { between: Boolean(actions) }, className)}
      data-align={align}
      {...props}
    >
      <div>
        {kicker ? <p>{kicker}</p> : null}
        <h1 className="h-tit">{title}</h1>
        {description ? <div>{description}</div> : null}
      </div>
      {actions}
    </header>
  );
}
