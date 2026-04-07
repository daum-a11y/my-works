import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageSection } from '../../components/shared/PageSection';
import { dataClient } from '../../api/client';
import { setDocumentTitle } from '../../router/navigation';
import { getCurrentMonth, shiftMonth } from '../resource/resourceUtils';
import {
  buildMonthRange,
  formatMonthLabel,
  monthKeyFromDate,
  sortProjects,
  type MonthlyQaRow,
} from './QaStatsPage.utils';
import { useAuth } from '../../auth/AuthContext';
import '../../styles/domain/pages/stats-shared.scss';

export function QaStatsPage() {
  const { session } = useAuth();
  const member = session?.member;
  const defaultEndMonth = getCurrentMonth();
  const defaultStartMonth = shiftMonth(defaultEndMonth, -5);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const projectsQuery = useQuery({
    queryKey: ['qa-projects', member?.id],
    queryFn: async () => dataClient.getQaStatsProjects(),
    enabled: Boolean(member),
  });

  const qaProjects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const [draftStartMonth, setDraftStartMonth] = useState(defaultStartMonth);
  const [draftEndMonth, setDraftEndMonth] = useState(defaultEndMonth);
  const [startMonth, setStartMonth] = useState(defaultStartMonth);
  const [endMonth, setEndMonth] = useState(defaultEndMonth);
  const [summaryView, setSummaryView] = useState<'stats-page__chart' | 'stats-page__table'>(
    'stats-page__chart',
  );

  useEffect(() => {
    setDocumentTitle('QA 통계');
  }, []);

  const handleSearch = () => {
    const nextStart =
      draftStartMonth && draftEndMonth && draftStartMonth > draftEndMonth
        ? draftEndMonth
        : draftStartMonth;
    const nextEnd =
      draftStartMonth && draftEndMonth && draftStartMonth > draftEndMonth
        ? draftStartMonth
        : draftEndMonth;
    setStartMonth(nextStart);
    setEndMonth(nextEnd);
    setDraftStartMonth(nextStart);
    setDraftEndMonth(nextEnd);
  };

  const handleReset = () => {
    setDraftStartMonth(defaultStartMonth);
    setDraftEndMonth(defaultEndMonth);
    setStartMonth(defaultStartMonth);
    setEndMonth(defaultEndMonth);
  };

  const filteredProjects = useMemo(() => {
    return qaProjects
      .filter((project) => {
        const monthKey = monthKeyFromDate(project.endDate);
        if (startMonth && monthKey < startMonth) {
          return false;
        }
        if (endMonth && monthKey > endMonth) {
          return false;
        }
        return true;
      })
      .sort(sortProjects);
  }, [endMonth, qaProjects, startMonth]);

  const monthlyRows = useMemo<MonthlyQaRow[]>(() => {
    if (!filteredProjects.length) {
      return [];
    }

    const grouped = new Map<string, { count: number; completed: number }>();
    const monthKeys = filteredProjects.map((project) => monthKeyFromDate(project.endDate));

    for (const project of filteredProjects) {
      const monthKey = monthKeyFromDate(project.endDate);
      const current = grouped.get(monthKey) ?? { count: 0, completed: 0 };
      current.count += 1;
      if (project.endDate <= today) {
        current.completed += 1;
      }
      grouped.set(monthKey, current);
    }

    return buildMonthRange(monthKeys).map((monthKey) => {
      const count = grouped.get(monthKey)?.count ?? 0;
      const completed = grouped.get(monthKey)?.completed ?? 0;

      return {
        monthKey,
        label: formatMonthLabel(monthKey),
        count,
        completed,
      };
    });
  }, [filteredProjects, today]);

  return (
    <div className={'stats-page stats-page--page'}>
      <header className={'stats-page__hero'}>
        <h1 className={'stats-page__title'}>QA 통계</h1>
      </header>

      <PageSection title="필터">
        <form
          className={'stats-page__filter-bar'}
          onSubmit={(event) => {
            event.preventDefault();
            handleSearch();
          }}
        >
          <label className={'stats-page__filter-field'}>
            <span>시작월</span>
            <input
              type="month"
              aria-label="QA 시작월"
              value={draftStartMonth}
              onChange={(event) => setDraftStartMonth(event.target.value)}
            />
          </label>
          <label className={'stats-page__filter-field'}>
            <span>종료월</span>
            <input
              type="month"
              aria-label="QA 종료월"
              value={draftEndMonth}
              onChange={(event) => setDraftEndMonth(event.target.value)}
            />
          </label>
          <div className={'stats-page__filter-actions'}>
            <button type="submit" className={'stats-page__filter-button'}>
              검색
            </button>
            <button
              type="button"
              className={'stats-page__filter-button stats-page__filter-button--secondary'}
              onClick={handleReset}
            >
              초기화
            </button>
          </div>
        </form>
      </PageSection>

      <PageSection title="월별 QA 현황">
        <div className={'stats-page__view-toggle'} role="tablist" aria-label="QA 월별 요약 보기">
          <button
            type="button"
            className={
              summaryView === 'stats-page__table'
                ? 'stats-page__view-toggle-button stats-page__view-toggle-button--active'
                : 'stats-page__view-toggle-button'
            }
            aria-pressed={summaryView === 'stats-page__table'}
            onClick={() => setSummaryView('stats-page__table')}
          >
            표
          </button>
          <button
            type="button"
            className={
              summaryView === 'stats-page__chart'
                ? 'stats-page__view-toggle-button stats-page__view-toggle-button--active'
                : 'stats-page__view-toggle-button'
            }
            aria-pressed={summaryView === 'stats-page__chart'}
            onClick={() => setSummaryView('stats-page__chart')}
          >
            그래프
          </button>
        </div>
        {summaryView === 'stats-page__chart' ? (
          <div className={'stats-page__chart-surface'}>
            {monthlyRows.length ? (
              <div className={'stats-page__chart-frame'} role="img" aria-label="QA 월별 차트">
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={monthlyRows} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="총 QA"
                      stroke="var(--chart-series-primary-stroke)"
                      fill="var(--chart-series-primary-fill)"
                    />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      name="완료 QA"
                      stroke="var(--chart-series-success-stroke)"
                      fill="var(--chart-series-success-fill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className={'stats-page__empty'}>QA 데이터가 없습니다.</p>
            )}
          </div>
        ) : (
          <div className={'stats-page__table-wrap'}>
            <table className={'stats-page__table'}>
              <caption className={'sr-only'}>QA 월별 표</caption>
              <thead>
                <tr>
                  <th scope="col">월</th>
                  <th scope="col">총 QA</th>
                  <th scope="col">완료 QA</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRows.map((row) => (
                  <tr key={row.monthKey}>
                    <td>{row.label}</td>
                    <td className="stats-page__table-number">{row.count}</td>
                    <td className="stats-page__table-number">{row.completed}</td>
                  </tr>
                ))}
                {!monthlyRows.length ? (
                  <tr>
                    <td colSpan={3} className={'stats-page__empty'}>
                      월별 데이터가 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </PageSection>

      <PageSection title="QA 프로젝트 목록">
        <div className={'stats-page__table-wrap'}>
          <table className={'stats-page__table'}>
            <caption className={'sr-only'}>필터링된 QA 프로젝트 목록</caption>
            <thead>
              <tr>
                <th scope="col">월</th>
                <th scope="col">서비스그룹</th>
                <th scope="col">프로젝트명</th>
                <th scope="col">리포터</th>
                <th scope="col">보고서URL</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id}>
                  <td>{formatMonthLabel(monthKeyFromDate(project.endDate))}</td>
                  <td>{project.serviceGroupName}</td>
                  <td>{project.name}</td>
                  <td>{project.reporterDisplay}</td>
                  <td>
                    {project.reportUrl ? (
                      <a
                        href={project.reportUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={'stats-page__link'}
                      >
                        링크
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
              {!filteredProjects.length ? (
                <tr>
                  <td colSpan={5} className={'stats-page__empty'}>
                    조건에 맞는 QA 내역이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </PageSection>
    </div>
  );
}
