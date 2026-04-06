import { Fragment, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { setDocumentTitle } from '../../router/navigation';
import { dataClient } from '../../api/client';
import { countWorkingDays, formatMm } from './resourceUtils';
import '../../styles/domain/pages/projects-feature.scss';
import '../../styles/domain/pages/resource-page.scss';
import { useAuth } from '../../auth/AuthContext';

export function ResourceServicePage() {
  const { session } = useAuth();
  const member = session?.member ?? null;
  const [activeYear, setActiveYear] = useState('');
  const yearsQuery = useQuery({
    queryKey: ['resource', 'service-summary-years', member?.id],
    queryFn: () => dataClient.getResourceServiceSummaryYears(member!),
    enabled: Boolean(member),
  });
  const detailQuery = useQuery({
    queryKey: ['resource', 'service-summary', member?.id, activeYear],
    queryFn: () => dataClient.getResourceServiceSummaryByYear(member!, activeYear),
    enabled: Boolean(member && activeYear),
  });
  const years = useMemo(() => yearsQuery.data ?? [], [yearsQuery.data]);
  const rowsData = useMemo(() => detailQuery.data ?? [], [detailQuery.data]);
  const [fold, setFold] = useState(false);

  useEffect(() => {
    setDocumentTitle('서비스그룹 집계');
  }, []);

  const rows = useMemo(() => {
    if (!rowsData.length) {
      return [];
    }
    const grouped = new Map<string, Map<string, Map<string, Map<string, number>>>>();

    for (const row of rowsData) {
      const month = `${row.year}-${row.month}`;
      const monthMap = grouped.get(month) ?? new Map<string, Map<string, Map<string, number>>>();
      const costGroupMap =
        monthMap.get(row.costGroupName) ?? new Map<string, Map<string, number>>();
      const groupMap = costGroupMap.get(row.serviceGroupName) ?? new Map<string, number>();
      groupMap.set(
        row.serviceName,
        (groupMap.get(row.serviceName) ?? 0) + Math.round(row.taskUsedtime),
      );
      costGroupMap.set(row.serviceGroupName, groupMap);
      monthMap.set(row.costGroupName, costGroupMap);
      grouped.set(month, monthMap);
    }

    const years = new Map<
      string,
      Array<{
        month: string;
        workingDays: number;
        totalMinutes: number;
        groups: Array<{
          costGroup: string;
          group: string;
          totalMinutes: number;
          names: Array<{ name: string; minutes: number }>;
        }>;
      }>
    >();

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
  }, [rowsData]);

  useEffect(() => {
    if (!years.length) {
      setActiveYear('');
      return;
    }

    if (!years.includes(activeYear)) {
      setActiveYear(years[0]);
    }
  }, [activeYear, years]);

  const activeRow = rows[0] ?? null;

  return (
    <section className="projects-feature projects-feature--shell resource-page resource-page--page">
      <header className="projects-feature__page-header">
        <div className="projects-feature__page-header-top">
          <h1 className="projects-feature__title">서비스그룹 집계</h1>
          <button
            type="button"
            className="projects-feature__header-action"
            onClick={() => setFold((current) => !current)}
            aria-pressed={fold}
            disabled={!rows.length}
          >
            {fold ? '펼치기' : '접기'}
          </button>
        </div>
      </header>

      {years.length ? (
        <section className="resource-page__table-tabs-section">
          <div className="resource-page__table-tabs-scroller">
            <div
              className="resource-page__table-tabs"
              role="tablist"
              aria-label="서비스그룹 집계 연도"
            >
              {years.map((year) => {
                const selected = year === activeYear;

                return (
                  <button
                    key={year}
                    id={`resource-service-tab-${year}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`resource-service-panel-${year}`}
                    tabIndex={selected ? 0 : -1}
                    className={[
                      'resource-page__table-tab',
                      selected ? 'resource-page__table-tab--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setActiveYear(year)}
                  >
                    {year}년
                  </button>
                );
              })}
            </div>
          </div>

          {activeRow ? (
            <div
              id={`resource-service-panel-${activeRow.year}`}
              role="tabpanel"
              aria-labelledby={`resource-service-tab-${activeRow.year}`}
              className="resource-page__table-tab-panel"
            >
              <div className="projects-feature__table-wrap">
                <table className="projects-feature__table">
                  <caption className="projects-feature__sr-only">
                    {activeRow.year}년 월 기준 서비스그룹 집계 표
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">월</th>
                      <th scope="col">청구그룹</th>
                      <th scope="col">서비스그룹</th>
                      <th scope="col">서비스명</th>
                      <th scope="col">MM</th>
                    </tr>
                  </thead>
                  <tbody>
                    <ServiceYearRows row={activeRow} fold={fold} />
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <div className="projects-feature__table-wrap">
          <table className="projects-feature__table">
            <caption className="projects-feature__sr-only">
              연도와 월 기준 서비스그룹 집계 표
            </caption>
            <thead>
              <tr>
                <th scope="col">월</th>
                <th scope="col">청구그룹</th>
                <th scope="col">서비스그룹</th>
                <th scope="col">서비스명</th>
                <th scope="col">MM</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="projects-feature__empty-state">
                  표시할 서비스그룹 집계가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ServiceYearRows({
  row,
  fold,
}: {
  row: {
    year: string;
    yearTotalMinutes: number;
    detailRowCount: number;
    foldRowCount: number;
    months: Array<{
      month: string;
      workingDays: number;
      totalMinutes: number;
      groups: Array<{
        costGroup: string;
        group: string;
        totalMinutes: number;
        names: Array<{ name: string; minutes: number }>;
      }>;
    }>;
  };
  fold: boolean;
}) {
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
              className="resource-page__summary-strong-row"
            >
              <td colSpan={3}>{month.month}월 합계</td>
              <td>{formatMm(month.totalMinutes, month.workingDays)}</td>
            </tr>
          </Fragment>
        ))}
        <tr className="resource-page__summary-strong-row">
          <td colSpan={4}>{row.year}년 합계</td>
          <td>{formatMm(row.yearTotalMinutes, 21.73)}</td>
        </tr>
      </>
    );
  }

  return (
    <>
      {row.months.map((month) => (
        <ServiceMonthDetailRows key={`${row.year}-${month.month}`} month={month} />
      ))}
      <tr className="resource-page__summary-strong-row">
        <td colSpan={4}>{row.year}년 합계</td>
        <td>{formatMm(row.yearTotalMinutes, 21.73)}</td>
      </tr>
    </>
  );
}

function ServiceMonthDetailRows({
  month,
}: {
  month: {
    month: string;
    workingDays: number;
    totalMinutes: number;
    groups: Array<{
      costGroup: string;
      group: string;
      totalMinutes: number;
      names: Array<{ name: string; minutes: number }>;
    }>;
  };
}) {
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
      <tr className="resource-page__summary-strong-row">
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
  rowCount:
    | number
    | ((group: {
        costGroup: string;
        group: string;
        totalMinutes: number;
        names: Array<{ name: string; minutes: number }>;
      }) => number),
  costGroup: string,
) {
  const previousGroup = groups[groupIndex - 1];

  if (previousGroup?.costGroup === costGroup) {
    return null;
  }

  const resolveRowCount = typeof rowCount === 'number' ? () => rowCount : rowCount;
  let span = 0;

  for (let index = groupIndex; index < groups.length; index += 1) {
    const group = groups[index];

    if (group.costGroup !== costGroup) {
      break;
    }

    span += resolveRowCount(group);
  }

  return <td rowSpan={span}>{costGroup}</td>;
}
