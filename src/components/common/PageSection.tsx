import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import clsx from 'clsx';
import '../../styles/domain/components/PageSection.scss';

interface PageSectionProps extends ComponentPropsWithoutRef<'section'> {
  title: string;
  actions?: ReactNode;
  variant?: 'plain' | 'panel';
}

export function PageSection({
  title,
  actions,
  className,
  children,
  variant = 'plain',
  ...props
}: PageSectionProps) {
  return (
    <section className={clsx('page-section', `page-section--${variant}`, className)} {...props}>
      <header className="page-section__header">
        <div className="page-section__heading">
          <h2>{title}</h2>
        </div>
        {actions ? <div className="page-section__actions">{actions}</div> : null}
      </header>
      <div className="page-section__content">{children}</div>
    </section>
  );
}
