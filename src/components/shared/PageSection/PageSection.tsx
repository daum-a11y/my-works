import clsx from 'clsx';
import '../../../styles/components/PageSection.scss';
import { PAGE_SECTION_DEFAULTS } from './PageSection.constants';
import type { PageSectionProps } from './PageSection.types';

export function PageSection({
  title,
  actions,
  className,
  children,
  variant = PAGE_SECTION_DEFAULTS.variant,
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
