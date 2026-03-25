import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { opsDataClient } from "../../lib/data-client";
import { pageStatusOptions, type Member, type PageStatus, type Project, type ProjectPage } from "../../lib/domain";
import styles from "./ProjectsFeature.module.css";

interface ProjectDraft {
  id?: string;
  name: string;
  platform: string;
  serviceGroupId: string;
  reportUrl: string;
  reporterMemberId: string;
  reviewerMemberId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface ProjectPageDraft {
  id?: string;
  projectId: string;
  title: string;
  url: string;
  ownerMemberId: string;
  trackStatus: PageStatus;
  monitoringInProgress: boolean;
  qaInProgress: boolean;
  note: string;
}

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

function toProjectDraft(project: Project): ProjectDraft {
  return {
    id: project.id,
    name: project.name,
    platform: project.platform,
    serviceGroupId: project.serviceGroupId ?? "",
    reportUrl: project.reportUrl,
    reporterMemberId: project.reporterMemberId ?? "",
    reviewerMemberId: project.reviewerMemberId ?? "",
    startDate: project.startDate,
    endDate: project.endDate,
    isActive: project.isActive,
  };
}

function toProjectPageDraft(page: ProjectPage): ProjectPageDraft {
  return {
    id: page.id,
    projectId: page.projectId,
    title: page.title,
    url: page.url,
    ownerMemberId: page.ownerMemberId ?? "",
    trackStatus: page.trackStatus,
    monitoringInProgress: page.monitoringInProgress,
    qaInProgress: page.qaInProgress,
    note: page.note,
  };
}

function emptyProjectDraft(): ProjectDraft {
  const today = new Date().toISOString().slice(0, 10);
  return {
    name: "",
    platform: "",
    serviceGroupId: "",
    reportUrl: "",
    reporterMemberId: "",
    reviewerMemberId: "",
    startDate: today,
    endDate: today,
    isActive: true,
  };
}

function emptyPageDraft(projectId: string): ProjectPageDraft {
  return {
    projectId,
    title: "",
    url: "",
    ownerMemberId: "",
    trackStatus: "미개선",
    monitoringInProgress: false,
    qaInProgress: false,
    note: "",
  };
}

function memberName(memberId: string | null | undefined, membersById: Map<string, Member>): string {
  if (!memberId) {
    return "미지정";
  }

  return membersById.get(memberId)?.name ?? "미지정";
}

export function ProjectsFeature() {
  const { session } = useAuth();
  const member = session?.member;
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
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

  const saveProjectMutation = useMutation({
    mutationFn: async (draft: ProjectDraft) => {
      return opsDataClient.saveProject({
        id: draft.id,
        name: draft.name,
        platform: draft.platform,
        serviceGroupId: draft.serviceGroupId || null,
        reportUrl: draft.reportUrl,
        reporterMemberId: draft.reporterMemberId || null,
        reviewerMemberId: draft.reviewerMemberId || null,
        startDate: draft.startDate,
        endDate: draft.endDate,
        isActive: draft.isActive,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects", member?.id] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", member?.id] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats", member?.id] });
    },
  });

  const savePageMutation = useMutation({
    mutationFn: async (draft: ProjectPageDraft) => {
      return opsDataClient.saveProjectPage({
        id: draft.id,
        projectId: draft.projectId,
        title: draft.title,
        url: draft.url,
        ownerMemberId: draft.ownerMemberId || null,
        trackStatus: draft.trackStatus,
        monitoringInProgress: draft.monitoringInProgress,
        qaInProgress: draft.qaInProgress,
        note: draft.note,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects", member?.id] });
      await queryClient.invalidateQueries({ queryKey: ["tracking", member?.id] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", member?.id] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats", member?.id] });
    },
  });

  const data = projectsQuery.data;
  const projects = data?.projects ?? [];
  const pages = data?.pages ?? [];
  const members = data?.members ?? [];

  const activeMembers = useMemo(() => members.filter((item) => item.isActive), [members]);
  const membersById = useMemo(() => new Map(members.map((item) => [item.id, item])), [members]);

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [projectDraft, setProjectDraft] = useState<ProjectDraft | null>(null);
  const [pageDraft, setPageDraft] = useState<ProjectPageDraft | null>(null);
  const [statusMessage, setStatusMessage] = useState("프로젝트를 선택하면 페이지와 편집기가 표시됩니다.");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );
  const selectedProjectPages = useMemo(
    () => (selectedProject ? pages.filter((page) => page.projectId === selectedProject.id) : []),
    [pages, selectedProject],
  );
  const selectedPage = useMemo(
    () => selectedProjectPages.find((page) => page.id === selectedPageId) ?? null,
    [selectedPageId, selectedProjectPages],
  );

  useEffect(() => {
    if (!projects.length) {
      setSelectedProjectId("");
      setSelectedPageId("");
      setProjectDraft((current) => current && !current.id ? current : emptyProjectDraft());
      setPageDraft(null);
      return;
    }

    if (!selectedProjectId || !projects.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (!selectedProject) {
      setProjectDraft((current) => current && !current.id ? current : emptyProjectDraft());
      return;
    }

    if (!projectDraft || projectDraft.id !== selectedProject.id) {
      setProjectDraft(toProjectDraft(selectedProject));
    }
  }, [projectDraft, selectedProject]);

  useEffect(() => {
    if (!selectedProject) {
      setSelectedPageId("");
      setPageDraft(null);
      return;
    }

    if (!selectedProjectPages.length) {
      setSelectedPageId("");
      setPageDraft((current) =>
        current && !current.id && current.projectId === selectedProject.id
          ? current
          : emptyPageDraft(selectedProject.id),
      );
      return;
    }

    if (!selectedPageId || !selectedProjectPages.some((page) => page.id === selectedPageId)) {
      setSelectedPageId(selectedProjectPages[0].id);
      return;
    }

    if (selectedPage && (!pageDraft || pageDraft.id !== selectedPage.id)) {
      setPageDraft(toProjectPageDraft(selectedPage));
    }
  }, [pageDraft, selectedPage, selectedPageId, selectedProject, selectedProjectPages]);

  const summary = useMemo(() => {
    return {
      totalProjects: projects.length,
      totalPages: pages.length,
      activePages: pages.filter((page) => page.monitoringInProgress || page.qaInProgress).length,
      attentionPages: pages.filter((page) => page.trackStatus === "미개선" || page.trackStatus === "일부" || page.trackStatus === "중지").length,
    };
  }, [pages, projects.length]);

  if (projectsQuery.isLoading) {
    return <section className={styles.empty}>프로젝트 데이터를 불러오는 중입니다.</section>;
  }

  if (!projectDraft) {
    return <section className={styles.empty}>프로젝트 편집기를 준비하는 중입니다.</section>;
  }

  const handleProjectSelect = (projectId: string) => {
    const nextProject = projects.find((project) => project.id === projectId);
    if (!nextProject) {
      return;
    }

    setSelectedProjectId(projectId);
    setSelectedPageId("");
    setProjectDraft(toProjectDraft(nextProject));
    setStatusMessage(`"${nextProject.name}" 프로젝트를 선택했습니다.`);
  };

  const handlePageSelect = (pageId: string) => {
    const nextPage = selectedProjectPages.find((page) => page.id === pageId);
    if (!nextPage) {
      return;
    }

    setSelectedPageId(pageId);
    setPageDraft(toProjectPageDraft(nextPage));
    setStatusMessage(`"${nextPage.title}" 페이지를 불러왔습니다.`);
  };

  const handleNewProject = () => {
    setSelectedProjectId("");
    setSelectedPageId("");
    setProjectDraft(emptyProjectDraft());
    setPageDraft(null);
    setStatusMessage("새 프로젝트를 작성할 수 있습니다.");
  };

  const handleNewPage = () => {
    if (!selectedProject) {
      setStatusMessage("프로젝트를 먼저 저장해 주세요.");
      return;
    }

    setSelectedPageId("");
    setPageDraft(emptyPageDraft(selectedProject.id));
    setStatusMessage(`"${selectedProject.name}"에 새 페이지를 추가할 수 있습니다.`);
  };

  const handleProjectSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const saved = await saveProjectMutation.mutateAsync(projectDraft);
      setSelectedProjectId(saved.id);
      setProjectDraft(toProjectDraft(saved));
      setPageDraft((current) =>
        current && current.projectId === saved.id ? current : emptyPageDraft(saved.id),
      );
      setStatusMessage(`"${saved.name}" 프로젝트를 저장했습니다.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "프로젝트 저장에 실패했습니다.");
    }
  };

  const handlePageSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedProject || !pageDraft) {
      setStatusMessage("프로젝트를 먼저 저장해 주세요.");
      return;
    }

    try {
      const saved = await savePageMutation.mutateAsync(pageDraft);
      setSelectedPageId(saved.id);
      setPageDraft(toProjectPageDraft(saved));
      setStatusMessage(`"${saved.title}" 페이지를 저장했습니다.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "페이지 저장에 실패했습니다.");
    }
  };

  const detailProjectName = selectedProject?.name || projectDraft.name || "새 프로젝트";
  const detailProjectPlatform = selectedProject?.platform || projectDraft.platform || "-";
  const detailReportUrl = selectedProject?.reportUrl || projectDraft.reportUrl || "";

  return (
    <section className={styles.shell} aria-labelledby="projects-heading">
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>프로젝트 / 페이지</p>
          <h1 id="projects-heading" className={styles.title}>
            프로젝트와 페이지를 실제 데이터로 관리합니다.
          </h1>
          <p className={styles.lead}>
            현재 로그인 세션 기준으로 프로젝트와 페이지를 조회하고, 저장은 공유 클라이언트의 mutation으로 처리합니다.
          </p>
        </div>
        <aside className={styles.summaryGrid} aria-label="프로젝트 요약">
          <article className={styles.statCard}>
            <span className={styles.statLabel}>프로젝트</span>
            <strong className={styles.statValue}>{summary.totalProjects}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>페이지</span>
            <strong className={styles.statValue}>{summary.totalPages}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>활성</span>
            <strong className={styles.statValue}>{summary.activePages}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>주의 필요</span>
            <strong className={styles.statValue}>{summary.attentionPages}</strong>
          </article>
        </aside>
      </header>

      <div className={styles.grid}>
        <aside className={styles.projectRail} aria-label="프로젝트 목록">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>프로젝트 목록</h2>
            <button type="button" className={styles.textButton} onClick={handleNewProject}>
              새 프로젝트
            </button>
          </div>
          <ul className={styles.projectList}>
            {projects.map((project) => {
              const selected = project.id === selectedProject?.id;
              const pageCount = pages.filter((page) => page.projectId === project.id).length;
              return (
                <li key={project.id} className={styles.projectListItem}>
                  <button
                    type="button"
                    className={`${styles.projectItem} ${selected ? styles.projectItemActive : ""}`}
                    onClick={() => handleProjectSelect(project.id)}
                    aria-current={selected ? "true" : undefined}
                  >
                    <div className={styles.projectBadges}>
                      <span className="uiPlatformBadge">{project.platform}</span>
                    </div>
                    <strong className={styles.projectName}>{project.name}</strong>
                    <span className={styles.projectSummary}>
                      {project.reportUrl || "보고서 URL 없음"}
                    </span>
                    <span className={styles.projectMeta}>
                      {memberName(project.reporterMemberId, membersById)} · {pageCount}페이지
                    </span>
                  </button>
                </li>
              );
            })}
            {!projects.length ? (
              <li className={styles.projectListItem}>
                <p className={styles.projectSummary}>등록된 프로젝트가 없습니다. 새 프로젝트를 생성해 주세요.</p>
              </li>
            ) : null}
          </ul>
        </aside>

        <article className={styles.detailPane}>
          <header className={styles.detailHeader}>
            <div>
              <p className={styles.detailKicker}>선택된 프로젝트</p>
              <h2 className={styles.detailTitle}>{detailProjectName}</h2>
              <p className={styles.detailSummary}>
                {detailProjectPlatform} · {detailReportUrl || "보고서 URL 없음"}
              </p>
            </div>
            <dl className={styles.metaGrid}>
              <div>
                <dt>리포터</dt>
                <dd>{memberName(selectedProject?.reporterMemberId ?? projectDraft.reporterMemberId, membersById)}</dd>
              </div>
              <div>
                <dt>검토자</dt>
                <dd>{memberName(selectedProject?.reviewerMemberId ?? projectDraft.reviewerMemberId, membersById)}</dd>
              </div>
              <div>
                <dt>시작일</dt>
                <dd>{projectDraft.startDate ? formatDate(projectDraft.startDate) : "-"}</dd>
              </div>
              <div>
                <dt>종료일</dt>
                <dd>{projectDraft.endDate ? formatDate(projectDraft.endDate) : "-"}</dd>
              </div>
            </dl>
          </header>

          <section className={styles.formSection} aria-labelledby="project-editor-heading">
            <div className={styles.sectionHeader}>
              <h3 id="project-editor-heading" className={styles.sectionTitle}>
                프로젝트 편집
              </h3>
              <span className={styles.sectionMeta}>{statusMessage}</span>
            </div>
            <form className={styles.form} onSubmit={handleProjectSave}>
              <div className={styles.field}>
                <label htmlFor="project-name">프로젝트명</label>
                <input
                  id="project-name"
                  value={projectDraft.name}
                  onChange={(event) => setProjectDraft((current) => current ? { ...current, name: event.target.value } : current)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="project-platform">플랫폼</label>
                <input
                  id="project-platform"
                  value={projectDraft.platform}
                  onChange={(event) => setProjectDraft((current) => current ? { ...current, platform: event.target.value } : current)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="project-reporter">리포터</label>
                <select
                  id="project-reporter"
                  value={projectDraft.reporterMemberId}
                  onChange={(event) => setProjectDraft((current) => current ? { ...current, reporterMemberId: event.target.value } : current)}
                >
                  <option value="">미지정</option>
                  {activeMembers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="project-reviewer">검토자</label>
                <select
                  id="project-reviewer"
                  value={projectDraft.reviewerMemberId}
                  onChange={(event) => setProjectDraft((current) => current ? { ...current, reviewerMemberId: event.target.value } : current)}
                >
                  <option value="">미지정</option>
                  {activeMembers.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="project-start">시작일</label>
                <input
                  id="project-start"
                  type="date"
                  value={projectDraft.startDate}
                  onChange={(event) => setProjectDraft((current) => current ? { ...current, startDate: event.target.value } : current)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="project-end">종료일</label>
                <input
                  id="project-end"
                  type="date"
                  value={projectDraft.endDate}
                  onChange={(event) => setProjectDraft((current) => current ? { ...current, endDate: event.target.value } : current)}
                  required
                />
              </div>
              <div className={styles.fieldWide}>
                <label htmlFor="project-report-url">보고서 URL</label>
                <input
                  id="project-report-url"
                  value={projectDraft.reportUrl}
                  onChange={(event) => setProjectDraft((current) => current ? { ...current, reportUrl: event.target.value } : current)}
                  placeholder="보고서 링크"
                />
              </div>
              <div className={styles.actions}>
                <button type="submit" className={styles.primaryButton} disabled={saveProjectMutation.isPending}>
                  {saveProjectMutation.isPending ? "저장 중..." : "프로젝트 저장"}
                </button>
              </div>
            </form>
          </section>

          <section className={styles.tableSection} aria-labelledby="project-pages-heading">
            <div className={styles.sectionHeader}>
              <h3 id="project-pages-heading" className={styles.sectionTitle}>
                페이지 현황
              </h3>
              <button
                type="button"
                className={styles.textButton}
                onClick={handleNewPage}
                disabled={!selectedProject}
              >
                새 페이지
              </button>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <caption className={styles.srOnly}>프로젝트 페이지 목록</caption>
                <thead>
                  <tr>
                    <th scope="col">페이지</th>
                    <th scope="col">담당자</th>
                    <th scope="col">상태</th>
                    <th scope="col">트래킹</th>
                    <th scope="col">수정 시각</th>
                    <th scope="col">선택</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProjectPages.map((page) => {
                    const selected = page.id === selectedPage?.id;
                    return (
                      <tr key={page.id} className={selected ? styles.tableRowActive : undefined}>
                        <td>
                          <strong>{page.title}</strong>
                          <p className={styles.cellNote}>{page.url || "URL 없음"}</p>
                        </td>
                        <td>{memberName(page.ownerMemberId, membersById)}</td>
                        <td>
                          <span className="uiStatusBadge" data-status={page.trackStatus}>
                            {page.trackStatus}
                          </span>
                        </td>
                        <td>
                          <div className={styles.projectBadges}>
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
                            {!page.monitoringInProgress && !page.qaInProgress ? "-" : null}
                          </div>
                        </td>
                        <td className="tabularNums">{formatDateTime(page.updatedAt)}</td>
                        <td>
                          <button
                            type="button"
                            className={styles.textButton}
                            onClick={() => handlePageSelect(page.id)}
                            aria-pressed={selected}
                          >
                            {selected ? "선택됨" : "선택"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!selectedProjectPages.length ? (
                    <tr>
                      <td colSpan={6}>
                        <p className={styles.cellNote}>
                          {selectedProject ? "이 프로젝트에 연결된 페이지가 없습니다." : "프로젝트를 먼저 저장해 주세요."}
                        </p>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.formSection} aria-labelledby="page-editor-heading">
            <div className={styles.sectionHeader}>
              <h3 id="page-editor-heading" className={styles.sectionTitle}>
                페이지 편집
              </h3>
              <span className={styles.sectionMeta}>
                {selectedPage ? "선택된 페이지를 수정합니다." : selectedProject ? "새 페이지를 작성합니다." : "프로젝트를 먼저 저장해 주세요."}
              </span>
            </div>
            {selectedProject && pageDraft ? (
              <form className={styles.form} onSubmit={handlePageSave}>
                <div className={styles.field}>
                  <label htmlFor="page-title">페이지명</label>
                  <input
                    id="page-title"
                    value={pageDraft.title}
                    onChange={(event) => setPageDraft((current) => current ? { ...current, title: event.target.value } : current)}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="page-owner">담당자</label>
                  <select
                    id="page-owner"
                    value={pageDraft.ownerMemberId}
                    onChange={(event) => setPageDraft((current) => current ? { ...current, ownerMemberId: event.target.value } : current)}
                  >
                    <option value="">미지정</option>
                    {activeMembers.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="page-status">상태</label>
                  <select
                    id="page-status"
                    value={pageDraft.trackStatus}
                    onChange={(event) => setPageDraft((current) => current ? { ...current, trackStatus: event.target.value as PageStatus } : current)}
                  >
                    {pageStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="page-url">URL</label>
                  <input
                    id="page-url"
                    value={pageDraft.url}
                    onChange={(event) => setPageDraft((current) => current ? { ...current, url: event.target.value } : current)}
                    placeholder="페이지 링크"
                  />
                </div>
                <div className={styles.fieldWide}>
                  <label htmlFor="page-note">메모</label>
                  <textarea
                    id="page-note"
                    rows={4}
                    value={pageDraft.note}
                    onChange={(event) => setPageDraft((current) => current ? { ...current, note: event.target.value } : current)}
                    placeholder="페이지 배정 관련 메모"
                  />
                </div>
                <div className={styles.fieldWide}>
                  <span className={styles.sectionMeta}>진행 플래그</span>
                  <div className={styles.toggleRow}>
                    <label className={styles.toggleChip}>
                      <input
                        className={styles.toggleInput}
                        type="checkbox"
                        checked={pageDraft.monitoringInProgress}
                        onChange={(event) => setPageDraft((current) => current ? { ...current, monitoringInProgress: event.target.checked } : current)}
                      />
                      <span className="uiFlagTag" data-flag="monitoring">모니터링 진행중</span>
                    </label>
                    <label className={styles.toggleChip}>
                      <input
                        className={styles.toggleInput}
                        type="checkbox"
                        checked={pageDraft.qaInProgress}
                        onChange={(event) => setPageDraft((current) => current ? { ...current, qaInProgress: event.target.checked } : current)}
                      />
                      <span className="uiFlagTag" data-flag="qa">QA 진행중</span>
                    </label>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button type="submit" className={styles.primaryButton} disabled={savePageMutation.isPending}>
                    {savePageMutation.isPending ? "저장 중..." : "페이지 저장"}
                  </button>
                </div>
              </form>
            ) : (
              <p className={styles.cellNote}>프로젝트를 먼저 저장한 뒤 페이지를 추가할 수 있습니다.</p>
            )}
          </section>
        </article>
      </div>
    </section>
  );
}

export default ProjectsFeature;
