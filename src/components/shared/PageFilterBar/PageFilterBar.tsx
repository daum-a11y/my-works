import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface PageFilterBarProps extends ComponentPropsWithoutRef<'div'> {
  actions?: ReactNode;
}

export function PageFilterBar({ actions, className, children, ...props }: PageFilterBarProps) {
  return (
    <div className={clsx('krds-page-filter-bar', className)} {...props}>
      <div className="krds-page-filter-bar__fields">{children}</div>
      {actions ? <div className="krds-page-filter-bar__actions">{actions}</div> : null}
    </div>
  );
}
