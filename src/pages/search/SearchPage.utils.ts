import { getToday, parseLocalDateInput, toLocalDateInputValue } from '../../utils';
import type { SearchTaskRow } from '../../types/domain';
import type { SearchFilters, SearchSortKey, SearchSortState } from './SearchPage.types';

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

function compareText(left: string, right: string) {
  return left.localeCompare(right, 'ko');
}

function getSearchSortValue(task: SearchTaskRow, key: SearchSortKey) {
  switch (key) {
    case 'costGroup':
      return task.costGroupName;
    case 'taskType1':
      return task.taskType1;
    case 'taskType2':
      return task.taskType2;
    case 'platform':
      return task.platform;
    case 'serviceGroup':
      return task.serviceGroupName;
    case 'serviceName':
      return task.serviceName;
    case 'projectName':
      return task.projectName;
    case 'subtaskTitle':
      return task.subtaskTitle;
    case 'taskUsedtime':
      return task.taskUsedtime;
    case 'taskDate':
    default:
      return task.taskDate;
  }
}

export function sortSearchRows<T extends SearchTaskRow>(
  items: readonly T[],
  sort: SearchSortState = { key: 'taskDate', direction: 'desc' },
) {
  const direction = sort.direction === 'asc' ? 1 : -1;

  return [...items].sort((left, right) => {
    const leftValue = getSearchSortValue(left, sort.key);
    const rightValue = getSearchSortValue(right, sort.key);
    const result =
      typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : compareText(String(leftValue ?? ''), String(rightValue ?? ''));

    return (
      result * direction ||
      right.taskDate.localeCompare(left.taskDate) ||
      right.updatedAt.localeCompare(left.updatedAt) ||
      right.id.localeCompare(left.id)
    );
  });
}
