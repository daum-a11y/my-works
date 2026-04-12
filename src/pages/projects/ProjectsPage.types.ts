export interface ProjectFilterState {
  startDate: string;
  endDate: string;
}

export type ProjectsSortKey =
  | 'taskType1'
  | 'platform'
  | 'costGroupName'
  | 'serviceGroupName'
  | 'name'
  | 'subtaskCount'
  | 'startDate'
  | 'endDate'
  | 'reporterDisplay'
  | 'reviewerDisplay';

export type ProjectsSortDirection = 'asc' | 'desc';

export interface ProjectsSortState {
  key: ProjectsSortKey;
  direction: ProjectsSortDirection;
}
