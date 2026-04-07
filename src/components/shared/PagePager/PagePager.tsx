import clsx from 'clsx';
import '../../../styles/domain/components/PagePager.scss';
import { PAGE_PAGER_LABELS } from './PagePager.constants';
import type { PagePagerProps } from './PagePager.types';

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
