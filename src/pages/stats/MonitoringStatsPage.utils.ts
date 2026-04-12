import type { MonitoringStatsRow, SubtaskStatus } from '../../types/domain';
export type { MonthlyMonitoringRow } from './MonitoringStatsPage.types';

export function formatTrackStatus(value: SubtaskStatus) {
  return value;
}

export function monthKeyFromMonitoringMonth(value: string): string {
  const digits = value.replace(/\D/g, '');
  const month = digits.slice(-2);
  if (month < '01' || month > '12') {
    return '';
  }
  if (digits.length === 4) {
    return `20${digits.slice(0, 2)}-${month}`;
  }
  if (digits.length === 6) {
    return `${digits.slice(0, 4)}-${month}`;
  }
  return '';
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

export function sortRows(left: MonitoringStatsRow, right: MonitoringStatsRow) {
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}
