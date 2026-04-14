import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';

export interface PageSizeFieldProps extends Omit<
  ComponentPropsWithoutRef<'select'>,
  'value' | 'onChange'
> {
  value: number;
  options: readonly number[];
  onValueChange: (next: number) => void;
  className?: string;
}

export const PAGE_SIZE_FIELD_LABEL = '페이지당';

export function PageSizeField({
  value,
  options,
  onValueChange,
  className,
  ...props
}: PageSizeFieldProps) {
  return (
    <label className={clsx('page-size-field', className)}>
      <span>{PAGE_SIZE_FIELD_LABEL}</span>
      <select
        value={String(value)}
        onChange={(event) => onValueChange(Number(event.target.value))}
        {...props}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}행
          </option>
        ))}
      </select>
    </label>
  );
}
