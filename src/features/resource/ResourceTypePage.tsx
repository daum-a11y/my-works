import { useEffect, useMemo, useState } from 'react';
import { setDocumentTitle } from '../../app/navigation';
import { countWorkingDays, formatMm, useResourceDataset } from './resourceShared';
import projectStyles from '../projects/ProjectsFeature.module.css';
import styles from './ResourcePage.module.css';

export function ResourceTypePage() {
  const query = useResourceDataset();
  const data = query.data;
  const [fold, setFold] = useState(false);
  const [activeYear, setActiveYear] = useState('');

  useEffect(() => {
    setDocumentTitle('업무유형 집계');
  }, []);

  const rows = useMemo(() => {
    if (!data) {
      return [];
    }

    const source =
      data.member.role === 'admin'
        ? data.tasks
        : data.tasks.filter((task) => task.memberId === data.member.id);
    const grouped = new Map<string, Map<string, number>>();

    for (const task of source) {
      const month = task.taskDate.slice(0, 7);
      const key = task.taskType1;
      const monthMap = grouped.get(month) ?? new Map<string, number>();
      monthMap.set(key, (monthMap.get(key) ?? 0) + Math.round(task.taskUsedtime));
      grouped.set(month, monthMap);
    }

    const years = new Map<
      string,
      Array<{
        month: string;
        workingDays: number;
        totalMinutes: number;
        items: Array<{ type: string; minutes: number }>;
      }>
    >();

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
  }, [data]);

  useEffect(() => {
    if (!rows.length) {
      setActiveYear('');
      return;
    }

    if (!rows.some((row) => row.year === activeYear)) {
      setActiveYear(rows[0].year);
    }
  }, [activeYear, rows]);

  const activeRow = rows.find((row) => row.year === activeYear) ?? null;

  return (
    <section className={projectStyles.shell}>
      <header className={projectStyles.pageHeader}>
        <div className={projectStyles.pageHeaderTop}>
          <h1 className={projectStyles.title}>업무유형 집계</h1>
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

      {rows.length ? (
        <section className={styles.tableTabsSection}>
          <div className={styles.tableTabsScroller}>
            <div className={styles.tableTabs} role="tablist" aria-label="업무유형 집계 연도">
              {rows.map((row) => {
                const selected = row.year === activeYear;

                return (
                  <button
                    key={row.year}
                    id={`resource-type-tab-${row.year}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`resource-type-panel-${row.year}`}
                    tabIndex={selected ? 0 : -1}
                    className={selected ? styles.tableTabActive : styles.tableTab}
                    onClick={() => setActiveYear(row.year)}
                  >
                    {row.year}년
                  </button>
                );
              })}
            </div>
          </div>

          {activeRow ? (
            <div
              id={`resource-type-panel-${activeRow.year}`}
              role="tabpanel"
              aria-labelledby={`resource-type-tab-${activeRow.year}`}
              className={styles.tableTabPanel}
            >
              <div className={projectStyles.tableWrap}>
                <table className={projectStyles.table}>
                  <caption className={styles.srOnly}>
                    {activeRow.year}년 월 기준 업무유형 집계 표
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">월</th>
                      <th scope="col">업무유형</th>
                      <th scope="col">MM</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TypeYearRows row={activeRow} fold={fold} />
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <div className={projectStyles.tableWrap}>
          <table className={projectStyles.table}>
            <caption className={styles.srOnly}>연도와 월 기준 업무유형 집계 표</caption>
            <thead>
              <tr>
                <th scope="col">월</th>
                <th scope="col">업무유형</th>
                <th scope="col">MM</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} className={projectStyles.emptyState}>
                  표시할 타입별 집계가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TypeYearRows({
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
      totalMinutes: number;
      workingDays: number;
      items: Array<{ type: string; minutes: number }>;
    }>;
  };
  fold: boolean;
}) {
  if (fold) {
    return (
      <>
        {row.months.map((month) => (
          <tr key={`${row.year}-${month.month}-sum`} className={styles.summaryStrongRow}>
            <td>{month.month}월</td>
            <td>전체</td>
            <td>{formatMm(month.totalMinutes, month.workingDays)}</td>
          </tr>
        ))}
        <tr className={styles.summaryStrongRow}>
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
        <MonthDetailRows key={`${row.year}-${month.month}`} month={month} />
      ))}
      <tr className={styles.summaryStrongRow}>
        <td colSpan={2}>{row.year}년 합계</td>
        <td>{formatMm(row.yearTotalMinutes, 21.73)}</td>
      </tr>
    </>
  );
}

function MonthDetailRows({
  month,
}: {
  month: {
    month: string;
    totalMinutes: number;
    workingDays: number;
    items: Array<{ type: string; minutes: number }>;
  };
}) {
  return (
    <>
      {month.items.map((item, index) => (
        <tr key={`${month.month}-${item.type}`}>
          {index === 0 ? <td rowSpan={month.items.length}>{month.month}월</td> : null}
          <td>{item.type}</td>
          <td>{formatMm(item.minutes, month.workingDays)}</td>
        </tr>
      ))}
      <tr className={styles.summaryStrongRow}>
        <td colSpan={2}>{month.month}월 합계</td>
        <td>{formatMm(month.totalMinutes, month.workingDays)}</td>
      </tr>
    </>
  );
}
