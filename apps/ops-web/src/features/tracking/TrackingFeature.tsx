import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { opsDataClient } from "../../lib/data-client";
import { pageStatusOptions, type Member, type PageStatus, type ProjectPage } from "../../lib/domain";
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

interface TrackingRow {
  page: ProjectPage;
  projectName: string;
  platform: string;
  ownerName: string;
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
    mutationFn: async ({ page, draft }: { page: ProjectPage; draft: TrackingDraft }) => {
      return opsDataClient.saveProjectPage({
        id: page.id,
        projectId: page.projectId,
        title: page.title,
        url: page.url,
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
  const [drafts, setDrafts] = useState<Record<string, TrackingDraft>>({});
  const [statusMessage, setStatusMessage] = useState("상단 상태 버튼으로 범위를 좁히고, 표에서 바로 수정합니다.");

  const rows = useMemo<TrackingRow[]>(() => {
    return pages
      .map((page) => {
        const project = projectsById.get(page.projectId);

        return {
          page,
          projectName: project?.name ?? "미분류 프로젝트",
          platform: project?.platform ?? "-",
          ownerName: memberName(page.ownerMemberId, membersById),
        };
      })
      .sort((left, right) => new Date(right.page.updatedAt).getTime() - new Date(left.page.updatedAt).getTime());
  }, [membersById, pages, projectsById]);

  const filteredRows = useMemo(() => {
    if (stateFilter === "all") {
      return rows;
    }

    return rows.filter((row) => row.page.trackStatus === stateFilter);
  }, [rows, stateFilter]);

  useEffect(() => {
    setDrafts((current) => {
      const next: Record<string, TrackingDraft> = {};

      for (const row of rows) {
        next[row.page.id] = {
          ...toDraft(row.page),
          ...(current[row.page.id] ?? {}),
          id: row.page.id,
          projectId: row.page.projectId,
        };
      }

      return next;
    });
  }, [rows]);

  if (query.isLoading) {
    return <section className={styles.empty}>트래킹 데이터를 불러오는 중입니다.</section>;
  }

  const updateDraft = (page: ProjectPage, patch: Partial<TrackingDraft>) => {
    setDrafts((current) => ({
      ...current,
      [page.id]: {
        ...(current[page.id] ?? toDraft(page)),
        ...patch,
        id: page.id,
        projectId: page.projectId,
      },
    }));
  };

  const handleSaveRow = async (row: TrackingRow) => {
    const draft = drafts[row.page.id] ?? toDraft(row.page);

    try {
      await saveMutation.mutateAsync({ page: row.page, draft });
      setStatusMessage(`"${row.page.title}" 행을 저장했습니다.`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "행 저장에 실패했습니다.");
    }
  };

  const changeFilter = (value: "all" | PageStatus) => {
    setStateFilter(value);
    setStatusMessage(value === "all" ? "전체 항목을 표시합니다." : `${value} 상태만 표시합니다.`);
  };

  return (
    <section className={styles.shell} aria-labelledby="tracking-heading">
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>트래킹</p>
          <h1 id="tracking-heading" className={styles.title}>
            상단 상태 버튼과 행 단위 편집으로 트래킹을 관리합니다.
          </h1>
          <p className={styles.lead}>
            선택 패널과 요약 카드를 없애고 원본 컬럼에 가까운 표 중심 흐름만 남겼습니다.
          </p>
        </div>
        <div className={styles.toolbar} role="group" aria-label="상태 필터">
          <button
            type="button"
            className={`${styles.filterButton} ${stateFilter === "all" ? styles.filterButtonActive : ""}`}
            onClick={() => changeFilter("all")}
            aria-pressed={stateFilter === "all"}
          >
            <span>전체</span>
            <strong>{rows.length}</strong>
          </button>
          {pageStatusOptions.map((option) => {
            const active = stateFilter === option;
            const count = rows.filter((row) => row.page.trackStatus === option).length;

            return (
              <button
                key={option}
                type="button"
                className={`${styles.filterButton} ${active ? styles.filterButtonActive : ""}`}
                onClick={() => changeFilter(option)}
                aria-pressed={active}
              >
                <span>{option}</span>
                <strong>{count}</strong>
              </button>
            );
          })}
        </div>
      </header>

      <section className={styles.panel} aria-labelledby="tracking-table-heading">
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="tracking-table-heading" className={styles.sectionTitle}>
              트래킹 표
            </h2>
            <span className={styles.sectionMeta}>{statusMessage}</span>
          </div>
          <span className={styles.sectionMeta}>
            표시 {filteredRows.length} / 전체 {rows.length}
          </span>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>트래킹 수정 표</caption>
            <thead>
              <tr>
                <th scope="col">플랫폼</th>
                <th scope="col">프로젝트 / 페이지</th>
                <th scope="col">담당자</th>
                <th scope="col">상태</th>
                <th scope="col">모니터링</th>
                <th scope="col">QA</th>
                <th scope="col">메모</th>
                <th scope="col">수정 시각</th>
                <th scope="col">저장</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const draft = drafts[row.page.id] ?? toDraft(row.page);

                return (
                  <tr key={row.page.id}>
                    <td>
                      <span className="uiPlatformBadge">{row.platform}</span>
                    </td>
                    <td>
                      <div className={styles.projectCell}>
                        <strong>{row.projectName}</strong>
                        <span>{row.page.title}</span>
                        <span className={styles.subText}>{row.page.url || "URL 없음"}</span>
                        <span className={styles.subText}>현재 담당: {row.ownerName}</span>
                      </div>
                    </td>
                    <td>
                      <select
                        className={styles.cellSelect}
                        value={draft.ownerMemberId}
                        onChange={(event) => updateDraft(row.page, { ownerMemberId: event.target.value })}
                      >
                        <option value="">미지정</option>
                        {activeMembers.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        className={styles.cellSelect}
                        value={draft.trackStatus}
                        onChange={(event) => updateDraft(row.page, { trackStatus: event.target.value as PageStatus })}
                      >
                        {pageStatusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <label className={styles.checkboxLabel}>
                        <input
                          className={styles.checkboxInput}
                          type="checkbox"
                          checked={draft.monitoringInProgress}
                          onChange={(event) =>
                            updateDraft(row.page, { monitoringInProgress: event.target.checked })
                          }
                        />
                        <span className="uiFlagTag" data-flag="monitoring">
                          모니터링
                        </span>
                      </label>
                    </td>
                    <td>
                      <label className={styles.checkboxLabel}>
                        <input
                          className={styles.checkboxInput}
                          type="checkbox"
                          checked={draft.qaInProgress}
                          onChange={(event) => updateDraft(row.page, { qaInProgress: event.target.checked })}
                        />
                        <span className="uiFlagTag" data-flag="qa">
                          QA
                        </span>
                      </label>
                    </td>
                    <td>
                      <textarea
                        className={styles.cellTextarea}
                        rows={2}
                        value={draft.note}
                        onChange={(event) => updateDraft(row.page, { note: event.target.value })}
                      />
                    </td>
                    <td className="tabularNums">{formatDateTime(row.page.updatedAt)}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.saveButton}
                        disabled={saveMutation.isPending}
                        onClick={() => void handleSaveRow(row)}
                      >
                        {saveMutation.isPending ? "저장 중..." : "저장"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!filteredRows.length ? (
                <tr>
                  <td colSpan={9} className={styles.empty}>
                    선택한 상태의 트래킹 항목이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export default TrackingFeature;
