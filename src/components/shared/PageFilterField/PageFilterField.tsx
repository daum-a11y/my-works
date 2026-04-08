import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import '../../../styles/components/PageFilterField.scss';

export interface PageFilterFieldProps extends ComponentPropsWithoutRef<'label'> {
  label: ReactNode;
}

export function PageFilterField({ label, className, children, ...props }: PageFilterFieldProps) {
  return (
    <label className={clsx('page-filter-field', className)} {...props}>
      <span className="page-filter-field__label">{label}</span>
      {children}
    </label>
  );
}
