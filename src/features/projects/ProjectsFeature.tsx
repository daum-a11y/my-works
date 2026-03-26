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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value));
}

function memberName(memberId: string | null | undefined, membersById: Map<string, Member>): string {
  if (!memberId) return "-";
  return membersById.get(memberId)?.name ?? "-";
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
  if (!project.isActive || isPastDate(project.endDate)) return "종료";
  if (projectPages.some((page) => isAttentionStatus(page.trackStatus))) return "주의";
  if (projectPages.some((page) => page.monitoringInProgress)) return "모니터링";
  if (projectPages.some((page) => page.qaInProgress)) return "QA";
  return "활성";
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

  const visibleProjects = useMemo(() => {
    return projects.filter((project) => {
      const projectPages = getProjectPages(project.id, pages);
      const label = getProjectStateLabel(project, projectPages);
      if (selectedTab === "all") return true;
      if (selectedTab === "active" && label === "활성") return true;
      if (selectedTab === "monitoring" && label === "모니터링") return true;
      if (selectedTab === "qa" && label === "QA") return true;
      if (selectedTab === "attention" && label === "주의") return true;
      if (selectedTab === "closed" && label === "종료") return true;
      return false;
    });
  }, [pages, projects, selectedTab]);

  if (query.isLoading) return null;

  return (
    <section className={styles.shell}>
      <header className={styles.hero}>
        <h1 id="projects-heading" className={styles.title}>
          프로젝트 관리
        </h1>
        <div className={styles.tablist}>
          {projectTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.tabButton} ${selectedTab === tab.key ? styles.tabButtonActive : ""}`}
              onClick={() => setSelectedTab(tab.key)}
            >
              <span>{tab.label}</span>
              <strong>{projects.filter(p => getProjectStateLabel(p, getProjectPages(p.id, pages)) === tab.label || tab.key === "all").length}</strong>
            </button>
          ))}
        </div>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">PROJECT</th>
              <th scope="col" style={{ width: "80px" }}>PLAT</th>
              <th scope="col" style={{ width: "60px" }}>PGS</th>
              <th scope="col" style={{ width: "100px" }}>STATUS</th>
              <th scope="col">REPORTER / REVIEWER</th>
              <th scope="col" style={{ width: "200px" }}>PERIOD</th>
            </tr>
          </thead>
          <tbody>
            {visibleProjects.map((project) => {
              const projectPages = getProjectPages(project.id, pages);
              return (
                <tr key={project.id}>
                  <td>
                    <strong>{project.name}</strong>
                    <span className={styles.subText}>{project.reportUrl || "-"}</span>
                  </td>
                  <td>
                    <span className="uiPlatformBadge">{project.platform}</span>
                  </td>
                  <td className="tabularNums">{projectPages.length}</td>
                  <td>{getProjectStateLabel(project, projectPages)}</td>
                  <td>
                    {memberName(project.reporterMemberId, membersById)} / {memberName(project.reviewerMemberId, membersById)}
                  </td>
                  <td className="tabularNums">
                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ProjectsFeature;
