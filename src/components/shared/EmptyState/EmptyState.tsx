import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface EmptyStateProps extends ComponentPropsWithoutRef<'div'> {
  message: ReactNode;
  description?: ReactNode;
}

export function EmptyState({ message, description, className, ...props }: EmptyStateProps) {
  return (
    <div className={clsx('empty-state', className)} {...props}>
      <p>{message}</p>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
