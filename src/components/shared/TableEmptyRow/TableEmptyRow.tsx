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
  const fallbackDescription = '필터 조건을 조정하거나 다시 조회해 주세요.';

  return (
    <tr>
      <td
        colSpan={colSpan}
        className={clsx('krds-table-empty-row', 'table-empty-row', className)}
        {...props}
      >
        <p className="krds-table-empty-row__title">{message}</p>
        <p className="krds-table-empty-row__description">{description ?? fallbackDescription}</p>
      </td>
    </tr>
  );
}
