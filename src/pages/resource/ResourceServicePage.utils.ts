import { countWorkingDays } from './resourceUtils';
import type { ResourceServiceYearSummary } from './ResourceServicePage.types';

interface ResourceServiceSummaryRow {
  year: string;
  month: string;
  costGroupName: string;
  serviceGroupName: string;
  serviceName: string;
  taskUsedtime: number;
}

export function buildResourceServiceYearRows(
  rowsData: ResourceServiceSummaryRow[],
): ResourceServiceYearSummary[] {
  if (!rowsData.length) {
    return [];
  }

  const grouped = new Map<string, Map<string, Map<string, Map<string, number>>>>();

  for (const row of rowsData) {
    const month = `${row.year}-${row.month}`;
    const monthMap = grouped.get(month) ?? new Map<string, Map<string, Map<string, number>>>();
    const costGroupMap = monthMap.get(row.costGroupName) ?? new Map<string, Map<string, number>>();
    const groupMap = costGroupMap.get(row.serviceGroupName) ?? new Map<string, number>();
    groupMap.set(
      row.serviceName,
      (groupMap.get(row.serviceName) ?? 0) + Math.round(row.taskUsedtime),
    );
    costGroupMap.set(row.serviceGroupName, groupMap);
    monthMap.set(row.costGroupName, costGroupMap);
    grouped.set(month, monthMap);
  }

  const years = new Map<string, ResourceServiceYearSummary['months']>();

  for (const [month, groups] of Array.from(grouped.entries()).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const year = month.slice(0, 4);
    const months = years.get(year) ?? [];
    const monthGroups = Array.from(groups.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .flatMap(([costGroup, serviceGroups]) =>
        Array.from(serviceGroups.entries())
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([group, names]) => ({
            costGroup,
            group,
            totalMinutes: Array.from(names.values()).reduce((sum, value) => sum + value, 0),
            names: Array.from(names.entries())
              .sort(([left], [right]) => left.localeCompare(right))
              .map(([name, minutes]) => ({ name, minutes })),
          })),
      );

    months.push({
      month: month.slice(5, 7),
      workingDays: countWorkingDays(month),
      totalMinutes: monthGroups.reduce((sum, group) => sum + group.totalMinutes, 0),
      groups: monthGroups,
    });
    years.set(year, months);
  }

  return Array.from(years.entries())
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([year, months]) => ({
      year,
      yearTotalMinutes: months.reduce((sum, month) => sum + month.totalMinutes, 0),
      detailRowCount: months.reduce(
        (sum, month) =>
          sum + month.groups.reduce((groupSum, group) => groupSum + group.names.length, 0) + 1,
        0,
      ),
      foldRowCount: months.reduce((sum, month) => sum + month.groups.length + 1, 0),
      months,
    }));
}
