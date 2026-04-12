export interface SearchFilters {
  startDate: string;
  endDate: string;
}

export type SearchSortKey =
  | 'taskDate'
  | 'costGroup'
  | 'taskType1'
  | 'taskType2'
  | 'platform'
  | 'serviceGroup'
  | 'serviceName'
  | 'projectName'
  | 'subtaskTitle'
  | 'taskUsedtime';

export type SearchSortDirection = 'asc' | 'desc';

export interface SearchSortState {
  key: SearchSortKey;
  direction: SearchSortDirection;
}
