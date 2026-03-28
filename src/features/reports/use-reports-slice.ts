import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../auth/AuthContext';
import { opsDataClient } from '../../lib/data-client';
import type {
  Project,
  ProjectPage,
  ReportFilters,
  Task,
  TaskActivity,
  TaskType,
} from '../../lib/domain';
import {
  buildProjectViewModels,
  buildReportViewModel,
  buildTaskType1Options,
  buildTaskType2Options,
  createEmptyReportDraft,
  DEFAULT_REPORT_FILTERS,
  draftFromReport,
  getTodayInputValue,
  parseReportHoursInput,
  reportMatchesFilters,
  shiftDateInput,
  sortReportsDescending,
  validateTaskTypeSelection,
  type ProjectViewModel,
  type ReportDraft,
  type ReportRecord,
  type ReportViewModel,
} from './report-domain';

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
  taskTypes: TaskType[];
  periodFilters: ReportFilters;
  type1Options: string[];
  type2Options: string[];
  missingTimeLines: string[];
  isSaving: boolean;
  statusMessage: string;
  activeTab: 'report' | 'period';
  setActiveTab: (tab: 'report' | 'period') => void;
  setDraftField: <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => void;
  setProjectQuery: (value: string) => void;
  applyProjectQuery: () => void;
  setPeriodField: <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => void;
  applyPeriodFilters: (nextFilters?: ReportFilters) => void;
  selectReport: (id: string) => void;
  startNewReport: () => void;
  resetDraft: () => void;
  saveDraft: () => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  saveOverheadReport: (hours: number, reportDate?: string) => Promise<void>;
  jumpDraftDate: (offsetDays: number) => void;
  clearPeriodFilters: () => void;
}

function toReportRecord(
  task: Task,
  currentMember: { id: string; name: string },
  projectsById: Map<string, Project>,
  pagesById: Map<string, ProjectPage>,
): ReportRecord {
  const project = task.projectId ? (projectsById.get(task.projectId) ?? null) : null;
  const page = task.pageId ? (pagesById.get(task.pageId) ?? null) : null;

  return {
    id: task.id,
    ownerId: currentMember.id,
    ownerName: currentMember.name,
    reportDate: task.taskDate,
    projectId: task.projectId ?? '',
    pageId: task.pageId ?? '',
    projectName: project?.name ?? '',
    pageName: page?.title ?? '',
    type1: task.taskType1 as ReportRecord['type1'],
    type2: task.taskType2 as ReportRecord['type2'],
    workHours: task.hours,
    content: task.content,
    note: task.note,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function toDateOnly(value: string) {
  return value.slice(0, 10);
}

function buildMissingTimeLines(
  memberJoinedAt: string,
  memberId: string,
  activities: TaskActivity[],
) {
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const beforeMonth = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth() - 1,
    yesterday.getDate(),
  );
  const joinedDate = new Date(memberJoinedAt.slice(0, 10));
  const startDate = joinedDate > beforeMonth ? joinedDate : beforeMonth;
  const start = toDateOnly(startDate.toISOString());
  const end = toDateOnly(yesterday.toISOString());

  const allDates = new Set(
    activities
      .map((activity) => activity.taskDate)
      .filter((taskDate) => taskDate >= start && taskDate <= end),
  );
  const myActivities = activities.filter(
    (activity) =>
      activity.memberId === memberId && activity.taskDate >= start && activity.taskDate <= end,
  );
  const myDates = new Set(myActivities.map((activity) => activity.taskDate));
  const lines: string[] = [];

  for (const taskDate of [...allDates].sort()) {
    if (!myDates.has(taskDate)) {
      lines.push(`${taskDate} 일에 하나도 입력 안했어요 -0-;.`);
    }
  }

  const hoursByDate = new Map<string, number>();
  for (const activity of myActivities) {
    hoursByDate.set(activity.taskDate, (hoursByDate.get(activity.taskDate) ?? 0) + activity.hours);
  }

  for (const [taskDate, totalHours] of [...hoursByDate.entries()].sort((left, right) =>
    right[0].localeCompare(left[0]),
  )) {
    const diff = 480 - totalHours;
    if (totalHours < 480) {
      lines.push(`${taskDate} 일의 시간이 ${diff} 분 모자름요.`);
    } else if (totalHours > 480) {
      lines.push(`${taskDate} 일 ${Math.abs(diff)} 분 야근했음.`);
    }
  }

  if (!myActivities.length) {
    return ['결과 값이 존재하지 않습니다.'];
  }

  return lines.length ? lines : ['Awesome! 완벽한 입력!'];
}

function buildLegacyNote(rawNote: string, meta: Record<string, string>) {
  const lines = [
    `platform: ${meta.platform}`,
    `service_group: ${meta.serviceGroupName}`,
    `service_name: ${meta.serviceName}`,
    `project_name: ${meta.projectName}`,
    `page_name: ${meta.pageName}`,
    `page_url: ${meta.pageUrl}`,
  ];

  if (rawNote.trim()) {
    lines.push(`raw_note: ${rawNote.trim()}`);
  }

  return lines.join('\n');
}

export function useReportsSlice(): ReportsSlice {
  const { session } = useAuth();
  const member = session?.member ?? null;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'report' | 'period'>('report');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReportDraft>(() => createEmptyReportDraft());
  const [projectQuery, setProjectQuery] = useState('');
  const [periodFilters, setPeriodFilters] = useState<ReportFilters>(DEFAULT_REPORT_FILTERS);
  const [appliedProjectQuery, setAppliedProjectQuery] = useState('');
  const [appliedPeriodFilters, setAppliedPeriodFilters] =
    useState<ReportFilters>(DEFAULT_REPORT_FILTERS);
  const [statusMessage, setStatusMessage] = useState('');

  const tasksQuery = useQuery({
    queryKey: ['reports', 'tasks', member?.id],
    queryFn: async () => opsDataClient.getTasks(member!),
    enabled: Boolean(member),
  });

  const projectsQuery = useQuery({
    queryKey: ['reports', 'projects'],
    queryFn: async () => opsDataClient.getProjects(),
    enabled: Boolean(member),
  });

  const serviceGroupsQuery = useQuery({
    queryKey: ['reports', 'service-groups'],
    queryFn: async () => opsDataClient.getServiceGroups(),
    enabled: Boolean(member),
  });

  const pagesQuery = useQuery({
    queryKey: ['reports', 'pages', member?.id],
    queryFn: async () => opsDataClient.getProjectPages(member!),
    enabled: Boolean(member),
  });

  const taskTypesQuery = useQuery({
    queryKey: ['reports', 'task-types'],
    queryFn: async () => opsDataClient.getTaskTypes(),
    enabled: Boolean(member),
  });
  const taskActivitiesQuery = useQuery({
    queryKey: ['reports', 'task-activities'],
    queryFn: async () => opsDataClient.getTaskActivities(),
    enabled: Boolean(member),
  });

  const projects = projectsQuery.data ?? [];
  const serviceGroups = serviceGroupsQuery.data ?? [];
  const pages = pagesQuery.data ?? [];
  const taskTypes = taskTypesQuery.data ?? [];
  const taskActivities = taskActivitiesQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];

  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project] as const)),
    [projects],
  );
  const pagesById = useMemo(() => new Map(pages.map((page) => [page.id, page] as const)), [pages]);
  const serviceGroupsById = useMemo(
    () => new Map(serviceGroups.map((group) => [group.id, group] as const)),
    [serviceGroups],
  );

  const reports = useMemo(() => {
    if (!member) {
      return [];
    }

    return sortReportsDescending(
      tasks.map((task) =>
        buildReportViewModel(
          toReportRecord(task, member, projectsById, pagesById),
          projectsById,
          serviceGroupsById,
          pagesById,
        ),
      ),
    );
  }, [member, tasks, projectsById, pagesById, serviceGroupsById]);

  const recentReports = useMemo(() => reports.slice(0, 8), [reports]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId],
  );

  const periodReports = useMemo(
    () =>
      sortReportsDescending(
        reports.filter((report) => reportMatchesFilters(report, appliedPeriodFilters)),
      ),
    [reports, appliedPeriodFilters],
  );

  const projectOptions = useMemo(
    () => buildProjectViewModels(projects, serviceGroups),
    [projects, serviceGroups],
  );

  const normalizedProjectQuery = appliedProjectQuery.trim().toLowerCase();
  const filteredProjectOptions = useMemo(() => {
    if (!normalizedProjectQuery) {
      return projectOptions.slice(0, 60);
    }

    return projectOptions
      .filter((project) =>
        project.project.name.trim().toLowerCase().includes(normalizedProjectQuery),
      )
      .slice(0, 60);
  }, [projectOptions, normalizedProjectQuery]);

  const draftPages = useMemo(
    () => pages.filter((page) => page.projectId === draft.projectId),
    [draft.projectId, pages],
  );

  const type1Options = useMemo(() => buildTaskType1Options(taskTypes), [taskTypes]);
  const type2Options = useMemo(
    () => buildTaskType2Options(taskTypes, draft.type1),
    [taskTypes, draft.type1],
  );
  const missingTimeLines = useMemo(() => {
    if (!member) {
      return [];
    }

    return buildMissingTimeLines(member.joinedAt, member.id, taskActivities);
  }, [member, taskActivities]);

  const invalidateReportQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['reports', 'tasks', member?.id] }),
      queryClient.invalidateQueries({ queryKey: ['search', 'tasks', member?.id] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', member?.id] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', member?.id] }),
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
        throw new Error('로그인 정보가 없습니다.');
      }

      let projectId = input.projectId.trim();
      const pageId = input.pageId.trim();

      if (pageId) {
        const page = pagesById.get(pageId);
        if (!page) {
          throw new Error('선택한 페이지 정보를 확인할 수 없습니다.');
        }

        if (projectId && page.projectId !== projectId) {
          throw new Error('선택한 프로젝트와 페이지 연결을 확인해 주세요.');
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
      await invalidateReportQueries();

      setSelectedReportId(null);
      setDraft(createEmptyReportDraft());
      setProjectQuery('');
      setAppliedProjectQuery('');
      setActiveTab('report');
      setStatusMessage(variables.id ? '수정되었습니다.' : '등록되었습니다.');
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : '저장하지 못했습니다.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!member) {
        throw new Error('로그인 정보가 없습니다.');
      }

      await opsDataClient.deleteTask(member, taskId);
    },
    onSuccess: async (_, taskId) => {
      await invalidateReportQueries();

      if (selectedReportId === taskId) {
        setSelectedReportId(null);
        setDraft(createEmptyReportDraft());
        setProjectQuery('');
        setAppliedProjectQuery('');
      }

      setStatusMessage('보고서를 삭제했습니다.');
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : '삭제하지 못했습니다.');
    },
  });

  const setDraftField = <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => {
    setDraft((current) => {
      const next = { ...current, [key]: value } as ReportDraft;

      if (key === 'projectId') {
        next.pageId = '';
        const project = projectsById.get(String(value));
        if (project) {
          const normalizedServiceName = project.serviceGroupId
            ? (serviceGroupsById.get(project.serviceGroupId)?.name ?? '')
            : '';
          const separator = normalizedServiceName.indexOf(' / ');
          next.type1 = project.projectType1;
          const nextType2Options = buildTaskType2Options(taskTypes, next.type1);
          if (!nextType2Options.includes(next.type2)) {
            next.type2 = '';
          }
          next.platform = project.platform;
          next.serviceGroupName =
            separator < 0 ? normalizedServiceName : normalizedServiceName.slice(0, separator);
          next.serviceName = separator < 0 ? '' : normalizedServiceName.slice(separator + 3);
          next.pageUrl = project.reportUrl;
        } else {
          next.type1 = '';
          next.type2 = '';
          next.platform = '';
          next.serviceGroupName = '';
          next.serviceName = '';
          next.pageUrl = '';
        }
      }

      if (key === 'pageId') {
        const page = pagesById.get(String(value));
        if (page) {
          next.pageUrl = page.url;
        }
      }

      if (key === 'type1') {
        const nextType2Options = buildTaskType2Options(taskTypes, String(value));
        if (!nextType2Options.includes(next.type2)) {
          next.type2 = '';
        }
      }

      return next;
    });
  };

  const setPeriodField = <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => {
    setPeriodFilters((current) => {
      if (key === 'projectId') {
        return {
          ...current,
          projectId: value as ReportFilters['projectId'],
          pageId: '',
        };
      }

      return { ...current, [key]: value };
    });
  };

  const applyProjectQuery = () => {
    setAppliedProjectQuery(projectQuery);
  };

  const applyPeriodFilters = (nextFilters = periodFilters) => {
    setAppliedPeriodFilters(nextFilters);
  };

  const selectReport = (id: string) => {
    const report = reports.find((item) => item.id === id);
    if (!report) {
      return;
    }

    setSelectedReportId(id);
    setDraft(draftFromReport(report));
  };

  const startNewReport = () => {
    setSelectedReportId(null);
    setDraft(createEmptyReportDraft());
    setProjectQuery('');
    setAppliedProjectQuery('');
    setActiveTab('report');
    setStatusMessage('');
  };

  const resetDraft = () => {
    startNewReport();
  };

  const saveDraft = async () => {
    if (saveMutation.isPending) {
      return;
    }

    try {
      const taskType = validateTaskTypeSelection(taskTypes, draft.type1, draft.type2);
      const hours = parseReportHoursInput(draft.workHours);
      const project = draft.projectId ? (projectsById.get(draft.projectId) ?? null) : null;
      const page = draft.pageId ? (pagesById.get(draft.pageId) ?? null) : null;
      const serviceGroupName =
        draft.serviceGroupName ||
        (project?.serviceGroupId
          ? (serviceGroupsById.get(project.serviceGroupId)?.name ?? '')
          : '');
      const serviceName = draft.serviceName || '';
      const pageName = draft.manualPageName || page?.title || '';
      const pageUrl = draft.pageUrl || page?.url || project?.reportUrl || '';
      const note = buildLegacyNote(draft.note, {
        platform: draft.platform || project?.platform || '',
        serviceGroupName,
        serviceName,
        projectName: project?.name || '',
        pageName,
        pageUrl,
      });

      await saveMutation.mutateAsync({
        id: selectedReportId ?? undefined,
        taskDate: draft.reportDate,
        projectId: draft.projectId,
        pageId: draft.pageId,
        taskType1: taskType.type1,
        taskType2: taskType.type2,
        hours,
        content: draft.content,
        note,
      });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '저장하지 못했습니다.');
    }
  };

  const deleteDraft = async (id: string) => {
    if (deleteMutation.isPending) {
      return;
    }

    await deleteMutation.mutateAsync(id);
  };

  const saveOverheadReport = async (hours: number, reportDate = getTodayInputValue()) => {
    if (saveMutation.isPending) {
      return;
    }

    try {
      const taskType = validateTaskTypeSelection(taskTypes, '기타버퍼', '오버헤드');

      await saveMutation.mutateAsync({
        taskDate: reportDate,
        projectId: '',
        pageId: '',
        taskType1: taskType.type1,
        taskType2: taskType.type2,
        hours,
        content: '',
        note: '',
      });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : '저장하지 못했습니다.');
    }
  };

  const jumpDraftDate = (offsetDays: number) => {
    setDraftField(
      'reportDate',
      shiftDateInput(draft.reportDate || getTodayInputValue(), offsetDays),
    );
  };

  const clearPeriodFilters = () => {
    setPeriodFilters(DEFAULT_REPORT_FILTERS);
    setAppliedPeriodFilters(DEFAULT_REPORT_FILTERS);
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
    taskTypes,
    periodFilters,
    type1Options,
    type2Options,
    missingTimeLines,
    isSaving: saveMutation.isPending,
    statusMessage,
    activeTab,
    setActiveTab,
    setDraftField,
    setProjectQuery,
    applyProjectQuery,
    setPeriodField,
    applyPeriodFilters,
    selectReport,
    startNewReport,
    resetDraft,
    saveDraft,
    deleteDraft,
    saveOverheadReport,
    jumpDraftDate,
    clearPeriodFilters,
  };
}
