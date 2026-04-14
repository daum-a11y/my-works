import type { ComponentPropsWithoutRef } from 'react';
import { Select } from 'krds-react';

export interface PageSizeFieldProps extends Omit<
  ComponentPropsWithoutRef<'select'>,
  'value' | 'defaultValue' | 'onChange' | 'size'
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
    <Select
      className={className}
      label={PAGE_SIZE_FIELD_LABEL}
      value={String(value)}
      variant="sorting"
      size="small"
      options={options.map((option) => ({
        value: String(option),
        label: `${option}행`,
      }))}
      onChange={(next) => onValueChange(Number(next))}
      {...props}
    />
  );
}
