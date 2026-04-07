export type SortKey =
  | 'id'
  | 'taskDate'
  | 'member'
  | 'costGroup'
  | 'taskType1'
  | 'taskType2'
  | 'platform'
  | 'serviceGroup'
  | 'serviceName'
  | 'projectName'
  | 'pageTitle'
  | 'taskUsedtime'
  | 'note';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: SortKey;
  direction: SortDirection;
}
