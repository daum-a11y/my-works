import clsx from 'clsx';
import '../../../styles/domain/components/PageResultBar.scss';
import type { PageResultBarProps } from './PageResultBar.types';

export function PageResultBar({ metrics, controls, className, ...props }: PageResultBarProps) {
  return (
    <section className={clsx('page-result-bar', className)} {...props}>
      <div className="page-result-bar__metrics">{metrics}</div>
      {controls ? <div className="page-result-bar__controls">{controls}</div> : null}
    </section>
  );
}
