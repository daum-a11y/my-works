import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import '../../../styles/components/PageResultBar.scss';

export interface PageResultBarProps extends ComponentPropsWithoutRef<'section'> {
  metrics: ReactNode;
  controls?: ReactNode;
}

export function PageResultBar({ metrics, controls, className, ...props }: PageResultBarProps) {
  return (
    <section className={clsx('page-result-bar', className)} {...props}>
      <div className="page-result-bar__metrics">{metrics}</div>
      {controls ? <div className="page-result-bar__controls">{controls}</div> : null}
    </section>
  );
}
