import type { ComponentPropsWithoutRef } from 'react';

export interface PageSizeFieldProps extends ComponentPropsWithoutRef<'label'> {
  value: number;
  options: readonly number[];
  onValueChange: (next: number) => void;
}
