import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDataClient } from "../admin-client";

import styles from "../AdminPage.module.css";
import type { AdminServiceGroupItem, AdminServiceGroupPayload, AdminTaskSearchItem } from "../admin-types";

const ALL_TASK_FILTERS = {
  startDate: "1970-01-01",
  endDate: "2099-12-31",
  memberId: "",
  projectId: "",
  pageId: "",
  taskType1: "",
  taskType2: "",
  serviceGroupId: "",
  keyword: "",
} as const;

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

function groupKey(serviceGroupId: string | null, serviceGroupName: string) {
  return serviceGroupId ?? `name:${serviceGroupName || "blank"}`;
}

export function AdminServiceGroupsPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"manage" | "validate">("manage");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminServiceGroupPayload | null>(null);
  const [selectedUsageKey, setSelectedUsageKey] = useState<string>("");
  const [replacementGroupId, setReplacementGroupId] = useState<string>("");

  const serviceGroupsQuery = useQuery({
    queryKey: ["admin", "service-groups"],
    queryFn: () => adminDataClient.listServiceGroups(),
  });

  const validationTasksQuery = useQuery({
    queryKey: ["admin", "service-groups", "validation-tasks"],
    queryFn: () => adminDataClient.searchTasksAdmin(ALL_TASK_FILTERS),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: AdminServiceGroupPayload) => adminDataClient.saveServiceGroupAdmin(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "service-groups"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "service-groups", "validation-tasks"] });
      setAdding(false);
      setEditingId(null);
      setDraft(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (serviceGroupId: string) => adminDataClient.deleteServiceGroupAdmin(serviceGroupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "service-groups"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "service-groups", "validation-tasks"] });
      setAdding(false);
      setEditingId(null);
      setDraft(null);
    },
  });

  const replaceMutation = useMutation({
    mutationFn: async () => {
      const selectedUsage = usageRows.find((row) => row.key === selectedUsageKey);
      if (!selectedUsage) {
        throw new Error("대상 서비스 그룹을 선택해 주십시오.");
      }
      if (!selectedUsage.serviceGroupId) {
        throw new Error("식별 가능한 서비스 그룹만 변경할 수 있습니다.");
      }
      if (!replacementGroupId) {
        throw new Error("변경할 서비스 그룹을 선택해 주십시오.");
      }
      await adminDataClient.replaceServiceGroupUsage(selectedUsage.serviceGroupId, replacementGroupId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "service-groups", "validation-tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "service-groups"] });
    },
  });

  const serviceGroups = useMemo(
    () =>
      [...(serviceGroupsQuery.data ?? [])].sort((left, right) => left.displayOrder - right.displayOrder || left.name.localeCompare(right.name)),
    [serviceGroupsQuery.data],
  );

  const groupMap = useMemo(() => new Map(serviceGroups.map((item) => [item.id, item])), [serviceGroups]);

  const usageRows = useMemo(() => {
    const usageMap = new Map<string, { key: string; serviceGroupId: string | null; serviceGroupName: string; count: number; tasks: AdminTaskSearchItem[]; exists: boolean }>();

    for (const task of validationTasksQuery.data ?? []) {
      const key = groupKey(task.serviceGroupId, task.serviceGroupName);
      const current = usageMap.get(key);
      if (current) {
        current.count += 1;
        current.tasks.push(task);
      } else {
        usageMap.set(key, {
          key,
          serviceGroupId: task.serviceGroupId,
          serviceGroupName: task.serviceGroupName,
          count: 1,
          tasks: [task],
          exists: task.serviceGroupId ? groupMap.has(task.serviceGroupId) : false,
        });
      }
    }

    return Array.from(usageMap.values()).sort(
      (left, right) => right.count - left.count || left.serviceGroupName.localeCompare(right.serviceGroupName),
    );
  }, [groupMap, validationTasksQuery.data]);

  const selectedUsage = usageRows.find((row) => row.key === selectedUsageKey) ?? usageRows[0] ?? null;
  const selectedUsageTasks = selectedUsage?.tasks ?? [];
  const replacementOptions = serviceGroups.filter((item) => item.id !== selectedUsage?.serviceGroupId);

  useEffect(() => {
    if (!selectedUsageKey && usageRows.length > 0) {
      setSelectedUsageKey(usageRows[0].key);
    }
  }, [selectedUsageKey, usageRows]);

  useEffect(() => {
    if (!replacementGroupId && replacementOptions.length > 0) {
      setReplacementGroupId(replacementOptions[0].id);
      return;
    }

    if (replacementGroupId && !replacementOptions.some((item) => item.id === replacementGroupId)) {
      setReplacementGroupId(replacementOptions[0]?.id ?? "");
    }
  }, [replacementGroupId, replacementOptions]);

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

  const handleApplyValidation = async () => {
    await replaceMutation.mutateAsync();
  };

  const errorMessage =
    (serviceGroupsQuery.error instanceof Error && serviceGroupsQuery.error.message) ||
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    ((validationTasksQuery.error instanceof Error && validationTasksQuery.error.message) ||
      (replaceMutation.error instanceof Error && replaceMutation.error.message) ||
      "");

  return (
    <section className={styles.page}>
      

      <header className={styles.hero}>
        <h2>서비스 그룹 관리</h2>
      </header>

      {errorMessage && <p className={styles.helperText}>{errorMessage}</p>}

      <div className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div>
            <h3>{mode === "manage" ? "관리모드" : "유효성검증모드"}</h3>
          </div>
          <div className={styles.sectionActions}>
            <button type="button" onClick={() => setMode((current) => (current === "manage" ? "validate" : "manage"))}>
              {mode === "manage" ? "유효성검증모드" : "관리모드"}
            </button>
            {mode === "manage" && !adding && (
              <button type="button" onClick={startAdd}>
                서비스 그룹 추가
              </button>
            )}
          </div>
        </div>

        {mode === "manage" ? (
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
                          <button type="button" onClick={() => startEdit(item)}>
                            수정
                          </button>
                          <button type="button" onClick={() => void handleDelete(item)} disabled={deleteMutation.isPending}>
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
        ) : (
          <div className={styles.validationLayout}>
            <div className={`${styles.panel} ${styles.validationList}`}>
              <h4>사용 중인 서비스 그룹</h4>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>서비스 그룹</th>
                    <th>Count</th>
                    <th>Valid</th>
                  </tr>
                </thead>
                <tbody>
                  {usageRows.length === 0 ? (
                    <tr>
                      <td colSpan={3}>
                        <div className={styles.emptyState}>검증할 서비스 그룹이 없습니다.</div>
                      </td>
                    </tr>
                  ) : (
                    usageRows.map((row) => (
                      <tr key={row.key} className={!row.exists ? styles.validationItemActive : undefined}>
                        <td>
                          <button type="button" className={styles.validationItemButton} onClick={() => setSelectedUsageKey(row.key)}>
                            {row.serviceGroupName || "미지정"}
                          </button>
                        </td>
                        <td>
                          <button type="button" className="btn btn-link" onClick={() => setSelectedUsageKey(row.key)}>
                            {row.count}
                          </button>
                        </td>
                        <td>
                          <span className={`${styles.pill} ${row.exists ? styles.positivePill : styles.dangerPill}`}>{row.exists ? "PASS" : "FAIL"}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.panel}>
              {!selectedUsage ? (
                <div className={styles.emptyState}>좌측에서 검증 대상을 선택해 주십시오.</div>
              ) : (
                <>
                  <h4>대상 서비스 그룹 전체 변경</h4>
                  <p className={styles.helperText}>{selectedUsage.serviceGroupName || "blank"} 의 사용 내역을 다른 서비스 그룹으로 바꿉니다.</p>

                  <div className={styles.field}>
                    <label htmlFor="admin-service-group-valid-target">변경할 서비스 그룹</label>
                    <select
                      id="admin-service-group-valid-target"
                      value={replacementGroupId}
                      onChange={(event) => setReplacementGroupId(event.target.value)}
                      disabled={!selectedUsage.serviceGroupId}
                    >
                      <option value="">선택</option>
                      {replacementOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!selectedUsage.serviceGroupId && <p className={styles.helperText}>식별 가능한 서비스 그룹만 일괄 변경할 수 있습니다.</p>}

                  <div className={styles.sectionActions}>
                    <button type="button" onClick={() => void handleApplyValidation()} disabled={replaceMutation.isPending || !selectedUsage.serviceGroupId}>
                      변경
                    </button>
                  </div>

                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>task id</th>
                          <th>프로젝트</th>
                          <th>사용자</th>
                          <th>업무일</th>
                          <th>내용</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUsageTasks.length === 0 ? (
                          <tr>
                            <td colSpan={5}>
                              <div className={styles.emptyState}>대상 내역이 없습니다.</div>
                            </td>
                          </tr>
                        ) : (
                          selectedUsageTasks.map((task) => (
                            <tr key={task.id}>
                              <td>{task.id}</td>
                              <td>{task.projectName || "미지정"}</td>
                              <td>{task.memberName}</td>
                              <td>{task.taskDate}</td>
                              <td>{task.content}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
