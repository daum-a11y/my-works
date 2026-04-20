import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface EmptyStateProps extends ComponentPropsWithoutRef<'div'> {
  message: ReactNode;
  description?: ReactNode;
}

export function EmptyState({ message, description, className, ...props }: EmptyStateProps) {
  const fallbackDescription = '조건을 조정하거나 다시 조회해 주세요.';

  return (
    <div className={clsx('krds-empty-state', 'empty-state', className)} {...props}>
      <p className="krds-empty-state-title">{message}</p>
      <p className="krds-empty-state-description">{description ?? fallbackDescription}</p>
    </div>
  );
}
