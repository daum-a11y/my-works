import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type {
  CostGroup,
  Platform,
  Project,
  ProjectPage,
  ServiceGroup,
  TaskType,
} from '../../../lib/domain';
import {
  buildProjectViewModels,
  buildSelectableTaskType1Options,
  buildTaskType2OptionsForValue,
  createEmptyReportDraft,
  getTodayInputValue,
  parseReportTaskUsedtimeInput,
  shiftDateInput,
  validateTaskTypeSelection,
  type ReportDraft,
} from '../../reports/reportDomain';
import { getTaskTypeUiRule } from '../../../lib/taskTypeRules';
import { adminDataClient } from '../adminClient';
import type { AdminTaskSearchItem, MemberAdminItem } from '../admin-types';
import '../../../styles/domain/pages/reports-page.scss';

function formatCompactDate(value: string, mode: 'short' | 'long') {
  if (!value) {
    return '';
  }

  const digits = value.replaceAll('-', '');
  if (digits.length !== 8) {
    return value;
  }

  return mode === 'short' ? digits.slice(2) : digits;
}

function parseCompactDate(value: string, mode: 'short' | 'long') {
  const digits = value.replace(/\D/g, '');

  if (mode === 'short' && digits.length === 6) {
    return `20${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
  }

  if (mode === 'long' && digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }

  return value;
}

function toTaskTypes(items: Awaited<ReturnType<typeof adminDataClient.listTaskTypes>>): TaskType[] {
  return items.map((item) => ({
    id: item.id,
    type1: item.type1,
    type2: item.type2,
    label: item.displayLabel,
    displayOrder: item.displayOrder,
    requiresServiceGroup: item.requiresServiceGroup,
    isActive: item.isActive,
  }));
}

function toServiceGroups(
  items: Awaited<ReturnType<typeof adminDataClient.listServiceGroups>>,
): ServiceGroup[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    costGroupId: item.costGroupId,
    costGroupName: item.costGroupName,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
  }));
}

function toProjects(items: Awaited<ReturnType<typeof adminDataClient.listProjects>>): Project[] {
  return items.map((item) => ({
    id: item.id,
    createdByMemberId: null,
    projectType1: item.projectType1,
    name: item.name,
    platformId: item.platformId,
    platform: item.platform,
    serviceGroupId: item.serviceGroupId,
    reportUrl: item.reportUrl,
    reporterMemberId: null,
    reviewerMemberId: null,
    startDate: '',
    endDate: '',
    isActive: item.isActive,
  }));
}

function toCostGroups(
  items: Awaited<ReturnType<typeof adminDataClient.listCostGroups>>,
): CostGroup[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    displayOrder: item.displayOrder,
    isActive: item.isActive,
  }));
}

function toPlatforms(items: Awaited<ReturnType<typeof adminDataClient.listPlatforms>>): Platform[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    displayOrder: item.displayOrder,
    isVisible: item.isVisible,
  }));
}

function toPages(
  items: Awaited<ReturnType<typeof adminDataClient.listProjectPages>>,
): ProjectPage[] {
  return items.map((item) => ({
    id: item.id,
    projectId: item.projectId,
    title: item.title,
    url: item.url,
    ownerMemberId: null,
    monitoringMonth: '',
    trackStatus: item.trackStatus as ProjectPage['trackStatus'],
    monitoringInProgress: item.monitoringInProgress,
    qaInProgress: item.qaInProgress,
    note: '',
    updatedAt: '',
  }));
}

function createDraftFromTask(task: AdminTaskSearchItem): ReportDraft {
  return {
    reportDate: task.taskDate,
    costGroupId: task.costGroupId,
    costGroupName: task.costGroupName,
    projectId: task.projectId ?? '',
    pageId: task.pageId ?? '',
    type1: task.taskType1,
    type2: task.taskType2,
    platform: task.platform || '',
    serviceGroupName: task.serviceGroupName || '',
    serviceName: task.serviceName || '',
    manualPageName: task.pageTitle || '',
    pageUrl: task.pageUrl || '',
    taskUsedtime: String(task.taskUsedtime ?? 0),
    content: task.content || '',
    note: task.note || '',
  };
}

export function AdminReportEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ taskId: string }>();
  const queryClient = useQueryClient();
  const taskId = params.taskId ?? '';
  const isEdit = Boolean(taskId);
  const locationState = (location.state as { memberId?: string } | null) ?? null;

  const [activeTab, setActiveTab] = useState<'report' | 'period'>('report');
  const [selectedMemberId, setSelectedMemberId] = useState(locationState?.memberId ?? '');
  const [draft, setDraft] = useState<ReportDraft>(() => createEmptyReportDraft());
  const [projectQuery, setProjectQuery] = useState('');
  const [appliedProjectQuery, setAppliedProjectQuery] = useState('');
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
        costGroupId: draft.costGroupId,
        platform: draft.platform,
        projectType1: draft.type1,
        query: appliedProjectQuery,
      }),
    enabled: Boolean(draft.costGroupId && draft.platform && draft.type1),
  });
  const pagesQuery = useQuery({
    queryKey: ['admin', 'project-pages', draft.projectId],
    queryFn: () => adminDataClient.listProjectPagesByProjectId(draft.projectId),
    enabled: Boolean(draft.projectId),
  });
  const taskQuery = useQuery({
    queryKey: ['admin', 'task', taskId],
    queryFn: () => adminDataClient.getTaskAdmin(taskId),
    enabled: isEdit,
  });

  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
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
  const pagesById = useMemo(() => new Map(pages.map((item) => [item.id, item] as const)), [pages]);
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

    setSelectedMemberId(taskQuery.data.memberId);
    setDraft(createDraftFromTask(taskQuery.data));
    setActiveTab(taskQuery.data.projectId ? 'report' : 'period');
    setProjectQuery('');
    setAppliedProjectQuery('');
    setStatusMessage('');
  }, [taskQuery.data]);

  const projectOptions = useMemo(
    () => buildProjectViewModels(projects, serviceGroups),
    [projects, serviceGroups],
  );
  const normalizedProjectQuery = appliedProjectQuery.trim().toLowerCase();
  const filteredProjectOptions = useMemo(() => {
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
  }, [draft.costGroupId, normalizedProjectQuery, projectOptions]);
  const draftPages = useMemo(
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
  const selectedTaskType = useMemo(
    () =>
      taskTypes.find(
        (taskType) => taskType.type1 === draft.type1 && taskType.type2 === draft.type2,
      ) ?? null,
    [draft.type1, draft.type2, taskTypes],
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
    ? currentProject?.project.projectType1 || draft.type1
    : draft.type1;
  const requiresServiceGroup = selectedTaskType?.requiresServiceGroup ?? false;
  const typeRule = useMemo(() => getTaskTypeUiRule(type1Value, taskTypes), [taskTypes, type1Value]);
  const usesProjectLookup = typeRule.projectLinked;
  const usesManualPageWithUrl = typeRule.manualPageWithUrl;
  const usesManualPageOnly = typeRule.manualPageOnly;
  const showPlatformSelect = !projectTypeSelected && usesProjectLookup;
  const showReadonlyService = projectTypeSelected || usesProjectLookup;
  const showProjectSelect = isProjectLinkedTab || usesProjectLookup;
  const isVacationType = typeRule.vacation;
  const isFixedDayType = false;
  const showProjectLinkedPageSelect = projectTypeSelected && typeRule.projectPageSelectable;
  const showProjectLinkedPageUrl = projectTypeSelected && requiresServiceGroup;
  const showPageSelect = isProjectLinkedTab
    ? showProjectLinkedPageSelect
    : Boolean(draft.projectId) && typeRule.projectPageSelectable;
  const showPageUrl = isProjectLinkedTab
    ? showProjectLinkedPageUrl
    : usesProjectLookup || usesManualPageWithUrl || (requiresServiceGroup && !showPageSelect);
  const showManualPageName = isProjectLinkedTab
    ? (projectTypeSelected && typeRule.projectLinked && !typeRule.projectPageSelectable) ||
      isVacationType
    : usesManualPageWithUrl || usesManualPageOnly || isVacationType;
  const isReadonlyWorkHours = isVacationType || isFixedDayType;
  const manualPageLabel = useMemo(() => {
    if (isVacationType) {
      return '휴가 종류';
    }
    if ((typeRule.projectLinked && !typeRule.projectPageSelectable) || usesManualPageOnly) {
      return '페이지명';
    }
    return '페이지명 & 내용';
  }, [isVacationType, typeRule.projectLinked, typeRule.projectPageSelectable, usesManualPageOnly]);
  const typeFilteredProjects = useMemo(() => {
    if (!draft.platform || !draft.type1) {
      return [] as typeof filteredProjectOptions;
    }

    return filteredProjectOptions.filter(
      (project) =>
        project.costGroupId === draft.costGroupId &&
        project.project.platform === draft.platform &&
        project.project.projectType1 === draft.type1,
    );
  }, [draft.costGroupId, draft.platform, draft.type1, filteredProjectOptions]);
  const projectSearchPlaceholder = useMemo(() => {
    if (!draft.costGroupId) {
      return '청구그룹을 먼저 선택하세요';
    }
    if (!projectQuery.trim()) {
      return '선택하세요';
    }
    if (!filteredProjectOptions.length) {
      return '검색 결과가 없습니다.';
    }
    return `${projectQuery} 로 검색되었습니다. 목록을 선택하세요`;
  }, [draft.costGroupId, filteredProjectOptions.length, projectQuery]);
  const type2Placeholder = useMemo(() => {
    if (isProjectLinkedTab || draft.type1 === '휴무') {
      return '선택하세요';
    }
    if (!type2Options.length) {
      return '타입2가 존재하지 않습니다.';
    }
    return '';
  }, [draft.type1, isProjectLinkedTab, type2Options.length]);

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

      if (key === 'costGroupId') {
        next.projectId = '';
        next.pageId = '';
        const costGroup = costGroups.find((item) => item.id === String(value)) ?? null;
        next.costGroupName = costGroup?.name ?? '';
        next.serviceGroupName = '';
        next.serviceName = '';
        next.pageUrl = '';
      }

      if (key === 'pageId') {
        const page = pagesById.get(String(value));
        if (page) {
          next.pageUrl = page.url;
        }
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
      setDraftField('manualPageName', '');
      setDraftField('taskUsedtime', '');
      return;
    }

    if (previousWasVacation) {
      setDraftField('manualPageName', '');
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
    setDraftField('manualPageName', value);
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
      await adminDataClient.saveTaskAdmin({
        id: isEdit ? taskId : undefined,
        memberId: selectedMemberId,
        taskDate: draft.reportDate,
        costGroupId: draft.costGroupId,
        projectId: draft.projectId,
        pageId: draft.pageId,
        taskType1: taskType.type1,
        taskType2: taskType.type2,
        taskUsedtime,
        content: taskQuery.data?.content ?? '',
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
    <section className={'page'}>
      <header className={'hero'}>
        <div className={'heroMain'}>
          <h1 className={'title'}>{isEdit ? '업무 임의수정' : '업무 임의 추가'}</h1>
        </div>
      </header>

      <section className={'panel'}>
        <div className={'panelHead'}>
          <div>
            <h2 className={'panelTitle'}>업무 입력</h2>
            <p className={'dateText'}>{draft.reportDate || getTodayInputValue()}</p>
          </div>
          <div className={'tabRow'}>
            <button
              type="button"
              className={`${'tabButton'} ${activeTab === 'report' ? 'tabButtonActive' : ''}`}
              onClick={() => setActiveTab('report')}
            >
              기본 입력
            </button>
            <button
              type="button"
              className={`${'tabButton'} ${activeTab === 'period' ? 'tabButtonActive' : ''}`}
              onClick={() => setActiveTab('period')}
            >
              TYPE 입력
            </button>
          </div>
        </div>

        {queryError ? <p className={'statusMsg'}>{queryError}</p> : null}
        {statusMessage ? <p className={'statusMsg'}>{statusMessage}</p> : null}

        {loading ? (
          <p className={'status'}>불러오는 중입니다...</p>
        ) : isEdit && !taskQuery.data ? (
          <p className={'status'}>수정할 업무를 찾을 수 없습니다.</p>
        ) : (
          <form className={'form'} onSubmit={onSubmit}>
            <div className={'formGrid'}>
              <label className={'field'}>
                <span>사용자</span>
                <select
                  value={selectedMemberId}
                  onChange={(event) => setSelectedMemberId(event.target.value)}
                  disabled={isEdit}
                >
                  <option value="">{members.length ? '선택하세요' : '사용자가 없습니다.'}</option>
                  {members.map((member: MemberAdminItem) => (
                    <option key={member.id} value={member.id}>
                      {member.accountId} ({member.name})
                    </option>
                  ))}
                </select>
              </label>

              <label className={'field'}>
                <span>일자</span>
                <input
                  type="text"
                  placeholder="YYMMDD"
                  value={formatCompactDate(draft.reportDate, 'short')}
                  onChange={(event) =>
                    setDraftField('reportDate', parseCompactDate(event.target.value, 'short'))
                  }
                />
              </label>
            </div>

            {activeTab === 'report' ? (
              <div className={'formGrid'}>
                <label className={'field'}>
                  <span>청구그룹</span>
                  <select
                    value={draft.costGroupId}
                    onChange={(event) => setDraftField('costGroupId', event.target.value)}
                  >
                    <option value="">
                      {costGroups.length ? '선택하세요' : '청구그룹이 없습니다.'}
                    </option>
                    {costGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={'field'}>
                  <span>프로젝트검색</span>
                  <input
                    value={projectQuery}
                    onChange={(event) => setProjectQuery(event.target.value)}
                    onKeyDown={handleProjectSearchKeyDown}
                    placeholder="검색어입력"
                  />
                </label>

                <div className={'searchButtonField'}>
                  <span className={'srOnly'}>프로젝트 검색</span>
                  <button
                    type="button"
                    className={'secondaryButton'}
                    onClick={() => setAppliedProjectQuery(projectQuery)}
                  >
                    검색
                  </button>
                </div>

                <label className={'field'}>
                  <span>프로젝트</span>
                  <select
                    value={draft.projectId}
                    onChange={(event) => setDraftField('projectId', event.target.value)}
                    disabled={!draft.costGroupId}
                  >
                    <option value="">{projectSearchPlaceholder}</option>
                    {filteredProjectOptions.map((project) => (
                      <option key={project.id} value={project.id}>
                        {`${project.project.projectType1} - ${project.project.platform} - ${project.project.name}`}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            <div className={'formGrid'}>
              {projectTypeSelected ? (
                <label className={'field'}>
                  <span>타입1</span>
                  <input value={type1Value} readOnly />
                </label>
              ) : (
                <label className={'field'}>
                  <span>타입1</span>
                  <select
                    value={draft.type1}
                    onChange={(event) => setDraftField('type1', event.target.value)}
                  >
                    <option value="">{isProjectLinkedTab ? '선택해주세요' : 'type1'}</option>
                    {(isProjectLinkedTab ? reportTabType1Options : type1Options).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className={'field'}>
                <span>타입2</span>
                <select
                  value={draft.type2}
                  onChange={(event) => handleType2Change(event.target.value)}
                >
                  {type2Placeholder ? <option value="">{type2Placeholder}</option> : null}
                  {type2Options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              {showPlatformSelect ? (
                <label className={'field'}>
                  <span>플랫폼</span>
                  <select
                    value={draft.platform}
                    onChange={(event) => setDraftField('platform', event.target.value)}
                  >
                    <option value="">선택하세요</option>
                    {platforms
                      .filter((platform) => platform.isVisible || platform.name === draft.platform)
                      .map((platform) => (
                        <option key={platform.id} value={platform.name}>
                          {platform.name}
                        </option>
                      ))}
                  </select>
                </label>
              ) : null}

              {showReadonlyService ? (
                <>
                  <label className={'field'}>
                    <span>청구그룹</span>
                    <input value={draft.costGroupName} readOnly />
                  </label>
                  <label className={'field'}>
                    <span>서비스 그룹</span>
                    <input value={draft.serviceGroupName} readOnly />
                  </label>
                  <label className={'field'}>
                    <span>서비스 명</span>
                    <input value={draft.serviceName} readOnly />
                  </label>
                </>
              ) : null}

              {showProjectSelect && !isProjectLinkedTab ? (
                <label className={'field'}>
                  <span>프로젝트</span>
                  <select
                    value={draft.projectId}
                    onChange={(event) => setDraftField('projectId', event.target.value)}
                    disabled={!draft.costGroupId}
                  >
                    <option value="">
                      {typeFilteredProjects.length ? '선택하세요' : '프로젝트가 존재하지 않습니다.'}
                    </option>
                    {typeFilteredProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.project.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {showPageSelect ? (
                <label className={'field'}>
                  <span>{isProjectLinkedTab ? '페이지명' : '프로젝트 페이지'}</span>
                  <select
                    value={draft.pageId}
                    onChange={(event) => setDraftField('pageId', event.target.value)}
                  >
                    <option value="">
                      {draftPages.length ? '선택하세요' : '페이지가 존재하지 않습니다.'}
                    </option>
                    {draftPages.map((page) => (
                      <option key={page.id} value={page.id}>
                        {page.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {showManualPageName ? (
                <label className={'field'}>
                  <span>{manualPageLabel}</span>
                  {isVacationType ? (
                    <select
                      value={draft.manualPageName}
                      onChange={(event) => handleVacationTypeChange(event.target.value)}
                    >
                      <option value="">선택하세요</option>
                      <option value="오전 반차">오전 반차</option>
                      <option value="오후 반차">오후 반차</option>
                      <option value="전일 휴가">전일 휴가</option>
                    </select>
                  ) : (
                    <input
                      value={draft.manualPageName}
                      onChange={(event) => setDraftField('manualPageName', event.target.value)}
                      placeholder={manualPageLabel}
                    />
                  )}
                </label>
              ) : null}

              {showPageUrl ? (
                <label className={'field'}>
                  <span>{showPageSelect ? '페이지 URL' : 'URL'}</span>
                  <input
                    value={draft.pageUrl}
                    onChange={(event) => setDraftField('pageUrl', event.target.value)}
                    readOnly={isProjectLinkedTab || usesProjectLookup}
                  />
                </label>
              ) : null}

              <label className={'field'}>
                <span>총시간</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={draft.taskUsedtime}
                  onChange={(event) => setDraftField('taskUsedtime', event.target.value)}
                  readOnly={isReadonlyWorkHours}
                />
              </label>
            </div>

            <label className={'field'}>
              <span>비고</span>
              <textarea
                value={draft.note}
                onChange={(event) => setDraftField('note', event.target.value)}
                rows={2}
              />
            </label>

            {isEdit && currentMember ? (
              <p className={'status'}>
                사용자: {currentMember.accountId} ({currentMember.name})
              </p>
            ) : null}

            <div className={'actionRow'}>
              <button type="submit" className={'primaryButton'} disabled={saveMutation.isPending}>
                저장
              </button>
              <button
                type="button"
                className={'secondaryButton'}
                onClick={() => navigate('/org/search')}
              >
                취소
              </button>
              <button
                type="button"
                className={'secondaryButton'}
                onClick={() =>
                  setDraftField(
                    'reportDate',
                    shiftDateInput(draft.reportDate || getTodayInputValue(), -1),
                  )
                }
              >
                이전일
              </button>
              <button
                type="button"
                className={'secondaryButton'}
                onClick={() => setDraftField('reportDate', getTodayInputValue())}
              >
                오늘
              </button>
              <button
                type="button"
                className={'secondaryButton'}
                onClick={() =>
                  setDraftField(
                    'reportDate',
                    shiftDateInput(draft.reportDate || getTodayInputValue(), 1),
                  )
                }
              >
                다음일
              </button>
            </div>
          </form>
        )}
      </section>
    </section>
  );
}
