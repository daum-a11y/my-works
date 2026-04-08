import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export interface TableEmptyRowProps extends ComponentPropsWithoutRef<'td'> {
  colSpan: number;
  message: ReactNode;
}

export function TableEmptyRow({ colSpan, message, className, ...props }: TableEmptyRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className={clsx(className)} {...props}>
        {message}
      </td>
    </tr>
  );
}
