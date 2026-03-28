import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDataClient } from "../admin-client";
import type { AdminServiceGroupItem, AdminServiceGroupPayload } from "../admin-types";
import styles from "./AdminServiceGroupsPage.module.css";

type DraftState = AdminServiceGroupPayload;

function createDraft(item?: AdminServiceGroupItem): DraftState {
  if (!item) {
    return {
      name: "",
      svcGroup: "",
      svcName: "",
      svcType: 3,
      svcActive: true,
      displayOrder: 0,
      isActive: true,
    };
  }

  return {
    id: item.id,
    name: item.name,
    legacySvcNum: item.legacySvcNum,
    svcGroup: item.svcGroup,
    svcName: item.svcName,
    svcType: item.svcType,
    svcActive: item.svcActive,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
  };
}

function typeLabel(value: number) {
  if (value === 1) return "카카오";
  if (value === 2) return "공동체";
  return "외부";
}

function groupServiceGroups(items: readonly AdminServiceGroupItem[]) {
  const grouped = new Map<string, AdminServiceGroupItem[]>();

  for (const item of items) {
    const key = item.svcGroup || "-";
    const rows = grouped.get(key) ?? [];
    rows.push(item);
    grouped.set(key, rows);
  }

  return Array.from(grouped.entries()).map(([svcGroup, rows]) => ({
    svcGroup,
    rows,
  }));
}

export function AdminServiceGroupsPage() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);

  const serviceGroupsQuery = useQuery({
    queryKey: ["admin", "service-groups"],
    queryFn: () => adminDataClient.listServiceGroups(),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: AdminServiceGroupPayload) => adminDataClient.saveServiceGroupAdmin(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "service-groups"] });
      setAdding(false);
      setEditingId(null);
      setDraft(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (serviceGroupId: string) => adminDataClient.deleteServiceGroupAdmin(serviceGroupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "service-groups"] });
      setAdding(false);
      setEditingId(null);
      setDraft(null);
    },
  });

  const serviceGroups = useMemo(
    () =>
      [...(serviceGroupsQuery.data ?? [])].sort(
        (left, right) => (left.legacySvcNum ?? left.displayOrder) - (right.legacySvcNum ?? right.displayOrder) || left.name.localeCompare(right.name),
      ),
    [serviceGroupsQuery.data],
  );
  const groupedServiceGroups = useMemo(() => groupServiceGroups(serviceGroups), [serviceGroups]);

  useEffect(() => {
    document.title = "서비스그룹 - 관리 | My Works";
  }, []);

  const handleDraftChange = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const startAdd = () => {
    setAdding(true);
    setEditingId(null);
    setDraft(createDraft());
  };

  const startEdit = (item: AdminServiceGroupItem) => {
    setAdding(false);
    setEditingId(item.id);
    setDraft(createDraft(item));
  };

  const cancelDraft = () => {
    setAdding(false);
    setEditingId(null);
    setDraft(null);
  };

  const saveDraft = async () => {
    if (!draft || saveMutation.isPending) {
      return;
    }

    await saveMutation.mutateAsync(draft);
  };

  const handleDelete = async (item: AdminServiceGroupItem) => {
    if (!window.confirm("정말 삭제 하시겠습니까? 복구할 수 없습니다.")) {
      return;
    }

    await deleteMutation.mutateAsync(item.id);
  };

  const errorMessage =
    (serviceGroupsQuery.error instanceof Error && serviceGroupsQuery.error.message) ||
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    "";

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <h1>서비스그룹 - 관리</h1>
      </header>

      {errorMessage ? <p className={styles.helperText}>{errorMessage}</p> : null}

      <div className={styles.toolbar}>
        <div>
          <h2>서비스그룹 내역</h2>
        </div>
        {!adding ? (
          <button type="button" className={styles.addButton} onClick={startAdd}>
            서비스그룹 추가
          </button>
        ) : null}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>서비스그룹 내역</caption>
          <thead>
            <tr>
              <th>서비스그룹</th>
              <th>서비스명</th>
              <th>분류</th>
              <th>활성여부</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {adding && draft ? (
              <tr className={styles.editRow}>
                <td>
                  <input
                    aria-label="서비스그룹"
                    className={styles.input}
                    type="text"
                    autoFocus
                    value={draft.svcGroup}
                    onChange={(event) => handleDraftChange("svcGroup", event.target.value)}
                  />
                </td>
                <td>
                  <input
                    aria-label="서비스명"
                    className={styles.input}
                    type="text"
                    value={draft.svcName}
                    onChange={(event) => handleDraftChange("svcName", event.target.value)}
                  />
                </td>
                <td>
                  <select
                    aria-label="서비스 분류"
                    className={styles.select}
                    value={String(draft.svcType)}
                    onChange={(event) => handleDraftChange("svcType", Number(event.target.value))}
                  >
                    <option value="1">카카오</option>
                    <option value="2">공동체</option>
                    <option value="3">외부</option>
                  </select>
                </td>
                <td>
                  <label className={styles.radioLabel}>
                    <input checked disabled readOnly type="radio" />
                    활성
                  </label>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button type="button" className={styles.primaryAction} onClick={() => void saveDraft()} disabled={saveMutation.isPending}>
                      저장
                    </button>
                    <button type="button" className={styles.secondaryAction} onClick={cancelDraft}>
                      취소
                    </button>
                  </div>
                </td>
              </tr>
            ) : null}

            {groupedServiceGroups.map((group) =>
              group.rows.map((item, rowIndex) => {
                const isEditing = editingId === item.id && draft;

                return isEditing && draft ? (
                  <tr key={item.id} className={styles.editRow}>
                    {rowIndex === 0 ? (
                      <td rowSpan={group.rows.length} scope="row">
                        {group.svcGroup}
                      </td>
                    ) : null}
                    <td>
                      <select
                        aria-label="서비스그룹 수정"
                        className={styles.select}
                        autoFocus
                        value={draft.svcGroup}
                        onChange={(event) => handleDraftChange("svcGroup", event.target.value)}
                      >
                        {groupedServiceGroups.map((option) => (
                          <option key={option.svcGroup} value={option.svcGroup}>
                            {option.svcGroup}
                          </option>
                        ))}
                      </select>
                      <input
                        aria-label="서비스명 수정"
                        className={styles.input}
                        type="text"
                        value={draft.svcName}
                        onChange={(event) => handleDraftChange("svcName", event.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        aria-label="서비스 분류"
                        className={styles.select}
                        value={String(draft.svcType)}
                        onChange={(event) => handleDraftChange("svcType", Number(event.target.value))}
                      >
                        <option value="1">카카오</option>
                        <option value="2">공동체</option>
                        <option value="3">외부</option>
                      </select>
                    </td>
                    <td>
                      <select
                        aria-label="서비스 분류"
                        className={styles.select}
                        value={draft.svcActive ? "1" : "0"}
                        onChange={(event) => {
                          const nextActive = event.target.value === "1";
                          handleDraftChange("svcActive", nextActive);
                          handleDraftChange("isActive", nextActive);
                        }}
                      >
                        <option value="1">활성</option>
                        <option value="0">비활성</option>
                      </select>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button type="button" className={styles.primaryAction} onClick={() => void saveDraft()} disabled={saveMutation.isPending}>
                          변경
                        </button>
                        <button type="button" className={styles.secondaryAction} onClick={cancelDraft}>
                          취소
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id} className={item.svcActive ? "" : styles.inactiveRow}>
                    {rowIndex === 0 ? (
                      <td rowSpan={group.rows.length} scope="row">
                        {group.svcGroup}
                      </td>
                    ) : null}
                    <td>{item.svcName || "-"}</td>
                    <td>{typeLabel(item.svcType)}</td>
                    <td>{item.svcActive ? "활성" : "비활성"}</td>
                    <td>
                      <div className={styles.actions}>
                        <button type="button" className={styles.secondaryAction} onClick={() => startEdit(item)}>
                          수정
                        </button>
                        <button type="button" className={styles.secondaryAction} onClick={() => void handleDelete(item)} disabled={deleteMutation.isPending}>
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
