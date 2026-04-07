export type StatsSummaryView = 'stats-page__chart' | 'stats-page__table';

export interface MonthlyQaRow {
  monthKey: string;
  label: string;
  count: number;
  completed: number;
}
