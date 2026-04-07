import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface PageFilterBarProps extends ComponentPropsWithoutRef<'div'> {
  actions?: ReactNode;
}
