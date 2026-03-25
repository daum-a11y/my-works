import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../auth/AuthContext";
import { opsDataClient } from "../../lib/data-client";
import { type Project, type ProjectPage, type ReportFilters, type Task } from "../../lib/domain";
import {
  createEmptyReportDraft,
  DEFAULT_REPORT_FILTERS,
  draftFromReport,
  reportMatchesFilters,
  sortReportsDescending,
  type ReportDraft,
  type ReportRecord,
  type ReportType1,
  type ReportType2,
} from "./report-domain";

export interface ReportsSlice {
  reports: ReportRecord[];
  filteredReports: ReportRecord[];
  selectedReport: ReportRecord | null;
  draft: ReportDraft;
  filters: ReportFilters;
  statusMessage: string;
  pendingDeleteId: string | null;
  projects: Project[];
  draftPages: ProjectPage[];
  filterPages: ProjectPage[];
  setDraftField: <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => void;
  setFilterField: <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => void;
  selectReport: (id: string) => void;
  startNewReport: () => void;
  saveDraft: () => void;
  promptDelete: (id: string) => void;
  cancelDelete: () => void;
  confirmDelete: () => void;
  resetDraft: () => void;
}

function toReportRecord(
  task: Task,
  currentMember: { id: string; name: string },
  projectsById: Map<string, Project>,
  pagesById: Map<string, ProjectPage>,
): ReportRecord {
  const project = task.projectId ? projectsById.get(task.projectId) ?? null : null;
  const page = task.pageId ? pagesById.get(task.pageId) ?? null : null;

  return {
    id: task.id,
    ownerId: currentMember.id,
    ownerName: currentMember.name,
    reportDate: task.taskDate,
    projectId: task.projectId ?? "",
    pageId: task.pageId ?? "",
    projectName: project?.name ?? "",
    pageName: page?.title ?? "",
    type1: task.taskType1 as ReportType1,
    type2: task.taskType2 as ReportType2,
    workHours: task.hours,
    content: task.content,
    note: task.note,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export function useReportsSlice(): ReportsSlice {
  const { session } = useAuth();
  const member = session?.member ?? null;
  const queryClient = useQueryClient();
  const hasInitializedSelection = useRef(false);

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReportDraft>(() => createEmptyReportDraft());
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS);
  const [statusMessage, setStatusMessage] = useState("보고서를 불러오는 중입니다.");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const tasksQuery = useQuery({
    queryKey: ["reports", "tasks", member?.id],
    queryFn: async () => opsDataClient.getTasks(member!),
    enabled: Boolean(member),
  });

  const projectsQuery = useQuery({
    queryKey: ["reports", "projects"],
    queryFn: async () => opsDataClient.getProjects(),
    enabled: Boolean(member),
  });

  const pagesQuery = useQuery({
    queryKey: ["reports", "pages", member?.id],
    queryFn: async () => opsDataClient.getProjectPages(member!),
    enabled: Boolean(member),
  });

  const projects = projectsQuery.data ?? [];
  const pages = pagesQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project] as const)),
    [projects],
  );
  const pagesById = useMemo(
    () => new Map(pages.map((page) => [page.id, page] as const)),
    [pages],
  );

  const reports = useMemo(() => {
    if (!member) {
      return [];
    }

    return sortReportsDescending(
      tasks.map((task) => toReportRecord(task, member, projectsById, pagesById)),
    );
  }, [member, tasks, projectsById, pagesById]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId],
  );

  const filteredReports = useMemo(
    () => sortReportsDescending(reports.filter((report) => reportMatchesFilters(report, filters))),
    [reports, filters],
  );

  const draftPages = useMemo(
    () => pages.filter((page) => page.projectId === draft.projectId),
    [draft.projectId, pages],
  );
  const filterPages = useMemo(
    () => (filters.projectId ? pages.filter((page) => page.projectId === filters.projectId) : pages),
    [filters.projectId, pages],
  );

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

      if (!input.projectId) {
        throw new Error("프로젝트를 선택해 주세요.");
      }

      if (!input.pageId) {
        throw new Error("페이지를 선택해 주세요.");
      }

      const page = pagesById.get(input.pageId);
      if (!page || page.projectId !== input.projectId) {
        throw new Error("선택한 프로젝트와 페이지 연결을 확인해 주세요.");
      }

      return opsDataClient.saveTask(member, {
        id: input.id,
        taskDate: input.taskDate,
        projectId: input.projectId,
        pageId: input.pageId,
        taskType1: input.taskType1,
        taskType2: input.taskType2,
        hours: input.hours,
        content: input.content,
        note: input.note,
      });
    },
    onSuccess: async (task) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reports", "tasks", member?.id] }),
        queryClient.invalidateQueries({ queryKey: ["search", "tasks", member?.id] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", member?.id] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats", member?.id] }),
      ]);

      const saved = toReportRecord(task, member!, projectsById, pagesById);
      setSelectedReportId(saved.id);
      setDraft(draftFromReport(saved));
      setPendingDeleteId(null);
      setStatusMessage(`"${saved.projectName}" 보고서를 저장했습니다.`);
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reports", "tasks", member?.id] }),
        queryClient.invalidateQueries({ queryKey: ["search", "tasks", member?.id] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard", member?.id] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats", member?.id] }),
      ]);

      if (selectedReportId === taskId) {
        setSelectedReportId(null);
        setDraft(createEmptyReportDraft());
      }

      setPendingDeleteId(null);
      setStatusMessage("보고서를 삭제했습니다.");
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : "삭제하지 못했습니다.");
    },
  });

  useEffect(() => {
    if (!reports.length) {
      if (!tasksQuery.isLoading && !hasInitializedSelection.current) {
        hasInitializedSelection.current = true;
      }
      return;
    }

    const current = selectedReportId ? reports.find((report) => report.id === selectedReportId) : null;

    if (!hasInitializedSelection.current) {
      const first = reports[0];
      hasInitializedSelection.current = true;
      setSelectedReportId(first.id);
      setDraft(draftFromReport(first));
      setStatusMessage(`"${first.projectName}" 보고서를 불러왔습니다.`);
      return;
    }

    if (selectedReportId && !current) {
      const first = reports[0];
      setSelectedReportId(first.id);
      setDraft(draftFromReport(first));
      setStatusMessage(`"${first.projectName}" 보고서를 불러왔습니다.`);
    }
  }, [reports, selectedReportId, tasksQuery.isLoading]);

  const setDraftField = <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => {
    setDraft((current) => {
      if (key === "projectId") {
        return { ...current, projectId: value as string, pageId: "" };
      }

      return { ...current, [key]: value };
    });
  };

  const setFilterField = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => {
    setFilters((current: ReportFilters) => {
      if (key === "projectId") {
        return { ...current, projectId: value as string, pageId: "" };
      }

      return { ...current, [key]: value };
    });
  };

  const selectReport = (id: string) => {
    const report = reports.find((item) => item.id === id) ?? null;
    setSelectedReportId(report?.id ?? null);
    if (report) {
      setDraft(draftFromReport(report));
      setStatusMessage(`"${report.projectName}" 보고서를 불러왔습니다.`);
    }
    setPendingDeleteId(null);
  };

  const startNewReport = () => {
    setSelectedReportId(null);
    setDraft(createEmptyReportDraft());
    setPendingDeleteId(null);
    setStatusMessage("새 업무보고를 작성할 수 있습니다.");
  };

  const resetDraft = () => {
    if (selectedReport) {
      setDraft(draftFromReport(selectedReport));
      setStatusMessage("선택한 보고서의 원본 값으로 되돌렸습니다.");
      return;
    }

    setDraft(createEmptyReportDraft());
    setStatusMessage("새 업무보고 초안으로 초기화했습니다.");
  };

  const saveDraft = () => {
    void saveMutation.mutateAsync({
      id: selectedReport?.id,
      taskDate: draft.reportDate,
      projectId: draft.projectId,
      pageId: draft.pageId,
      taskType1: draft.type1,
      taskType2: draft.type2,
      hours: Number.parseFloat(draft.workHours) || 0,
      content: draft.content,
      note: draft.note,
    });
  };

  const promptDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) {
      return;
    }

    void deleteMutation.mutateAsync(pendingDeleteId);
  };

  return {
    reports,
    filteredReports,
    selectedReport,
    draft,
    filters,
    statusMessage,
    pendingDeleteId,
    projects,
    draftPages,
    filterPages,
    setDraftField,
    setFilterField,
    selectReport,
    startNewReport,
    saveDraft,
    promptDelete,
    cancelDelete,
    confirmDelete,
    resetDraft,
  };
}
