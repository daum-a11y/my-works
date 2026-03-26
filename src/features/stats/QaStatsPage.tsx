import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageSection } from "../../components/ui/PageSection";
import { opsDataClient } from "../../lib/data-client";
import { formatDateLabel, parseLocalDateInput } from "../../lib/utils";
import { useAuth } from "../auth/AuthContext";
import styles from "./shared.module.css";

interface QaProject {
  id: string;
  name: string;
  platform: string;
  reportUrl: string;
  reporterName: string;
  startDate: string;
  endDate: string;
}

interface MonthlyQaRow {
  monthKey: string;
  label: string;
  count: number;
  active: number;
}

function buildDueTag(endDate: string) {
  const today = new Date();
  const due = parseLocalDateInput(endDate);
  if (!due) {
    return { label: endDate, state: "scheduled" as const };
  }
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

  return { label: formatDateLabel(endDate), state: "scheduled" as const };
}

function monthKeyFromDate(value: string): string {
  return value.slice(0, 7);
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
  }).format(new Date(year, month - 1, 1));
}

function buildMonthRange(monthKeys: string[]): string[] {
  if (!monthKeys.length) {
    return [];
  }

  const uniqueKeys = [...new Set(monthKeys)].sort();
  const [startYear, startMonth] = uniqueKeys[0].split("-").map(Number);
  const [endYear, endMonth] = uniqueKeys[uniqueKeys.length - 1].split("-").map(Number);
  const range: string[] = [];
  let cursor = new Date(startYear, startMonth - 1, 1);
  const end = new Date(endYear, endMonth - 1, 1);

  while (cursor <= end) {
    range.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return range;
}

function isActiveProject(project: QaProject): boolean {
  const now = new Date();
  const startDate = parseLocalDateInput(project.startDate);
  const endDate = parseLocalDateInput(project.endDate);
  if (!startDate || !endDate) {
    return false;
  }
  return startDate <= now && endDate >= now;
}

export function QaStatsPage() {
  const { session } = useAuth();
  const member = session?.member;

  const projectsQuery = useQuery({
    queryKey: ["qa-projects", member?.id],
    queryFn: async () => {
      const [pages, projects, members] = await Promise.all([
        opsDataClient.getAllProjectPages(),
        opsDataClient.getProjects(),
        opsDataClient.getMembers(),
      ]);
      const qaProjectIds = new Set(pages.filter((page) => page.qaInProgress).map((page) => page.projectId));
      const membersById = new Map(members.map((item) => [item.id, item.name]));

      return projects
        .filter((project) => qaProjectIds.has(project.id))
        .map((project) => ({
          id: project.id,
          name: project.name,
          platform: project.platform,
          reportUrl: project.reportUrl,
          reporterName: project.reporterMemberId ? membersById.get(project.reporterMemberId) ?? "미지정" : "미지정",
          startDate: project.startDate,
          endDate: project.endDate,
        }))
        .sort((left, right) => left.endDate.localeCompare(right.endDate) || left.name.localeCompare(right.name));
    },
    enabled: Boolean(member),
  });

  const qaProjects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const activeCount = useMemo(() => qaProjects.filter((project) => isActiveProject(project)).length, [qaProjects]);
  const monthlyRows = useMemo<MonthlyQaRow[]>(() => {
    if (!qaProjects.length) {
      return [];
    }

    const grouped = new Map<string, { count: number; active: number }>();
    const monthKeys = qaProjects.map((project) => monthKeyFromDate(project.endDate));

    for (const project of qaProjects) {
      const monthKey = monthKeyFromDate(project.endDate);
      const current = grouped.get(monthKey) ?? { count: 0, active: 0 };
      current.count += 1;
      if (isActiveProject(project)) {
        current.active += 1;
      }
      grouped.set(monthKey, current);
    }

    return buildMonthRange(monthKeys).map((monthKey) => ({
      monthKey,
      label: formatMonthLabel(monthKey),
      count: grouped.get(monthKey)?.count ?? 0,
      active: grouped.get(monthKey)?.active ?? 0,
    }));
  }, [qaProjects]);
  const maxCount = monthlyRows.reduce((max, row) => Math.max(max, row.count), 1);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>QA 통계</h1>
      </header>

      <section className={styles.scoreboard}>
        <article className={styles.scoreCard}>
          <span>총 QA</span>
          <strong>{qaProjects.length}</strong>
        </article>
        <article className={styles.scoreCard}>
          <span>진행중</span>
          <strong>{activeCount}</strong>
        </article>
        <article className={styles.scoreCard}>
          <span>완료</span>
          <strong>{qaProjects.length - activeCount}</strong>
        </article>
      </section>

      <PageSection title="월별 차트">
        <div className={styles.chartSurface}>
          {monthlyRows.length ? (
            <div className={styles.chart} role="img" aria-label="QA 월별 차트">
              {monthlyRows.map((row) => {
                const height = maxCount ? Math.max((row.count / maxCount) * 100, row.count ? 14 : 8) : 8;

                return (
                  <div key={row.monthKey} className={styles.chartColumn}>
                    <div className={styles.chartTrack}>
                      <div className={styles.chartBar} style={{ height: `${height}%` }}>
                        <strong className={styles.chartValue}>{row.count}</strong>
                      </div>
                    </div>
                    <span className={styles.chartLabel}>{row.label}</span>
                    <span className={styles.chartNote}>진행중 {row.active}개</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.empty}>QA 데이터가 없습니다.</p>
          )}
        </div>
      </PageSection>

      <PageSection title="월별 표">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>QA 월별 표</caption>
            <thead>
              <tr>
                <th scope="col">월</th>
                <th scope="col">QA 프로젝트</th>
                <th scope="col">진행중</th>
                <th scope="col">완료</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRows.map((row) => (
                <tr key={row.monthKey}>
                  <td>{row.label}</td>
                  <td className="tabularNums">{row.count}</td>
                  <td className="tabularNums">{row.active}</td>
                  <td className="tabularNums">{row.count - row.active}</td>
                </tr>
              ))}
              {!monthlyRows.length ? (
                <tr>
                  <td colSpan={4} className={styles.empty}>
                    월별 데이터가 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </PageSection>

      <PageSection title="상세 목록">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>QA 상세 목록</caption>
            <thead>
              <tr>
                <th scope="col">플랫폼</th>
                <th scope="col">프로젝트</th>
                <th scope="col">리포터</th>
                <th scope="col">종료 예정</th>
                <th scope="col">보고서</th>
              </tr>
            </thead>
            <tbody>
              {qaProjects.map((project) => {
                const dueTag = buildDueTag(project.endDate);

                return (
                  <tr key={project.id}>
                    <td>
                      <span className="uiPlatformBadge">{project.platform}</span>
                    </td>
                    <td>
                      <div className={styles.stackCell}>
                        <strong>{project.name}</strong>
                        <span>종료일 {formatDateLabel(project.endDate)}</span>
                      </div>
                    </td>
                    <td>{project.reporterName}</td>
                    <td>
                      <span className="uiDueTag" data-state={dueTag.state}>
                        {dueTag.label}
                      </span>
                    </td>
                    <td>
                      {project.reportUrl ? (
                        <a href={project.reportUrl} target="_blank" rel="noreferrer" className={styles.link}>
                          열기
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })}
              {!qaProjects.length ? (
                <tr>
                  <td colSpan={5} className={styles.empty}>
                    진행중 QA 프로젝트가 없습니다.
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
