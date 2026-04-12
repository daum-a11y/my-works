import { getToday, parseLocalDateInput, toLocalDateInputValue } from '../../utils';
import type { ProjectListRow } from '../../types/domain';
import type { ProjectFilterState, ProjectsSortKey, ProjectsSortState } from './ProjectsPage.types';

export function createInitialProjectFilters(): ProjectFilterState {
  const endDate = getToday();
  const end = parseLocalDateInput(endDate) ?? new Date();
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 1);

  return {
    startDate: toLocalDateInputValue(start),
    endDate,
  };
}

function compareText(left: string, right: string) {
  return left.localeCompare(right, 'ko');
}

function getProjectsSortValue(project: ProjectListRow, key: ProjectsSortKey) {
  switch (key) {
    case 'taskType1':
      return project.taskType1;
    case 'platform':
      return project.platform;
    case 'costGroupName':
      return project.costGroupName;
    case 'serviceGroupName':
      return project.serviceGroupName;
    case 'name':
      return project.name;
    case 'subtaskCount':
      return project.subtaskCount;
    case 'startDate':
      return project.startDate;
    case 'reporterDisplay':
      return project.reporterDisplay;
    case 'reviewerDisplay':
      return project.reviewerDisplay;
    case 'endDate':
    default:
      return project.endDate;
  }
}

export function sortProjects(
  projects: readonly ProjectListRow[],
  sort: ProjectsSortState = { key: 'endDate', direction: 'desc' },
) {
  const direction = sort.direction === 'asc' ? 1 : -1;

  return [...projects].sort((left, right) => {
    const leftValue = getProjectsSortValue(left, sort.key);
    const rightValue = getProjectsSortValue(right, sort.key);
    const result =
      typeof leftValue === 'number' && typeof rightValue === 'number'
        ? leftValue - rightValue
        : compareText(String(leftValue ?? ''), String(rightValue ?? ''));

    return (
      result * direction ||
      right.endDate.localeCompare(left.endDate) ||
      right.startDate.localeCompare(left.startDate) ||
      left.name.localeCompare(right.name, 'ko') ||
      right.id.localeCompare(left.id)
    );
  });
}
