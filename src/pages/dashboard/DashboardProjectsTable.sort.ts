export type DashboardProjectsSortKey =
  | 'costGroupName'
  | 'type1'
  | 'serviceGroupName'
  | 'projectName'
  | 'platform'
  | 'startDate'
  | 'endDate';

export interface DashboardProjectsSortState {
  key: DashboardProjectsSortKey;
  direction: 'asc' | 'desc';
}

export interface DashboardProjectRow {
  projectId: string;
  type1: string | null;
  platform: string | null;
  costGroupName: string | null;
  serviceGroupName: string | null;
  projectName: string | null;
  startDate: string;
  endDate: string;
}

function compareText(left: string, right: string) {
  return left.localeCompare(right, 'ko');
}

function getSortValue(project: DashboardProjectRow, key: DashboardProjectsSortKey) {
  switch (key) {
    case 'costGroupName':
      return project.costGroupName;
    case 'type1':
      return project.type1;
    case 'serviceGroupName':
      return project.serviceGroupName;
    case 'projectName':
      return project.projectName;
    case 'platform':
      return project.platform;
    case 'startDate':
      return project.startDate;
    case 'endDate':
    default:
      return project.endDate;
  }
}

export function sortDashboardProjects(
  projects: readonly DashboardProjectRow[],
  sortState: DashboardProjectsSortState,
) {
  const direction = sortState.direction === 'asc' ? 1 : -1;

  return [...projects].sort((left, right) => {
    const leftValue = getSortValue(left, sortState.key);
    const rightValue = getSortValue(right, sortState.key);
    const result = compareText(String(leftValue ?? ''), String(rightValue ?? ''));

    return (
      result * direction ||
      right.endDate.localeCompare(left.endDate) ||
      right.startDate.localeCompare(left.startDate) ||
      compareText(String(left.projectName ?? ''), String(right.projectName ?? '')) ||
      right.projectId.localeCompare(left.projectId)
    );
  });
}
