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
