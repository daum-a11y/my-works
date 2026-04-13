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
