import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface EmptyStateProps extends ComponentPropsWithoutRef<'div'> {
  message: ReactNode;
  description?: ReactNode;
}

export function EmptyState({ message, description, className, ...props }: EmptyStateProps) {
  return (
    <div className={clsx('krds-empty-state', 'empty-state', className)} {...props}>
      <p className="krds-empty-state__title">{message}</p>
      {description ? <p className="krds-empty-state__description">{description}</p> : null}
    </div>
  );
}
