export type StatsSummaryView = 'stats-page__chart' | 'stats-page__table';

export type ProjectStatsSortKey =
  | 'month'
  | 'type1'
  | 'costGroupName'
  | 'serviceGroupName'
  | 'projectName'
  | 'platform'
  | 'subtaskCount'
  | 'reporterAccountId'
  | 'reviewerAccountId';

export interface ProjectStatsSortState {
  key: ProjectStatsSortKey;
  direction: 'asc' | 'desc';
}

export interface ProjectStatsMonthlyRow {
  monthKey: string;
  label: string;
  totalProjectCount: number;
  projectCountByType1: Record<string, number>;
}

export type TaskMonitoringSortKey =
  | 'month'
  | 'costGroupName'
  | 'type1'
  | 'serviceName'
  | 'platform'
  | 'projectName'
  | 'title'
  | 'ownerAccountId'
  | 'taskStatus';

export interface TaskMonitoringSortState {
  key: TaskMonitoringSortKey;
  direction: 'asc' | 'desc';
}

export interface TaskMonitoringMonthlyRow {
  monthKey: string;
  label: string;
  totalCount: number;
  statusCounts: Record<'미수정' | '일부 수정' | '전체 수정', number>;
}
