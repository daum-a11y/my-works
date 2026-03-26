import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../auth/AuthContext";
import { opsDataClient } from "../../lib/data-client";
import { downloadExcelFile } from "../../lib/excel-export";
import type { Project, ProjectPage, ReportFilters, Task, TaskType } from "../../lib/domain";
import {
  buildProjectViewModels,
  buildReportViewModel,
  buildTaskType1Options,
  buildTaskType2Options,
  createEmptyReportDraft,
  DEFAULT_REPORT_FILTERS,
  draftFromReport,
  formatReportDate,
  formatReportHours,
  parseReportHoursInput,
  sortReportsByMode,
  validateTaskTypeSelection,
  type ReportDraft,
  type ReportSortMode,
  type ReportViewModel,
} from "../reports/report-domain";
import styles from "./search-page.module.css";

interface SearchDraft {
  startDate: string;
  endDate: string;
}

function toReportRecord(
  task: Task,
  member: { id: string; name: string },
  projectsById: Map<string, Project>,
  pagesById: Map<string, ProjectPage>,
) {
  const project = task.projectId ? projectsById.get(task.projectId) ?? null : null;
  const page = task.pageId ? pagesById.get(task.pageId) ?? null : null;

  return {
    id: task.id,
    ownerId: member.id,
    ownerName: member.name,
    reportDate: task.taskDate,
    projectId: task.projectId ?? "",
    pageId: task.pageId ?? "",
    projectName: project?.name ?? "",
    pageName: page?.title ?? "",
    type1: task.taskType1 as ReportViewModel["type1"],
    type2: task.taskType2 as ReportViewModel["type2"],
    workHours: task.hours,
    content: task.content,
    note: task.note,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function updateDraftField<K extends keyof ReportDraft>(
  current: ReportDraft,
  key: K,
  value: ReportDraft[K],
  pages: ProjectPage[],
  taskTypes: TaskType[],
) {
  const next = { ...current, [key]: value } as ReportDraft;

  if (key === "projectId") {
    next.pageId = "";
  }

  if (key === "type1") {
    const nextType2Options = buildTaskType2Options(taskTypes, String(value));
    if (!nextType2Options.includes(next.type2)) {
      next.type2 = nextType2Options[0] ?? "";
    }
  }

  return next;
}

function buildExportFilename(startDate: string, endDate: string) {
  const compact = (value: string) => value.replaceAll("-", "").slice(2);

  if (startDate && endDate && startDate === endDate) {
    return `${compact(startDate)}_검색결과.xlsx`;
  }

  if (startDate && endDate) {
    return `${compact(startDate)}~${compact(endDate)}_검색결과.xlsx`;
  }

  if (startDate && !endDate) {
    return `${compact(startDate)}~${compact(startDate)}_검색결과.xlsx`;
  }

  if (!startDate && endDate) {
    return `${compact(endDate)}~${compact(endDate)}_검색결과.xlsx`;
  }

  return "검색결과.xlsx";
}

export function SearchPage() {
  const { session } = useAuth();
  const member = session?.member ?? null;
  const queryClient = useQueryClient();

  const [searchDraft, setSearchDraft] = useState<SearchDraft>({
    startDate: "",
    endDate: "",
  });
  const [appliedSearch, setAppliedSearch] = useState<SearchDraft>(searchDraft);
  const [sortMode, setSortMode] = useState<ReportSortMode>("date-desc");
  const [addDraft, setAddDraft] = useState<ReportDraft>(() => createEmptyReportDraft());
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<ReportDraft | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["search", "projects"],
    queryFn: async () => opsDataClient.getProjects(),
    enabled: Boolean(member),
  });

  const serviceGroupsQuery = useQuery({
    queryKey: ["search", "service-groups"],
    queryFn: async () => opsDataClient.getServiceGroups(),
    enabled: Boolean(member),
  });

  const pagesQuery = useQuery({
    queryKey: ["search", "pages", member?.id],
    queryFn: async () => opsDataClient.getProjectPages(member!),
    enabled: Boolean(member),
  });

  const taskTypesQuery = useQuery({
    queryKey: ["search", "task-types"],
    queryFn: async () => opsDataClient.getTaskTypes(),
    enabled: Boolean(member),
  });

  const tasksQuery = useQuery({
    queryKey: ["search", "tasks", member?.id, appliedSearch.startDate, appliedSearch.endDate],
    queryFn: async () =>
      opsDataClient.searchTasks(member!, {
        ...DEFAULT_REPORT_FILTERS,
        startDate: appliedSearch.startDate,
        endDate: appliedSearch.endDate,
      }),
    enabled: Boolean(member),
  });

  const projects = projectsQuery.data ?? [];
  const serviceGroups = serviceGroupsQuery.data ?? [];
  const pages = pagesQuery.data ?? [];
  const taskTypes = taskTypesQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project] as const)),
    [projects],
  );
  const pagesById = useMemo(
    () => new Map(pages.map((page) => [page.id, page] as const)),
    [pages],
  );
  const serviceGroupsById = useMemo(
    () => new Map(serviceGroups.map((group) => [group.id, group] as const)),
    [serviceGroups],
  );

  const reports = useMemo(() => {
    if (!member) {
      return [];
    }

    return tasks.map((task) => buildReportViewModel(toReportRecord(task, member, projectsById, pagesById), projectsById, serviceGroupsById, pagesById));
  }, [member, tasks, projectsById, pagesById, serviceGroupsById]);

  const sortedReports = useMemo(() => sortReportsByMode(reports, sortMode), [reports, sortMode]);

  const projectOptions = useMemo(
    () => buildProjectViewModels(projects, serviceGroups),
    [projects, serviceGroups],
  );
  const type1Options = useMemo(() => buildTaskType1Options(taskTypes), [taskTypes]);
  const type2Options = useMemo(
    () => buildTaskType2Options(taskTypes, editingDraft?.type1 ?? addDraft.type1),
    [addDraft.type1, editingDraft?.type1, taskTypes],
  );

  const invalidateQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["reports", "tasks", member?.id] }),
      queryClient.invalidateQueries({ queryKey: ["search", "tasks", member?.id] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard", member?.id] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats", member?.id] }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async (input: {
      id?: string;
      taskDate: string;
      projectId: string;
      pageId: string;
      taskType1: string;
      taskType2: string;
      hours: number;
      content: string;
      note: string;
    }) => {
      if (!member) {
        throw new Error("로그인 정보가 없습니다.");
      }

      let projectId = input.projectId.trim();
      const pageId = input.pageId.trim();

      if (pageId) {
        const page = pagesById.get(pageId);
        if (!page) {
          throw new Error("선택한 페이지 정보를 확인할 수 없습니다.");
        }

        if (projectId && page.projectId !== projectId) {
          throw new Error("선택한 프로젝트와 페이지 연결을 확인해 주세요.");
        }

        if (!projectId) {
          projectId = page.projectId;
        }
      }

      const taskType = validateTaskTypeSelection(taskTypes, input.taskType1, input.taskType2);

      return opsDataClient.saveTask(member, {
        id: input.id,
        taskDate: input.taskDate,
        projectId: projectId || null,
        pageId: pageId || null,
        taskType1: taskType.type1,
        taskType2: taskType.type2,
        hours: input.hours,
        content: input.content,
        note: input.note,
      });
    },
    onSuccess: async (task, variables) => {
      await invalidateQueries();

      const saved = buildReportViewModel(
        toReportRecord(task, member!, projectsById, pagesById),
        projectsById,
        serviceGroupsById,
        pagesById,
      );

      if (variables.id) {
        setStatusMessage(`"${saved.projectDisplayName}" 보고서를 수정했습니다.`);
      } else {
        setStatusMessage(`"${saved.projectDisplayName}" 보고서를 추가했습니다.`);
      }
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : "저장하지 못했습니다.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!member) {
        throw new Error("로그인 정보가 없습니다.");
      }

      await opsDataClient.deleteTask(member, taskId);
      return taskId;
    },
    onSuccess: async (taskId) => {
      await invalidateQueries();

      if (editingReportId === taskId) {
        setEditingReportId(null);
        setEditingDraft(null);
      }

      setStatusMessage("보고서를 삭제했습니다.");
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : "삭제하지 못했습니다.");
    },
  });

  const appliedTaskTypes = editingReportId ? type2Options : buildTaskType2Options(taskTypes, addDraft.type1);

  const filteredPagesForAdd = useMemo(
    () => pages.filter((page) => page.projectId === addDraft.projectId),
    [addDraft.projectId, pages],
  );

  const filteredPagesForEdit = useMemo(
    () => pages.filter((page) => page.projectId === editingDraft?.projectId),
    [editingDraft?.projectId, pages],
  );

  const beginEdit = (report: ReportViewModel) => {
    setEditingReportId(report.id);
    setEditingDraft(draftFromReport(report));
    setStatusMessage(`"${report.projectDisplayName}" 보고서를 수정 중입니다.`);
  };

  const startNewReport = () => {
    setSelectedReportId(null);
    setDraft(createEmptyReportDraft());
    setProjectQuery("");
    setActiveTab("report");
    setStatusMessage("");
  };

  const clearEditState = () => {
    setEditingReportId(null);
    setEditingDraft(null);
  };

  const cancelEdit = () => {
    clearEditState();
    setStatusMessage("편집을 취소했습니다.");
  };

  const runSearch = () => {
    setAppliedSearch(searchDraft);
    setStatusMessage("검색을 실행했습니다.");
  };

  const clearSearch = () => {
    const nextDraft = {
      startDate: "",
      endDate: "",
    };
    setSearchDraft(nextDraft);
    setAppliedSearch(nextDraft);
    setSortMode("date-desc");
    setStatusMessage("검색 조건을 초기화했습니다.");
  };

  const handleDownload = () => {
    downloadExcelFile(buildExportFilename(appliedSearch.startDate, appliedSearch.endDate), "검색결과", sortedReports, [
      { header: "작성일", value: (report) => report.reportDate, width: 12 },
      { header: "서비스그룹", value: (report) => report.serviceGroupName, width: 16 },
      { header: "프로젝트", value: (report) => report.projectDisplayName, width: 24 },
      { header: "페이지", value: (report) => report.pageDisplayName, width: 24 },
      { header: "업무유형 1", value: (report) => report.type1, width: 14 },
      { header: "업무유형 2", value: (report) => report.type2, width: 14 },
      { header: "소요시간", value: (report) => report.workHours, width: 12 },
      { header: "업무내용", value: (report) => report.content, width: 40 },
      { header: "비고", value: (report) => report.note, width: 28 },
    ]);
  };

  const handleSaveAdd = async () => {
    if (saveMutation.isPending) {
      return;
    }

    try {
      const taskType = validateTaskTypeSelection(taskTypes, addDraft.type1, addDraft.type2);
      const hours = parseReportHoursInput(addDraft.workHours);

      await saveMutation.mutateAsync({
        taskDate: addDraft.reportDate,
        projectId: addDraft.projectId,
        pageId: addDraft.pageId,
        taskType1: taskType.type1,
        taskType2: taskType.type2,
        hours,
        content: addDraft.content,
        note: addDraft.note,
      });

      setAddDraft(createEmptyReportDraft());
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "저장하지 못했습니다.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingReportId || !editingDraft) {
      return;
    }

    if (saveMutation.isPending) {
      return;
    }

    try {
      const taskType = validateTaskTypeSelection(taskTypes, editingDraft.type1, editingDraft.type2);
      const hours = parseReportHoursInput(editingDraft.workHours);

      await saveMutation.mutateAsync({
        id: editingReportId,
        taskDate: editingDraft.reportDate,
        projectId: editingDraft.projectId,
        pageId: editingDraft.pageId,
        taskType1: taskType.type1,
        taskType2: taskType.type2,
        hours,
        content: editingDraft.content,
        note: editingDraft.note,
      });

      clearEditState();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "저장하지 못했습니다.");
    }
  };

  const handleDelete = async (report: ReportViewModel) => {
    if (deleteMutation.isPending) {
      return;
    }

    const confirmed = window.confirm(`"${report.projectDisplayName}" 보고서를 삭제하시겠습니까?`);
    if (!confirmed) {
      return;
    }

    await deleteMutation.mutateAsync(report.id);
  };

  const applyAddDraftField = <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => {
    setAddDraft((current) => updateDraftField(current, key, value, pages, taskTypes));
  };

  const applyEditDraftField = <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => {
    setEditingDraft((current) => (current ? updateDraftField(current, key, value, pages, taskTypes) : current));
  };

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>업무보고 검색</h1>
        <div className={styles.heroActions}>
          <button type="button" className={styles.primaryButton} onClick={runSearch}>
            검색 실행
          </button>
          <button type="button" className={styles.secondaryButton} onClick={clearSearch}>
            초기화
          </button>
          <button type="button" className={styles.secondaryButton} onClick={handleDownload} disabled={!sortedReports.length}>
            엑셀 내보내기
          </button>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>검색 필터</h2>
          <div className={styles.toolbarActions}>
            <button type="button" className={styles.secondaryButton} onClick={runSearch}>
              검색
            </button>
            <button type="button" className={styles.secondaryButton} onClick={clearSearch}>
              초기화
            </button>
            <button type="button" className={styles.secondaryButton} onClick={handleDownload} disabled={!sortedReports.length}>
              엑셀파일로 내려받기
            </button>
          </div>
        </div>

        <div className={styles.searchGrid}>
          <label className={styles.field}>
            <span>시작일</span>
            <input
              type="date"
              value={searchDraft.startDate}
              onChange={(event) => setSearchDraft((current) => ({ ...current, startDate: event.target.value }))}
            />
          </label>

          <label className={styles.field}>
            <span>종료일</span>
            <input
              type="date"
              value={searchDraft.endDate}
              onChange={(event) => setSearchDraft((current) => ({ ...current, endDate: event.target.value }))}
            />
          </label>

          <label className={styles.field}>
            <span>정렬</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as ReportSortMode)}>
              <option value="date-desc">최신순</option>
              <option value="date-asc">오래된 순</option>
              <option value="updated-desc">최근 수정순</option>
              <option value="updated-asc">수정 오래된 순</option>
              <option value="project-asc">프로젝트 오름차순</option>
              <option value="project-desc">프로젝트 내림차순</option>
              <option value="hours-desc">시간 내림차순</option>
              <option value="hours-asc">시간 오름차순</option>
            </select>
          </label>
        </div>

        <p className={styles.status}>{statusMessage}</p>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>검색 결과 ({sortedReports.length})</h2>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>개인 검색 결과</caption>
            <thead>
              <tr>
                <th scope="col">일자</th>
                <th scope="col">프로젝트 / 페이지</th>
                <th scope="col">TYPE</th>
                <th scope="col">시간</th>
                <th scope="col">내용</th>
                <th scope="col">메모</th>
                <th scope="col">작업</th>
              </tr>
            </thead>
            <tbody>
              {sortedReports.map((report) => {
                const isEditing = editingReportId === report.id;

                if (isEditing && editingDraft) {
                  return (
                    <tr key={report.id} data-active>
                      <td>
                        <input
                          type="date"
                          value={editingDraft.reportDate}
                          onChange={(event) => applyEditDraftField("reportDate", event.target.value)}
                        />
                      </td>
                      <td className={styles.editCell}>
                        <select
                          value={editingDraft.projectId}
                          onChange={(event) => applyEditDraftField("projectId", event.target.value)}
                        >
                          <option value="">선택</option>
                          {projectOptions.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={editingDraft.pageId}
                          onChange={(event) => applyEditDraftField("pageId", event.target.value)}
                          disabled={!editingDraft.projectId}
                        >
                          <option value="">선택</option>
                          {filteredPagesForEdit.map((page) => (
                            <option key={page.id} value={page.id}>
                              {page.title}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={styles.editCell}>
                        <select
                          value={editingDraft.type1}
                          onChange={(event) => applyEditDraftField("type1", event.target.value as typeof editingDraft.type1)}
                        >
                          {type1Options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <select
                          value={editingDraft.type2}
                          onChange={(event) => applyEditDraftField("type2", event.target.value as typeof editingDraft.type2)}
                        >
                          {appliedTaskTypes.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={editingDraft.workHours}
                          onChange={(event) => applyEditDraftField("workHours", event.target.value)}
                        />
                      </td>
                      <td>
                        <textarea
                          value={editingDraft.content}
                          onChange={(event) => applyEditDraftField("content", event.target.value)}
                        />
                      </td>
                      <td>
                        <textarea value={editingDraft.note} onChange={(event) => applyEditDraftField("note", event.target.value)} />
                      </td>
                      <td className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.primaryButton}
                          onClick={() => void handleSaveEdit()}
                          disabled={saveMutation.isPending}
                        >
                          저장
                        </button>
                        <button type="button" className={styles.secondaryButton} onClick={cancelEdit} disabled={saveMutation.isPending}>
                          취소
                        </button>
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() => void handleDelete(report)}
                          disabled={deleteMutation.isPending}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={report.id}>
                    <td>{formatReportDate(report.reportDate)}</td>
                    <td>
                      <strong>{report.projectDisplayName}</strong>
                      <span>{report.pageDisplayName}</span>
                    </td>
                    <td>
                      <strong>{report.type1}</strong>
                      <span>{report.type2}</span>
                    </td>
                    <td>{formatReportHours(report.workHours)}</td>
                    <td>{report.content}</td>
                    <td>{report.note}</td>
                    <td className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => beginEdit(report)}
                        disabled={saveMutation.isPending || deleteMutation.isPending}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className={styles.ghostButton}
                        onClick={() => void handleDelete(report)}
                        disabled={deleteMutation.isPending}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!sortedReports.length && (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>
                    검색 조건에 맞는 보고가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
