import type { QaStatsProjectRow } from '../../types/domain';
export type { MonthlyQaRow } from './QaStatsPage.types';

export function monthKeyFromDate(value: string): string {
  return value.slice(0, 7);
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return `${year}/${String(month).padStart(2, '0')}`;
}

export function buildMonthRange(monthKeys: string[]): string[] {
  if (!monthKeys.length) {
    return [];
  }

  const uniqueKeys = [...new Set(monthKeys)].sort();
  const [startYear, startMonth] = uniqueKeys[0].split('-').map(Number);
  const [endYear, endMonth] = uniqueKeys[uniqueKeys.length - 1].split('-').map(Number);
  const range: string[] = [];
  let cursor = new Date(startYear, startMonth - 1, 1);
  const end = new Date(endYear, endMonth - 1, 1);

  while (cursor <= end) {
    range.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return range;
}

export function sortProjects(left: QaStatsProjectRow, right: QaStatsProjectRow) {
  return (
    right.endDate.localeCompare(left.endDate) ||
    (left.name ?? '').localeCompare(right.name ?? '', 'ko')
  );
}
