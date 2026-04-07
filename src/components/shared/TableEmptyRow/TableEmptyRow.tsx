import clsx from 'clsx';
import type { TableEmptyRowProps } from './TableEmptyRow.types';

export function TableEmptyRow({ colSpan, message, className, ...props }: TableEmptyRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className={clsx(className)} {...props}>
        {message}
      </td>
    </tr>
  );
}
