import { getToday, parseLocalDateInput, toLocalDateInputValue } from '../../utils';
import type { SearchFilters } from './SearchPage.types';

export function buildCurrentMonthFilters(): SearchFilters {
  const today = parseLocalDateInput(getToday()) ?? new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0, 0);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 12, 0, 0, 0);

  return {
    startDate: toLocalDateInputValue(startDate),
    endDate: toLocalDateInputValue(endDate),
  };
}

export function buildExportFilename(startDate: string, endDate: string) {
  const compact = (value: string) => value.replaceAll('-', '').slice(2);

  if (startDate && endDate && startDate === endDate) {
    return `${compact(startDate)}_검색결과.xlsx`;
  }

  if (startDate && endDate) {
    return `${compact(startDate)}~${compact(endDate)}_검색결과.xlsx`;
  }

  if (startDate && !endDate) {
    return `${compact(startDate)}~${compact(startDate)}_검색결과.xlsx`;
  }

  if (!startDate && endDate) {
    return `${compact(endDate)}~${compact(endDate)}_검색결과.xlsx`;
  }

  return '검색결과.xlsx';
}

export function isDownloadRangeWithinThreeMonths(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  const maxEnd = new Date(start);
  maxEnd.setMonth(maxEnd.getMonth() + 3);
  return end <= maxEnd;
}

export function sortSearchRows<T extends { taskDate: string; updatedAt: string; id: string }>(
  items: T[],
) {
  return [...items].sort(
    (left, right) =>
      right.taskDate.localeCompare(left.taskDate) ||
      right.updatedAt.localeCompare(left.updatedAt) ||
      right.id.localeCompare(left.id),
  );
}
