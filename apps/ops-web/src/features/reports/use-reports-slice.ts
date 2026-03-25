import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../auth/AuthContext";
import { opsDataClient } from "../../lib/data-client";
import type { Project, ProjectPage, ReportFilters, Task, TaskType } from "../../lib/domain";
import {
  buildProjectViewModels,
  buildReportViewModel,
  buildTaskType1Options,
  buildTaskType2Options,
  createEmptyReportDraft,
  DEFAULT_REPORT_FILTERS,
  draftFromReport,
  getTodayInputValue,
  reportMatchesFilters,
  shiftDateInput,
  sortReportsDescending,
  type ProjectViewModel,
  type ReportDraft,
  type ReportRecord,
  type ReportViewModel,
} from "./report-domain";

export interface ReportsSlice {
  reports: ReportViewModel[];
  recentReports: ReportViewModel[];
  periodReports: ReportViewModel[];
  selectedReport: ReportViewModel | null;
  selectedReportId: string | null;
  draft: ReportDraft;
  projectQuery: string;
  projectOptions: ProjectViewModel[];
  filteredProjectOptions: ProjectViewModel[];
  draftPages: ProjectPage[];
  periodFilters: ReportFilters;
  type1Options: string[];
  type2Options: string[];
  statusMessage: string;
  activeTab: "report" | "period";
  setActiveTab: (tab: "report" | "period") => void;
  setDraftField: <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => void;
  setProjectQuery: (value: string) => void;
  setPeriodField: <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => void;
  selectReport: (id: string) => void;
  startNewReport: () => void;
  resetDraft: () => void;
  saveDraft: () => Promise<void>;
  jumpDraftDate: (offsetDays: number) => void;
  clearPeriodFilters: () => void;
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
    type1: task.taskType1 as ReportRecord["type1"],
    type2: task.taskType2 as ReportRecord["type2"],
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

  const [activeTab, setActiveTab] = useState<"report" | "period">("report");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReportDraft>(() => createEmptyReportDraft());
  const [projectQuery, setProjectQuery] = useState("");
  const [periodFilters, setPeriodFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS);
  const [statusMessage, setStatusMessage] = useState("새 보고를 작성할 수 있습니다.");

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

  const serviceGroupsQuery = useQuery({
    queryKey: ["reports", "service-groups"],
    queryFn: async () => opsDataClient.getServiceGroups(),
    enabled: Boolean(member),
  });

  const pagesQuery = useQuery({
    queryKey: ["reports", "pages", member?.id],
    queryFn: async () => opsDataClient.getProjectPages(member!),
    enabled: Boolean(member),
  });

  const taskTypesQuery = useQuery({
    queryKey: ["reports", "task-types"],
    queryFn: async () => opsDataClient.getTaskTypes(),
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

    return sortReportsDescending(
      tasks.map((task) => buildReportViewModel(toReportRecord(task, member, projectsById, pagesById), projectsById, serviceGroupsById, pagesById)),
    );
  }, [member, tasks, projectsById, pagesById, serviceGroupsById]);

  const recentReports = useMemo(() => reports.slice(0, 8), [reports]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId],
  );

  const periodReports = useMemo(
    () => sortReportsDescending(reports.filter((report) => reportMatchesFilters(report, periodFilters))),
    [reports, periodFilters],
  );

  const projectOptions = useMemo(
    () => buildProjectViewModels(projects, serviceGroups),
    [projects, serviceGroups],
  );

  const normalizedProjectQuery = projectQuery.trim().toLowerCase();
  const filteredProjectOptions = useMemo(() => {
    if (!normalizedProjectQuery) {
      return projectOptions;
    }

    return projectOptions.filter((project) => project.searchText.includes(normalizedProjectQuery));
  }, [projectOptions, normalizedProjectQuery]);

  const draftPages = useMemo(
    () => pages.filter((page) => page.projectId === draft.projectId),
    [draft.projectId, pages],
  );

  const type1Options = useMemo(() => buildTaskType1Options(taskTypes), [taskTypes]);
  const type2Options = useMemo(() => buildTaskType2Options(taskTypes, draft.type1), [taskTypes, draft.type1]);

  const invalidateReportQueries = async () => {
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

      return opsDataClient.saveTask(member, {
        id: input.id,
        taskDate: input.taskDate,
        projectId: projectId || null,
        pageId: pageId || null,
        taskType1: input.taskType1,
        taskType2: input.taskType2,
        hours: input.hours,
        content: input.content,
        note: input.note,
      });
    },
    onSuccess: async (task, variables) => {
      await invalidateReportQueries();

      const saved = buildReportViewModel(
        toReportRecord(task, member!, projectsById, pagesById),
        projectsById,
        serviceGroupsById,
        pagesById,
      );

      setSelectedReportId(saved.id);
      setDraft(draftFromReport(saved));
      setProjectQuery(saved.projectDisplayName);
      setStatusMessage(
        variables.id ? `"${saved.projectDisplayName}" 보고서를 수정했습니다.` : `"${saved.projectDisplayName}" 보고서를 저장했습니다.`,
      );
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : "저장하지 못했습니다.");
    },
  });

  const setDraftField = <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => {
    setDraft((current) => {
      const next = { ...current, [key]: value } as ReportDraft;

      if (key === "projectId") {
        const nextPages = pages.filter((page) => page.projectId === String(value));
        next.pageId = nextPages[0]?.id ?? "";
      }

      if (key === "type1") {
        const nextType2Options = buildTaskType2Options(taskTypes, String(value));
        if (!nextType2Options.includes(next.type2)) {
          next.type2 = nextType2Options[0] ?? "";
        }
      }

      return next;
    });
  };

  const setPeriodField = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => {
    setPeriodFilters((current) => {
      if (key === "projectId") {
        return {
          ...current,
          projectId: value as ReportFilters["projectId"],
          pageId: "",
        };
      }

      return { ...current, [key]: value };
    });
  };

  const selectReport = (id: string) => {
    const report = reports.find((item) => item.id === id);
    if (!report) {
      return;
    }

    setSelectedReportId(id);
    setDraft(draftFromReport(report));
    setProjectQuery(report.projectDisplayName);
    setActiveTab("report");
    setStatusMessage(`"${report.projectDisplayName}" 보고서를 불러왔습니다.`);
  };

  const startNewReport = () => {
    setSelectedReportId(null);
    setDraft(createEmptyReportDraft());
    setProjectQuery("");
    setActiveTab("report");
    setStatusMessage("새 보고를 작성할 수 있습니다.");
  };

  const resetDraft = () => {
    startNewReport();
  };

  const saveDraft = async () => {
    await saveMutation.mutateAsync({
      id: selectedReportId ?? undefined,
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

  const jumpDraftDate = (offsetDays: number) => {
    setDraftField("reportDate", shiftDateInput(draft.reportDate || getTodayInputValue(), offsetDays));
  };

  const clearPeriodFilters = () => {
    setPeriodFilters(DEFAULT_REPORT_FILTERS);
  };

  return {
    reports,
    recentReports,
    periodReports,
    selectedReport,
    selectedReportId,
    draft,
    projectQuery,
    projectOptions,
    filteredProjectOptions,
    draftPages,
    periodFilters,
    type1Options,
    type2Options,
    statusMessage,
    activeTab,
    setActiveTab,
    setDraftField,
    setProjectQuery,
    setPeriodField,
    selectReport,
    startNewReport,
    resetDraft,
    saveDraft,
    jumpDraftDate,
    clearPeriodFilters,
  };
}
