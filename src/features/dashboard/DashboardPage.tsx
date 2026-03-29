import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { setDocumentTitle } from '../../app/navigation';
import { MonthlyReportCalendar } from '../../components/ui/MonthlyReportCalendar';
import { opsDataClient } from '../../lib/data-client';
import { useAuth } from '../auth/AuthContext';
import {
  buildCalendarWeeks,
  filterTasksByMonth,
  getCurrentMonth,
  shiftMonth,
} from '../resource/resource-shared';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { session } = useAuth();
  const member = session?.member;
  const [selectedMonth, setSelectedMonth] = useState(() => getCurrentMonth());

  useEffect(() => {
    setDocumentTitle('대시보드');
  }, []);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', member?.id],
    queryFn: async () => opsDataClient.getDashboard(member!),
    enabled: Boolean(member),
  });

  const tasksQuery = useQuery({
    queryKey: ['dashboard', 'tasks', member?.id],
    queryFn: async () => opsDataClient.getTasks(member!),
    enabled: Boolean(member),
  });

  const dashboard = dashboardQuery.data;
  const inProgressProjects = dashboard?.inProgressProjects ?? [];
  const monthState = useMemo(() => {
    if (!member) {
      return null;
    }

    const tasks = filterTasksByMonth(tasksQuery.data ?? [], selectedMonth);
    const summary = new Map<number, number>();

    for (const task of tasks) {
      const day = Number(task.taskDate.slice(8, 10));
      summary.set(day, (summary.get(day) ?? 0) + Math.round(task.hours));
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
  }, [member, selectedMonth, tasksQuery.data]);

  return (
    <div className={styles.page}>
      <section className={styles.pageIntro}>
        <h1>대시보드</h1>
      </section>
      <section className={styles.topGrid}>
        <section className={styles.calendarSection}>
          {monthState && (
            <div className={styles.sectionHead}>
              <div className={styles.calendarHeading}>
                <div className={styles.calendarTitleBlock}>
                  <p className={styles.calendarEyebrow}>업무 현황</p>
                  <h2 className={styles.calendarTitle}>
                    {monthState.year}년 {monthState.month}월
                  </h2>
                </div>
                <div className={styles.calendarNav} aria-label="업무일지 월 이동">
                  <button
                    type="button"
                    className={styles.calendarNavButton}
                    onClick={() => setSelectedMonth((current) => shiftMonth(current, -1))}
                    aria-label="이전달 보기"
                  >
                    <span aria-hidden="true" className={styles.calendarNavIcon}>
                      &lt;
                    </span>
                    이전달
                  </button>
                  <button
                    type="button"
                    className={styles.calendarNavButton}
                    onClick={() => setSelectedMonth((current) => shiftMonth(current, 1))}
                    aria-label="다음달 보기"
                  >
                    다음달
                    <span aria-hidden="true" className={styles.calendarNavIcon}>
                      &gt;
                    </span>
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
              panel={false}
              getDateLink={(date) => ({ to: '/reports', state: { reportDate: date } })}
            />
          ) : (
            <div className={styles.empty}>유저정보가 없습니다.</div>
          )}
        </section>
      </section>

      <section className={styles.tableSection}>
        <div className={styles.sectionHead}>
          <h2>진행중인 프로젝트 목록</h2>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="srOnly">진행중인 프로젝트 목록</caption>
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
                  <td colSpan={6} className={styles.empty}>
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
