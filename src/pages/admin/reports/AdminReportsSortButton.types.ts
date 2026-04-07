import type { SortKey, SortState } from './AdminReportsPage.types';

export interface AdminReportsSortButtonProps {
  label: string;
  sortKey: SortKey;
  sortState: SortState;
  onChange: (next: SortState) => void;
}
