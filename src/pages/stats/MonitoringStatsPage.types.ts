export type StatsSummaryView = 'stats-page__chart' | 'stats-page__table';

export interface MonthlyMonitoringRow {
  monthKey: string;
  label: string;
  count: number;
  untouched: number;
  partial: number;
  completed: number;
}
