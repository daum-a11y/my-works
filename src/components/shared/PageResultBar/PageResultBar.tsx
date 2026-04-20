import clsx from 'clsx';
import {
  Children,
  Fragment,
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from 'react';

export interface PageResultBarProps extends ComponentPropsWithoutRef<'section'> {
  metrics: ReactNode;
  controls?: ReactNode;
}

function renderListItems(content: ReactNode): ReactNode[] {
  return Children.toArray(content).map((child, index) => {
    if (isValidElement(child) && child.type === Fragment) {
      return renderListItems((child as ReactElement<{ children?: ReactNode }>).props.children);
    }

    return <li key={index}>{child}</li>;
  });
}

export function PageResultBar({ metrics, controls, className, ...props }: PageResultBarProps) {
  return (
    <section className={clsx('krds-result-bar', 'search-list-top', className)} {...props}>
      <ul className="krds-result-bar-metrics sch-info" aria-live="polite">
        {renderListItems(metrics)}
      </ul>
      {controls ? (
        <ul className="krds-result-bar-controls sch-sort">
          <li>{controls}</li>
        </ul>
      ) : null}
    </section>
  );
}
