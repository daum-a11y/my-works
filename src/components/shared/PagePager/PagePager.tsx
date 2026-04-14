import type { ComponentPropsWithoutRef } from 'react';
import { Pagination } from 'krds-react';

export interface PagePagerProps extends ComponentPropsWithoutRef<'div'> {
  currentPage: number;
  totalPages: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPageChange?: (page: number) => void;
  buttonClassName?: string;
  statusClassName?: string;
}

export function PagePager({
  currentPage,
  totalPages,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onPageChange,
  className,
  ...props
}: PagePagerProps) {
  const handleChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
      return;
    }

    if (page < currentPage && canGoPrevious) {
      onPrevious();
      return;
    }

    if (page > currentPage && canGoNext) {
      onNext();
    }
  };

  return (
    <div className={className} {...props}>
      <span className="sr-only">
        {currentPage}/ {totalPages}
      </span>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onChange={handleChange}
        prevLabel="이전 페이지"
        nextLabel="다음 페이지"
        disabled={!canGoPrevious && !canGoNext}
      />
    </div>
  );
}
