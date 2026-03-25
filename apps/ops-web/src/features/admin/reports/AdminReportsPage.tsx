import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminDataClient } from "../admin-client";
import styles from "../AdminPage.module.css";
import {
  createDefaultAdminTaskSearchFilters,
  type AdminTaskSaveInput,
  type AdminTaskSearchFilters,
  type AdminTaskSearchItem,
} from "../admin-types";

function createDraft(task: AdminTaskSearchItem): AdminTaskSaveInput {
  return {
    id: task.id,
    memberId: task.memberId,
    taskDate: task.taskDate,
    projectId: task.projectId ?? "",
    pageId: task.pageId ?? "",
    taskType1: task.taskType1,
    taskType2: task.taskType2,
    hours: Number(task.hours ?? 0),
    content: task.content,
    note: task.note,
  };
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AdminTaskSearchFilters>(() => createDefaultAdminTaskSearchFilters());
  const [appliedFilters, setAppliedFilters] = useState<AdminTaskSearchFilters>(() => createDefaultAdminTaskSearchFilters());
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [draft, setDraft] = useState<AdminTaskSaveInput | null>(null);

  const membersQuery = useQuery({
    queryKey: ["admin", "members"],
    queryFn: () => adminDataClient.listMembersAdmin(),
  });
  const taskTypesQuery = useQuery({
    queryKey: ["admin", "task-types"],
    queryFn: () => adminDataClient.listTaskTypes(),
  });
  const serviceGroupsQuery = useQuery({
    queryKey: ["admin", "service-groups"],
    queryFn: () => adminDataClient.listServiceGroups(),
  });
  const projectsQuery = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: () => adminDataClient.listProjects(),
  });
  const pagesQuery = useQuery({
    queryKey: ["admin", "project-pages"],
    queryFn: () => adminDataClient.listProjectPages(),
  });
  const searchQuery = useQuery({
    queryKey: ["admin", "task-search", appliedFilters],
    queryFn: () => adminDataClient.searchTasksAdmin(appliedFilters),
  });

  const members = membersQuery.data ?? [];
  const taskTypes = taskTypesQuery.data ?? [];
  const serviceGroups = serviceGroupsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const pages = pagesQuery.data ?? [];
  const tasks = searchQuery.data ?? [];

  const visiblePages = useMemo(
    () => (filters.projectId ? pages.filter((page) => page.projectId === filters.projectId) : pages),
    [filters.projectId, pages],
  );

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  useEffect(() => {
    if (tasks.length === 0) {
      setSelectedTaskId("");
      return;
    }

    const hasSelectedTask = tasks.some((task) => task.id === selectedTaskId);
    if (!hasSelectedTask) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [selectedTaskId, tasks]);

  useEffect(() => {
    if (selectedTask) {
      setDraft(createDraft(selectedTask));
      return;
    }

    if (tasks.length === 0) {
      setDraft(null);
    }
  }, [selectedTask, tasks.length]);

  useEffect(() => {
    if (draft?.projectId && draft.pageId) {
      const currentPage = pages.find((page) => page.id === draft.pageId);
      if (currentPage && currentPage.projectId !== draft.projectId) {
        setDraft((current) => (current ? { ...current, pageId: "" } : current));
      }
    }
  }, [draft?.pageId, draft?.projectId, pages]);

  const saveMutation = useMutation({
    mutationFn: (input: AdminTaskSaveInput) => adminDataClient.saveTaskAdmin(input),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "task-search"] });
      setSelectedTaskId(saved.id);
      setDraft(createDraft(saved));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => adminDataClient.deleteTaskAdmin(taskId),
    onSuccess: () => {
      setSelectedTaskId("");
      setDraft(null);
      void queryClient.invalidateQueries({ queryKey: ["admin", "task-search"] });
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => adminDataClient.exportTasksAdmin(appliedFilters),
    onSuccess: ({ filename, content }) => {
      downloadCsv(filename, content);
    },
  });

  const taskType1Options = useMemo(() => {
    const names = new Set(taskTypes.map((item) => item.name));
    if (draft?.taskType1) names.add(draft.taskType1);
    return Array.from(names);
  }, [draft?.taskType1, taskTypes]);

  const taskType2Options = useMemo(() => {
    const names = new Set(taskTypes.map((item) => item.name));
    if (draft?.taskType2) names.add(draft.taskType2);
    return Array.from(names);
  }, [draft?.taskType2, taskTypes]);

  const draftPages = useMemo(
    () => (draft?.projectId ? pages.filter((page) => page.projectId === draft.projectId) : pages),
    [draft?.projectId, pages],
  );

  const handleFilterField = <K extends keyof AdminTaskSearchFilters>(key: K, value: AdminTaskSearchFilters[K]) => {
    setFilters((current) => {
      const next = { ...current, [key]: value };
      if (key === "projectId") {
        next.pageId = "";
      }
      return next;
    });
  };

  const handleDraftField = <K extends keyof AdminTaskSaveInput>(key: K, value: AdminTaskSaveInput[K]) => {
    setDraft((current) => {
      if (!current) return current;
      const next = { ...current, [key]: value };
      if (key === "projectId") {
        next.pageId = "";
      }
      return next;
    });
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
  };

  const handleSave = async () => {
    if (!draft) return;
    await saveMutation.mutateAsync({
      ...draft,
      hours: Number(draft.hours) || 0,
    });
  };

  const handleDelete = async () => {
    if (!selectedTask || !window.confirm("선택한 업무보고를 삭제하시겠습니까?")) {
      return;
    }
    await deleteMutation.mutateAsync(selectedTask.id);
  };

  const searchError = searchQuery.error instanceof Error ? searchQuery.error.message : "";
  const mutationError =
    (saveMutation.error instanceof Error && saveMutation.error.message) ||
    (deleteMutation.error instanceof Error && deleteMutation.error.message) ||
    (exportMutation.error instanceof Error && exportMutation.error.message) ||
    "";

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <h2>전체 업무보고 검색 및 관리자 수정</h2>
        <p>
          개인 검색과 분리된 관리자 검색 화면입니다. 전체 사용자 기준으로 조회하고, 결과를 즉시 수정/삭제하거나 CSV로 내보낼 수 있습니다.
        </p>
      </header>

      <div className={styles.panel}>
        <div className={styles.toolbar}>
          <div>
            <h3>검색 조건</h3>
            <p className={styles.helperText}>기간, 사용자, 프로젝트, 업무유형, 서비스그룹 기준으로 전체 업무보고를 조회합니다.</p>
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={handleSearch}>
              검색
            </button>
            <button type="button" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
              CSV 내보내기
            </button>
          </div>
        </div>

        <div className={styles.filtersGrid}>
          <div className={styles.field}>
            <label htmlFor="admin-reports-start-date">시작일</label>
            <input
              id="admin-reports-start-date"
              type="date"
              value={filters.startDate}
              onChange={(event) => handleFilterField("startDate", event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-reports-end-date">종료일</label>
            <input
              id="admin-reports-end-date"
              type="date"
              value={filters.endDate}
              onChange={(event) => handleFilterField("endDate", event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-reports-member">사용자</label>
            <select
              id="admin-reports-member"
              value={filters.memberId}
              onChange={(event) => handleFilterField("memberId", event.target.value)}
            >
              <option value="">전체</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · {member.legacyUserId}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-reports-project">프로젝트</label>
            <select
              id="admin-reports-project"
              value={filters.projectId}
              onChange={(event) => handleFilterField("projectId", event.target.value)}
            >
              <option value="">전체</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                  {project.isActive ? "" : " (비활성)"}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-reports-page">페이지</label>
            <select
              id="admin-reports-page"
              value={filters.pageId}
              onChange={(event) => handleFilterField("pageId", event.target.value)}
            >
              <option value="">전체</option>
              {visiblePages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-reports-task-type-1">업무유형 1</label>
            <select
              id="admin-reports-task-type-1"
              value={filters.taskType1}
              onChange={(event) => handleFilterField("taskType1", event.target.value)}
            >
              <option value="">전체</option>
              {taskTypes.map((type) => (
                <option key={`type1-${type.id}`} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-reports-task-type-2">업무유형 2</label>
            <select
              id="admin-reports-task-type-2"
              value={filters.taskType2}
              onChange={(event) => handleFilterField("taskType2", event.target.value)}
            >
              <option value="">전체</option>
              {taskTypes.map((type) => (
                <option key={`type2-${type.id}`} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="admin-reports-service-group">서비스그룹</label>
            <select
              id="admin-reports-service-group"
              value={filters.serviceGroupId}
              onChange={(event) => handleFilterField("serviceGroupId", event.target.value)}
            >
              <option value="">전체</option>
              {serviceGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className={`${styles.field} ${styles.fullWidth}`}>
            <label htmlFor="admin-reports-keyword">키워드</label>
            <input
              id="admin-reports-keyword"
              type="search"
              value={filters.keyword}
              placeholder="업무 내용, 메모, 프로젝트, 페이지, 사용자명 기준 검색"
              onChange={(event) => handleFilterField("keyword", event.target.value)}
            />
          </div>
        </div>
      </div>

      {(searchError || mutationError) && <p className={styles.helperText}>{searchError || mutationError}</p>}

      <div className={styles.layout}>
        <div className={styles.stack}>
          <div className={styles.panel}>
            <div className={styles.toolbar}>
              <div>
                <h3>검색 결과</h3>
                <p className={styles.helperText}>총 {tasks.length}건</p>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>작성일</th>
                    <th>사용자</th>
                    <th>프로젝트 / 페이지</th>
                    <th>업무유형</th>
                    <th>서비스그룹</th>
                    <th>소요시간</th>
                    <th>업무내용</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className={styles.emptyState}>검색 결과가 없습니다.</div>
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task.id} className={task.id === selectedTaskId ? styles.selectedRow : undefined}>
                        <td>{task.taskDate}</td>
                        <td>
                          <button type="button" className={styles.rowButton} onClick={() => setSelectedTaskId(task.id)}>
                            <strong>{task.memberName}</strong>
                            <span>{task.memberEmail}</span>
                          </button>
                        </td>
                        <td>
                          <strong>{task.projectName || "미지정"}</strong>
                          <div className={styles.muted}>{task.pageTitle || "페이지 미지정"}</div>
                        </td>
                        <td>
                          {task.taskType1}
                          <div className={styles.muted}>{task.taskType2}</div>
                        </td>
                        <td>{task.serviceGroupName || "미지정"}</td>
                        <td>{task.hours.toFixed(1)}h</td>
                        <td>{task.content}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className={styles.panel}>
          <div className={styles.toolbar}>
            <div>
              <h3>선택 항목 편집</h3>
              <p className={styles.helperText}>관리자 권한으로 업무보고를 수정하거나 삭제합니다.</p>
            </div>
            {selectedTask && (
              <button type="button" onClick={() => void handleDelete()} disabled={deleteMutation.isPending}>
                삭제
              </button>
            )}
          </div>

          {!draft ? (
            <div className={styles.emptyState}>좌측 결과에서 업무보고를 선택해 주십시오.</div>
          ) : (
            <>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label htmlFor="admin-task-member">사용자</label>
                  <select
                    id="admin-task-member"
                    value={draft.memberId}
                    onChange={(event) => handleDraftField("memberId", event.target.value)}
                  >
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} · {member.legacyUserId}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="admin-task-date">작성일</label>
                  <input
                    id="admin-task-date"
                    type="date"
                    value={draft.taskDate}
                    onChange={(event) => handleDraftField("taskDate", event.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="admin-task-project">프로젝트</label>
                  <select
                    id="admin-task-project"
                    value={draft.projectId}
                    onChange={(event) => handleDraftField("projectId", event.target.value)}
                  >
                    <option value="">선택 안 함</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="admin-task-page">페이지</label>
                  <select
                    id="admin-task-page"
                    value={draft.pageId}
                    onChange={(event) => handleDraftField("pageId", event.target.value)}
                  >
                    <option value="">선택 안 함</option>
                    {draftPages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="admin-task-type1">업무유형 1</label>
                  <select
                    id="admin-task-type1"
                    value={draft.taskType1}
                    onChange={(event) => handleDraftField("taskType1", event.target.value)}
                  >
                    {taskType1Options.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="admin-task-type2">업무유형 2</label>
                  <select
                    id="admin-task-type2"
                    value={draft.taskType2}
                    onChange={(event) => handleDraftField("taskType2", event.target.value)}
                  >
                    {taskType2Options.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="admin-task-hours">소요시간</label>
                  <input
                    id="admin-task-hours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={draft.hours}
                    onChange={(event) => handleDraftField("hours", Number(event.target.value))}
                  />
                </div>
                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label htmlFor="admin-task-content">업무내용</label>
                  <textarea
                    id="admin-task-content"
                    value={draft.content}
                    onChange={(event) => handleDraftField("content", event.target.value)}
                  />
                </div>
                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <label htmlFor="admin-task-note">비고</label>
                  <textarea
                    id="admin-task-note"
                    value={draft.note}
                    onChange={(event) => handleDraftField("note", event.target.value)}
                  />
                </div>
              </div>

              <div className={styles.actions}>
                <button type="button" onClick={() => void handleSave()} disabled={saveMutation.isPending}>
                  저장
                </button>
                <span className={styles.helperText}>최근 수정 시각: {selectedTask?.updatedAt || "-"}</span>
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
