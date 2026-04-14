import clsx from 'clsx';
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

const PAGE_PAGER_LABELS = {
  previous: '이전',
  next: '다음',
} as const;

const numberFormatter = new Intl.NumberFormat('ko-KR');

export function PagePager({
  currentPage,
  totalPages,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  className,
  buttonClassName,
  statusClassName,
  ...props
}: PagePagerProps) {
  return (
    <div className={clsx('page-pager', className)} {...props}>
      <button
        type="button"
        className={clsx('page-pager__button', buttonClassName)}
        onClick={onPrevious}
        disabled={!canGoPrevious}
        aria-label="이전 페이지"
      >
        {PAGE_PAGER_LABELS.previous}
      </button>
      <p className={clsx('page-pager__status', statusClassName)}>
        <strong>{currentPage}</strong>
        <span>/ {numberFormatter.format(totalPages)}</span>
      </p>
      <button
        type="button"
        className={clsx('page-pager__button', buttonClassName)}
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="다음 페이지"
      >
        {PAGE_PAGER_LABELS.next}
      </button>
    </div>
  );
}
