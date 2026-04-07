import { countWorkingDays } from './resourceUtils';
import type { ResourceTypeYearSummary } from './ResourceTypePage.types';

interface ResourceTypeSummaryRow {
  year: string;
  month: string;
  taskType1: string;
  taskUsedtime: number;
}

export function buildResourceTypeYearRows(
  rowsData: ResourceTypeSummaryRow[],
): ResourceTypeYearSummary[] {
  if (!rowsData.length) {
    return [];
  }

  const grouped = new Map<string, Map<string, number>>();

  for (const row of rowsData) {
    const month = `${row.year}-${row.month}`;
    const key = row.taskType1;
    const monthMap = grouped.get(month) ?? new Map<string, number>();
    monthMap.set(key, (monthMap.get(key) ?? 0) + Math.round(row.taskUsedtime));
    grouped.set(month, monthMap);
  }

  const years = new Map<string, ResourceTypeYearSummary['months']>();

  for (const [month, types] of Array.from(grouped.entries()).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const year = month.slice(0, 4);
    const months = years.get(year) ?? [];
    months.push({
      month: month.slice(5, 7),
      workingDays: countWorkingDays(month),
      totalMinutes: Array.from(types.values()).reduce((sum, value) => sum + value, 0),
      items: Array.from(types.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([type, minutes]) => ({ type, minutes })),
    });
    years.set(year, months);
  }

  return Array.from(years.entries())
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([year, months]) => ({
      year,
      yearTotalMinutes: months.reduce((sum, month) => sum + month.totalMinutes, 0),
      detailRowCount: months.reduce((sum, month) => sum + month.items.length + 1, 0),
      foldRowCount: months.length + 1,
      months,
    }));
}
