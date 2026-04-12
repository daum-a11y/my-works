import type { ResourceSummaryRow } from './ResourceSummaryPage.types';

export type ResourceSummarySortKey = 'label' | 'diffMinutes';

export interface ResourceSummarySortState {
  key: ResourceSummarySortKey;
  direction: 'asc' | 'desc';
}

function compareText(left: string, right: string) {
  return left.localeCompare(right, 'ko');
}

function getSortValue(row: ResourceSummaryRow, key: ResourceSummarySortKey) {
  switch (key) {
    case 'label':
      return row.label;
    case 'diffMinutes':
      return row.diffMinutes;
  }
}

export function sortResourceSummaryRows(
  rows: readonly ResourceSummaryRow[],
  sortState: ResourceSummarySortState,
) {
  const direction = sortState.direction === 'asc' ? 1 : -1;

  return [...rows].sort((left, right) => {
    const leftValue = getSortValue(left, sortState.key);
    const rightValue = getSortValue(right, sortState.key);

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      const delta = leftValue - rightValue;
      if (delta !== 0) {
        return delta * direction;
      }
    } else {
      const delta = compareText(String(leftValue ?? ''), String(rightValue ?? ''));
      if (delta !== 0) {
        return delta * direction;
      }
    }

    return compareText(left.label, right.label);
  });
}
