import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Project } from '../../../types/domain';
import {
  buildProjectViewModels,
  buildSelectableTaskType1Options,
  buildTaskType2OptionsForValue,
  createEmptyReportDraft,
  parseReportTaskUsedtimeInput,
  validateTaskTypeSelection,
  type ReportDraft,
} from '../../reports/reportUtils';
import { getTaskTypeUiRule } from '../../../utils/taskType';
import { adminDataClient } from '../../../api/admin';
import {
  ADMIN_REPORT_EDITOR_CREATE_TITLE,
  ADMIN_REPORT_EDITOR_DEFAULT_TAB,
  ADMIN_REPORT_EDITOR_EDIT_TITLE,
} from './AdminReportEditorPage.constants';
import type { AdminReportEditorTab } from './AdminReportEditorPage.types';
import {
  createDraftFromTask,
  formatCompactDate,
  parseCompactDate,
  toCostGroups,
  toPages,
  toPlatforms,
  toProjects,
  toServiceGroups,
  toTaskTypes,
} from './AdminReportEditorPage.utils';
import { toAdminTask, toMemberAdmin } from '../adminApiTransform';
import { AdminReportEditorForm } from './AdminReportEditorForm';
import '../../../styles/pages/AdminPage.scss';

export function AdminReportEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ taskId: string }>();
  const queryClient = useQueryClient();
  const taskId = params.taskId ?? '';
  const isEdit = Boolean(taskId);
  const locationState = (location.state as { memberId?: string } | null) ?? null;

  const [activeTab, setActiveTab] = useState<AdminReportEditorTab>(ADMIN_REPORT_EDITOR_DEFAULT_TAB);
  const [selectedMemberId, setSelectedMemberId] = useState(locationState?.memberId ?? '');
  const [draft, setDraft] = useState<ReportDraft>(() => createEmptyReportDraft());
  const [projectQuery, setProjectQuery] = useState('');
  const [appliedProjectQuery, setAppliedProjectQuery] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const membersQuery = useQuery({
    queryKey: ['admin', 'members'],
    queryFn: () => adminDataClient.listMembersAdmin(),
  });
  const taskTypesQuery = useQuery({
    queryKey: ['admin', 'task-types'],
    queryFn: () => adminDataClient.listTaskTypes(),
  });
  const serviceGroupsQuery = useQuery({
    queryKey: ['admin', 'service-groups'],
    queryFn: () => adminDataClient.listServiceGroups(),
  });
  const costGroupsQuery = useQuery({
    queryKey: ['admin', 'cost-groups'],
    queryFn: () => adminDataClient.listCostGroups(),
  });
  const platformsQuery = useQuery({
    queryKey: ['admin', 'platforms'],
    queryFn: () => adminDataClient.listPlatforms(),
  });
  const selectedProjectQuery = useQuery({
    queryKey: ['admin', 'project-option', draft.projectId],
    queryFn: () => adminDataClient.getProjectAdminOption(draft.projectId),
    enabled: Boolean(draft.projectId),
  });
  const reportProjectsQuery = useQuery({
    queryKey: [
      'admin',
      'report-project-options',
      draft.costGroupId,
      draft.platform,
      draft.type1,
      appliedProjectQuery,
    ],
    queryFn: () =>
      adminDataClient.searchReportProjectsAdmin({
        costGroupId: draft.costGroupId || null,
        platform: draft.platform || null,
        taskType1: draft.type1 || null,
        query: appliedProjectQuery || null,
      }),
    enabled: Boolean(
      draft.costGroupId && draft.platform && draft.type1 && appliedProjectQuery !== null,
    ),
  });
  const pagesQuery = useQuery({
    queryKey: ['admin', 'project-pages', draft.projectId],
    queryFn: () => adminDataClient.listProjectSubtasksByProjectId(draft.projectId),
    enabled: Boolean(draft.projectId),
  });
  const taskQuery = useQuery({
    queryKey: ['admin', 'task', taskId],
    queryFn: () => adminDataClient.getTaskAdmin(taskId),
    enabled: isEdit,
  });

  const members = useMemo(() => (membersQuery.data ?? []).map(toMemberAdmin), [membersQuery.data]);
  const taskTypes = useMemo(() => toTaskTypes(taskTypesQuery.data ?? []), [taskTypesQuery.data]);
  const serviceGroups = useMemo(
    () => toServiceGroups(serviceGroupsQuery.data ?? []),
    [serviceGroupsQuery.data],
  );
  const costGroups = useMemo(
    () => toCostGroups(costGroupsQuery.data ?? []),
    [costGroupsQuery.data],
  );
  const platforms = useMemo(() => toPlatforms(platformsQuery.data ?? []), [platformsQuery.data]);
  const searchedProjects = useMemo(
    () => toProjects(reportProjectsQuery.data ?? []),
    [reportProjectsQuery.data],
  );
  const selectedProjects = useMemo(() => {
    if (!selectedProjectQuery.data) {
      return [] as Project[];
    }
    return toProjects([selectedProjectQuery.data]);
  }, [selectedProjectQuery.data]);
  const pages = useMemo(() => toPages(pagesQuery.data ?? []), [pagesQuery.data]);

  const projects = useMemo(() => {
    const merged = [...selectedProjects, ...searchedProjects];
    const seen = new Set<string>();
    return merged.filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    });
  }, [searchedProjects, selectedProjects]);

  const projectsById = useMemo(
    () => new Map(projects.map((item) => [item.id, item] as const)),
    [projects],
  );
  const subtasksById = useMemo(
    () => new Map(pages.map((item) => [item.id, item] as const)),
    [pages],
  );
  const serviceGroupsById = useMemo(
    () => new Map(serviceGroups.map((item) => [item.id, item] as const)),
    [serviceGroups],
  );

  useEffect(() => {
    if (!selectedMemberId && members.length > 0 && !isEdit) {
      setSelectedMemberId(locationState?.memberId || members[0]!.id);
    }
  }, [isEdit, locationState?.memberId, members, selectedMemberId]);

  useEffect(() => {
    if (!taskQuery.data) {
      return;
    }

    const task = toAdminTask(taskQuery.data);
    setSelectedMemberId(task.memberId);
    setDraft(createDraftFromTask(task));
    setActiveTab(task.projectId ? 'report' : 'period');
    setProjectQuery('');
    setAppliedProjectQuery(null);
    setStatusMessage('');
  }, [taskQuery.data]);

  const projectOptions = useMemo(
    () => buildProjectViewModels(projects, serviceGroups),
    [projects, serviceGroups],
  );
  const normalizedProjectQuery = (appliedProjectQuery ?? '').trim().toLowerCase();
  const filteredProjectOptions = useMemo(() => {
    if (appliedProjectQuery === null) {
      return [];
    }

    const base = draft.costGroupId
      ? projectOptions.filter((project) => project.costGroupId === draft.costGroupId)
      : projectOptions;
    if (!normalizedProjectQuery) {
      return base.slice(0, 60);
    }

    return base
      .filter((project) =>
        project.project.name.trim().toLowerCase().includes(normalizedProjectQuery),
      )
      .slice(0, 60);
  }, [appliedProjectQuery, draft.costGroupId, normalizedProjectQuery, projectOptions]);
  const draftSubtasks = useMemo(
    () => pages.filter((page) => page.projectId === draft.projectId),
    [draft.projectId, pages],
  );
  const currentProject = useMemo(
    () =>
      filteredProjectOptions.find((project) => project.id === draft.projectId) ??
      projectOptions.find((project) => project.id === draft.projectId) ??
      null,
    [draft.projectId, filteredProjectOptions, projectOptions],
  );
  const reportTabType1Options = useMemo(() => {
    const preferredOrder = ['민원', '데이터버퍼', '일반버퍼', '교육', '기타버퍼', '휴무'];
    const taskType1Options = buildSelectableTaskType1Options(taskTypes, draft.type1);
    const available = preferredOrder.filter((type1) => taskType1Options.includes(type1));
    return available.length ? available : taskType1Options;
  }, [draft.type1, taskTypes]);
  const type1Options = useMemo(
    () => buildSelectableTaskType1Options(taskTypes, draft.type1),
    [draft.type1, taskTypes],
  );
  const type2Options = useMemo(
    () => buildTaskType2OptionsForValue(taskTypes, draft.type1, draft.type2),
    [draft.type1, draft.type2, taskTypes],
  );
  const isProjectLinkedTab = activeTab === 'report';
  const projectTypeSelected = isProjectLinkedTab && Boolean(draft.projectId);
  const type1Value = projectTypeSelected
    ? currentProject?.project.taskType1 || draft.type1
    : draft.type1;
  const typeRule = useMemo(() => getTaskTypeUiRule(type1Value, taskTypes), [taskTypes, type1Value]);
  const usesProjectLookup = typeRule.projectLinked;
  const usesManualSubtaskWithUrl = typeRule.manualSubtaskWithUrl;
  const usesManualSubtaskOnly = typeRule.manualSubtaskOnly;
  const showPlatformSelect = !projectTypeSelected && usesProjectLookup;
  const showReadonlyService = projectTypeSelected || usesProjectLookup;
  const showProjectSelect = isProjectLinkedTab || usesProjectLookup;
  const isVacationType = typeRule.vacation;
  const isFixedDayType = false;
  const showProjectLinkedSubtaskSelect = projectTypeSelected && typeRule.projectSubtaskSelectable;
  const showSubtaskSelect = isProjectLinkedTab
    ? showProjectLinkedSubtaskSelect
    : Boolean(draft.projectId) && typeRule.projectSubtaskSelectable;
  const showManualSubtaskName = isProjectLinkedTab
    ? (projectTypeSelected && typeRule.projectLinked && !typeRule.projectSubtaskSelectable) ||
      isVacationType
    : usesManualSubtaskWithUrl || usesManualSubtaskOnly || isVacationType;
  const isReadonlyWorkHours = isVacationType || isFixedDayType;
  const manualSubtaskLabel = useMemo(() => {
    if (isVacationType) {
      return '휴가 종류';
    }
    if ((typeRule.projectLinked && !typeRule.projectSubtaskSelectable) || usesManualSubtaskOnly) {
      return '과업명';
    }
    return '과업명';
  }, [
    isVacationType,
    typeRule.projectLinked,
    typeRule.projectSubtaskSelectable,
    usesManualSubtaskOnly,
  ]);
  const typeFilteredProjects = useMemo(() => {
    if (!draft.platform || !draft.type1) {
      return [] as typeof filteredProjectOptions;
    }

    return filteredProjectOptions.filter(
      (project) =>
        project.costGroupId === draft.costGroupId &&
        project.project.platform === draft.platform &&
        project.project.taskType1 === draft.type1,
    );
  }, [draft.costGroupId, draft.platform, draft.type1, filteredProjectOptions]);
  const projectSearchPlaceholder = useMemo(() => {
    if (!draft.costGroupId) {
      return '청구그룹을 먼저 선택하세요';
    }
    if (appliedProjectQuery === null) {
      return '검색어 입력 후 검색하세요';
    }
    if (!appliedProjectQuery.trim()) {
      return '선택';
    }
    if (!filteredProjectOptions.length) {
      return '검색 결과가 없습니다.';
    }
    return `${appliedProjectQuery} 로 검색되었습니다. 목록을 선택하세요`;
  }, [appliedProjectQuery, draft.costGroupId, filteredProjectOptions.length]);
  const type2Placeholder = useMemo(() => {
    if (isProjectLinkedTab || draft.type1 === '휴무') {
      return '선택';
    }
    if (!type2Options.length) {
      return '타입2가 존재하지 않습니다.';
    }
    return '선택';
  }, [draft.type1, isProjectLinkedTab, type2Options.length]);

  const setDraftField = <K extends keyof ReportDraft>(key: K, value: ReportDraft[K]) => {
    setDraft((current) => {
      const next = { ...current, [key]: value } as ReportDraft;

      if (key === 'projectId') {
        next.subtaskId = '';
        const project = projectsById.get(String(value));
        if (project) {
          const normalizedServiceName = project.serviceGroupId
            ? (serviceGroupsById.get(project.serviceGroupId)?.name ?? '')
            : '';
          const separator = normalizedServiceName.indexOf(' / ');
          next.type1 = project.taskType1;
          const nextType2Options = buildTaskType2OptionsForValue(taskTypes, next.type1, next.type2);
          if (!nextType2Options.includes(next.type2)) {
            next.type2 = '';
          }
          next.platform = project.platform;
          next.costGroupId = project.serviceGroupId
            ? (serviceGroupsById.get(project.serviceGroupId)?.costGroupId ?? '')
            : '';
          next.costGroupName = project.serviceGroupId
            ? (serviceGroupsById.get(project.serviceGroupId)?.costGroupName ?? '')
            : '';
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
        next.subtaskId = '';
        const costGroup = costGroups.find((item) => item.id === String(value)) ?? null;
        next.costGroupName = costGroup?.name ?? '';
        next.serviceGroupName = '';
        next.serviceName = '';
      }

      if (key === 'type1') {
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

  const handleType2Change = (nextType2: string) => {
    const previousWasVacation = draft.type1 === '휴무';
    setDraftField('type2', nextType2 as ReportDraft['type2']);

    if (nextType2 === draft.type2) {
      return;
    }

    const nextIsVacation = type1Value === '휴무';
    if (nextIsVacation) {
      setDraftField('manualSubtaskName', '');
      setDraftField('taskUsedtime', '');
      return;
    }

    if (previousWasVacation) {
      setDraftField('manualSubtaskName', '');
      setDraftField('taskUsedtime', '');
    }
  };

  const handleProjectSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setAppliedProjectQuery(projectQuery);
    }
  };

  const handleVacationTypeChange = (value: string) => {
    setDraftField('manualSubtaskName', value);
    if (value === '오전 반차' || value === '오후 반차') {
      setDraftField('taskUsedtime', '240');
      return;
    }
    if (value === '전일 휴가') {
      setDraftField('taskUsedtime', '480');
      return;
    }
    setDraftField('taskUsedtime', '');
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMemberId) {
        throw new Error('사용자를 선택해 주세요.');
      }

      const taskType = validateTaskTypeSelection(taskTypes, draft.type1, draft.type2);
      const taskUsedtime = parseReportTaskUsedtimeInput(draft.taskUsedtime);
      let projectId = draft.projectId.trim();
      const subtaskId = draft.subtaskId.trim();

      if (subtaskId) {
        const page = subtasksById.get(subtaskId);
        if (!page) {
          throw new Error('선택한 과업 정보를 확인할 수 없습니다.');
        }

        if (projectId && page.projectId !== projectId) {
          throw new Error('선택한 프로젝트와 페이지 연결을 확인해 주세요.');
        }

        if (!projectId) {
          projectId = page.projectId;
        }
      }

      await adminDataClient.saveTaskAdmin({
        id: isEdit ? taskId : undefined,
        memberId: selectedMemberId,
        taskDate: draft.reportDate,
        costGroupId: draft.costGroupId,
        projectId,
        subtaskId,
        taskType1: taskType.type1,
        taskType2: taskType.type2,
        taskUsedtime,
        url: draft.url.trim(),
        content: draft.content.trim(),
        note: draft.note.trim(),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'task-search'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'task', taskId] }),
      ]);
      navigate('/org/search');
    },
    onError: (error) => {
      setStatusMessage(error instanceof Error ? error.message : '저장하지 못했습니다.');
    },
  });

  const loading =
    membersQuery.isLoading ||
    taskTypesQuery.isLoading ||
    serviceGroupsQuery.isLoading ||
    costGroupsQuery.isLoading ||
    selectedProjectQuery.isLoading ||
    reportProjectsQuery.isLoading ||
    pagesQuery.isLoading ||
    taskQuery.isLoading;
  const queryError =
    (membersQuery.error instanceof Error && membersQuery.error.message) ||
    (taskTypesQuery.error instanceof Error && taskTypesQuery.error.message) ||
    (serviceGroupsQuery.error instanceof Error && serviceGroupsQuery.error.message) ||
    (costGroupsQuery.error instanceof Error && costGroupsQuery.error.message) ||
    (platformsQuery.error instanceof Error && platformsQuery.error.message) ||
    (selectedProjectQuery.error instanceof Error && selectedProjectQuery.error.message) ||
    (reportProjectsQuery.error instanceof Error && reportProjectsQuery.error.message) ||
    (pagesQuery.error instanceof Error && pagesQuery.error.message) ||
    (taskQuery.error instanceof Error && taskQuery.error.message) ||
    '';
  const currentMember = members.find((member) => member.id === selectedMemberId) ?? null;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage('');
    void saveMutation.mutateAsync();
  };

  return (
    <section className={'reports-page reports-page--page'}>
      <header className={'reports-page__hero'}>
        <div className={'reports-page__hero-main'}>
          <h1 className={'reports-page__title'}>
            {isEdit ? ADMIN_REPORT_EDITOR_EDIT_TITLE : ADMIN_REPORT_EDITOR_CREATE_TITLE}
          </h1>
        </div>
      </header>

      <AdminReportEditorForm
        isEdit={isEdit}
        activeTab={activeTab}
        draft={draft}
        members={members}
        selectedMemberId={selectedMemberId}
        loading={loading}
        queryError={queryError}
        statusMessage={statusMessage}
        missingEditTarget={Boolean(isEdit && !taskQuery.data)}
        currentMember={currentMember}
        costGroups={costGroups}
        filteredProjectOptions={filteredProjectOptions}
        platforms={platforms}
        draftSubtasks={draftSubtasks}
        projectQuery={projectQuery}
        projectSearchPlaceholder={projectSearchPlaceholder}
        isProjectLinkedTab={isProjectLinkedTab}
        projectTypeSelected={projectTypeSelected}
        type1Value={type1Value}
        reportTabType1Options={reportTabType1Options}
        type1Options={type1Options}
        type2Options={type2Options}
        type2Placeholder={type2Placeholder}
        showPlatformSelect={showPlatformSelect}
        showReadonlyService={showReadonlyService}
        showProjectSelect={showProjectSelect}
        typeFilteredProjects={typeFilteredProjects}
        showSubtaskSelect={showSubtaskSelect}
        showManualSubtaskName={showManualSubtaskName}
        manualSubtaskLabel={manualSubtaskLabel}
        isVacationType={isVacationType}
        isReadonlyWorkHours={isReadonlyWorkHours}
        savePending={saveMutation.isPending}
        onSubmit={onSubmit}
        onTabChange={setActiveTab}
        onMemberChange={setSelectedMemberId}
        onReportDateChange={(value) => setDraftField('reportDate', value)}
        onCostGroupChange={(value) => setDraftField('costGroupId', value)}
        onProjectQueryChange={setProjectQuery}
        onProjectSearch={() => setAppliedProjectQuery(projectQuery)}
        onProjectSearchKeyDown={handleProjectSearchKeyDown}
        onProjectChange={(value) => setDraftField('projectId', value)}
        onType1Change={(value) => setDraftField('type1', value)}
        onType2Change={handleType2Change}
        onPlatformChange={(value) => setDraftField('platform', value)}
        onSubtaskChange={(value) => setDraftField('subtaskId', value)}
        onManualSubtaskNameChange={(value) => setDraftField('manualSubtaskName', value)}
        onVacationTypeChange={handleVacationTypeChange}
        onUrlChange={(value) => setDraftField('url', value)}
        onTaskUsedtimeChange={(value) => setDraftField('taskUsedtime', value)}
        onNoteChange={(value) => setDraftField('note', value)}
        onCancel={() => navigate('/org/search')}
        onDateShift={(nextDate) => setDraftField('reportDate', nextDate)}
        formatCompactDate={formatCompactDate}
        parseCompactDate={parseCompactDate}
      />
    </section>
  );
}
