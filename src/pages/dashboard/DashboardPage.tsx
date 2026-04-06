import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { setDocumentTitle } from '../../router/navigation';
import { MonthlyReportCalendar } from '../../components/shared/MonthlyReportCalendar';
import { dataClient } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { buildCalendarWeeks, getCurrentMonth, shiftMonth } from '../resource/resourceUtils';
import '../../styles/domain/pages/dashboard-page.scss';

export function DashboardPage() {
  const { session } = useAuth();
  const member = session?.member;
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonth());
  const shouldShowWorklogCalendar = member?.reportRequired === true;

  useEffect(() => {
    setDocumentTitle('대시보드');
  }, []);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', member?.id],
    queryFn: async () => dataClient.getDashboard(member!),
    enabled: Boolean(member),
  });

  const tasksQuery = useQuery({
    queryKey: ['dashboard', 'tasks', member?.id, selectedMonth],
    queryFn: async () => dataClient.getDashboardTaskCalendar(member!, selectedMonth),
    enabled: Boolean(member),
  });

  const dashboard = dashboardQuery.data;
  const inProgressProjects = dashboard?.inProgressProjects ?? [];
  const monthState = useMemo(() => {
    if (!member || !shouldShowWorklogCalendar) {
      return null;
    }

    const summary = new Map<number, number>();

    for (const task of tasksQuery.data ?? []) {
      const day = Number(task.taskDate.slice(8, 10));
      summary.set(day, (summary.get(day) ?? 0) + Math.round(task.taskUsedtime));
    }

    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const currentMonth = currentYearMonth === selectedMonth;
    const future = selectedMonth > currentYearMonth;

    return {
      currentMonth,
      future,
      today: today.getDate(),
      weeks: buildCalendarWeeks(selectedMonth),
      year: Number(selectedMonth.slice(0, 4)),
      month: Number(selectedMonth.slice(5, 7)),
      summary,
    };
  }, [member, selectedMonth, shouldShowWorklogCalendar, tasksQuery.data]);

  return (
    <div className="dashboard-page">
      <section className="dashboard-page__intro">
        <h1 className="dashboard-page__intro-title">대시보드</h1>
      </section>
      {shouldShowWorklogCalendar ? (
        <section className="dashboard-page__top-grid">
          <section className="dashboard-page__calendar-section">
            {monthState && (
              <div className="dashboard-page__section-head">
                <div className="dashboard-page__calendar-heading">
                  <div className="dashboard-page__calendar-nav" aria-label="업무일지 월 이동">
                    <button
                      type="button"
                      className="dashboard-page__calendar-nav-button"
                      onClick={() => setSelectedMonth((current) => shiftMonth(current, -1))}
                    >
                      <ChevronLeft size={16} strokeWidth={2.4} aria-hidden="true" />
                      <span className="dashboard-page__sr-only">이전달 보기</span>
                    </button>
                    <h2 className="dashboard-page__calendar-title">
                      {monthState.year}년 {monthState.month}월
                    </h2>
                    <button
                      type="button"
                      className="dashboard-page__calendar-nav-button"
                      onClick={() => setSelectedMonth((current) => shiftMonth(current, 1))}
                    >
                      <ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" />
                      <span className="dashboard-page__sr-only">다음달 보기</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {monthState ? (
              <MonthlyReportCalendar
                caption="업무일지 작성 현황"
                weeks={monthState.weeks}
                summary={monthState.summary}
                currentMonth={monthState.currentMonth}
                futureMonth={monthState.future}
                todayDay={monthState.today}
                padded={false}
                panel={false}
                getDateLink={(date) => ({ to: '/reports', state: { reportDate: date } })}
              />
            ) : (
              <div className="dashboard-page__empty">유저정보가 없습니다.</div>
            )}
          </section>
        </section>
      ) : null}

      <section className="dashboard-page__table-section">
        <div className="dashboard-page__section-head">
          <h2 className="dashboard-page__section-title">진행중인 프로젝트 목록</h2>
        </div>
        <div className="dashboard-page__table-wrap">
          <table className="dashboard-page__table">
            <caption className="dashboard-page__sr-only">진행중인 프로젝트 목록</caption>
            <thead>
              <tr>
                <th scope="col">타입1</th>
                <th scope="col">플랫폼</th>
                <th scope="col">서비스그룹</th>
                <th scope="col">프로젝트명</th>
                <th scope="col">시작일</th>
                <th scope="col">종료일</th>
              </tr>
            </thead>
            <tbody>
              {inProgressProjects.map((item) => (
                <tr key={item.projectId}>
                  <td>{item.type1}</td>
                  <td>{item.platform}</td>
                  <td>{item.serviceGroupName}</td>
                  <td>{item.projectName}</td>
                  <td>{item.startDate}</td>
                  <td>{item.endDate}</td>
                </tr>
              ))}
              {!inProgressProjects.length ? (
                <tr>
                  <td colSpan={6} className="dashboard-page__empty">
                    진행중인 프로젝트가 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
