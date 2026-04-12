export interface ResourceTypeItemSummary {
  type1: string;
  type2: string;
  minutes: number;
}

export interface ResourceTypeMonthSummary {
  month: string;
  totalMinutes: number;
  workingDays: number;
  items: ResourceTypeItemSummary[];
  type1Items: ResourceTypeItemSummary[];
}

export interface ResourceTypeYearSummary {
  year: string;
  yearTotalMinutes: number;
  detailRowCount: number;
  foldRowCount: number;
  months: ResourceTypeMonthSummary[];
}
