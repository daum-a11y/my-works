import clsx from 'clsx';
import '../../../styles/components/PageFilterField.scss';
import type { PageFilterFieldProps } from './PageFilterField.types';

export function PageFilterField({ label, className, children, ...props }: PageFilterFieldProps) {
  return (
    <label className={clsx('page-filter-field', className)} {...props}>
      <span className="page-filter-field__label">{label}</span>
      {children}
    </label>
  );
}
