import type { ButtonHTMLAttributes } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortableSortState<TSortKey extends string = string> {
  key: TSortKey;
  direction: SortDirection;
}

export interface SortableTableHeaderButtonProps<TSortKey extends string = string> extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange'
> {
  label: string;
  sortKey: TSortKey;
  sortState: SortableSortState<TSortKey>;
  onChange: (next: SortableSortState<TSortKey>) => void;
}
