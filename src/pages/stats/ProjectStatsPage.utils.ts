import type { SubtaskStatus } from '../../types/domain';
export type { ProjectStatsMonthlyRow } from './ProjectStatsPage.types';

export function formatTaskStatus(value: SubtaskStatus) {
  return value;
}

export function monthKeyFromDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return '';
  }
  const monthKey = value.slice(0, 7);
  const month = monthKey.slice(-2);
  return month >= '01' && month <= '12' ? monthKey : '';
}

export function monthKeyFromTaskMonth(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return monthKeyFromDate(value);
  }
  const digits = value.replace(/\D/g, '');
  if (digits.length === 4) {
    const month = digits.slice(2, 4);
    if (month < '01' || month > '12') {
      return '';
    }
    return `20${digits.slice(0, 2)}-${month}`;
  }
  if (digits.length === 6) {
    const month = digits.slice(4, 6);
    if (month < '01' || month > '12') {
      return '';
    }
    return `${digits.slice(0, 4)}-${month}`;
  }
  if (digits.length === 8) {
    const month = digits.slice(4, 6);
    if (month < '01' || month > '12') {
      return '';
    }
    return `${digits.slice(0, 4)}-${month}`;
  }
  return '';
}

export function formatTaskMonthValue(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const monthKey = monthKeyFromTaskMonth(value);
  return monthKey ? formatMonthLabel(monthKey) : '-';
}

export function formatMonthLabel(monthKey: string): string {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    return '';
  }
  const [year, month] = monthKey.split('-');
  if (month < '01' || month > '12') {
    return '';
  }
  return `${year}/${month}`;
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
