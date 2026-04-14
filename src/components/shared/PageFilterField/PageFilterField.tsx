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

const KRDS_LABEL_COMPONENTS = new Set(['TextInput', 'Select', 'Textarea', 'Checkbox', 'DateInput']);

export function PageFilterField({ label, className, children, ...props }: PageFilterFieldProps) {
  const labelId = useId();
  const childArray = Children.toArray(children);
  const usesChildLabel =
    typeof label === 'string' &&
    childArray.some((child) => {
      if (!isValidElement(child)) {
        return false;
      }

      const childType = child.type as { displayName?: string; name?: string };
      const componentName = childType.displayName ?? childType.name;
      return Boolean(componentName && KRDS_LABEL_COMPONENTS.has(componentName));
    });

  const enhancedChildren = childArray.map((child) => {
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

  if (usesChildLabel) {
    return (
      <div className={clsx(className)} {...props}>
        {enhancedChildren}
      </div>
    );
  }

  return (
    <div className={clsx('form-group', className)} {...props}>
      <div className="form-tit">
        <label id={labelId}>{label}</label>
      </div>
      <div className="form-conts">{enhancedChildren}</div>
    </div>
  );
}
