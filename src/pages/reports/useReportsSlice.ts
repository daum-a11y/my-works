import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../auth/AuthContext';
import { dataClient } from '../../api/client';
import {
  toCostGroup,
  toPlatform,
  toProject,
  toProjectPage,
  toReportProjectOption,
  toServiceGroup,
  toTask,
  toTaskType,
} from './reportsApiTransform';
import type { CostGroup, Platform, ProjectPage, TaskType } from '../../types/domain';
import {
  buildProjectViewModels,
  buildProjectViewModelsFromRows,
  buildTaskReportViewModel,
  buildSelectableTaskType1Options,
  buildTaskType2OptionsForValue,
  createEmptyReportDraft,
  draftFromReport,
  getTodayInputValue,
  parseReportTaskUsedtimeInput,
  shiftDateInput,
  sortReportsDescending,
  validateTaskTypeSelection,
  type ProjectViewModel,
  type ReportDraft,
  type ReportViewModel,
} from './reportUtils';

export interface ReportsSlice {
  dailyReports: ReportViewModel[];
  selectedReport: ReportViewModel | null;
  selectedReportId: string | null;
  draft: ReportDraft;
  selectedDate: string;
  projectQuery: string;
  appliedProjectQuery: string | null;
  projectOptions: ProjectViewModel[];
  filteredProjectOptions: ProjectViewModel[];
  draftPages: ProjectPage[];
  costGroupOptions: CostGroup[];
  taskTypes: TaskType[];
  type1Options: string[];
  type2Options: string[];
  platformOptions: Platform[];
  canEditReports: boolean;
  isSaving: boolean;
  statusMessage: string;
  statusKind: 'success' | 'error' | 'info';
  isEditMode: boolean;
  activeTab: 'report' | 'period';
  setActiveTab: (tab: 'report' | 'period') => void;
  setDraftField: <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => void;
  setSelectedDate: (value: string) => void;
  setProjectQuery: (value: string) => void;
  applyProjectQuery: () => void;
  selectReport: (id: string) => void;
  cancelEdit: () => void;
  startNewReport: () => void;
  resetDraft: () => void;
  saveDraft: (reportDateOverride?: string) => Promise<void>;
  deleteDraft: (id: string) => Promise<void>;
  overheadCostGroupId: string;
  setOverheadCostGroupId: (value: string) => void;
  saveOverheadReport: (taskUsedtime: number, reportDate?: string) => Promise<void>;
  jumpDraftDate: (offsetDays: number) => void;
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error) {
    const data = error as Record<string, unknown>;
    const message = typeof data.message === 'string' ? data.message : '';
    const details = typeof data.details === 'string' ? data.details : '';
    const hint = typeof data.hint === 'string' ? data.hint : '';
    const code = typeof data.code === 'string' ? data.code : '';
    const merged = [message, details, hint, code].filter(Boolean).join(' | ');
    if (merged) {
      return merged;
    }
  }

  return fallback;
}

function isValidTaskDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeTaskDate(value: string) {
  const trimmed = value.trim();
  if (isValidTaskDate(trimmed)) {
    return trimmed;
  }

  const compact = trimmed.replace(/\D/g, '');
  if (/^\d{8}$/.test(compact)) {
    return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
  }

  if (trimmed.length >= 10) {
    const head = trimmed.slice(0, 10);
    if (isValidTaskDate(head)) {
      return head;
    }
  }

  return '';
}

export function useReportsSlice(): ReportsSlice {
  const { session } = useAuth();
  const member = session?.member ?? null;
  const canEditReports = Boolean(member?.reportRequired);
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'report' | 'period'>('report');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReportDraft>(() => createEmptyReportDraft());
  const [selectedDate, setSelectedDate] = useState(() => getTodayInputValue());
  const [projectQuery, setProjectQuery] = useState('');
  const [appliedProjectQuery, setAppliedProjectQuery] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusKind, setStatusKind] = useState<'success' | 'error' | 'info'>('info');
  const [overheadCostGroupId, setOverheadCostGroupId] = useState('');

  const tasksQuery = useQuery({
    queryKey: ['reports', 'tasks', member?.id, selectedDate],
    queryFn: async () => dataClient.getTasksByDate(member!, selectedDate),
    enabled: Boolean(member),
  });
  const tasks = useMemo(() => (tasksQuery.data ?? []).map(toTask), [tasksQuery.data]);

  const reportProjectsQuery = useQuery({
    queryKey: ['reports', 'project-options', draft.costGroupId, draft.type1, appliedProjectQuery],
    queryFn: async () =>
      dataClient.searchReportProjects({
        costGroupId: draft.costGroupId || null,
        platform: null,
        taskType1: draft.type1 || null,
        query: appliedProjectQuery || null,
      }),
    enabled: Boolean(member && draft.costGroupId && draft.type1 && appliedProjectQuery !== null),
  });

  const serviceGroupsQuery = useQuery({
    queryKey: ['reports', 'service-groups'],
    queryFn: async () => dataClient.getServiceGroups(),
    enabled: Boolean(member),
  });
  const costGroupsQuery = useQuery({
    queryKey: ['reports', 'cost-groups'],
    queryFn: async () => dataClient.getCostGroups(),
    enabled: Boolean(member),
  });

  const pagesQuery = useQuery({
    queryKey: ['reports', 'pages', member?.id, draft.projectId],
    queryFn: async () => {
      if (!draft.projectId) {
        return [];
      }

      return dataClient.getProjectPagesByProjectId(draft.projectId);
    },
    enabled: Boolean(member),
  });

  const selectedProjectQuery = useQuery({
    queryKey: ['reports', 'project', draft.projectId],
    queryFn: async () => {
      if (!draft.projectId) {
        return null;
      }

      return dataClient.getProject(draft.projectId);
    },
    enabled: Boolean(member && draft.projectId),
  });

  const taskTypesQuery = useQuery({
    queryKey: ['reports', 'task-types'],
    queryFn: async () => dataClient.getTaskTypes(),
    enabled: Boolean(member),
  });
  const platformsQuery = useQuery({
    queryKey: ['reports', 'platforms'],
    queryFn: async () => dataClient.getPlatforms(),
    enabled: Boolean(member),
  });
  const reportProjectRows = useMemo(
    () => (reportProjectsQuery.data ?? []).map(toReportProjectOption),
    [reportProjectsQuery.data],
  );
  const costGroupOptions = useMemo(
    () => (costGroupsQuery.data ?? []).map(toCostGroup),
    [costGroupsQuery.data],
  );
  const platformOptions = useMemo(
    () => (platformsQuery.data ?? []).map(toPlatform),
    [platformsQuery.data],
  );
  const serviceGroups = useMemo(
    () => (serviceGroupsQuery.data ?? []).map(toServiceGroup),
    [serviceGroupsQuery.data],
  );
  const pages = useMemo(() => (pagesQuery.data ?? []).map(toProjectPage), [pagesQuery.data]);
  const taskTypes = useMemo(
    () => (taskTypesQuery.data ?? []).map(toTaskType),
    [taskTypesQuery.data],
  );

  const projectOptionsFromSearch = useMemo(
    () => buildProjectViewModelsFromRows(reportProjectRows),
    [reportProjectRows],
  );
  const selectedProjectOptions = useMemo(() => {
    if (!selectedProjectQuery.data) {
      return [];
    }

    return buildProjectViewModels([toProject(selectedProjectQuery.data)], serviceGroups);
  }, [selectedProjectQuery.data, serviceGroups]);
  const projectOptions = useMemo(() => {
    const merged = [...selectedProjectOptions, ...projectOptionsFromSearch];
    const seen = new Set<string>();

    return merged.filter((project) => {
      if (seen.has(project.id)) {
        return false;
      }

      seen.add(project.id);
      return true;
    });
  }, [projectOptionsFromSearch, selectedProjectOptions]);
  const projectOptionsById = useMemo(
    () => new Map(projectOptions.map((project) => [project.id, project] as const)),
    [projectOptions],
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

    return sortReportsDescending(tasks.map((task) => buildTaskReportViewModel(task, member)));
  }, [member, tasks]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId],
  );

  const normalizedProjectQuery = (appliedProjectQuery ?? '').trim().toLowerCase();
  const filteredProjectOptions = useMemo(() => {
    if (appliedProjectQuery === null) {
      return [];
    }

    const base = projectOptions;

    if (!normalizedProjectQuery) {
      return base.slice(0, 60);
    }

    return base
      .filter((project) =>
        project.project.name.trim().toLowerCase().includes(normalizedProjectQuery),
      )
      .slice(0, 60);
  }, [appliedProjectQuery, normalizedProjectQuery, projectOptions]);

  const draftPages = useMemo(
    () => pages.filter((page) => page.projectId === draft.projectId),
    [draft.projectId, pages],
  );

  const type1Options = useMemo(
    () => buildSelectableTaskType1Options(taskTypes, draft.type1),
    [draft.type1, taskTypes],
  );
  const type2Options = useMemo(
    () => buildTaskType2OptionsForValue(taskTypes, draft.type1, draft.type2),
    [draft.type1, draft.type2, taskTypes],
  );
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
      costGroupId: string;
      projectId: string;
      pageId: string;
      taskType1: string;
      taskType2: string;
      taskUsedtime: number;
      url: string;
      content: string;
      note: string;
    }) => {
      if (!member) {
        throw new Error('로그인 정보가 없습니다.');
      }

      if (!member.reportRequired) {
        throw new Error('업무보고 입력 권한이 없습니다.');
      }

      const normalizedTaskDate = normalizeTaskDate(input.taskDate);
      if (!normalizedTaskDate) {
        throw new Error('일자 값이 올바르지 않습니다.');
      }

      let projectId = input.projectId.trim();
      const costGroupId = input.costGroupId.trim();
      const pageId = input.pageId.trim();

      if (!costGroupId) {
        throw new Error('청구그룹을 선택해 주세요.');
      }

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

      if (projectId) {
        const project =
          projectOptionsById.get(projectId)?.project ??
          (selectedProjectQuery.data ? toProject(selectedProjectQuery.data) : null);
        if (!project) {
          throw new Error('선택한 프로젝트 정보를 확인할 수 없습니다.');
        }

        const projectCostGroupId = project.serviceGroupId
          ? (serviceGroupsById.get(project.serviceGroupId)?.costGroupId ?? '')
          : '';

        if (!projectCostGroupId || projectCostGroupId !== costGroupId) {
          throw new Error('선택한 프로젝트의 청구그룹과 입력값이 일치하지 않습니다.');
        }
      }

      const taskType = validateTaskTypeSelection(taskTypes, input.taskType1, input.taskType2);

      return dataClient.saveTask(member, {
        id: input.id,
        taskDate: normalizedTaskDate,
        costGroupId,
        projectId: projectId || null,
        pageId: pageId || null,
        taskType1: taskType.type1,
        taskType2: taskType.type2,
        taskUsedtime: input.taskUsedtime,
        url: input.url,
        content: input.content,
        note: input.note,
      });
    },
    onSuccess: async (task, variables) => {
      await invalidateReportQueries();

      setSelectedReportId(null);
      setDraft(createEmptyReportDraft());
      const mappedTask = toTask(task);
      setSelectedDate(mappedTask.taskDate);
      setProjectQuery('');
      setAppliedProjectQuery(null);
      setActiveTab('report');
      setStatusKind('success');
      setStatusMessage(variables.id ? '업무가 수정되었습니다.' : '업무가 저장되었습니다.');
    },
    onError: (error) => {
      setStatusKind('error');
      setStatusMessage(toErrorMessage(error, '저장하지 못했습니다.'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      if (!member) {
        throw new Error('로그인 정보가 없습니다.');
      }

      if (!member.reportRequired) {
        throw new Error('업무보고 입력 권한이 없습니다.');
      }

      await dataClient.deleteTask(member, taskId);
    },
    onSuccess: async (_, taskId) => {
      await invalidateReportQueries();

      if (selectedReportId === taskId) {
        setSelectedReportId(null);
        setDraft(createEmptyReportDraft());
        setProjectQuery('');
        setAppliedProjectQuery(null);
      }

      setStatusKind('success');
      setStatusMessage('업무가 삭제되었습니다.');
    },
    onError: (error) => {
      setStatusKind('error');
      setStatusMessage(toErrorMessage(error, '삭제하지 못했습니다.'));
    },
  });

  const setDraftField = <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => {
    setDraft((current) => {
      const next = { ...current, [key]: value } as ReportDraft;

      if (key === 'reportDate') {
        const normalized = normalizeTaskDate(String(value));
        next.reportDate = normalized || current.reportDate;
      }

      if (key === 'projectId') {
        next.pageId = '';
        const project =
          projectOptionsById.get(String(value))?.project ??
          (selectedProjectQuery.data ? toProject(selectedProjectQuery.data) : null);
        if (project) {
          const normalizedServiceName = project.serviceGroupId
            ? (serviceGroupsById.get(project.serviceGroupId)?.name ?? '')
            : '';
          const costGroup = project.serviceGroupId
            ? (serviceGroupsById.get(project.serviceGroupId)?.costGroupName ?? '')
            : '';
          const costGroupId = project.serviceGroupId
            ? (serviceGroupsById.get(project.serviceGroupId)?.costGroupId ?? '')
            : '';
          const separator = normalizedServiceName.indexOf(' / ');
          next.type1 = project.taskType1;
          const nextType2Options = buildTaskType2OptionsForValue(taskTypes, next.type1, next.type2);
          if (!nextType2Options.includes(next.type2)) {
            next.type2 = '';
          }
          next.platform = project.platform;
          next.costGroupId = costGroupId;
          next.costGroupName = costGroup;
          next.serviceGroupName =
            separator < 0 ? normalizedServiceName : normalizedServiceName.slice(0, separator);
          next.serviceName = separator < 0 ? '' : normalizedServiceName.slice(separator + 3);
        } else {
          next.type1 = '';
          next.type2 = '';
          next.platform = '';
          next.serviceGroupName = '';
          next.serviceName = '';
        }
      }

      if (key === 'costGroupId') {
        next.projectId = '';
        next.pageId = '';
        const costGroup = costGroupOptions.find((item) => item.id === String(value)) ?? null;
        next.costGroupName = costGroup?.name ?? '';
        next.platform = '';
        next.serviceGroupName = '';
        next.serviceName = '';
      }

      if (key === 'type1') {
        next.projectId = '';
        next.pageId = '';
        next.platform = '';
        next.serviceGroupName = '';
        next.serviceName = '';
        const nextType2Options = buildTaskType2OptionsForValue(
          taskTypes,
          String(value),
          next.type2,
        );
        if (!nextType2Options.includes(next.type2)) {
          next.type2 = '';
        }
      }

      return next;
    });
  };

  const applyProjectQuery = () => {
    setAppliedProjectQuery(projectQuery);
  };

  const selectReport = (id: string) => {
    const report = reports.find((item) => item.id === id);
    if (!report) {
      return;
    }

    setSelectedReportId(id);
    setDraft(draftFromReport(report));
    setStatusMessage('');
  };

  const cancelEdit = () => {
    setSelectedReportId(null);
    setDraft(createEmptyReportDraft());
    setProjectQuery('');
    setAppliedProjectQuery(null);
    setActiveTab('report');
    setStatusMessage('');
  };

  const startNewReport = () => {
    cancelEdit();
    setStatusMessage('');
  };

  const resetDraft = () => {
    startNewReport();
  };

  const saveDraft = async (reportDateOverride?: string) => {
    if (saveMutation.isPending) {
      return;
    }

    try {
      const sourceTaskDate = selectedReportId ? draft.reportDate : (reportDateOverride ?? '');
      const taskDate = normalizeTaskDate(sourceTaskDate);
      if (!isValidTaskDate(taskDate)) {
        setStatusMessage('일자는 필수입니다.');
        return;
      }

      const taskType = validateTaskTypeSelection(taskTypes, draft.type1, draft.type2);
      const taskUsedtime = parseReportTaskUsedtimeInput(draft.taskUsedtime);
      const content = draft.content.trim() || '업무';

      await saveMutation.mutateAsync({
        id: selectedReportId ?? undefined,
        taskDate,
        costGroupId: draft.costGroupId,
        projectId: draft.projectId,
        pageId: draft.pageId,
        taskType1: taskType.type1,
        taskType2: taskType.type2,
        taskUsedtime,
        url: draft.url.trim(),
        content,
        note: draft.note.trim(),
      });
    } catch (error) {
      setStatusKind('error');
      setStatusMessage(toErrorMessage(error, '저장하지 못했습니다.'));
    }
  };

  const deleteDraft = async (id: string) => {
    if (deleteMutation.isPending) {
      return;
    }

    await deleteMutation.mutateAsync(id);
  };

  const saveOverheadReport = async (taskUsedtime: number, reportDate = getTodayInputValue()) => {
    if (saveMutation.isPending) {
      return;
    }

    if (!member?.reportRequired) {
      setStatusKind('error');
      setStatusMessage('업무보고 입력 권한이 없습니다.');
      return;
    }

    try {
      const taskType = validateTaskTypeSelection(taskTypes, '기타버퍼', '오버헤드');
      const taskDate = normalizeTaskDate(reportDate);
      if (!isValidTaskDate(taskDate)) {
        setStatusKind('error');
        setStatusMessage('일자 값이 올바르지 않습니다.');
        return;
      }

      if (!overheadCostGroupId) {
        setStatusKind('error');
        setStatusMessage('청구그룹을 선택해 주세요.');
        return;
      }

      await saveMutation.mutateAsync({
        taskDate,
        costGroupId: overheadCostGroupId,
        projectId: '',
        pageId: '',
        taskType1: taskType.type1,
        taskType2: taskType.type2,
        taskUsedtime,
        url: '',
        content: '오버헤드',
        note: '',
      });
      setStatusKind('success');
      setStatusMessage('오버헤드가 등록되었습니다.');
      setOverheadCostGroupId('');
    } catch (error) {
      setStatusKind('error');
      setStatusMessage(toErrorMessage(error, '저장하지 못했습니다.'));
    }
  };

  const jumpDraftDate = (offsetDays: number) => {
    setDraftField(
      'reportDate',
      shiftDateInput(draft.reportDate || getTodayInputValue(), offsetDays),
    );
  };

  return {
    dailyReports: reports,
    selectedReport,
    selectedReportId,
    draft,
    selectedDate,
    projectQuery,
    appliedProjectQuery,
    projectOptions,
    filteredProjectOptions,
    costGroupOptions,
    draftPages,
    taskTypes,
    type1Options,
    type2Options,
    platformOptions,
    canEditReports,
    isSaving: saveMutation.isPending || deleteMutation.isPending,
    statusMessage,
    statusKind,
    isEditMode: Boolean(selectedReportId),
    activeTab,
    setActiveTab,
    setDraftField,
    setSelectedDate,
    setProjectQuery,
    applyProjectQuery,
    selectReport,
    cancelEdit,
    startNewReport,
    resetDraft,
    saveDraft,
    deleteDraft,
    overheadCostGroupId,
    setOverheadCostGroupId,
    saveOverheadReport,
    jumpDraftDate,
  };
}
