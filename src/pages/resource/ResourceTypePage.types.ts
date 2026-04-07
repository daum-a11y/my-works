export interface ResourceTypeItemSummary {
  type: string;
  minutes: number;
}

export interface ResourceTypeMonthSummary {
  month: string;
  totalMinutes: number;
  workingDays: number;
  items: ResourceTypeItemSummary[];
}

export interface ResourceTypeYearSummary {
  year: string;
  yearTotalMinutes: number;
  detailRowCount: number;
  foldRowCount: number;
  months: ResourceTypeMonthSummary[];
}
