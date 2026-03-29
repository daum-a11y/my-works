import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Project, ProjectPage, ServiceGroup, TaskType } from '../../../lib/domain';
import {
  buildProjectViewModels,
  buildTaskType1Options,
  buildTaskType2Options,
  createEmptyReportDraft,
  getTodayInputValue,
  parseLegacyTaskMeta,
  parseReportHoursInput,
  shiftDateInput,
  validateTaskTypeSelection,
  type ReportDraft,
} from '../../reports/report-domain';
import { adminDataClient } from '../admin-client';
import type { AdminTaskSearchItem, MemberAdminItem } from '../admin-types';
import styles from '../../reports/reports-page.module.css';

const PROJECT_LINKED_PAGE_SELECT_TYPE2_IDS = [
  '2',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '65',
  '88',
  '96',
  '97',
  '98',
  '99',
  '100',
] as const;
const PROJECT_LINKED_PAGE_URL_TYPE2_IDS = [
  '2',
  '4',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '50',
  '51',
  '65',
  '88',
  '96',
  '97',
  '98',
  '99',
  '100',
] as const;
const PROJECT_LINKED_MANUAL_PAGE_TYPE2_IDS = ['35', '38', '67', '69'] as const;
const TYPE_INPUT_PAGE_SELECT_TYPE2_IDS = ['2', '7', '9', '10', '12', '13'] as const;
const TYPE_INPUT_PAGE_URL_TYPE2_IDS = ['2', '7', '9', '10', '12', '13', '50'] as const;

function includesValue(values: readonly string[], value: string) {
  return values.includes(value);
}

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

function toTaskTypes(items: Awaited<ReturnType<typeof adminDataClient.listTaskTypes>>): TaskType[] {
  return items.map((item) => ({
    id: item.id,
    legacyTypeId: item.legacyTypeNum == null ? '' : String(item.legacyTypeNum),
    type1: item.type1,
    type2: item.type2,
    label: item.displayLabel,
    displayOrder: item.displayOrder,
    requiresServiceGroup: item.requiresServiceGroup,
  }));
}

function toServiceGroups(
  items: Awaited<ReturnType<typeof adminDataClient.listServiceGroups>>,
): ServiceGroup[] {
  return items.map((item) => ({
    id: item.id,
    legacyServiceGroupId: item.legacySvcNum == null ? '' : String(item.legacySvcNum),
    name: item.name,
    displayOrder: item.displayOrder,
  }));
}

function toProjects(items: Awaited<ReturnType<typeof adminDataClient.listProjects>>): Project[] {
  return items.map((item) => ({
    id: item.id,
    legacyProjectId: '',
    createdByMemberId: null,
    projectType1: item.projectType1,
    name: item.name,
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

function toPages(
  items: Awaited<ReturnType<typeof adminDataClient.listProjectPages>>,
): ProjectPage[] {
  return items.map((item) => ({
    id: item.id,
    legacyPageId: '',
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
  const meta = parseLegacyTaskMeta(task.note);

  return {
    reportDate: task.taskDate,
    projectId: task.projectId ?? '',
    pageId: task.pageId ?? '',
    type1: task.taskType1,
    type2: task.taskType2,
    platform: meta.platform || task.platform || '',
    serviceGroupName: meta.serviceGroupName || task.serviceGroupName || '',
    serviceName: meta.serviceName || task.serviceName || '',
    manualPageName: meta.pageName || task.pageTitle || '',
    pageUrl: meta.pageUrl || task.pageUrl || '',
    workHours: String(task.hours ?? 0),
    content: task.content || '',
    note: meta.rawNote || task.note || '',
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
  const projectsQuery = useQuery({
    queryKey: ['admin', 'projects'],
    queryFn: () => adminDataClient.listProjects(),
  });
  const pagesQuery = useQuery({
    queryKey: ['admin', 'project-pages'],
    queryFn: () => adminDataClient.listProjectPages(),
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
  const projects = useMemo(() => toProjects(projectsQuery.data ?? []), [projectsQuery.data]);
  const pages = useMemo(() => toPages(pagesQuery.data ?? []), [pagesQuery.data]);

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
    if (!normalizedProjectQuery) {
      return projectOptions.slice(0, 60);
    }

    return projectOptions
      .filter((project) =>
        project.project.name.trim().toLowerCase().includes(normalizedProjectQuery),
      )
      .slice(0, 60);
  }, [normalizedProjectQuery, projectOptions]);
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
  const selectedType2LegacyId = useMemo(
    () =>
      taskTypes.find((taskType) => taskType.type1 === draft.type1 && taskType.type2 === draft.type2)
        ?.legacyTypeId ?? '',
    [draft.type1, draft.type2, taskTypes],
  );
  const reportTabType1Options = useMemo(() => {
    const legacyOrder = ['민원', '데이터버퍼', '일반버퍼', '교육', '기타버퍼', '휴무'];
    const available = legacyOrder.filter((type1) =>
      buildTaskType1Options(taskTypes).includes(type1),
    );
    return available.length ? available : buildTaskType1Options(taskTypes);
  }, [taskTypes]);
  const type1Options = useMemo(() => buildTaskType1Options(taskTypes), [taskTypes]);
  const type2Options = useMemo(
    () => buildTaskType2Options(taskTypes, draft.type1),
    [draft.type1, taskTypes],
  );
  const isProjectLinkedTab = activeTab === 'report';
  const projectTypeSelected = isProjectLinkedTab && Boolean(draft.projectId);
  const type1Value = projectTypeSelected
    ? currentProject?.project.projectType1 || draft.type1
    : draft.type1;
  const usesProjectLookup = includesValue(['QA', '접근성테스트', '모니터링', '민원'], type1Value);
  const usesManualPageWithUrl = includesValue(['데이터버퍼', 'RnD'], type1Value);
  const usesManualPageOnly = includesValue(['일반버퍼', '교육', '매니징', '기타버퍼'], type1Value);
  const showPlatformSelect = !projectTypeSelected && usesProjectLookup;
  const showReadonlyService = projectTypeSelected || usesProjectLookup;
  const showProjectSelect = isProjectLinkedTab || usesProjectLookup;
  const isVacationType = selectedType2LegacyId === '36';
  const isFixedDayType = selectedType2LegacyId === '38';
  const showProjectLinkedPageSelect =
    projectTypeSelected &&
    includesValue(PROJECT_LINKED_PAGE_SELECT_TYPE2_IDS, selectedType2LegacyId);
  const showProjectLinkedPageUrl =
    projectTypeSelected && includesValue(PROJECT_LINKED_PAGE_URL_TYPE2_IDS, selectedType2LegacyId);
  const showPageSelect = isProjectLinkedTab
    ? showProjectLinkedPageSelect
    : Boolean(draft.projectId) &&
      (includesValue(['모니터링', '민원'], type1Value) ||
        includesValue(TYPE_INPUT_PAGE_SELECT_TYPE2_IDS, selectedType2LegacyId));
  const showPageUrl = isProjectLinkedTab
    ? showProjectLinkedPageUrl
    : usesProjectLookup ||
      usesManualPageWithUrl ||
      includesValue(TYPE_INPUT_PAGE_URL_TYPE2_IDS, selectedType2LegacyId);
  const showManualPageName = isProjectLinkedTab
    ? includesValue(PROJECT_LINKED_MANUAL_PAGE_TYPE2_IDS, selectedType2LegacyId) || isVacationType
    : usesManualPageWithUrl ||
      usesManualPageOnly ||
      includesValue(['36', '38', '67', '69'], selectedType2LegacyId);
  const isReadonlyWorkHours = isVacationType || isFixedDayType;
  const manualPageLabel = useMemo(() => {
    if (isVacationType) {
      return '휴가 종류';
    }
    if (includesValue(['35', '38', '67', '69'], selectedType2LegacyId)) {
      return '페이지명';
    }
    return '페이지명 & 내용';
  }, [isVacationType, selectedType2LegacyId]);
  const typeFilteredProjects = useMemo(() => {
    if (!draft.platform || !draft.type1) {
      return [] as typeof filteredProjectOptions;
    }

    return filteredProjectOptions.filter(
      (project) =>
        project.project.platform === draft.platform && project.project.projectType1 === draft.type1,
    );
  }, [draft.platform, draft.type1, filteredProjectOptions]);
  const projectSearchPlaceholder = useMemo(() => {
    if (!projectQuery.trim()) {
      return '선택하세요';
    }
    if (!filteredProjectOptions.length) {
      return '검색 결과가 없습니다.';
    }
    return `${projectQuery} 로 검색되었습니다. 목록을 선택하세요`;
  }, [filteredProjectOptions.length, projectQuery]);
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

  const handleType2Change = (nextType2: string) => {
    const previousLegacyId = selectedType2LegacyId;
    setDraftField('type2', nextType2 as ReportDraft['type2']);

    if (nextType2 === draft.type2) {
      return;
    }

    const nextLegacyId =
      taskTypes.find((taskType) => taskType.type1 === type1Value && taskType.type2 === nextType2)
        ?.legacyTypeId ?? '';
    if (nextLegacyId === '38') {
      setDraftField('manualPageName', '');
      setDraftField('workHours', '480');
      return;
    }

    if (nextLegacyId === '36' || nextLegacyId === '67' || nextLegacyId === '69') {
      setDraftField('manualPageName', '');
      setDraftField('workHours', '');
      return;
    }

    if (
      previousLegacyId === '36' ||
      previousLegacyId === '38' ||
      previousLegacyId === '67' ||
      previousLegacyId === '69'
    ) {
      setDraftField('manualPageName', '');
      setDraftField('workHours', '');
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
      setDraftField('workHours', '240');
      return;
    }
    if (value === '전일 휴가') {
      setDraftField('workHours', '480');
      return;
    }
    setDraftField('workHours', '');
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMemberId) {
        throw new Error('사용자를 선택해 주세요.');
      }

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

      await adminDataClient.saveTaskAdmin({
        id: isEdit ? taskId : undefined,
        memberId: selectedMemberId,
        taskDate: draft.reportDate,
        projectId: draft.projectId,
        pageId: draft.pageId,
        taskType1: taskType.type1,
        taskType2: taskType.type2,
        hours,
        content: taskQuery.data?.content ?? '',
        note,
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
    projectsQuery.isLoading ||
    pagesQuery.isLoading ||
    taskQuery.isLoading;
  const queryError =
    (membersQuery.error instanceof Error && membersQuery.error.message) ||
    (taskTypesQuery.error instanceof Error && taskTypesQuery.error.message) ||
    (serviceGroupsQuery.error instanceof Error && serviceGroupsQuery.error.message) ||
    (projectsQuery.error instanceof Error && projectsQuery.error.message) ||
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
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroMain}>
          <h1 className={styles.title}>{isEdit ? '전체 업무 수정' : '전체 업무 추가'}</h1>
          <p className={styles.description}>
            {isEdit ? '기존 업무를 수정합니다.' : '누락된 업무를 관리자 화면에서 등록합니다.'}
          </p>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>업무 입력</h2>
            <p className={styles.dateText}>{draft.reportDate || getTodayInputValue()}</p>
          </div>
          <div className={styles.tabRow}>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === 'report' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('report')}
            >
              기본 입력
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === 'period' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('period')}
            >
              TYPE 입력
            </button>
          </div>
        </div>

        {queryError ? <p className={styles.statusMsg}>{queryError}</p> : null}
        {statusMessage ? <p className={styles.statusMsg}>{statusMessage}</p> : null}

        {loading ? (
          <p className={styles.status}>불러오는 중입니다...</p>
        ) : isEdit && !taskQuery.data ? (
          <p className={styles.status}>수정할 업무를 찾을 수 없습니다.</p>
        ) : (
          <form className={styles.form} onSubmit={onSubmit}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
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

              <label className={styles.field}>
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
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>프로젝트검색</span>
                  <input
                    value={projectQuery}
                    onChange={(event) => setProjectQuery(event.target.value)}
                    onKeyDown={handleProjectSearchKeyDown}
                    placeholder="검색어입력"
                  />
                </label>

                <div className={styles.searchButtonField}>
                  <span className={styles.srOnly}>프로젝트 검색</span>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => setAppliedProjectQuery(projectQuery)}
                  >
                    검색
                  </button>
                </div>

                <label className={styles.field}>
                  <span>프로젝트</span>
                  <select
                    value={draft.projectId}
                    onChange={(event) => setDraftField('projectId', event.target.value)}
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

            <div className={styles.formGrid}>
              {projectTypeSelected ? (
                <label className={styles.field}>
                  <span>타입1</span>
                  <input value={type1Value} readOnly />
                </label>
              ) : (
                <label className={styles.field}>
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

              <label className={styles.field}>
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
                <label className={styles.field}>
                  <span>플랫폼</span>
                  <select
                    value={draft.platform}
                    onChange={(event) => setDraftField('platform', event.target.value)}
                  >
                    <option value="">선택하세요</option>
                    {['PC-Web', 'M-Web', 'iOS-App', 'And-App', 'Win-App'].map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {showReadonlyService ? (
                <>
                  <label className={styles.field}>
                    <span>서비스 그룹</span>
                    <input value={draft.serviceGroupName} readOnly />
                  </label>
                  <label className={styles.field}>
                    <span>서비스 명</span>
                    <input value={draft.serviceName} readOnly />
                  </label>
                </>
              ) : null}

              {showProjectSelect && !isProjectLinkedTab ? (
                <label className={styles.field}>
                  <span>프로젝트</span>
                  <select
                    value={draft.projectId}
                    onChange={(event) => setDraftField('projectId', event.target.value)}
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
                <label className={styles.field}>
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
                <label className={styles.field}>
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
                <label className={styles.field}>
                  <span>{showPageSelect ? '페이지 URL' : 'URL'}</span>
                  <input
                    value={draft.pageUrl}
                    onChange={(event) => setDraftField('pageUrl', event.target.value)}
                    readOnly={isProjectLinkedTab || usesProjectLookup}
                  />
                </label>
              ) : null}

              <label className={styles.field}>
                <span>총시간</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={draft.workHours}
                  onChange={(event) => setDraftField('workHours', event.target.value)}
                  readOnly={isReadonlyWorkHours}
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>비고</span>
              <textarea
                value={draft.note}
                onChange={(event) => setDraftField('note', event.target.value)}
                rows={2}
              />
            </label>

            {isEdit && currentMember ? (
              <p className={styles.status}>
                사용자: {currentMember.accountId} ({currentMember.name})
              </p>
            ) : null}

            <div className={styles.actionRow}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={saveMutation.isPending}
              >
                저장
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => navigate('/org/search')}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
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
                className={styles.secondaryButton}
                onClick={() => setDraftField('reportDate', getTodayInputValue())}
              >
                오늘
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
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
