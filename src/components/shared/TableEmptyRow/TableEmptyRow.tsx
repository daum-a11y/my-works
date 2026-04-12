import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface TableEmptyRowProps extends ComponentPropsWithoutRef<'td'> {
  colSpan: number;
  message: ReactNode;
  description?: ReactNode;
}

export function TableEmptyRow({
  colSpan,
  message,
  description,
  className,
  ...props
}: TableEmptyRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className={clsx('table-empty-row', className)} {...props}>
        <span className="table-empty-row__content">
          <span className="table-empty-row__message">{message}</span>
          {description ? <span className="table-empty-row__description">{description}</span> : null}
        </span>
      </td>
    </tr>
  );
}
