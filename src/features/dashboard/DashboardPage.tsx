import { useQuery } from "@tanstack/react-query";
import { PageSection } from "../../components/ui/PageSection";
import { opsDataClient } from "../../lib/data-client";
import { formatDateLabel, toLocalDateInputValue } from "../../lib/utils";
import { useAuth } from "../auth/AuthContext";
import styles from "./DashboardPage.module.css";

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
  const monthDays = buildMonthDays(new Date());
  const tasksByDate = new Map(
    (tasksQuery.data ?? []).map((task) => [task.taskDate, task]),
  );

  return (
    <div className={styles.page}>
      <PageSection title="내 업무보고 작성현황">
        <div className={styles.monthGrid}>
          {monthDays.map((day) => {
            const exists = tasksByDate.has(day.value);
            return (
              <div key={day.value} className={styles.dayCard} data-state={exists ? "done" : "empty"}>
                <strong className={styles.dayNumber}>{day.day}</strong>
                <span className={styles.dayState}>{exists ? "작성" : "미작성"}</span>
              </div>
            );
          })}
        </div>
      </PageSection>

      <div className={styles.grid}>
        <PageSection
          title="진행중 모니터링"
        >
          {dashboardQuery.isLoading ? (
            <p className={styles.message}>대시보드 데이터를 불러오는 중입니다.</p>
          ) : (
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
                  {dashboard?.monitoring.map((item) => (
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
                  {!dashboard?.monitoring.length ? (
                    <tr>
                      <td colSpan={4} className={styles.empty}>표시할 진행중 모니터링 항목이 없습니다.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </PageSection>

        <PageSection title="진행중 QA">
          {dashboardQuery.isLoading ? (
            <p className={styles.message}>대시보드 데이터를 불러오는 중입니다.</p>
          ) : (
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
                  {dashboard?.qa.map((item) => {
                    return (
                      <tr key={item.pageId}>
                        <td>
                          <span className="uiPlatformBadge">{item.platform}</span>
                        </td>
                        <td>
                          <strong>{item.projectName}</strong>
                        </td>
                        <td>{item.ownerName}</td>
                      <td>
                        {item.dueDate ? formatDateLabel(item.dueDate) : "-"}
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
                    );
                  })}
                  {!dashboard?.qa.length ? (
                    <tr>
                      <td colSpan={5} className={styles.empty}>표시할 진행중 QA 항목이 없습니다.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </PageSection>
      </div>
    </div>
  );
}
