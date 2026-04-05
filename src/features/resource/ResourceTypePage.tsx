import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { setDocumentTitle } from '../../app/navigation';
import { opsDataClient } from '../../lib/dataClient';
import { countWorkingDays, formatMm } from './resourceShared';
import '../../styles/domain/pages/projects-feature.scss';
import '../../styles/domain/pages/resource-page.scss';
import { useAuth } from '../auth/AuthContext';

export function ResourceTypePage() {
  const { session } = useAuth();
  const member = session?.member ?? null;
  const [activeYear, setActiveYear] = useState('');
  const yearsQuery = useQuery({
    queryKey: ['resource', 'type-summary-years', member?.id],
    queryFn: () => opsDataClient.getResourceTypeSummaryYears(member!),
    enabled: Boolean(member),
  });
  const detailQuery = useQuery({
    queryKey: ['resource', 'type-summary', member?.id, activeYear],
    queryFn: () => opsDataClient.getResourceTypeSummaryByYear(member!, activeYear),
    enabled: Boolean(member && activeYear),
  });
  const years = useMemo(() => yearsQuery.data ?? [], [yearsQuery.data]);
  const rowsData = useMemo(() => detailQuery.data ?? [], [detailQuery.data]);
  const [fold, setFold] = useState(false);

  useEffect(() => {
    setDocumentTitle('업무유형 집계');
  }, []);

  const rows = useMemo(() => {
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
    <section className="projectsFeatureScope shell">
      <header className="pageHeader">
        <div className="pageHeaderTop">
          <h1 className="title">업무유형 집계</h1>
          <button
            type="button"
            className="headerAction"
            onClick={() => setFold((current) => !current)}
            aria-pressed={fold}
            disabled={!rows.length}
          >
            {fold ? '펼치기' : '접기'}
          </button>
        </div>
      </header>

      {years.length ? (
        <section className="tableTabsSection">
          <div className="tableTabsScroller">
            <div className="tableTabs" role="tablist" aria-label="업무유형 집계 연도">
              {years.map((year) => {
                const selected = year === activeYear;

                return (
                  <button
                    key={year}
                    id={`resource-type-tab-${year}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`resource-type-panel-${year}`}
                    tabIndex={selected ? 0 : -1}
                    className={selected ? 'tableTabActive' : 'tableTab'}
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
              id={`resource-type-panel-${activeRow.year}`}
              role="tabpanel"
              aria-labelledby={`resource-type-tab-${activeRow.year}`}
              className="tableTabPanel"
            >
              <div className="tableWrap">
                <table className="table">
                  <caption className="srOnly">{activeRow.year}년 월 기준 업무유형 집계 표</caption>
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
        <div className="tableWrap">
          <table className="table">
            <caption className="srOnly">연도와 월 기준 업무유형 집계 표</caption>
            <thead>
              <tr>
                <th scope="col">월</th>
                <th scope="col">업무유형</th>
                <th scope="col">MM</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} className="emptyState">
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
          <tr key={`${row.year}-${month.month}-sum`} className="summaryStrongRow">
            <td>{month.month}월</td>
            <td>전체</td>
            <td>{formatMm(month.totalMinutes, month.workingDays)}</td>
          </tr>
        ))}
        <tr className="summaryStrongRow">
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
      <tr className="summaryStrongRow">
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
      <tr className="summaryStrongRow">
        <td colSpan={2}>{month.month}월 합계</td>
        <td>{formatMm(month.totalMinutes, month.workingDays)}</td>
      </tr>
    </>
  );
}
