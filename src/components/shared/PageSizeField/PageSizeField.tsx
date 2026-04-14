import type { ComponentPropsWithoutRef } from 'react';
import { useId } from 'react';
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

export const PAGE_SIZE_FIELD_LABEL = '페이지당 행 수';

export function PageSizeField({
  id,
  value,
  options,
  onValueChange,
  className,
  ...props
}: PageSizeFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <>
      <strong className="sort-label">
        <label htmlFor={selectId}>{PAGE_SIZE_FIELD_LABEL}</label>
      </strong>
      <Select
        id={selectId}
        className={className}
        value={String(value)}
        variant="sorting"
        size="small"
        options={options.map((option) => ({
          value: String(option),
          label: `${option}개`,
        }))}
        onChange={(next) => onValueChange(Number(next))}
        {...props}
      />
    </>
  );
}
