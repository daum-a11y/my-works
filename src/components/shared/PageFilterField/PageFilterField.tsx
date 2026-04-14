import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

export interface PageFilterFieldProps extends ComponentPropsWithoutRef<'div'> {
  label: ReactNode;
}

const KRDS_LABEL_COMPONENTS = new Set([
  'TextInput',
  'Select',
  'Textarea',
  'Checkbox',
  'KrdsDateInput',
]);

export function PageFilterField({ label, className, children, ...props }: PageFilterFieldProps) {
  const labelId = useId();
  let usesChildLabel = false;
  const enhancedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    const childProps = child.props as {
      'aria-label'?: string;
      'aria-labelledby'?: string;
      label?: ReactNode;
    };
    const childType = child.type as { displayName?: string; name?: string };
    const componentName = childType.displayName ?? childType.name;

    if (typeof label === 'string' && componentName && KRDS_LABEL_COMPONENTS.has(componentName)) {
      usesChildLabel = true;
      return cloneElement(child as ReactElement<Record<string, unknown>>, {
        label: childProps.label ?? label,
      });
    }

    if (childProps['aria-label'] || childProps['aria-labelledby'] || childProps.label) {
      return child;
    }

    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      'aria-labelledby': labelId,
    });
  });

  return (
    <div className={clsx('krds-page-filter-field', className)} {...props}>
      {usesChildLabel ? null : (
        <span className="krds-page-filter-field__label" id={labelId}>
          {label}
        </span>
      )}
      <div className="krds-page-filter-field__control">{enhancedChildren}</div>
    </div>
  );
}
