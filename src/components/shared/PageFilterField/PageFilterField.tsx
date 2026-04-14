import clsx from 'clsx';
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from 'react';

export interface PageFilterFieldProps extends ComponentPropsWithoutRef<'div'> {
  label: ReactNode;
}

const PAGE_FILTER_FIELD_STYLES = {
  root: {
    display: 'grid',
    gap: '8px',
    minWidth: 0,
  },
  label: {
    color: '#1d1d1d',
    fontSize: '15px',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  control: {
    minWidth: 0,
  },
} satisfies Record<string, CSSProperties>;

export function PageFilterField({ label, className, children, ...props }: PageFilterFieldProps) {
  return (
    <div className={clsx('page-filter-field', className)} style={PAGE_FILTER_FIELD_STYLES.root} {...props}>
      <span className="page-filter-field__label" style={PAGE_FILTER_FIELD_STYLES.label}>{label}</span>
      <div className="page-filter-field__control" style={PAGE_FILTER_FIELD_STYLES.control}>
        {children}
      </div>
    </div>
  );
}
