import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { opsDataClient } from "../../lib/data-client";
import { formatDateLabel, toLocalDateInputValue } from "../../lib/utils";
import { useAuth } from "../auth/AuthContext";
import styles from "./DashboardPage.module.css";

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"] as const;

function buildMonthDays(referenceDate: Date) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, index) => {
    const day = index + 1;
    const value = toLocalDateInputValue(new Date(year, month, day, 12, 0, 0, 0));
    return { day, value };
  });
}

function buildCalendarCells(referenceDate: Date) {
  const monthDays = buildMonthDays(referenceDate);
  const firstDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const leadingBlanks = firstDate.getDay();

  return [
    ...Array.from({ length: leadingBlanks }, (_, index) => ({ key: `blank-${index}`, day: 0, value: "", blank: true as const })),
    ...monthDays.map((day) => ({ key: day.value, blank: false as const, ...day })),
  ];
}

export function DashboardPage() {
  const { session } = useAuth();
  const member = session?.member;

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
  const calendarCells = useMemo(() => buildCalendarCells(new Date()), []);
  const tasksByDate = new Map((tasksQuery.data ?? []).map((task) => [task.taskDate, task]));
  const completedCount = tasksByDate.size;
  const totalCount = calendarCells.filter((cell) => !cell.blank).length;
  const missingCount = totalCount - completedCount;
  const monitoring = dashboard?.monitoring ?? [];
  const qa = dashboard?.qa ?? [];
  const urgentMonitoring = monitoring.slice(0, 4);
  const urgentQa = qa.slice(0, 4);
  const completionRate = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const getDayState = (date: string) => (tasksByDate.has(date) ? "done" : "none");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <h1>이번 달 운영 현황</h1>
        </div>
        <dl className={styles.summaryStrip}>
          <div>
            <dt>작성률</dt>
            <dd>{completionRate}%</dd>
          </div>
          <div>
            <dt>미작성</dt>
            <dd>{missingCount}일</dd>
          </div>
          <div>
            <dt>진행중</dt>
            <dd>{monitoring.length + qa.length}건</dd>
          </div>
        </dl>
      </header>

      <div className={styles.mainGrid}>
        <div className={styles.mainCol}>
          <section className={styles.matrixSection}>
            <div className={styles.sectionHead}>
              <h2>업무 보고 현황</h2>
            </div>
            <div className={styles.matrixWrap}>
              <div className={styles.matrix}>
                {weekdayLabels.map(l => <span key={l} className={styles.matrixWeekday}>{l}</span>)}
                {calendarCells.map((cell) => {
                  if (cell.blank) {
                    return <div key={cell.key} className={styles.matrixBlank} />;
                  }
                  const state = getDayState(cell.value);
                  return (
                    <div 
                      key={cell.key} 
                      className={styles.matrixCell} 
                      data-state={state}
                    >
                      <span className={styles.matrixDate}>{cell.day}</span>
                      <div className={styles.statusDot} />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className={styles.tableSection}>
            <h2>진행중 모니터링</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <caption className="srOnly">진행중 모니터링 목록</caption>
                <thead>
                  <tr>
                    <th scope="col">플랫폼</th>
                    <th scope="col">앱 / 페이지</th>
                    <th scope="col">상태</th>
                    <th scope="col">보고서</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoring.map((item) => (
                    <tr key={item.pageId}>
                      <td>
                        <span className="uiPlatformBadge">{item.platform}</span>
                      </td>
                      <td>
                        <strong>{item.projectName}</strong>
                        <span>{item.pageTitle}</span>
                      </td>
                      <td>
                        <div className={styles.stackCell}>
                          <span className="uiStatusBadge" data-status={item.statusLabel}>
                            {item.statusLabel}
                          </span>
                          <span>{item.detail || "메모 없음"}</span>
                        </div>
                      </td>
                      <td>
                        {item.reportUrl ? (
                          <a href={item.reportUrl} target="_blank" rel="noreferrer" className={styles.link}>
                            열기
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                  {!monitoring.length ? (
                    <tr>
                      <td colSpan={4} className={styles.empty}>진행중 모니터링 항목이 없습니다.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.tableSection}>
            <h2>진행중 QA</h2>
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
                      <td>
                        <strong>{item.projectName}</strong>
                      </td>
                      <td>{item.ownerName}</td>
                      <td>{item.dueDate ? formatDateLabel(item.dueDate) : "-"}</td>
                      <td>
                        {item.reportUrl ? (
                          <a href={item.reportUrl} target="_blank" rel="noreferrer" className={styles.link}>
                            열기
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                  {!qa.length ? (
                    <tr>
                      <td colSpan={5} className={styles.empty}>진행중 QA 항목이 없습니다.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className={styles.sideCol}>
          <section className={styles.priorityBlock}>
            <h2>모니터링 우선순위</h2>
            <ul className={styles.queueList}>
              {urgentMonitoring.map((item) => (
                <li key={item.pageId}>
                  <strong>{item.projectName}</strong>
                  <span>{item.pageTitle}</span>
                </li>
              ))}
              {!urgentMonitoring.length ? (
                <li className={styles.emptyItem}>
                  <span>진행중 항목이 없습니다.</span>
                </li>
              ) : null}
            </ul>
          </section>

          <section className={styles.priorityBlock}>
            <h2>QA 종료 예정</h2>
            <ul className={styles.queueList}>
              {urgentQa.map((item) => (
                <li key={item.pageId}>
                  <strong>{item.projectName}</strong>
                  <span>{item.dueDate ? formatDateLabel(item.dueDate) : "종료일 미정"}</span>
                </li>
              ))}
              {!urgentQa.length ? <li className={styles.emptyItem}><span>진행중 QA가 없습니다.</span></li> : null}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
