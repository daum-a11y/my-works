export type StatsSummaryView = 'stats-page__chart' | 'stats-page__table';
export type ProjectStatsPeriodBasis = 'project' | 'subtask';

export type ProjectStatsSortKey =
  | 'month'
  | 'type1'
  | 'costGroupName'
  | 'serviceGroupName'
  | 'projectName'
  | 'platform'
  | 'subtaskCount'
  | 'untouchedSubtaskCount'
  | 'partialSubtaskCount'
  | 'completedSubtaskCount';

export interface ProjectStatsSortState {
  key: ProjectStatsSortKey;
  direction: 'asc' | 'desc';
}

export interface ProjectStatsMonthlyRow {
  monthKey: string;
  label: string;
  projectCount: number;
  subtaskCount: number;
}
