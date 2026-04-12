import { countWorkingDays } from './resourceUtils';
import type { ResourceTypeYearSummary } from './ResourceTypePage.types';

interface ResourceTypeSummaryRow {
  year: string;
  month: string;
  taskType1: string;
  taskType2: string;
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
    const key = `${row.taskType1}\u0000${row.taskType2}`;
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
    const items = Array.from(types.entries())
      .map(([key, minutes]) => {
        const [type1, type2] = key.split('\u0000');
        return { type1, type2, minutes };
      })
      .sort(
        (left, right) =>
          left.type1.localeCompare(right.type1) || left.type2.localeCompare(right.type2),
      );
    const type1Totals = new Map<string, number>();

    for (const item of items) {
      type1Totals.set(item.type1, (type1Totals.get(item.type1) ?? 0) + item.minutes);
    }

    months.push({
      month: month.slice(5, 7),
      workingDays: countWorkingDays(month),
      totalMinutes: items.reduce((sum, item) => sum + item.minutes, 0),
      items,
      type1Items: Array.from(type1Totals.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([type1, minutes]) => ({ type1, type2: '합계', minutes })),
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
