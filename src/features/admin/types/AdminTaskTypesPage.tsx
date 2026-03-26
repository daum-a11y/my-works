import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDataClient } from "../admin-client";

import styles from "../AdminPage.module.css";
import type { AdminTaskSearchItem, AdminTaskTypeItem, AdminTaskTypePayload } from "../admin-types";

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

function createDraft(taskType?: AdminTaskTypeItem): AdminTaskTypePayload {
  if (!taskType) {
    return {
      type1: "",
      type2: "",
      displayLabel: "",
      displayOrder: 0,
      requiresServiceGroup: false,
      isActive: true,
    };
  }

  return {
    id: taskType.id,
    type1: taskType.type1,
    type2: taskType.type2,
    displayLabel: taskType.displayLabel,
    displayOrder: taskType.displayOrder,
    requiresServiceGroup: taskType.requiresServiceGroup,
    isActive: taskType.isActive,
  };
}

function pairKey(type1: string, type2: string) {
  return `${type1}||${type2}`;
}

export function AdminTaskTypesPage() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminTaskTypePayload | null>(null);
  const [selectedUsageKey, setSelectedUsageKey] = useState<string>("");
  const [replacementType1, setReplacementType1] = useState<string>("");
  const [replacementType2, setReplacementType2] = useState<string>("");

  const taskTypesQuery = useQuery({
    queryKey: ["admin", "task-types"],
    queryFn: () => adminDataClient.listTaskTypes(),
  });

  const validationTasksQuery = useQuery({
    queryKey: ["admin", "task-types", "validation-tasks"],
    queryFn: () => adminDataClient.searchTasksAdmin(ALL_TASK_FILTERS),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: AdminTaskTypePayload) => adminDataClient.saveTaskTypeAdmin(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "task-types"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "task-types", "validation-tasks"] });
      setAdding(false);
      setEditingId(null);
      setDraft(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskTypeId: string) => adminDataClient.deleteTaskTypeAdmin(taskTypeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "task-types"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "task-types", "validation-tasks"] });
      setAdding(false);
      setEditingId(null);
      setDraft(null);
    },
  });

  const replaceMutation = useMutation({
    mutationFn: async () => {
      const selectedUsage = usageRows.find((row) => row.key === selectedUsageKey);
      if (!selectedUsage) {
        throw new Error("대상 업무유형을 선택해 주십시오.");
      }
      if (!replacementType1 || !replacementType2) {
        throw new Error("변경할 업무유형을 선택해 주십시오.");
      }
      await adminDataClient.replaceTaskTypeUsage(selectedUsage.type1, selectedUsage.type2, replacementType1, replacementType2);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "task-types", "validation-tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "task-types"] });
    },
  });

  const taskTypes = useMemo(
    () =>
      [...(taskTypesQuery.data ?? [])].sort(
        (left, right) =>
          left.displayOrder - right.displayOrder || left.type1.localeCompare(right.type1) || left.type2.localeCompare(right.type2),
      ),
    [taskTypesQuery.data],
  );

  const type1Options = useMemo(() => {
    return Array.from(new Set(taskTypes.map((item) => item.type1))).sort((left, right) => left.localeCompare(right));
  }, [taskTypes]);

  const type2Options = useMemo(() => {
    return taskTypes.filter((item) => item.type1 === replacementType1);
  }, [replacementType1, taskTypes]);

  const taskTypeMap = useMemo(() => new Map(taskTypes.map((item) => [pairKey(item.type1, item.type2), item])), [taskTypes]);

  const usageRows = useMemo(() => {
    const usageMap = new Map<string, { key: string; type1: string; type2: string; count: number; tasks: AdminTaskSearchItem[]; exists: boolean }>();

    for (const task of validationTasksQuery.data ?? []) {
      const key = pairKey(task.taskType1, task.taskType2);
      const current = usageMap.get(key);
      if (current) {
        current.count += 1;
        current.tasks.push(task);
      } else {
        usageMap.set(key, {
          key,
          type1: task.taskType1,
          type2: task.taskType2,
          count: 1,
          tasks: [task],
          exists: taskTypeMap.has(key),
        });
      }
    }

    return Array.from(usageMap.values()).sort(
      (left, right) => right.count - left.count || left.type1.localeCompare(right.type1) || left.type2.localeCompare(right.type2),
    );
  }, [taskTypeMap, validationTasksQuery.data]);

  const selectedUsage = usageRows.find((row) => row.key === selectedUsageKey) ?? usageRows[0] ?? null;
  const selectedUsageTasks = selectedUsage?.tasks ?? [];
  const validationError =
    (validationTasksQuery.error instanceof Error && validationTasksQuery.error.message) ||
    (replaceMutation.error instanceof Error && replaceMutation.error.message) ||
    "";

  useEffect(() => {
    if (!selectedUsageKey && usageRows.length > 0) {
      setSelectedUsageKey(usageRows[0].key);
    }
  }, [selectedUsageKey, usageRows]);

  useEffect(() => {
    if (!selectedUsage) {
      return;
    }

    if (!replacementType1 || !type1Options.includes(replacementType1)) {
      setReplacementType1(type1Options[0] ?? "");
    }
  }, [replacementType1, selectedUsage, type1Options]);

  useEffect(() => {
    if (!replacementType1) {
      setReplacementType2("");
      return;
    }

    if (!type2Options.some((item) => item.type2 === replacementType2)) {
      setReplacementType2(type2Options[0]?.type2 ?? "");
    }
  }, [replacementType1, replacementType2, type2Options]);

  const handleChange = <K extends keyof AdminTaskTypePayload>(key: K, value: AdminTaskTypePayload[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  const startAdd = () => {
    setAdding(true);
    setEditingId(null);
    const nextOrder = Math.max(0, ...taskTypes.map((item) => item.displayOrder)) + 1;
    setDraft({
      ...createDraft(),
      displayOrder: nextOrder,
    });
  };

  const startEdit = (item: AdminTaskTypeItem) => {
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

  const handleDelete = async (item: AdminTaskTypeItem) => {
    if (!window.confirm(`정말 ${item.displayLabel} 업무유형을 삭제하시겠습니까?`)) {
      return;
    }

    await deleteMutation.mutateAsync(item.id);
  };

  const handleApplyValidation = async () => {
    await replaceMutation.mutateAsync();
  };

  const errorMessage =
    (taskTypesQuery.error instanceof Error && taskTypesQuery.error.message) ||
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    validationError ||
    "";

  return (
    <section className={styles.page}>
      

      <header className={styles.hero}>
        <h2>업무 타입 관리</h2>
      </header>

      {errorMessage && <p className={styles.helperText}>{errorMessage}</p>}

      <div className={styles.panel}>
        <div className={styles.sectionHeader}>
          <h3>업무 타입 리스트</h3>
          <div className={styles.sectionActions}>
            {!adding && (
              <button type="button" onClick={startAdd} className={styles.primaryButton}>
                업무 타입 추가
              </button>
            )}
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>대분류(type1)</th>
                <th>소분류(type2)</th>
                <th>표시 라벨</th>
                <th>정렬</th>
                <th>서비스그룹 필요</th>
                <th>활성</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {adding && draft && (
                <tr>
                  <td className={styles.inlineRowCell}>
                    <input aria-label="타입1 추가" value={draft.type1} onChange={(event) => handleChange("type1", event.target.value)} />
                  </td>
                  <td className={styles.inlineRowCell}>
                    <input aria-label="타입2 추가" value={draft.type2} onChange={(event) => handleChange("type2", event.target.value)} />
                  </td>
                  <td className={styles.inlineRowCell}>
                    <input aria-label="표시 라벨 추가" value={draft.displayLabel} onChange={(event) => handleChange("displayLabel", event.target.value)} />
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
                      aria-label="서비스그룹 필요 추가"
                      value={draft.requiresServiceGroup ? "1" : "0"}
                      onChange={(event) => handleChange("requiresServiceGroup", event.target.value === "1")}
                    >
                      <option value="1">필요</option>
                      <option value="0">선택</option>
                    </select>
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

              {taskTypes.map((item) => {
                const isEditing = editingId === item.id && draft;

                return isEditing && draft ? (
                  <tr key={item.id}>
                    <td className={styles.inlineRowCell}>
                      <input aria-label="타입1 수정" value={draft.type1} onChange={(event) => handleChange("type1", event.target.value)} />
                    </td>
                    <td className={styles.inlineRowCell}>
                      <input aria-label="타입2 수정" value={draft.type2} onChange={(event) => handleChange("type2", event.target.value)} />
                    </td>
                    <td className={styles.inlineRowCell}>
                      <input aria-label="표시 라벨 수정" value={draft.displayLabel} onChange={(event) => handleChange("displayLabel", event.target.value)} />
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
                        aria-label="서비스그룹 필요 수정"
                        value={draft.requiresServiceGroup ? "1" : "0"}
                        onChange={(event) => handleChange("requiresServiceGroup", event.target.value === "1")}
                      >
                        <option value="1">필요</option>
                        <option value="0">선택</option>
                      </select>
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
                    <td>{item.type1}</td>
                    <td>{item.type2}</td>
                    <td>{item.displayLabel}</td>
                    <td>{item.displayOrder}</td>
                    <td>{item.requiresServiceGroup ? "필요" : "선택"}</td>
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
