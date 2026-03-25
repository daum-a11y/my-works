import { useQuery } from "@tanstack/react-query";
import { PageSection } from "../../components/ui/PageSection";
import { opsDataClient } from "../../lib/data-client";
import { useAuth } from "../auth/AuthContext";
import styles from "./shared.module.css";

export function MonitoringStatsPage() {
  const { session } = useAuth();
  const member = session?.member;

  const monitoringQuery = useQuery({
    queryKey: ["monitoring-detail", member?.id],
    queryFn: async () => {
      const [pages, projects, members] = await Promise.all([
        opsDataClient.getAllProjectPages(),
        opsDataClient.getProjects(),
        opsDataClient.getMembers(),
      ]);
      const projectsById = new Map(projects.map((project) => [project.id, project]));
      const membersById = new Map(members.map((item) => [item.id, item.name]));
      return pages
        .filter((page) => page.monitoringInProgress)
        .map((page) => ({
          ...page,
          projectName: projectsById.get(page.projectId)?.name ?? "미분류 프로젝트",
          platform: projectsById.get(page.projectId)?.platform ?? "-",
          assigneeName: page.ownerMemberId ? membersById.get(page.ownerMemberId) ?? "미지정" : "미지정",
        }));
    },
    enabled: Boolean(member),
  });

  const pages = monitoringQuery.data ?? [];

  return (
    <div className={styles.page}>
      <section className={styles.cards} aria-label="모니터링 통계 요약">
        <article className={styles.card} data-tone="monitoring">
          <span>총 진행</span>
          <strong className="tabularNums">{pages.length}</strong>
        </article>
        <article className={styles.card} data-tone="monitoring">
          <span>전체 수정</span>
          <strong className="tabularNums">{pages.filter((page) => page.trackStatus === "개선").length}</strong>
        </article>
        <article className={styles.card} data-tone="neutral">
          <span>일부 수정</span>
          <strong className="tabularNums">{pages.filter((page) => page.trackStatus === "일부").length}</strong>
        </article>
      </section>

      <PageSection title="모니터링 상세 리스트" description="진행중 모니터링 페이지, 담당자, 진행상태, 비고, 링크를 유지합니다.">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="srOnly">모니터링 통계 상세 리스트</caption>
            <thead>
              <tr>
                <th scope="col">플랫폼</th>
                <th scope="col">앱 / 페이지</th>
                <th scope="col">담당자</th>
                <th scope="col">진행상태</th>
                <th scope="col">비고</th>
                <th scope="col">보고서</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id}>
                  <td>
                    <span className="uiPlatformBadge">{page.platform}</span>
                  </td>
                  <td className={styles.stackCell}>
                    <strong>{page.projectName}</strong>
                    <span>{page.title}</span>
                  </td>
                  <td>{page.assigneeName}</td>
                  <td>
                    <span className="uiStatusBadge" data-status={page.trackStatus}>
                      {page.trackStatus}
                    </span>
                  </td>
                  <td>{page.note || "-"}</td>
                  <td>
                    {page.url ? (
                      <a href={page.url} target="_blank" rel="noreferrer" className={styles.link}>
                        열기
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {!pages.length ? (
                <tr>
                  <td colSpan={6} className={styles.empty}>진행중 모니터링 항목이 없습니다.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </PageSection>
    </div>
  );
}
