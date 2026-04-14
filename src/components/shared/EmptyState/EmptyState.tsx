import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface EmptyStateProps extends ComponentPropsWithoutRef<'div'> {
  message: ReactNode;
  description?: ReactNode;
}

export function EmptyState({ message, description, className, ...props }: EmptyStateProps) {
  return (
    <div className={clsx('empty-state', className)} {...props}>
      <div className="empty-state__content">
        <strong className="empty-state__message">{message}</strong>
        {description ? <p className="empty-state__description">{description}</p> : null}
      </div>
    </div>
  );
}
