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
    ...Array.from({ length: leadingBlanks }, (_, index) => ({
      key: `blank-${index}`,
      day: 0,
      value: "",
      blank: true as const,
    })),
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
  const monitoring = dashboard?.monitoring ?? [];
  const qa = dashboard?.qa ?? [];
  const getDayState = (date: string) => (tasksByDate.has(date) ? "done" : "none");

  return (
    <div className={styles.page}>
      <section className={styles.matrixSection}>
        <h2>업무 보고 현황</h2>
        <div className={styles.matrixWrap}>
          <table className={styles.matrixTable}>
            <thead>
              <tr>
                {weekdayLabels.map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.ceil(calendarCells.length / 7) }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {calendarCells.slice(rowIndex * 7, rowIndex * 7 + 7).map((cell) => {
                    if (cell.blank) {
                      return <td key={cell.key} className={styles.matrixBlank} />;
                    }

                    return (
                      <td key={cell.key} className={styles.matrixCell} data-state={getDayState(cell.value)}>
                        <span className={styles.matrixDate}>{cell.day}</span>
                        <div className={styles.statusDot} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
                  <td>{item.projectName}</td>
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
