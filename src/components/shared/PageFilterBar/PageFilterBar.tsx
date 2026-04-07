import clsx from 'clsx';
import '../../../styles/domain/components/PageFilterBar.scss';
import type { PageFilterBarProps } from './PageFilterBar.types';

export function PageFilterBar({ actions, className, children, ...props }: PageFilterBarProps) {
  return (
    <div className={clsx('page-filter-bar', className)} {...props}>
      <div className="page-filter-bar__fields">{children}</div>
      {actions ? <div className="page-filter-bar__actions">{actions}</div> : null}
    </div>
  );
}
