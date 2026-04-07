import type { ResourceTypeMonthSummary, ResourceTypeYearSummary } from './ResourceTypePage.types';
import { formatMm } from './resourceUtils';

interface ResourceTypeYearRowsProps {
  row: ResourceTypeYearSummary;
  fold: boolean;
}

export function ResourceTypeYearRows({ row, fold }: ResourceTypeYearRowsProps) {
  if (fold) {
    return (
      <>
        {row.months.map((month) => (
          <tr key={`${row.year}-${month.month}-sum`} className="resource-page__summary-strong-row">
            <td>{month.month}월</td>
            <td>전체</td>
            <td>{formatMm(month.totalMinutes, month.workingDays)}</td>
          </tr>
        ))}
        <tr className="resource-page__summary-strong-row">
          <td>{row.year}년 합계</td>
          <td>전체</td>
          <td>{formatMm(row.yearTotalMinutes, 21.73)}</td>
        </tr>
      </>
    );
  }

  return (
    <>
      {row.months.map((month) => (
        <ResourceTypeMonthDetailRows key={`${row.year}-${month.month}`} month={month} />
      ))}
      <tr className="resource-page__summary-strong-row">
        <td colSpan={2}>{row.year}년 합계</td>
        <td>{formatMm(row.yearTotalMinutes, 21.73)}</td>
      </tr>
    </>
  );
}

interface ResourceTypeMonthDetailRowsProps {
  month: ResourceTypeMonthSummary;
}

function ResourceTypeMonthDetailRows({ month }: ResourceTypeMonthDetailRowsProps) {
  return (
    <>
      {month.items.map((item, index) => (
        <tr key={`${month.month}-${item.type}`}>
          {index === 0 ? <td rowSpan={month.items.length}>{month.month}월</td> : null}
          <td>{item.type}</td>
          <td>{formatMm(item.minutes, month.workingDays)}</td>
        </tr>
      ))}
      <tr className="resource-page__summary-strong-row">
        <td colSpan={2}>{month.month}월 합계</td>
        <td>{formatMm(month.totalMinutes, month.workingDays)}</td>
      </tr>
    </>
  );
}
