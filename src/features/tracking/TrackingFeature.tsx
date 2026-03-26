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

function sameDraft(left: TrackingDraft | undefined, right: TrackingDraft): boolean {
  if (!left) return false;
  return (
    left.id === right.id &&
    left.projectId === right.projectId &&
    left.ownerMemberId === right.ownerMemberId &&
    left.trackStatus === right.trackStatus &&
    left.monitoringInProgress === right.monitoringInProgress &&
    left.qaInProgress === right.qaInProgress &&
    left.note === right.note
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function memberName(memberId: string | null | undefined, membersById: Map<string, Member>): string {
  if (!memberId) return "-";
  return membersById.get(memberId)?.name ?? "-";
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
        ...page,
        ownerMemberId: draft.ownerMemberId || null,
        trackStatus: draft.trackStatus,
        monitoringInProgress: draft.monitoringInProgress,
        qaInProgress: draft.qaInProgress,
        note: draft.note,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tracking", member?.id] });
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

  const rows = useMemo<TrackingRow[]>(() => {
    return pages
      .map((page) => {
        const project = projectsById.get(page.projectId);
        return {
          page,
          projectName: project?.name ?? "미분류",
          platform: project?.platform ?? "-",
          ownerName: memberName(page.ownerMemberId, membersById),
        };
      })
      .sort((left, right) => new Date(right.page.updatedAt).getTime() - new Date(left.page.updatedAt).getTime());
  }, [membersById, pages, projectsById]);

  const filteredRows = useMemo(() => {
    if (stateFilter === "all") return rows;
    return rows.filter((row) => row.page.trackStatus === stateFilter);
  }, [rows, stateFilter]);

  useEffect(() => {
    setDrafts((current) => {
      const next: Record<string, TrackingDraft> = {};
      for (const row of rows) {
        next[row.page.id] = current[row.page.id] ?? toDraft(row.page);
      }
      return next;
    });
  }, [rows]);

  if (query.isLoading) return null;

  const updateDraft = (id: string, patch: Partial<TrackingDraft>) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  };

  const handleSaveRow = async (row: TrackingRow) => {
    const draft = drafts[row.page.id];
    if (!draft) return;
    await saveMutation.mutateAsync({ page: row.page, draft });
  };

  return (
    <section className={styles.shell}>
      <header className={styles.hero}>
          <h1 id="tracking-heading" className={styles.title}>트래킹</h1>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={`${styles.filterButton} ${stateFilter === "all" ? styles.filterButtonActive : ""}`}
            onClick={() => setStateFilter("all")}
          >
            <span>전체</span>
            <strong>{rows.length}</strong>
          </button>
          {pageStatusOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`${styles.filterButton} ${stateFilter === option ? styles.filterButtonActive : ""}`}
              onClick={() => setStateFilter(option)}
            >
              <span>{option}</span>
              <strong>{rows.filter(r => r.page.trackStatus === option).length}</strong>
            </button>
          ))}
        </div>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" style={{ width: "80px" }}>PLAT</th>
              <th scope="col">PROJECT / PAGE</th>
              <th scope="col" style={{ width: "120px" }}>ASSIGNEE</th>
              <th scope="col" style={{ width: "120px" }}>STATUS</th>
              <th scope="col" style={{ width: "100px" }}>MNTR</th>
              <th scope="col" style={{ width: "100px" }}>QA</th>
              <th scope="col">NOTE</th>
              <th scope="col" style={{ width: "140px" }}>UPDATED</th>
              <th scope="col" style={{ width: "80px" }}>SAVE</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const draft = drafts[row.page.id] || toDraft(row.page);
              return (
                <tr key={row.page.id}>
                  <td>
                    <span className="uiPlatformBadge">{row.platform}</span>
                  </td>
                  <td>
                    <div className={styles.projectCell}>
                      <strong>{row.projectName}</strong>
                      <span className={styles.subText}>{row.page.title}</span>
                      <span className={styles.subText}>{row.ownerName}</span>
                    </div>
                  </td>
                  <td>
                    <select
                      className={styles.cellSelect}
                      value={draft.ownerMemberId}
                      onChange={(e) => updateDraft(row.page.id, { ownerMemberId: e.target.value })}
                    >
                      <option value="">-</option>
                      {activeMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select
                      className={styles.cellSelect}
                      value={draft.trackStatus}
                      onChange={(e) => updateDraft(row.page.id, { trackStatus: e.target.value as PageStatus })}
                    >
                      {pageStatusOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td>
                    <input
                      className={styles.checkboxInput}
                      type="checkbox"
                      checked={draft.monitoringInProgress}
                      onChange={(e) => updateDraft(row.page.id, { monitoringInProgress: e.target.checked })}
                    />
                  </td>
                  <td>
                    <input
                      className={styles.checkboxInput}
                      type="checkbox"
                      checked={draft.qaInProgress}
                      onChange={(e) => updateDraft(row.page.id, { qaInProgress: e.target.checked })}
                    />
                  </td>
                  <td>
                    <textarea
                      className={styles.cellTextarea}
                      rows={1}
                      value={draft.note}
                      onChange={(e) => updateDraft(row.page.id, { note: e.target.value })}
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
                      SAVE
                    </button>
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

export default TrackingFeature;
