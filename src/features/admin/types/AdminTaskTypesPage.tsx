import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDataClient } from "../admin-client";

import styles from "../AdminPage.module.css";
import type { AdminTaskTypeItem, AdminTaskTypePayload } from "../admin-types";

const addButtonStyle = {
  minHeight: "var(--control-height-sm)",
  padding: "var(--control-padding-y) var(--control-padding-x)",
  border: "1px solid var(--button-secondary-border)",
  background: "var(--button-secondary-bg)",
  color: "var(--text-primary)",
  fontFamily: "inherit",
  fontSize: "var(--text-form-size)",
  fontWeight: "var(--text-form-weight)",
  lineHeight: "var(--text-form-line-height)",
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

function groupTaskTypes(taskTypes: AdminTaskTypeItem[]) {
  const grouped = new Map<string, AdminTaskTypeItem[]>();

  for (const taskType of taskTypes) {
    const items = grouped.get(taskType.type1) ?? [];
    items.push(taskType);
    grouped.set(taskType.type1, items);
  }

  return Array.from(grouped.entries())
    .map(([type1, rows]) => ({
      type1,
      rows: [...rows].sort(
        (left, right) => left.displayOrder - right.displayOrder || left.type2.localeCompare(right.type2),
      ),
    }))
    .sort((left, right) => {
      const leftOrder = left.rows[0]?.displayOrder ?? 0;
      const rightOrder = right.rows[0]?.displayOrder ?? 0;
      return leftOrder - rightOrder || left.type1.localeCompare(right.type1);
    });
}

export function AdminTaskTypesPage() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminTaskTypePayload | null>(null);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const createType1Ref = useRef<HTMLInputElement | null>(null);
  const editType1Ref = useRef<HTMLSelectElement | null>(null);

  const taskTypesQuery = useQuery({
    queryKey: ["admin", "task-types"],
    queryFn: () => adminDataClient.listTaskTypes(),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: AdminTaskTypePayload) => adminDataClient.saveTaskTypeAdmin(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "task-types"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskTypeId: string) => adminDataClient.deleteTaskTypeAdmin(taskTypeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "task-types"] });
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

  const groupedTaskTypes = useMemo(() => groupTaskTypes(taskTypes), [taskTypes]);
  const type1Options = useMemo(() => groupedTaskTypes.map((group) => group.type1), [groupedTaskTypes]);

  const activeTypeMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const item of taskTypes) {
      map.set(item.id, item.isActive);
    }
    return map;
  }, [taskTypes]);

  useEffect(() => {
    document.title = "타입 - 관리 | My Works";
  }, []);

  useEffect(() => {
    if (adding) {
      createType1Ref.current?.focus();
      return;
    }

    if (editingId) {
      editType1Ref.current?.focus();
      return;
    }

    addButtonRef.current?.focus();
  }, [adding, editingId]);

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
      isActive: true,
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
    addButtonRef.current?.focus();
  };

  const saveDraft = async () => {
    if (!draft || saveMutation.isPending) {
      return;
    }

    const isCreate = adding || !draft.id;

    if (isCreate && !window.confirm("저장하시겠습니까?")) {
      return;
    }

    try {
      await saveMutation.mutateAsync(draft);
      if (isCreate) {
        alert("저장되었습니다.");
      } else {
        alert("수정 완료");
      }
      setAdding(false);
      setEditingId(null);
      setDraft(null);
      addButtonRef.current?.focus();
    } catch (error) {
      alert(error instanceof Error ? error.message : "서버 저장 실패. 다시 시도해주세요.");
    }
  };

  const handleDelete = async (item: AdminTaskTypeItem) => {
    if (!window.confirm("정말 삭제 하시겠습니까? 복구할 수 없습니다.")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(item.id);
      alert("삭제 완료");
      setAdding(false);
      setEditingId(null);
      setDraft(null);
      addButtonRef.current?.focus();
    } catch (error) {
      alert(error instanceof Error ? error.message : "서버 처리 실패. 다시 시도해주세요.");
    }
  };

  const errorMessage =
    (taskTypesQuery.error instanceof Error && taskTypesQuery.error.message) ||
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    "";

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <h1>업무타입</h1>
      </header>

      {errorMessage ? <p className={styles.helperText}>{errorMessage}</p> : null}

      <div className={styles.panel}>
        <div className={styles.sectionHeader}>
          <h2>업무타입 내역</h2>
          <div className={styles.sectionActions}>
            {!adding ? (
              <button ref={addButtonRef} type="button" onClick={startAdd} style={addButtonStyle}>
                업무 타입 추가
              </button>
            ) : null}
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="sr-only">업무타입 내역</caption>
            <thead>
              <tr>
                <th>대분류 (type1)</th>
                <th>소분류 (type2)</th>
                <th>seq</th>
                <th>리소스 타입</th>
                <th>활성여부</th>
                <th>비고</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {adding && draft ? (
                <tr>
                  <td className={styles.inlineRowCell}>
                    <input
                      ref={createType1Ref}
                      aria-label="타입1"
                      className="form-control form-control-sm"
                      type="text"
                      value={draft.type1}
                      onChange={(event) => handleChange("type1", event.target.value)}
                    />
                  </td>
                  <td className={styles.inlineRowCell}>
                    <input
                      aria-label="타입2"
                      className="form-control form-control-sm"
                      type="text"
                      value={draft.type2}
                      onChange={(event) => handleChange("type2", event.target.value)}
                    />
                  </td>
                  <td>-</td>
                  <td className={styles.inlineRowCell}>
                    <select
                      aria-label="리소스 타입"
                      className="form-control form-control-sm"
                      value={draft.requiresServiceGroup ? "1" : "0"}
                      onChange={(event) => handleChange("requiresServiceGroup", event.target.value === "1")}
                    >
                      <option value="1">프로젝트</option>
                      <option value="0">일반</option>
                    </select>
                  </td>
                  <td>
                    <label>
                      <input defaultChecked disabled type="radio" />
                      활성
                    </label>
                  </td>
                  <td className={styles.inlineRowCell}>
                    <input
                      aria-label="비고"
                      className="form-control form-control-sm"
                      type="text"
                      value={draft.displayLabel}
                      onChange={(event) => handleChange("displayLabel", event.target.value)}
                    />
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
              ) : null}

              {groupedTaskTypes.length ? (
                groupedTaskTypes.map((group) =>
                  group.rows.map((item, rowIndex) => {
                    const isEditing = editingId === item.id && draft;

                    return isEditing && draft ? (
                      <tr key={item.id}>
                        {rowIndex === 0 ? (
                          <td rowSpan={group.rows.length} scope="row">
                            {group.type1}
                          </td>
                        ) : null}
                        <td className={styles.inlineRowCell}>
                          <div>
                            <select
                              ref={editType1Ref}
                              aria-label="타입1 수정"
                              className="form-control form-control-sm"
                              value={draft.type1}
                              onChange={(event) => handleChange("type1", event.target.value)}
                            >
                              {type1Options.map((type1) => (
                                <option key={type1} value={type1}>
                                  {type1}
                                </option>
                              ))}
                            </select>
                            <input
                              aria-label="타입2 수정"
                              className="form-control form-control-sm"
                              style={{ marginTop: "8px" }}
                              type="text"
                              value={draft.type2}
                              onChange={(event) => handleChange("type2", event.target.value)}
                            />
                          </div>
                        </td>
                        <td>{item.displayOrder}</td>
                        <td className={styles.inlineRowCell}>
                          <select
                            aria-label="리소스 타입 수정"
                            className="form-control form-control-sm"
                            value={draft.requiresServiceGroup ? "1" : "0"}
                            onChange={(event) => handleChange("requiresServiceGroup", event.target.value === "1")}
                          >
                            <option value="1">프로젝트</option>
                            <option value="0">일반</option>
                          </select>
                        </td>
                        <td className={styles.inlineRowCell}>
                          <select
                            aria-label="활성 수정"
                            className="form-control form-control-sm"
                            value={draft.isActive ? "1" : "0"}
                            onChange={(event) => handleChange("isActive", event.target.value === "1")}
                          >
                            <option value="1">활성</option>
                            <option value="0">비활성</option>
                          </select>
                        </td>
                        <td className={styles.inlineRowCell}>
                          <input
                            aria-label="비고 수정"
                            className="form-control form-control-sm"
                            type="text"
                            value={draft.displayLabel}
                            onChange={(event) => handleChange("displayLabel", event.target.value)}
                          />
                        </td>
                        <td className={styles.inlineRowActions}>
                          <div className={styles.actions}>
                            <button type="button" onClick={() => void saveDraft()} disabled={saveMutation.isPending}>
                              변경
                            </button>
                            <button type="button" onClick={cancelDraft}>
                              취소
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr key={item.id}>
                        {rowIndex === 0 ? (
                          <td rowSpan={group.rows.length} scope="row">
                            {group.type1}
                          </td>
                        ) : null}
                        <td>{item.type2}</td>
                        <td>{item.displayOrder}</td>
                        <td>{item.requiresServiceGroup ? "프로젝트" : "일반"}</td>
                        <td>{activeTypeMap.get(item.id) ? "활성" : "비활성"}</td>
                        <td>{item.displayLabel || "-"}</td>
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
                  }),
                )
              ) : (
                <tr>
                  <td className={styles.emptyState} colSpan={7}>
                    표시할 업무타입 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
