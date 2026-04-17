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
      <td
        colSpan={colSpan}
        className={clsx('krds-table-empty-row', 'table-empty-row', className)}
        {...props}
      >
        <p className="krds-table-empty-row__title">{message}</p>
        {description ? <p className="krds-table-empty-row__description">{description}</p> : null}
      </td>
    </tr>
  );
}
