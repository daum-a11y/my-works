import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageSection } from "../../components/ui/PageSection";
import { opsDataClient } from "../../lib/data-client";
import { formatDateLabel } from "../../lib/utils";
import { useAuth } from "../auth/AuthContext";
import styles from "./shared.module.css";

function buildDueTag(endDate: string) {
  const today = new Date();
  const due = new Date(endDate);
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
      const qaProjectIds = new Set(
        pages.filter((page) => page.qaInProgress).map((page) => page.projectId),
      );
      const membersById = new Map(members.map((item) => [item.id, item.name]));
      return projects
        .filter((project) => qaProjectIds.has(project.id))
        .map((project) => ({
          ...project,
          reporterName: project.reporterMemberId ? membersById.get(project.reporterMemberId) ?? "미지정" : "미지정",
        }));
    },
    enabled: Boolean(member),
  });

  const qaProjects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);
  const now = new Date();
  const activeCount = qaProjects.filter((project) => new Date(project.startDate) <= now && new Date(project.endDate) >= now).length;

  return (
    <div className={styles.page}>
      <section className={styles.cards} aria-label="QA 통계 요약">
        <article className={styles.card} data-tone="qa">
          <span>총 진행</span>
          <strong className="tabularNums">{qaProjects.length}</strong>
        </article>
        <article className={styles.card} data-tone="qa">
          <span>진행 중</span>
          <strong className="tabularNums">{activeCount}</strong>
        </article>
        <article className={styles.card} data-tone="neutral">
          <span>진행 완료</span>
          <strong className="tabularNums">{qaProjects.length - activeCount}</strong>
        </article>
      </section>

      <PageSection title="QA 상세 리스트" description="진행중 QA 페이지가 속한 프로젝트만 유지합니다.">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="srOnly">QA 통계 상세 리스트</caption>
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
              {qaProjects.map((project) => {
                const dueTag = buildDueTag(project.endDate);
                return (
                  <tr key={project.id}>
                    <td>
                      <span className="uiPlatformBadge">{project.platform}</span>
                    </td>
                    <td><strong>{project.name}</strong></td>
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
                  <td colSpan={5} className={styles.empty}>진행중 QA 프로젝트가 없습니다.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </PageSection>
    </div>
  );
}
