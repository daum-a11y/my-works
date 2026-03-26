import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { opsDataClient } from "../../lib/data-client";
import { type Member, type Project, type ProjectPage } from "../../lib/domain";
import styles from "./ProjectsFeature.module.css";

type ProjectTabKey = "all" | "active" | "monitoring" | "qa" | "attention" | "closed";

const projectTabs: Array<{ key: ProjectTabKey; label: string }> = [
  { key: "all", label: "전체" },
  { key: "active", label: "활성" },
  { key: "monitoring", label: "모니터링" },
  { key: "qa", label: "QA" },
  { key: "attention", label: "주의" },
  { key: "closed", label: "종료" },
];

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function memberName(memberId: string | null | undefined, membersById: Map<string, Member>): string {
  if (!memberId) {
    return "미지정";
  }

  return membersById.get(memberId)?.name ?? "미지정";
}

function isAttentionStatus(status: string): boolean {
  return status === "미개선" || status === "일부" || status === "중지";
}

function isPastDate(value: string): boolean {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return new Date(value) < startOfToday;
}

function getProjectPages(projectId: string, pages: ProjectPage[]): ProjectPage[] {
  return pages.filter((page) => page.projectId === projectId);
}

function getProjectStateLabel(project: Project, projectPages: ProjectPage[]): string {
  if (!project.isActive || isPastDate(project.endDate)) {
    return "종료";
  }

  if (projectPages.some((page) => isAttentionStatus(page.trackStatus))) {
    return "주의";
  }

  const monitoring = projectPages.some((page) => page.monitoringInProgress);
  const qa = projectPages.some((page) => page.qaInProgress);

  if (monitoring && qa) {
    return "모니터링 / QA";
  }

  if (monitoring) {
    return "모니터링";
  }

  if (qa) {
    return "QA";
  }

  return "활성";
}

function getProjectStateTone(project: Project, projectPages: ProjectPage[]): "active" | "monitoring" | "qa" | "attention" | "closed" {
  if (!project.isActive || isPastDate(project.endDate)) {
    return "closed";
  }

  if (projectPages.some((page) => isAttentionStatus(page.trackStatus))) {
    return "attention";
  }

  if (projectPages.some((page) => page.monitoringInProgress)) {
    return "monitoring";
  }

  if (projectPages.some((page) => page.qaInProgress)) {
    return "qa";
  }

  return "active";
}

function projectMatchesTab(project: Project, projectPages: ProjectPage[], tab: ProjectTabKey): boolean {
  switch (tab) {
    case "active":
      return project.isActive && !isPastDate(project.endDate);
    case "monitoring":
      return projectPages.some((page) => page.monitoringInProgress);
    case "qa":
      return projectPages.some((page) => page.qaInProgress);
    case "attention":
      return projectPages.some((page) => isAttentionStatus(page.trackStatus));
    case "closed":
      return !project.isActive || isPastDate(project.endDate);
    case "all":
    default:
      return true;
  }
}

export function ProjectsFeature() {
  const { session } = useAuth();
  const member = session?.member;

  const query = useQuery({
    queryKey: ["projects", member?.id],
    enabled: Boolean(member),
    queryFn: async () => {
      const [projects, pages, members] = await Promise.all([
        opsDataClient.getProjects(),
        opsDataClient.getProjectPages(member!),
        opsDataClient.getMembers(),
      ]);

      return { projects, pages, members };
    },
  });

  const data = query.data;
  const projects = data?.projects ?? [];
  const pages = data?.pages ?? [];
  const members = data?.members ?? [];
  const membersById = useMemo(() => new Map(members.map((item) => [item.id, item])), [members]);

  const [selectedTab, setSelectedTab] = useState<ProjectTabKey>("all");
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const tabCounts = useMemo(() => {
    const counts: Record<ProjectTabKey, number> = {
      all: projects.length,
      active: 0,
      monitoring: 0,
      qa: 0,
      attention: 0,
      closed: 0,
    };

    for (const project of projects) {
      const projectPages = getProjectPages(project.id, pages);

      if (projectMatchesTab(project, projectPages, "active")) {
        counts.active += 1;
      }

      if (projectMatchesTab(project, projectPages, "monitoring")) {
        counts.monitoring += 1;
      }

      if (projectMatchesTab(project, projectPages, "qa")) {
        counts.qa += 1;
      }

      if (projectMatchesTab(project, projectPages, "attention")) {
        counts.attention += 1;
      }

      if (projectMatchesTab(project, projectPages, "closed")) {
        counts.closed += 1;
      }
    }

    return counts;
  }, [pages, projects]);

  const visibleProjects = useMemo(
    () => projects.filter((project) => projectMatchesTab(project, getProjectPages(project.id, pages), selectedTab)),
    [pages, projects, selectedTab],
  );

  useEffect(() => {
    if (!visibleProjects.length) {
      setSelectedProjectId("");
      return;
    }

    if (!visibleProjects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(visibleProjects[0].id);
    }
  }, [selectedProjectId, visibleProjects]);

  const selectedProject = visibleProjects.find((project) => project.id === selectedProjectId) ?? visibleProjects[0] ?? null;
  const selectedProjectPages = useMemo(
    () => (selectedProject ? getProjectPages(selectedProject.id, pages) : []),
    [pages, selectedProject],
  );
  const selectedTabLabel = projectTabs.find((item) => item.key === selectedTab)?.label ?? "전체";
  const selectedProjectStateLabel = selectedProject ? getProjectStateLabel(selectedProject, selectedProjectPages) : "";
  const selectedProjectStateTone = selectedProject
    ? getProjectStateTone(selectedProject, selectedProjectPages)
    : "active";

  if (query.isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <div style={{ width: "2rem", height: "2rem", border: "2px solid var(--border-subtle)", borderTopColor: "var(--accent-strong)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <section className={styles.shell} aria-labelledby="projects-heading">
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>프로젝트</p>
          <h1 id="projects-heading" className={styles.title}>프로젝트 관리</h1>
        </div>
        <div className={styles.tablist} role="tablist" aria-label="프로젝트 보기">
          {projectTabs.map((tab) => {
            const active = tab.key === selectedTab;

            return (
              <button
                key={tab.key}
                type="button"
                className={`${styles.tabButton} ${active ? styles.tabButtonActive : ""}`}
                onClick={() => setSelectedTab(tab.key)}
                aria-pressed={active}
              >
                <span>{tab.label}</span>
                <strong>{tabCounts[tab.key]}</strong>
              </button>
            );
          })}
        </div>
      </header>

      <section className={styles.panel} aria-labelledby="project-list-heading">
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="project-list-heading" className={styles.sectionTitle}>
              프로젝트 목록
            </h2>
            <span className={styles.sectionMeta}>
              {selectedTabLabel} · {visibleProjects.length}개
            </span>
          </div>
          <span className={styles.sectionMeta}>전체 {projects.length}개</span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>프로젝트 목록</caption>
            <thead>
              <tr>
                <th scope="col">프로젝트</th>
                <th scope="col">플랫폼</th>
                <th scope="col">페이지</th>
                <th scope="col">상태</th>
                <th scope="col">담당</th>
                <th scope="col">기간</th>
                <th scope="col">보기</th>
              </tr>
            </thead>
            <tbody>
              {visibleProjects.map((project) => {
                const projectPages = getProjectPages(project.id, pages);
                const selected = project.id === selectedProject?.id;
                const stateTone = getProjectStateTone(project, projectPages);
                const stateLabel = getProjectStateLabel(project, projectPages);

                return (
                  <tr key={project.id} className={selected ? styles.tableRowActive : undefined}>
                    <td>
                      <div className={styles.stackCell}>
                        <strong>{project.name}</strong>
                        <span className={styles.subText}>{project.reportUrl || "보고서 URL 없음"}</span>
                      </div>
                    </td>
                    <td>
                      <span className="uiPlatformBadge">{project.platform}</span>
                    </td>
                    <td className="tabularNums">{projectPages.length}</td>
                    <td>
                      <span className={styles.statusTag} data-tone={stateTone}>
                        {stateLabel}
                      </span>
                    </td>
                    <td className={styles.stackCell}>
                      <strong>{memberName(project.reporterMemberId, membersById)}</strong>
                      <span className={styles.subText}>{memberName(project.reviewerMemberId, membersById)}</span>
                    </td>
                    <td className="tabularNums">
                      {formatDate(project.startDate)} - {formatDate(project.endDate)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.inlineButton}
                        onClick={() => setSelectedProjectId(project.id)}
                        aria-current={selected ? "true" : undefined}
                      >
                        {selected ? "선택됨" : "선택"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!visibleProjects.length ? (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    선택한 탭에 해당하는 프로젝트가 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="project-detail-heading">
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="project-detail-heading" className={styles.sectionTitle}>
              선택된 프로젝트
            </h2>
            <span className={styles.sectionMeta}>
              {selectedProject ? `${selectedProjectPages.length}개 페이지` : "표에서 프로젝트를 선택하세요."}
            </span>
          </div>
          {selectedProject ? (
            <span className={styles.sectionMeta}>
              <span className={styles.statusTag} data-tone={selectedProjectStateTone}>
                {selectedProjectStateLabel}
              </span>
            </span>
          ) : null}
        </div>

        {selectedProject ? (
          <>
            <div className={styles.detailHeader}>
              <div>
                <p className={styles.detailKicker}>{selectedProject.platform}</p>
                <h3 className={styles.detailTitle}>{selectedProject.name}</h3>
                <p className={styles.detailSummary}>
                  {selectedProject.reportUrl ? (
                    <a
                      href={selectedProject.reportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.linkText}
                    >
                      보고서 열기
                    </a>
                  ) : (
                    "보고서 URL 없음"
                  )}
                </p>
              </div>
              <dl className={styles.metaGrid}>
                <div>
                  <dt>리포터</dt>
                  <dd>{memberName(selectedProject.reporterMemberId, membersById)}</dd>
                </div>
                <div>
                  <dt>검토자</dt>
                  <dd>{memberName(selectedProject.reviewerMemberId, membersById)}</dd>
                </div>
                <div>
                  <dt>시작일</dt>
                  <dd>{formatDate(selectedProject.startDate)}</dd>
                </div>
                <div>
                  <dt>종료일</dt>
                  <dd>{formatDate(selectedProject.endDate)}</dd>
                </div>
              </dl>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <caption className={styles.srOnly}>선택된 프로젝트 페이지 목록</caption>
                <thead>
                  <tr>
                    <th scope="col">페이지</th>
                    <th scope="col">담당자</th>
                    <th scope="col">상태</th>
                    <th scope="col">트래킹</th>
                    <th scope="col">수정 시각</th>
                    <th scope="col">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProjectPages.map((page) => (
                    <tr key={page.id}>
                      <td>
                        <div className={styles.stackCell}>
                          <strong>{page.title}</strong>
                          <span className={styles.subText}>{page.url || "URL 없음"}</span>
                        </div>
                      </td>
                      <td>{memberName(page.ownerMemberId, membersById)}</td>
                      <td>
                        <span className="uiStatusBadge" data-status={page.trackStatus}>
                          {page.trackStatus}
                        </span>
                      </td>
                      <td>
                        <div className={styles.flagRow}>
                          {page.monitoringInProgress ? (
                            <span className="uiFlagTag" data-flag="monitoring">
                              모니터링
                            </span>
                          ) : null}
                          {page.qaInProgress ? (
                            <span className="uiFlagTag" data-flag="qa">
                              QA
                            </span>
                          ) : null}
                          {!page.monitoringInProgress && !page.qaInProgress ? <span className={styles.subText}>-</span> : null}
                        </div>
                      </td>
                      <td className="tabularNums">{formatDateTime(page.updatedAt)}</td>
                      <td>{page.note || "-"}</td>
                    </tr>
                  ))}
                  {!selectedProjectPages.length ? (
                    <tr>
                      <td colSpan={6} className={styles.empty}>
                        이 프로젝트에 연결된 페이지가 없습니다.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className={styles.empty}>표에서 프로젝트를 선택하면 상세 표가 표시됩니다.</p>
        )}
      </section>
    </section>
  );
}

export default ProjectsFeature;
