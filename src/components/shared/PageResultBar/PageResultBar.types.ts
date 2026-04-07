import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface PageResultBarProps extends ComponentPropsWithoutRef<'section'> {
  metrics: ReactNode;
  controls?: ReactNode;
}
