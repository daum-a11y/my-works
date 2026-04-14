import clsx from 'clsx';
import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';

export interface PageFilterFieldProps extends ComponentPropsWithoutRef<'div'> {
  label: ReactNode;
}

export function PageFilterField({ label, className, children, ...props }: PageFilterFieldProps) {
  const labelId = useId();
  const enhancedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    const childProps = child.props as { 'aria-label'?: string; 'aria-labelledby'?: string };
    if (childProps['aria-label'] || childProps['aria-labelledby']) {
      return child;
    }

    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      'aria-labelledby': labelId,
    });
  });

  return (
    <div className={clsx('page-filter-field', className)} {...props}>
      <span id={labelId} className="page-filter-field__label">
        {label}
      </span>
      <div className="page-filter-field__control">{enhancedChildren}</div>
    </div>
  );
}
