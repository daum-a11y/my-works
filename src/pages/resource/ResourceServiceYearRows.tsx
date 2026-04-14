import { Fragment } from 'react';
import type {
  ResourceServiceMonthSummary,
  ResourceServiceYearSummary,
} from './ResourceServicePage.types';
import { formatMm } from './resourceUtils';

interface ResourceServiceYearRowsProps {
  row: ResourceServiceYearSummary;
  fold: boolean;
}

export function ResourceServiceYearRows({ row, fold }: ResourceServiceYearRowsProps) {
  if (fold) {
    return (
      <>
        {row.months.map((month) => (
          <Fragment key={`${row.year}-${month.month}`}>
            {month.groups.map((group, groupIndex) => (
              <tr key={`${row.year}-${month.month}-${group.group}`}>
                {groupIndex === 0 ? (
                  <td rowSpan={month.groups.length + 1}>{month.month}월</td>
                ) : null}
                {renderCostGroupCell(month.groups, groupIndex, 1, group.costGroup)}
                <td>{group.group}</td>
                <td>합계</td>
                <td>{formatMm(group.totalMinutes, month.workingDays)}</td>
              </tr>
            ))}
            <tr
              key={`${row.year}-${month.month}-sum`}
              className="krds-page__summary-strong-row"
            >
              <td colSpan={3}>{month.month}월 합계</td>
              <td>{formatMm(month.totalMinutes, month.workingDays)}</td>
            </tr>
          </Fragment>
        ))}
        <tr className="krds-page__summary-strong-row">
          <td colSpan={4}>{row.year}년 합계</td>
          <td>{formatMm(row.yearTotalMinutes, 21.73)}</td>
        </tr>
      </>
    );
  }

  return (
    <>
      {row.months.map((month) => (
        <ResourceServiceMonthDetailRows key={`${row.year}-${month.month}`} month={month} />
      ))}
      <tr className="krds-page__summary-strong-row">
        <td colSpan={4}>{row.year}년 합계</td>
        <td>{formatMm(row.yearTotalMinutes, 21.73)}</td>
      </tr>
    </>
  );
}

interface ResourceServiceMonthDetailRowsProps {
  month: ResourceServiceMonthSummary;
}

function ResourceServiceMonthDetailRows({ month }: ResourceServiceMonthDetailRowsProps) {
  const monthRowSpan = month.groups.reduce((sum, group) => sum + group.names.length, 0) + 1;

  return (
    <>
      {month.groups.map((group, groupIndex) =>
        group.names.map((name, nameIndex) => (
          <tr key={`${month.month}-${group.group}-${name.name}`}>
            {groupIndex === 0 && nameIndex === 0 ? (
              <td rowSpan={monthRowSpan}>{month.month}월</td>
            ) : null}
            {nameIndex === 0
              ? renderCostGroupCell(
                  month.groups,
                  groupIndex,
                  (currentGroup) => currentGroup.names.length,
                  group.costGroup,
                )
              : null}
            {nameIndex === 0 ? <td rowSpan={group.names.length}>{group.group}</td> : null}
            <td>{name.name}</td>
            <td>{formatMm(name.minutes, month.workingDays)}</td>
          </tr>
        )),
      )}
      <tr className="krds-page__summary-strong-row">
        <td colSpan={3}>{month.month}월 합계</td>
        <td>{formatMm(month.totalMinutes, month.workingDays)}</td>
      </tr>
    </>
  );
}

function renderCostGroupCell(
  groups: Array<{
    costGroup: string;
    group: string;
    totalMinutes: number;
    names: Array<{ name: string; minutes: number }>;
  }>,
  groupIndex: number,
  getGroupRowSpan: number | ((group: (typeof groups)[number]) => number),
  costGroup: string,
) {
  const previous = groups[groupIndex - 1];
  if (previous && previous.costGroup === costGroup) {
    return null;
  }

  const matchingGroups = groups.filter((group) => group.costGroup === costGroup);
  const rowSpan =
    typeof getGroupRowSpan === 'number'
      ? matchingGroups.length * getGroupRowSpan
      : matchingGroups.reduce((sum, group) => sum + getGroupRowSpan(group), 0);

  return <td rowSpan={rowSpan}>{costGroup}</td>;
}
