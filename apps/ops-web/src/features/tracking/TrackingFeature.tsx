import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { opsDataClient } from "../../lib/data-client";
import { pageStatusOptions, type Member, type PageStatus, type Project, type ProjectPage } from "../../lib/domain";
import styles from "./TrackingFeature.module.css";

interface TrackingDraft {
  id: string;
  projectId: string;
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

function memberName(memberId: string | null | undefined, membersById: Map<string, Member>): string {
  if (!memberId) {
    return "미지정";
  }

  return membersById.get(memberId)?.name ?? "미지정";
}

function toDraft(page: ProjectPage): TrackingDraft {
  return {
    id: page.id,
    projectId: page.projectId,
    ownerMemberId: page.ownerMemberId ?? "",
    trackStatus: page.trackStatus,
    monitoringInProgress: page.monitoringInProgress,
    qaInProgress: page.qaInProgress,
    note: page.note,
  };
}

export function TrackingFeature() {
  const { session } = useAuth();
  const member = session?.member;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tracking", member?.id],
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

  const saveMutation = useMutation({
    mutationFn: async (draft: TrackingDraft) => {
      const selected = pages.find((page) => page.id === draft.id);
      if (!selected) {
        throw new Error("페이지를 다시 선택해 주세요.");
      }

      return opsDataClient.saveProjectPage({
        id: selected.id,
        projectId: selected.projectId,
        title: selected.title,
        url: selected.url,
        ownerMemberId: draft.ownerMemberId || null,
        trackStatus: draft.trackStatus,
        monitoringInProgress: draft.monitoringInProgress,
        qaInProgress: draft.qaInProgress,
        note: draft.note,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tracking", member?.id] });
      await queryClient.invalidateQueries({ queryKey: ["projects", member?.id] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", member?.id] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats", member?.id] });
    },
  });

  const data = query.data;
  const projects = data?.projects ?? [];
  const pages = data?.pages ?? [];
  const members = data?.members ?? [];
  const activeMembers = useMemo(() => members.filter((item) => item.isActive), [members]);
  const membersById = useMemo(() => new Map(members.map((item) => [item.id, item])), [members]);
  const projectsById = useMemo(() => new Map(projects.map((item) => [item.id, item])), [projects]);

  const [stateFilter, setStateFilter] = useState<"all" | PageStatus>("all");
  const [selectedPageId, setSelectedPageId] = useState("");
  const [draft, setDraft] = useState<TrackingDraft | null>(null);
  const [statusMessage, setStatusMessage] = useState("페이지를 선택하면 트래킹 상태를 수정할 수 있습니다.");

  const filteredPages = useMemo(() => {
    if (stateFilter === "all") {
      return pages;
    }

    return pages.filter((page) => page.trackStatus === stateFilter);
  }, [pages, stateFilter]);

  useEffect(() => {
    if (!filteredPages.length) {
      setSelectedPageId("");
      setDraft(null);
      return;
    }

    if (!selectedPageId || !filteredPages.some((page) => page.id === selectedPageId)) {
      setSelectedPageId(filteredPages[0].id);
    }
  }, [filteredPages, selectedPageId]);

  const selectedPage = filteredPages.find((page) => page.id === selectedPageId) ?? filteredPages[0] ?? null;

  useEffect(() => {
    if (!selectedPage) {
      setDraft(null);
      return;
    }

    if (!draft || draft.id !== selectedPage.id) {
      setDraft(toDraft(selectedPage));
    }
  }, [draft, selectedPage]);

  const summary = useMemo(() => {
    return {
      total: pages.length,
      improved: pages.filter((page) => page.trackStatus === "개선").length,
      attention: pages.filter((page) => page.trackStatus === "미개선" || page.trackStatus === "일부" || page.trackStatus === "중지").length,
    };
  }, [pages]);

  if (query.isLoading) {
    return <section className={styles.empty}>트래킹 데이터를 불러오는 중입니다.</section>;
  }

  if (!selectedPage || !draft) {
    return <section className={styles.empty}>트래킹 데이터가 없습니다.</section>;
  }

  const handleSelect = (pageId: string) => {
    const nextPage = filteredPages.find((page) => page.id === pageId);
    if (!nextPage) {
      return;
    }

    setSelectedPageId(pageId);
    setDraft(toDraft(nextPage));
    setStatusMessage(`"${nextPage.title}" 항목을 불러왔습니다.`);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await saveMutation.mutateAsync(draft);
      setStatusMessage(`"${selectedPage.title}" 트래킹 상태를 저장했습니다.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "트래킹 저장에 실패했습니다.");
    }
  };

  const selectedProject = projectsById.get(selectedPage.projectId) ?? null;

  return (
    <section className={styles.shell} aria-labelledby="tracking-heading">
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>트래킹</p>
          <h1 id="tracking-heading" className={styles.title}>
            페이지별 트래킹 상태를 실제 데이터로 관리합니다.
          </h1>
          <p className={styles.lead}>
            현재 로그인 세션 기준으로 볼 수 있는 페이지를 조회하고, 상태와 메모만 수정합니다.
          </p>
        </div>
        <aside className={styles.summaryGrid} aria-label="트래킹 요약">
          <article className={styles.statCard}>
            <span className={styles.statLabel}>전체</span>
            <strong className={styles.statValue}>{summary.total}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>개선</span>
            <strong className={styles.statValue}>{summary.improved}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>주의 필요</span>
            <strong className={styles.statValue}>{summary.attention}</strong>
          </article>
        </aside>
      </header>

      <div className={styles.grid}>
        <aside className={styles.listPane} aria-label="트래킹 목록">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>상태 목록</h2>
            <div className={styles.inlineFilter}>
              <label htmlFor="tracking-filter">상태 필터</label>
              <select
                id="tracking-filter"
                value={stateFilter}
                onChange={(event) => {
                  const value = event.target.value;
                  setStateFilter(value === "all" ? "all" : (value as PageStatus));
                }}
              >
                <option value="all">전체</option>
                {pageStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ul className={styles.list}>
            {filteredPages.map((page) => {
              const selected = page.id === selectedPage.id;
              const project = projectsById.get(page.projectId);
              return (
                <li key={page.id} className={styles.listItemRow}>
                  <button
                    type="button"
                    className={`${styles.listItem} ${selected ? styles.listItemActive : ""}`}
                    onClick={() => handleSelect(page.id)}
                    aria-current={selected ? "true" : undefined}
                  >
                    <div className={styles.recordBadges}>
                      <span className="uiPlatformBadge">{project?.platform ?? "-"}</span>
                    </div>
                    <strong className={styles.recordTitle}>{page.title}</strong>
                    <span className={styles.recordSummary}>{project?.name ?? "미분류 프로젝트"}</span>
                    <div className={styles.recordMeta}>
                      <span>{memberName(page.ownerMemberId, membersById)}</span>
                      <span className="uiStatusBadge" data-status={page.trackStatus}>{page.trackStatus}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <article className={styles.detailPane}>
          <header className={styles.detailHeader}>
            <div>
              <p className={styles.detailKicker}>선택된 트래킹 항목</p>
              <h2 className={styles.detailTitle}>{selectedPage.title}</h2>
              <p className={styles.detailSummary}>{selectedProject?.name ?? "미분류 프로젝트"}</p>
            </div>
            <dl className={styles.metaGrid}>
              <div>
                <dt>플랫폼</dt>
                <dd>{selectedProject?.platform ?? "-"}</dd>
              </div>
              <div>
                <dt>현재 상태</dt>
                <dd>
                  <span className="uiStatusBadge" data-status={selectedPage.trackStatus}>
                    {selectedPage.trackStatus}
                  </span>
                </dd>
              </div>
              <div>
                <dt>수정 시각</dt>
                <dd>{formatDateTime(selectedPage.updatedAt)}</dd>
              </div>
              <div>
                <dt>메모</dt>
                <dd>{selectedPage.note || "-"}</dd>
              </div>
            </dl>
          </header>

          <section className={styles.formSection} aria-labelledby="tracking-editor-heading">
            <div className={styles.sectionHeader}>
              <h3 id="tracking-editor-heading" className={styles.sectionTitle}>
                트래킹 편집기
              </h3>
              <span className={styles.sectionMeta}>{statusMessage}</span>
            </div>
            <form className={styles.form} onSubmit={handleSave}>
              <div className={styles.field}>
                <label htmlFor="project">프로젝트</label>
                <input id="project" value={selectedProject?.name ?? "미분류 프로젝트"} readOnly />
              </div>
              <div className={styles.field}>
                <label htmlFor="owner">담당자</label>
                <select
                  id="owner"
                  value={draft.ownerMemberId}
                  onChange={(event) => setDraft((current) => current ? { ...current, ownerMemberId: event.target.value } : current)}
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
                <label htmlFor="status">상태</label>
                <select
                  id="status"
                  value={draft.trackStatus}
                  onChange={(event) => setDraft((current) => current ? { ...current, trackStatus: event.target.value as PageStatus } : current)}
                >
                  {pageStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="page-title">페이지명</label>
                <input id="page-title" value={selectedPage.title} readOnly />
              </div>
              <div className={styles.fieldWide}>
                <label htmlFor="note">메모</label>
                <textarea
                  id="note"
                  rows={4}
                  value={draft.note}
                  onChange={(event) => setDraft((current) => current ? { ...current, note: event.target.value } : current)}
                />
              </div>
              <div className={styles.fieldWide}>
                <span className={styles.sectionMeta}>진행 플래그</span>
                <div className={styles.toggleRow}>
                  <label className={styles.toggleChip}>
                    <input
                      className={styles.toggleInput}
                      type="checkbox"
                      checked={draft.monitoringInProgress}
                      onChange={(event) => setDraft((current) => current ? { ...current, monitoringInProgress: event.target.checked } : current)}
                    />
                    <span className="uiFlagTag" data-flag="monitoring">모니터링 진행중</span>
                  </label>
                  <label className={styles.toggleChip}>
                    <input
                      className={styles.toggleInput}
                      type="checkbox"
                      checked={draft.qaInProgress}
                      onChange={(event) => setDraft((current) => current ? { ...current, qaInProgress: event.target.checked } : current)}
                    />
                    <span className="uiFlagTag" data-flag="qa">QA 진행중</span>
                  </label>
                </div>
              </div>
              <div className={styles.actions}>
                <button type="submit" className={styles.primaryButton} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "저장 중..." : "저장"}
                </button>
              </div>
            </form>
          </section>
        </article>
      </div>
    </section>
  );
}

export default TrackingFeature;
