import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface PageFilterBarProps extends ComponentPropsWithoutRef<'div'> {
  actions?: ReactNode;
}

export function PageFilterBar({ actions, className, children, ...props }: PageFilterBarProps) {
  return (
    <div
      className={clsx('krds-filter-bar', 'form-col-group', className)}
      data-layout="filter-bar"
      data-has-actions={actions ? 'true' : undefined}
      {...props}
    >
      <div className="krds-filter-bar-fields">{children}</div>
      {actions ? <div className="krds-filter-bar-actions">{actions}</div> : null}
    </div>
  );
}
