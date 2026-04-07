import type { SortDirection, SortKey, SortState } from './AdminReportsPage.types';

interface AdminReportsSortButtonProps {
  label: string;
  sortKey: SortKey;
  sortState: SortState;
  onChange: (next: SortState) => void;
}

export function AdminReportsSortButton({
  label,
  sortKey,
  sortState,
  onChange,
}: AdminReportsSortButtonProps) {
  const active = sortState.key === sortKey;
  const nextDirection: SortDirection = active && sortState.direction === 'asc' ? 'desc' : 'asc';

  return (
    <button
      type="button"
      className={[
        'admin-reports-page__sort-button',
        active ? 'admin-reports-page__sort-button--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onChange({ key: sortKey, direction: nextDirection })}
      aria-label={`${label} 정렬`}
    >
      <span>{label}</span>
      <span className={'admin-reports-page__sort-arrow'}>
        {active && sortState.direction === 'asc' ? '▲' : '▼'}
      </span>
    </button>
  );
}
