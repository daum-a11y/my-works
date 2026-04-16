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
          <ResourceTypeMonthRows
            key={`${row.year}-${month.month}-type1`}
            month={month}
            items={month.type1Items}
          />
        ))}
        <tr className="summary-row is-strong">
          <td colSpan={3}>{row.year}년 합계</td>
          <td>{formatMm(row.yearTotalMinutes, 21.73)}</td>
        </tr>
      </>
    );
  }

  return (
    <>
      {row.months.map((month) => (
        <ResourceTypeMonthRows
          key={`${row.year}-${month.month}`}
          month={month}
          items={month.items}
          showMonthSummary
        />
      ))}
      <tr className="summary-row is-strong">
        <td colSpan={3}>{row.year}년 합계</td>
        <td>{formatMm(row.yearTotalMinutes, 21.73)}</td>
      </tr>
    </>
  );
}

interface ResourceTypeMonthRowsProps {
  month: ResourceTypeMonthSummary;
  items: ResourceTypeMonthSummary['items'];
  showMonthSummary?: boolean;
}

function ResourceTypeMonthRows({
  month,
  items,
  showMonthSummary = false,
}: ResourceTypeMonthRowsProps) {
  const type1RowSpans = new Map<string, number>();
  const firstType1Indexes = new Set<number>();

  for (const item of items) {
    type1RowSpans.set(item.type1, (type1RowSpans.get(item.type1) ?? 0) + 1);
  }

  for (let index = 0; index < items.length; index += 1) {
    if (index === 0 || items[index - 1].type1 !== items[index].type1) {
      firstType1Indexes.add(index);
    }
  }

  return (
    <>
      {items.map((item, index) => (
        <tr key={`${month.month}-${item.type1}-${item.type2}`}>
          {index === 0 ? <td rowSpan={items.length}>{month.month}월</td> : null}
          {firstType1Indexes.has(index) ? (
            <td rowSpan={type1RowSpans.get(item.type1)}>{item.type1}</td>
          ) : null}
          <td>{item.type2}</td>
          <td>{formatMm(item.minutes, month.workingDays)}</td>
        </tr>
      ))}
      {showMonthSummary ? (
        <tr className="summary-row is-strong">
          <td colSpan={3}>{month.month}월 합계</td>
          <td>{formatMm(month.totalMinutes, month.workingDays)}</td>
        </tr>
      ) : null}
    </>
  );
}
