import { Button } from 'krds-react';
import type {
  SortDirection,
  SortableTableHeaderButtonProps,
} from './SortableTableHeaderButton.types';

export function SortableTableHeaderButton<TSortKey extends string = string>({
  label,
  sortKey,
  sortState,
  onChange,
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
    <Button
      size="medium"
      type="button"
      variant="tertiary"
      onClick={() => onChange({ key: sortKey, direction: nextDirection })}
      aria-pressed={active}
      aria-label={
        active
          ? `${label} 정렬, 현재 ${currentDirectionLabel}, 클릭하면 ${nextDirectionLabel}`
          : `${label} 정렬, 클릭하면 ${nextDirectionLabel}`
      }
      {...props}
    >
      <span>{label}</span>
      <span className={'sr-only'}>
        {active ? `${currentDirectionLabel}으로 정렬 중` : '정렬 기준 선택 가능'}
      </span>
    </Button>
  );
}
