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
    <section className={clsx('pageSectionScope', 'section', variant, className)} {...props}>
      <header className="pageSectionHeader">
        <div className="pageSectionHeading">
          <h2>{title}</h2>
        </div>
        {actions ? <div className="pageSectionActions">{actions}</div> : null}
      </header>
      <div className="pageSectionContent">{children}</div>
    </section>
  );
}
