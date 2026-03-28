import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { opsDataClient } from "../../lib/data-client";
import { useAuth } from "../auth/AuthContext";
import { buildCalendarWeeks, filterTasksByMonth, getCurrentMonth, minutesFromHours } from "../resource/resource-shared";
import styles from "./DashboardPage.module.css";

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

export function DashboardPage() {
  const { session } = useAuth();
  const member = session?.member;
  const selectedMonth = getCurrentMonth();

  useEffect(() => {
    document.title = "Dashboard | My Works";
  }, []);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", member?.id],
    queryFn: async () => opsDataClient.getDashboard(member!),
    enabled: Boolean(member),
  });

  const tasksQuery = useQuery({
    queryKey: ["dashboard", "tasks", member?.id],
    queryFn: async () => opsDataClient.getTasks(member!),
    enabled: Boolean(member),
  });

  const dashboard = dashboardQuery.data;
  const monitoring = dashboard?.monitoring ?? [];
  const qa = dashboard?.qa ?? [];
  const monthState = useMemo(() => {
    if (!member) {
      return null;
    }

    const tasks = filterTasksByMonth(tasksQuery.data ?? [], selectedMonth);
    const summary = new Map<number, number>();

    for (const task of tasks) {
      const day = Number(task.taskDate.slice(8, 10));
      summary.set(day, (summary.get(day) ?? 0) + minutesFromHours(task.hours));
    }

    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
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
      <h1>Dashboard</h1>
      <section className={styles.topGrid}>
        <section className={styles.calendarSection}>
          <h2>내 업무보고 작성현황</h2>
          {monthState ? (
            <div className={styles.calendarWrap}>
              <table className={styles.calendarTable}>
                <caption>
                  {monthState.year}년 {monthState.month}월 업무일지 작성시간 현황
                </caption>
                <thead>
                  <tr>
                    {weekdayLabels.map((label) => (
                      <th key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthState.weeks.map((week, index) => (
                    <tr key={`${selectedMonth}-week-${index}`}>
                      {week.map((cell, weekdayIndex) => {
                        if (!cell) {
                          return <td key={`${selectedMonth}-${index}-${weekdayIndex}`} className={styles.calendarBlank}>&nbsp;</td>;
                        }

                        const minutes = monthState.summary.get(cell.day) ?? 0;
                        const isWeekend = cell.weekday === 0 || cell.weekday === 6;
                        const showBusinessState =
                          !isWeekend &&
                          ((monthState.currentMonth && monthState.today >= cell.day) || (!monthState.future && !monthState.currentMonth));

                        return (
                          <td key={cell.date} className={styles.calendarCell}>
                            {isWeekend ? (
                              minutes > 0 ? (
                                <Link to="/reports" state={{ reportDate: cell.date }} className={styles.calendarLink}>
                                  <span className={styles.calendarDate}>{cell.day}일</span>
                                </Link>
                              ) : (
                                <span className={styles.calendarDate}>{cell.day}일</span>
                              )
                            ) : (
                              <Link to="/reports" state={{ reportDate: cell.date }} className={styles.calendarLink}>
                                <span className={styles.calendarDate}>{cell.day}일</span>
                              </Link>
                            )}{" "}
                            {isWeekend ? (
                              minutes > 0 ? <span className={`${styles.badge} ${styles.badgeWeekend}`}>{minutes}분</span> : null
                            ) : showBusinessState ? (
                              minutes > 0 ? (
                                <span className={`${styles.badge} ${minutes >= 480 ? styles.badgeSuccess : styles.badgeWarning}`}>
                                  {(480 - minutes) * -1}분
                                </span>
                              ) : (
                                <span className={`${styles.badge} ${styles.badgeDanger}`}>-480분</span>
                              )
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.empty}>유저정보가 없습니다.</div>
          )}
        </section>

        <section className={styles.noticeSection} aria-label="대시보드 안내">
          <p className={styles.noticeImageWrap}>
            <img src="/img/dash01.png" alt="언젠간 할 날이 오겠지..." className={styles.noticeImage} />
          </p>
        </section>
      </section>

      <section className={styles.tableSection}>
        <h2>진행중 모니터링 목록</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="srOnly">진행중 모니터링 목록</caption>
            <thead>
              <tr>
                <th scope="col">플랫폼</th>
                <th scope="col">앱이름</th>
                <th scope="col">내용</th>
                <th scope="col">보고서</th>
              </tr>
            </thead>
            <tbody>
              {monitoring.map((item) => (
                <tr key={item.pageId}>
                  <td>
                    <span className="uiPlatformBadge">{item.platform}</span>
                  </td>
                  <td>{item.projectName}</td>
                  <td>{item.pageTitle || "-"}</td>
                  <td>
                    {item.reportUrl ? (
                      <a href={item.reportUrl} target="_blank" rel="noreferrer" className={styles.link}>
                        Click
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {!monitoring.length ? (
                <tr>
                  <td colSpan={4} className={styles.empty}>
                    진행중 모니터링 항목이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.tableSection}>
        <h2>진행중 QA 목록</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="srOnly">진행중 QA 목록</caption>
            <thead>
              <tr>
                <th scope="col">플랫폼</th>
                <th scope="col">앱이름</th>
                <th scope="col">리포터</th>
                <th scope="col">종료 예정</th>
                <th scope="col">보고서</th>
              </tr>
            </thead>
            <tbody>
              {qa.map((item) => (
                <tr key={item.pageId}>
                  <td>
                    <span className="uiPlatformBadge">{item.platform}</span>
                  </td>
                  <td>{item.projectName}</td>
                  <td>{item.ownerName}</td>
                  <td>{item.dueDate || "-"}</td>
                  <td>
                    {item.reportUrl ? (
                      <a href={item.reportUrl} target="_blank" rel="noreferrer" className={styles.link}>
                        Click
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {!qa.length ? (
                <tr>
                  <td colSpan={5} className={styles.empty}>
                    진행중 QA 항목이 없습니다.
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
