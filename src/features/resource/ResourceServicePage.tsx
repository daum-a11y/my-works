import { Fragment, useEffect, useMemo, useState } from 'react';
import { setDocumentTitle } from '../../app/navigation';
import {
  buildProjectMaps,
  countWorkingDays,
  formatMm,
  getTaskServiceInfo,
  useResourceDataset,
} from './resourceShared';
import projectStyles from '../projects/ProjectsFeature.module.css';
import styles from './ResourcePage.module.css';

export function ResourceServicePage() {
  const query = useResourceDataset();
  const data = query.data;
  const [fold, setFold] = useState(false);

  useEffect(() => {
    setDocumentTitle('서비스그룹 집계');
  }, []);

  const rows = useMemo(() => {
    if (!data) {
      return [];
    }

    const source =
      data.member.role === 'admin'
        ? data.tasks
        : data.tasks.filter((task) => task.memberId === data.member.id);
    const { projectsById, serviceGroupsById } = buildProjectMaps(data.projects, data.serviceGroups);
    const grouped = new Map<string, Map<string, Map<string, number>>>();

    for (const task of source) {
      const month = task.taskDate.slice(0, 7);
      const service = getTaskServiceInfo(task, projectsById, serviceGroupsById);
      const monthMap = grouped.get(month) ?? new Map<string, Map<string, number>>();
      const groupMap = monthMap.get(service.group) ?? new Map<string, number>();
      groupMap.set(service.name, (groupMap.get(service.name) ?? 0) + Math.round(task.hours));
      monthMap.set(service.group, groupMap);
      grouped.set(month, monthMap);
    }

    const years = new Map<
      string,
      Array<{
        month: string;
        workingDays: number;
        totalMinutes: number;
        groups: Array<{
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
        .map(([group, names]) => ({
          group,
          totalMinutes: Array.from(names.values()).reduce((sum, value) => sum + value, 0),
          names: Array.from(names.entries())
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([name, minutes]) => ({ name, minutes })),
        }));

      months.push({
        month: month.slice(5, 7),
        workingDays: countWorkingDays(month),
        totalMinutes: monthGroups.reduce((sum, group) => sum + group.totalMinutes, 0),
        groups: monthGroups,
      });
      years.set(year, months);
    }

    return Array.from(years.entries()).map(([year, months]) => ({
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
  }, [data]);

  return (
    <section className={projectStyles.shell}>
      <header className={projectStyles.pageHeader}>
        <div className={projectStyles.pageHeaderTop}>
          <h1 className={projectStyles.title}>서비스그룹 집계</h1>
          <button
            type="button"
            className={projectStyles.headerAction}
            onClick={() => setFold((current) => !current)}
            aria-pressed={fold}
            disabled={!rows.length}
          >
            {fold ? '펼치기' : '접기'}
          </button>
        </div>
      </header>

      <div className={projectStyles.tableWrap}>
        <table className={projectStyles.table}>
          <caption className={styles.srOnly}>연도와 월 기준 서비스그룹 집계 표</caption>
          <thead>
            <tr>
              <th scope="col">연도</th>
              <th scope="col">월</th>
              <th scope="col">서비스그룹</th>
              <th scope="col">서비스명</th>
              <th scope="col">MM</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <ServiceYearRows key={row.year} row={row} fold={fold} />
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className={projectStyles.emptyState}>
                  표시할 서비스그룹 집계가 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
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
        {row.months.map((month, monthIndex) => (
          <Fragment key={`${row.year}-${month.month}`}>
            {month.groups.map((group, groupIndex) => (
              <tr key={`${row.year}-${month.month}-${group.group}`}>
                {monthIndex === 0 && groupIndex === 0 ? (
                  <td rowSpan={row.foldRowCount}>{row.year}년</td>
                ) : null}
                {groupIndex === 0 ? (
                  <td rowSpan={month.groups.length + 1}>{month.month}월</td>
                ) : null}
                <td>{group.group}</td>
                <td>합계</td>
                <td>{formatMm(group.totalMinutes, month.workingDays)}</td>
              </tr>
            ))}
            <tr key={`${row.year}-${month.month}-sum`} className={styles.summaryStrongRow}>
              <td colSpan={2}>{month.month}월 합계</td>
              <td>{formatMm(month.totalMinutes, month.workingDays)}</td>
            </tr>
          </Fragment>
        ))}
        <tr className={styles.summaryStrongRow}>
          <td colSpan={4}>{row.year}년 합계</td>
          <td>{formatMm(row.yearTotalMinutes, 21.73)}</td>
        </tr>
      </>
    );
  }

  return (
    <>
      {row.months.map((month, monthIndex) => (
        <ServiceMonthDetailRows
          key={`${row.year}-${month.month}`}
          year={row.year}
          month={month}
          showYear={monthIndex === 0}
          yearRowSpan={row.detailRowCount}
        />
      ))}
      <tr className={styles.summaryStrongRow}>
        <td colSpan={4}>{row.year}년 합계</td>
        <td>{formatMm(row.yearTotalMinutes, 21.73)}</td>
      </tr>
    </>
  );
}

function ServiceMonthDetailRows({
  year,
  month,
  showYear,
  yearRowSpan,
}: {
  year: string;
  month: {
    month: string;
    workingDays: number;
    totalMinutes: number;
    groups: Array<{
      group: string;
      totalMinutes: number;
      names: Array<{ name: string; minutes: number }>;
    }>;
  };
  showYear: boolean;
  yearRowSpan: number;
}) {
  const monthRowSpan = month.groups.reduce((sum, group) => sum + group.names.length, 0) + 1;

  return (
    <>
      {month.groups.map((group, groupIndex) =>
        group.names.map((name, nameIndex) => (
          <tr key={`${year}-${month.month}-${group.group}-${name.name}`}>
            {showYear && groupIndex === 0 && nameIndex === 0 ? (
              <td rowSpan={yearRowSpan}>{year}년</td>
            ) : null}
            {groupIndex === 0 && nameIndex === 0 ? (
              <td rowSpan={monthRowSpan}>{month.month}월</td>
            ) : null}
            {nameIndex === 0 ? <td rowSpan={group.names.length}>{group.group}</td> : null}
            <td>{name.name}</td>
            <td>{formatMm(name.minutes, month.workingDays)}</td>
          </tr>
        )),
      )}
      <tr className={styles.summaryStrongRow}>
        <td colSpan={2}>{month.month}월 합계</td>
        <td>{formatMm(month.totalMinutes, month.workingDays)}</td>
      </tr>
    </>
  );
}
