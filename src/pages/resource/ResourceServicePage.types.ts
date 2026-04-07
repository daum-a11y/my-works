export interface ResourceServiceNameSummary {
  name: string;
  minutes: number;
}

export interface ResourceServiceGroupSummary {
  costGroup: string;
  group: string;
  totalMinutes: number;
  names: ResourceServiceNameSummary[];
}

export interface ResourceServiceMonthSummary {
  month: string;
  workingDays: number;
  totalMinutes: number;
  groups: ResourceServiceGroupSummary[];
}

export interface ResourceServiceYearSummary {
  year: string;
  yearTotalMinutes: number;
  detailRowCount: number;
  foldRowCount: number;
  months: ResourceServiceMonthSummary[];
}
