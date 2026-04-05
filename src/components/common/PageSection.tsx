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
    <section className={clsx('section', variant, className)} {...props}>
      <header className={'header'}>
        <div className={'heading'}>
          <h2>{title}</h2>
        </div>
        {actions ? <div className={'actions'}>{actions}</div> : null}
      </header>
      <div className={'content'}>{children}</div>
    </section>
  );
}
