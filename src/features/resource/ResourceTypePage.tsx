import { useEffect, useMemo, useState } from 'react';
import { setDocumentTitle } from '../../app/navigation';
import { PageSection } from '../../components/ui/PageSection';
import { countWorkingDays, formatMm, useResourceDataset } from './resource-shared';
import styles from './ResourcePage.module.css';

export function ResourceTypePage() {
  const query = useResourceDataset();
  const data = query.data;
  const [fold, setFold] = useState(false);

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
      const key = `${task.taskType1} / ${task.taskType2}`;
      const monthMap = grouped.get(month) ?? new Map<string, number>();
      monthMap.set(key, (monthMap.get(key) ?? 0) + Math.round(task.hours));
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

    return Array.from(years.entries()).map(([year, months]) => ({
      year,
      yearTotalMinutes: months.reduce((sum, month) => sum + month.totalMinutes, 0),
      detailRowCount: months.reduce((sum, month) => sum + month.items.length + 1, 0),
      foldRowCount: months.length + 1,
      months,
    }));
  }, [data]);

  return (
    <PageSection title="전체 기간">
      <div className={styles.tableActionRow}>
        <button type="button" onClick={() => setFold((current) => !current)}>
          {fold ? '펼치기' : '접기'}
        </button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>year</th>
              <th>month</th>
              <th>type</th>
              <th>MM</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <TypeYearRows key={row.year} row={row} fold={fold} />
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={4} className={styles.empty}>
                  표시할 타입별 집계가 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </PageSection>
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
        {row.months.map((month, monthIndex) => (
          <tr key={`${row.year}-${month.month}-sum`} className={styles.summaryStrongRow}>
            {monthIndex === 0 ? <td rowSpan={row.foldRowCount}>{row.year}년</td> : null}
            <td>{month.month}월</td>
            <td>전체</td>
            <td>{formatMm(month.totalMinutes, month.workingDays)}</td>
          </tr>
        ))}
        <tr className={styles.summaryStrongRow}>
          <td>합계</td>
          <td>전체</td>
          <td>{formatMm(row.yearTotalMinutes, 21.73)}</td>
        </tr>
      </>
    );
  }

  return (
    <>
      {row.months.map((month, monthIndex) => (
        <MonthDetailRows
          key={`${row.year}-${month.month}`}
          year={row.year}
          month={month}
          showYear={monthIndex === 0}
          yearRowSpan={row.detailRowCount}
        />
      ))}
      <tr className={styles.summaryStrongRow}>
        <td>{row.year}년</td>
        <td>합계</td>
        <td>{formatMm(row.yearTotalMinutes, 21.73)}</td>
      </tr>
    </>
  );
}

function MonthDetailRows({
  year,
  month,
  showYear,
  yearRowSpan,
}: {
  year: string;
  month: {
    month: string;
    totalMinutes: number;
    workingDays: number;
    items: Array<{ type: string; minutes: number }>;
  };
  showYear: boolean;
  yearRowSpan: number;
}) {
  return (
    <>
      {month.items.map((item, index) => (
        <tr key={`${year}-${month.month}-${item.type}`}>
          {showYear && index === 0 ? <td rowSpan={yearRowSpan}>{year}년</td> : null}
          {index === 0 ? <td rowSpan={month.items.length}>{month.month}월</td> : null}
          <td>{item.type}</td>
          <td>{formatMm(item.minutes, month.workingDays)}</td>
        </tr>
      ))}
      <tr className={styles.summaryStrongRow}>
        <td>{month.month}월 합계</td>
        <td>{formatMm(month.totalMinutes, month.workingDays)}</td>
      </tr>
    </>
  );
}
