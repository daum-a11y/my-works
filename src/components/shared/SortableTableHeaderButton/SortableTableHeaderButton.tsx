import clsx from 'clsx';
import type {
  SortDirection,
  SortableTableHeaderButtonProps,
} from './SortableTableHeaderButton.types';

export function SortableTableHeaderButton<TSortKey extends string = string>({
  label,
  sortKey,
  sortState,
  onChange,
  className,
  ...props
}: SortableTableHeaderButtonProps<TSortKey>) {
  const active = sortState.key === sortKey;
  const nextDirection: SortDirection = active && sortState.direction === 'asc' ? 'desc' : 'asc';
  const currentDirectionLabel = active
    ? sortState.direction === 'asc'
      ? '오름차순'
      : '내림차순'
    : '';
  const nextDirectionLabel = nextDirection === 'asc' ? '오름차순' : '내림차순';

  return (
    <button
      type="button"
      className={clsx(
        'sortable-table-header-button',
        active && 'sortable-table-header-button--active',
        className,
      )}
      onClick={() => onChange({ key: sortKey, direction: nextDirection })}
      aria-pressed={active}
      aria-label={
        active
          ? `${label} 정렬, 현재 ${currentDirectionLabel}, 클릭하면 ${nextDirectionLabel}`
          : `${label} 정렬, 클릭하면 ${nextDirectionLabel}`
      }
      {...props}
    >
      <span className={'sortable-table-header-button__label'}>{label}</span>
      <span className={'sortable-table-header-button__icon'} aria-hidden="true">
        <span
          className={clsx(
            'sortable-table-header-button__chevron',
            'sortable-table-header-button__chevron--up',
            active &&
              sortState.direction === 'asc' &&
              'sortable-table-header-button__chevron--current',
          )}
        />
        <span
          className={clsx(
            'sortable-table-header-button__chevron',
            'sortable-table-header-button__chevron--down',
            active &&
              sortState.direction === 'desc' &&
              'sortable-table-header-button__chevron--current',
          )}
        />
      </span>
      <span className={'sr-only'}>
        {active ? `${currentDirectionLabel}으로 정렬 중` : '정렬 기준 선택 가능'}
      </span>
    </button>
  );
}
