import type { ComponentPropsWithoutRef } from 'react';

export interface PagePagerProps extends ComponentPropsWithoutRef<'div'> {
  currentPage: number;
  totalPages: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  buttonClassName?: string;
  statusClassName?: string;
}
