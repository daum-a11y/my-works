import { useQuery } from "@tanstack/react-query";
import { PageSection } from "../../components/ui/PageSection";
import { opsDataClient } from "../../lib/data-client";
import { formatDateLabel } from "../../lib/utils";
import { useAuth } from "../auth/AuthContext";
import styles from "./DashboardPage.module.css";

function buildDueTag(dueDate: string | null) {
  if (!dueDate) {
    return { label: "일정 미정", state: "scheduled" as const };
  }

  const today = new Date();
  const due = new Date(dueDate);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86400000);

  if (diffDays < 0) {
    return { label: `지남 ${Math.abs(diffDays)}일`, state: "overdue" as const };
  }

  if (diffDays === 0) {
    return { label: "오늘 종료", state: "today" as const };
  }

  if (diffDays <= 3) {
    return { label: `D-${diffDays}`, state: "soon" as const };
  }

  return { label: formatDateLabel(dueDate), state: "scheduled" as const };
}

export function DashboardPage() {
  const { session } = useAuth();
  const member = session?.member;

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", member?.id],
    queryFn: async () => opsDataClient.getDashboard(member!),
    enabled: Boolean(member),
  });

  const statsQuery = useQuery({
    queryKey: ["dashboard-stats", member?.id],
    queryFn: async () => opsDataClient.getStats(member!),
    enabled: Boolean(member),
  });

  const dashboard = dashboardQuery.data;
  const stats = statsQuery.data;

  return (
    <div className={styles.page}>
      <section className={styles.summaryStrip} aria-label="대시보드 요약">
        <article className={styles.kpiCard} data-tone="monitoring">
          <span>진행중 모니터링</span>
          <strong className="tabularNums">{stats?.monitoringInProgress ?? 0}</strong>
          <p>현재 플래그가 켜진 페이지 수</p>
        </article>
        <article className={styles.kpiCard} data-tone="qa">
          <span>진행중 QA</span>
          <strong className="tabularNums">{stats?.qaInProgress ?? 0}</strong>
          <p>현재 일정 안에 있는 QA 대상</p>
        </article>
        <article className={styles.kpiCard} data-tone="tasks">
          <span>누적 업무 수</span>
          <strong className="tabularNums">{stats?.totalTasks ?? 0}</strong>
          <p>전체 업무보고 등록 건수</p>
        </article>
      </section>

      <div className={styles.grid}>
        <PageSection
          title="진행중 모니터링"
          description="현재 진행 페이지와 보고서 링크만 우선 제공합니다."
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

        <PageSection title="진행중 QA" description="현재 진행 중인 QA 프로젝트와 종료 예정일을 먼저 확인합니다.">
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
                    const dueTag = buildDueTag(item.dueDate);
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
                          <span className="uiDueTag" data-state={dueTag.state}>
                            {dueTag.label}
                          </span>
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
