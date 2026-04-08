import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import '../../../styles/components/PageFilterBar.scss';

export interface PageFilterBarProps extends ComponentPropsWithoutRef<'div'> {
  actions?: ReactNode;
}

export function PageFilterBar({ actions, className, children, ...props }: PageFilterBarProps) {
  return (
    <div className={clsx('page-filter-bar', className)} {...props}>
      <div className="page-filter-bar__fields">{children}</div>
      {actions ? <div className="page-filter-bar__actions">{actions}</div> : null}
    </div>
  );
}
