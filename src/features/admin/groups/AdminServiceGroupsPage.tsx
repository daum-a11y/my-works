import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDataClient } from "../admin-client";

import styles from "../AdminPage.module.css";
import type { AdminServiceGroupItem, AdminServiceGroupPayload } from "../admin-types";

function createDraft(serviceGroup?: AdminServiceGroupItem): AdminServiceGroupPayload {
  if (!serviceGroup) {
    return {
      name: "",
      displayOrder: 0,
      isActive: true,
    };
  }

  return {
    id: serviceGroup.id,
    name: serviceGroup.name,
    displayOrder: serviceGroup.displayOrder,
    isActive: serviceGroup.isActive,
  };
}

export function AdminServiceGroupsPage() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminServiceGroupPayload | null>(null);

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
      [...(serviceGroupsQuery.data ?? [])].sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name)),
    [serviceGroupsQuery.data],
  );

  const handleChange = <K extends keyof AdminServiceGroupPayload>(key: K, value: AdminServiceGroupPayload[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const startAdd = () => {
    setAdding(true);
    setEditingId(null);
    const nextOrder = Math.max(0, ...serviceGroups.map((item) => item.displayOrder)) + 1;
    setDraft({
      ...createDraft(),
      displayOrder: nextOrder,
    });
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
    if (!draft) return;
    await saveMutation.mutateAsync(draft);
  };

  const handleDelete = async (item: AdminServiceGroupItem) => {
    if (!window.confirm(`정말 ${item.name} 서비스를 삭제하시겠습니까?`)) {
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
        <h1>서비스 그룹 관리</h1>
      </header>

      {errorMessage && <p className={styles.helperText}>{errorMessage}</p>}

      <div className={styles.panel}>
        <div className={styles.sectionHeader}>
          <h2>서비스 그룹 리스트</h2>
          <div className={styles.sectionActions}>
            {!adding && (
              <button type="button" onClick={startAdd} className={styles.primaryButton}>
                신규 그룹 추가
              </button>
            )}
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>서비스 그룹</th>
                <th>정렬</th>
                <th>활성</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {adding && draft && (
                <tr>
                  <td className={styles.inlineRowCell}>
                    <input aria-label="서비스 그룹 추가" value={draft.name} onChange={(event) => handleChange("name", event.target.value)} />
                  </td>
                  <td className={styles.inlineRowCell}>
                    <input
                      aria-label="정렬 순서 추가"
                      type="number"
                      value={draft.displayOrder}
                      onChange={(event) => handleChange("displayOrder", Number(event.target.value))}
                    />
                  </td>
                  <td className={styles.inlineRowCell}>
                    <select
                      aria-label="활성 추가"
                      value={draft.isActive ? "1" : "0"}
                      onChange={(event) => handleChange("isActive", event.target.value === "1")}
                    >
                      <option value="1">활성</option>
                      <option value="0">비활성</option>
                    </select>
                  </td>
                  <td className={styles.inlineRowActions}>
                    <div className={styles.actions}>
                      <button type="button" onClick={() => void saveDraft()} disabled={saveMutation.isPending}>
                        저장
                      </button>
                      <button type="button" onClick={cancelDraft}>
                        취소
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {serviceGroups.map((item) => {
                const isEditing = editingId === item.id && draft;

                return isEditing && draft ? (
                  <tr key={item.id}>
                    <td className={styles.inlineRowCell}>
                      <input aria-label="서비스 그룹 수정" value={draft.name} onChange={(event) => handleChange("name", event.target.value)} />
                    </td>
                    <td className={styles.inlineRowCell}>
                      <input
                        aria-label="정렬 순서 수정"
                        type="number"
                        value={draft.displayOrder}
                        onChange={(event) => handleChange("displayOrder", Number(event.target.value))}
                      />
                    </td>
                    <td className={styles.inlineRowCell}>
                      <select
                        aria-label="활성 수정"
                        value={draft.isActive ? "1" : "0"}
                        onChange={(event) => handleChange("isActive", event.target.value === "1")}
                      >
                        <option value="1">활성</option>
                        <option value="0">비활성</option>
                      </select>
                    </td>
                    <td className={styles.inlineRowActions}>
                      <div className={styles.actions}>
                        <button type="button" onClick={() => void saveDraft()} disabled={saveMutation.isPending}>
                          저장
                        </button>
                        <button type="button" onClick={cancelDraft}>
                          취소
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.displayOrder}</td>
                    <td>{item.isActive ? "활성" : "비활성"}</td>
                    <td className={styles.inlineRowActions}>
                      <div className={styles.actions}>
                        <button type="button" className={styles.secondaryButton} onClick={() => startEdit(item)}>
                          수정
                        </button>
                        <button type="button" className={styles.secondaryButton} onClick={() => void handleDelete(item)} disabled={deleteMutation.isPending}>
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
