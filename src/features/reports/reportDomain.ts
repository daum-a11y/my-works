import type {
  Project,
  ProjectPage,
  ReportProjectOptionRow,
  ReportFilters as OpsReportFilters,
  ServiceGroup,
  Task,
  TaskType,
} from '../../lib/domain';
import {
  buildProjectTypeOptions,
  buildTaskType1Options as buildTaskType1OptionValues,
  buildTaskType2Options as buildTaskType2OptionValues,
} from '../../lib/taskTypeRules';

export type ReportFilters = OpsReportFilters;

export const REPORT_TYPE1_OPTIONS = ['기획', '개발', 'QA', '운영', '지원'] as const;

export const REPORT_TYPE2_OPTIONS = [
  '작성',
  '수정',
  '검토',
  '배포',
  '점검',
  '회의',
  '지원',
] as const;

export const PERSONAL_REPORT_OWNER = {
  id: 'me',
  name: '운영 사용자',
} as const;

export type ReportType1 = string;
export type ReportType2 = string;

export interface ReportRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  reportDate: string;
  costGroupId: string;
  costGroupName: string;
  projectId: string;
  pageId: string;
  projectName: string;
  pageName: string;
  type1: ReportType1;
  type2: ReportType2;
  taskUsedtime: number;
  content: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDraft {
  reportDate: string;
  costGroupId: string;
  costGroupName: string;
  projectId: string;
  pageId: string;
  type1: ReportType1;
  type2: ReportType2;
  platform: string;
  serviceGroupName: string;
  serviceName: string;
  manualPageName: string;
  pageUrl: string;
  taskUsedtime: string;
  content: string;
  note: string;
}

export interface ProjectViewModel {
  id: string;
  project: Project;
  costGroupId: string | null;
  costGroupName: string;
  serviceGroupId: string | null;
  serviceGroupName: string;
  serviceName: string;
  label: string;
  searchText: string;
}

export interface ProjectPageViewModel {
  id: string;
  page: ProjectPage;
  projectName: string;
  serviceGroupName: string;
  label: string;
  searchText: string;
}

export interface ReportViewModel extends ReportRecord {
  platform: string;
  serviceGroupName: string;
  serviceName: string;
  projectDisplayName: string;
  pageDisplayName: string;
  pageUrl: string;
  searchText: string;
}

export type ReportSortMode =
  | 'date-desc'
  | 'date-asc'
  | 'updated-desc'
  | 'updated-asc'
  | 'project-asc'
  | 'project-desc'
  | 'task-usedtime-desc'
  | 'task-usedtime-asc';

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  query: '',
  projectId: '',
  pageId: '',
  taskType1: '',
  taskType2: '',
  startDate: '',
  endDate: '',
  minTaskUsedtime: '',
  maxTaskUsedtime: '',
};

function isoToDateInput(value: string) {
  return value.slice(0, 10);
}

function toLocalInputDate(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string) {
  if (!value) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number.parseInt(yearText ?? '', 10);
  const month = Number.parseInt(monthText ?? '', 10);
  const day = Number.parseInt(dayText ?? '', 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function compareStrings(left: string, right: string) {
  return left.localeCompare(right, 'ko');
}

function buildServiceGroupMap(serviceGroups: ServiceGroup[]) {
  return new Map(serviceGroups.map((group) => [group.id, group] as const));
}

function splitServiceGroupName(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return {
      serviceGroupName: '',
      serviceName: '',
    };
  }

  const separator = normalized.indexOf(' / ');
  if (separator < 0) {
    return {
      serviceGroupName: normalized,
      serviceName: '',
    };
  }

  return {
    serviceGroupName: normalized.slice(0, separator),
    serviceName: normalized.slice(separator + 3),
  };
}

function buildProjectLookup(project: Project, normalizedServiceName: string) {
  const { serviceGroupName, serviceName } = splitServiceGroupName(normalizedServiceName);
  const projectName = project.name || '';
  const label = [serviceGroupName, projectName].filter(Boolean).join(' / ') || projectName;
  const searchText = normalizeText(
    [serviceGroupName, serviceName, projectName, project.platform, project.id].join(' '),
  );

  return {
    id: project.id,
    project,
    costGroupId: null,
    costGroupName: '',
    serviceGroupId: project.serviceGroupId,
    serviceGroupName,
    serviceName,
    label,
    searchText,
  } satisfies ProjectViewModel;
}

function buildPageLookup(
  page: ProjectPage,
  project: Project | undefined,
  serviceGroupName: string,
) {
  const projectName = project?.name || '';
  const label =
    [serviceGroupName, projectName, page.title].filter(Boolean).join(' / ') || page.title;
  const searchText = normalizeText(
    [serviceGroupName, projectName, page.title, page.note, page.url, page.id].join(' '),
  );

  return {
    id: page.id,
    page,
    projectName,
    serviceGroupName,
    label,
    searchText,
  } satisfies ProjectPageViewModel;
}

export function buildProjectViewModels(projects: Project[], serviceGroups: ServiceGroup[]) {
  const serviceGroupsById = buildServiceGroupMap(serviceGroups);

  return projects.map((project) => {
    const serviceGroup = project.serviceGroupId
      ? serviceGroupsById.get(project.serviceGroupId)
      : null;
    const next = buildProjectLookup(project, serviceGroup?.name ?? '');
    return {
      ...next,
      costGroupId: serviceGroup?.costGroupId ?? null,
      costGroupName: serviceGroup?.costGroupName ?? '',
    };
  });
}

export function buildProjectViewModelsFromRows(rows: ReportProjectOptionRow[]) {
  return rows.map((row) => {
    const next = buildProjectLookup(
      {
        id: row.id,
        createdByMemberId: null,
        projectType1: row.projectType1,
        name: row.name,
        platformId: null,
        platform: row.platform,
        serviceGroupId: row.serviceGroupId,
        reportUrl: row.reportUrl,
        reporterMemberId: null,
        reviewerMemberId: null,
        startDate: '',
        endDate: '',
        isActive: true,
      },
      row.serviceName ? `${row.serviceGroupName} / ${row.serviceName}` : row.serviceGroupName,
    );
    return {
      ...next,
      costGroupId: row.costGroupId,
      costGroupName: row.costGroupName,
      serviceGroupName: row.serviceGroupName,
      serviceName: row.serviceName,
    };
  });
}

export function buildProjectPageViewModels(
  pages: ProjectPage[],
  projects: Project[],
  serviceGroups: ServiceGroup[],
) {
  const projectsById = new Map(projects.map((project) => [project.id, project] as const));
  const serviceGroupsById = buildServiceGroupMap(serviceGroups);

  return pages.map((page) => {
    const project = projectsById.get(page.projectId);
    const serviceGroupName = project?.serviceGroupId
      ? (serviceGroupsById.get(project.serviceGroupId)?.name ?? '')
      : '';
    return buildPageLookup(page, project, serviceGroupName);
  });
}

export function buildTaskType1Options(taskTypes: TaskType[]) {
  const values = buildTaskType1OptionValues(taskTypes);
  return values.length ? values : [...REPORT_TYPE1_OPTIONS];
}

export function buildSelectableTaskType1Options(taskTypes: TaskType[], currentValue = '') {
  const values = buildTaskType1OptionValues(taskTypes, { currentValue });
  return values.length ? values : [...REPORT_TYPE1_OPTIONS];
}

export function buildSelectableProjectTypeOptions(taskTypes: TaskType[], currentValue = '') {
  return buildProjectTypeOptions(taskTypes, currentValue);
}

export function buildTaskType2Options(taskTypes: TaskType[], selectedType1 = '') {
  return buildTaskType2OptionsForValue(taskTypes, selectedType1);
}

export function buildTaskType2OptionsForValue(
  taskTypes: TaskType[],
  selectedType1 = '',
  currentValue = '',
) {
  if (!selectedType1) {
    return [];
  }

  const values = buildTaskType2OptionValues(taskTypes, selectedType1, currentValue);
  return values.length ? values : [...REPORT_TYPE2_OPTIONS];
}

export function validateTaskTypeSelection(taskTypes: TaskType[], type1: string, type2: string) {
  const normalizedType1 = type1.trim();
  const normalizedType2 = type2.trim();

  if (!normalizedType1 || !normalizedType2) {
    throw new Error('업무 유형을 모두 선택해 주세요.');
  }

  if (!taskTypes.length) {
    throw new Error('업무 유형 기준 정보를 확인할 수 없습니다.');
  }

  const isValid = taskTypes.some(
    (taskType) => taskType.type1 === normalizedType1 && taskType.type2 === normalizedType2,
  );

  if (!isValid) {
    throw new Error('업무 유형 기준 정보와 일치하지 않습니다.');
  }

  return {
    type1: normalizedType1,
    type2: normalizedType2,
  };
}

export function parseReportTaskUsedtimeInput(value: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    throw new Error('소요 시간을 분 단위로 입력해 주세요.');
  }

  const parsed = Number.parseInt(normalizedValue, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('소요 시간은 0 이상의 분으로 입력해 주세요.');
  }

  if (!/^\d+$/.test(normalizedValue)) {
    throw new Error('소요 시간은 분 단위 정수로 입력해 주세요.');
  }

  return parsed;
}

export function getTodayInputValue(referenceDate = new Date()) {
  return toLocalInputDate(referenceDate);
}

export function shiftDateInput(value: string, offsetDays: number) {
  const parsed = parseDateInput(value);
  const next = parsed ?? new Date();
  next.setDate(next.getDate() + offsetDays);
  return toLocalInputDate(next);
}

export function createEmptyReportDraft(referenceDate = new Date()): ReportDraft {
  return {
    reportDate: getTodayInputValue(referenceDate),
    costGroupId: '',
    costGroupName: '',
    projectId: '',
    pageId: '',
    type1: '',
    type2: '',
    platform: '',
    serviceGroupName: '',
    serviceName: '',
    manualPageName: '',
    pageUrl: '',
    taskUsedtime: '60',
    content: '',
    note: '',
  };
}

export function draftFromReport(report: ReportRecord): ReportDraft {
  const reportView = report as Partial<ReportViewModel>;
  return {
    reportDate: isoToDateInput(report.reportDate),
    costGroupId: reportView.costGroupId ?? '',
    costGroupName: reportView.costGroupName ?? '',
    projectId: report.projectId,
    pageId: report.pageId,
    type1: report.type1,
    type2: report.type2,
    platform: reportView.platform ?? '',
    serviceGroupName: reportView.serviceGroupName ?? '',
    serviceName: reportView.serviceName ?? '',
    manualPageName: report.pageName,
    pageUrl: reportView.pageUrl ?? '',
    taskUsedtime: String(report.taskUsedtime),
    content: report.content,
    note: report.note,
  };
}

export function buildReportFromDraft(
  draft: ReportDraft,
  taskTypes: TaskType[],
  options: {
    existing?: ReportRecord;
    now?: Date;
  } = {},
): ReportRecord {
  const now = options.now ?? new Date();
  const existing = options.existing;
  const taskType = validateTaskTypeSelection(taskTypes, draft.type1, draft.type2);

  return {
    id: existing?.id ?? `report-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    ownerId: existing?.ownerId ?? PERSONAL_REPORT_OWNER.id,
    ownerName: existing?.ownerName ?? PERSONAL_REPORT_OWNER.name,
    reportDate: draft.reportDate,
    costGroupId: draft.costGroupId,
    costGroupName: draft.costGroupName,
    projectId: draft.projectId,
    pageId: draft.pageId,
    projectName: existing?.projectName ?? '',
    pageName: existing?.pageName ?? '',
    type1: taskType.type1,
    type2: taskType.type2,
    taskUsedtime: parseReportTaskUsedtimeInput(draft.taskUsedtime),
    content: draft.content.trim(),
    note: draft.note.trim(),
    createdAt: existing?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function buildReportViewModel(
  report: ReportRecord,
  projectsById: Map<string, Project>,
  serviceGroupsById: Map<string, ServiceGroup>,
  pagesById: Map<string, ProjectPage>,
) {
  const project = report.projectId ? (projectsById.get(report.projectId) ?? null) : null;
  const page = report.pageId ? (pagesById.get(report.pageId) ?? null) : null;
  const splitProjectService = project?.serviceGroupId
    ? splitServiceGroupName(serviceGroupsById.get(project.serviceGroupId)?.name ?? '')
    : null;
  const costGroupName = report.costGroupName ?? '';
  const serviceGroupName = splitProjectService?.serviceGroupName ?? '';
  const platform = project?.platform ?? '';
  const serviceName = splitProjectService?.serviceName ?? '';
  const resolvedProjectName = project?.name ?? report.projectName ?? '';
  const projectDisplayName = resolvedProjectName || '-';
  const pageDisplayName = page?.title || report.pageName || '-';
  const pageUrl = page?.url || '';
  const searchText = normalizeText(
    [
      report.reportDate,
      costGroupName,
      platform,
      serviceGroupName,
      serviceName,
      pageDisplayName,
      pageUrl,
      report.type1,
      report.type2,
      report.content,
      report.note,
    ].join(' '),
  );

  return {
    ...report,
    costGroupName,
    platform,
    serviceGroupName,
    serviceName,
    projectDisplayName,
    pageDisplayName,
    pageUrl,
    searchText,
  } satisfies ReportViewModel;
}

export function buildTaskReportViewModel(task: Task, owner: { id: string; name: string }) {
  const projectDisplayName = task.projectDisplayName || '-';
  const pageDisplayName = task.pageDisplayName || task.content || '-';
  const searchText = normalizeText(
    [
      task.costGroupName,
      task.platform,
      task.serviceGroupName,
      task.serviceName,
      projectDisplayName,
      pageDisplayName,
      task.taskType1,
      task.taskType2,
      task.content,
      task.note,
      task.pageUrl,
      task.id,
    ].join(' '),
  );

  return {
    id: task.id,
    ownerId: owner.id,
    ownerName: owner.name,
    reportDate: task.taskDate,
    costGroupId: task.costGroupId,
    costGroupName: task.costGroupName,
    projectId: task.projectId ?? '',
    pageId: task.pageId ?? '',
    projectName: task.projectDisplayName || '',
    pageName: task.pageDisplayName || task.content || '',
    type1: task.taskType1 as ReportViewModel['type1'],
    type2: task.taskType2 as ReportViewModel['type2'],
    taskUsedtime: task.taskUsedtime,
    content: task.content,
    note: task.note,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    platform: task.platform || '-',
    serviceGroupName: task.serviceGroupName || '',
    serviceName: task.serviceName || '',
    projectDisplayName,
    pageDisplayName,
    pageUrl: task.pageUrl || '',
    searchText,
  } satisfies ReportViewModel;
}

export function sortReportsByMode<T extends ReportRecord>(
  reports: readonly T[],
  mode: ReportSortMode,
) {
  return [...reports].sort((left, right) => {
    switch (mode) {
      case 'date-asc':
        return (
          left.reportDate.localeCompare(right.reportDate) ||
          left.updatedAt.localeCompare(right.updatedAt)
        );
      case 'updated-desc':
        return right.updatedAt.localeCompare(left.updatedAt) || right.id.localeCompare(left.id);
      case 'updated-asc':
        return left.updatedAt.localeCompare(right.updatedAt) || left.id.localeCompare(right.id);
      case 'project-asc':
        return (
          compareStrings(left.projectName || '', right.projectName || '') ||
          compareStrings(left.pageName || '', right.pageName || '') ||
          compareStrings(left.id, right.id)
        );
      case 'project-desc':
        return (
          compareStrings(right.projectName || '', left.projectName || '') ||
          compareStrings(right.pageName || '', left.pageName || '') ||
          compareStrings(right.id, left.id)
        );
      case 'task-usedtime-desc':
        return (
          right.taskUsedtime - left.taskUsedtime ||
          right.updatedAt.localeCompare(left.updatedAt) ||
          right.id.localeCompare(left.id)
        );
      case 'task-usedtime-asc':
        return (
          left.taskUsedtime - right.taskUsedtime ||
          left.updatedAt.localeCompare(right.updatedAt) ||
          left.id.localeCompare(right.id)
        );
      case 'date-desc':
      default:
        return (
          right.reportDate.localeCompare(left.reportDate) ||
          right.updatedAt.localeCompare(left.updatedAt) ||
          right.id.localeCompare(left.id)
        );
    }
  });
}

export function sortReportsDescending<T extends ReportRecord>(reports: readonly T[]) {
  return sortReportsByMode(reports, 'date-desc');
}

function buildReportSearchText(report: ReportRecord) {
  return normalizeText(
    [
      report.reportDate,
      report.projectName,
      report.pageName,
      // Search stays permissive; page URL is only present on view models.
      report.type1,
      report.type2,
      report.content,
      report.note,
    ].join(' '),
  );
}

export function reportMatchesFilters(report: ReportRecord, filters: ReportFilters) {
  const searchText = normalizeText(filters.query);
  const minTaskUsedtime = filters.minTaskUsedtime
    ? Number.parseFloat(filters.minTaskUsedtime)
    : null;
  const maxTaskUsedtime = filters.maxTaskUsedtime
    ? Number.parseFloat(filters.maxTaskUsedtime)
    : null;

  if (searchText && !buildReportSearchText(report).includes(searchText)) {
    return false;
  }

  if (filters.projectId && report.projectId !== filters.projectId) {
    return false;
  }

  if (filters.pageId && report.pageId !== filters.pageId) {
    return false;
  }

  if (filters.taskType1 && report.type1 !== filters.taskType1) {
    return false;
  }

  if (filters.taskType2 && report.type2 !== filters.taskType2) {
    return false;
  }

  if (filters.startDate && report.reportDate < filters.startDate) {
    return false;
  }

  if (filters.endDate && report.reportDate > filters.endDate) {
    return false;
  }

  if (minTaskUsedtime !== null && report.taskUsedtime < minTaskUsedtime) {
    return false;
  }

  if (maxTaskUsedtime !== null && report.taskUsedtime > maxTaskUsedtime) {
    return false;
  }

  return true;
}

export function formatReportTaskUsedtime(value: number) {
  return `${value}분`;
}

export function formatReportDate(value: string) {
  return value.replaceAll('-', '.');
}

export function formatReportDateTime(value: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(date)
    .replaceAll('. ', '.')
    .replace(', ', ' ');
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildReportDownloadHtml(reports: readonly ReportViewModel[], title: string) {
  const rows = reports
    .map(
      (report) => `
        <tr>
          <td>${escapeHtml(formatReportDate(report.reportDate))}</td>
          <td>${escapeHtml(report.projectDisplayName)}</td>
          <td>${escapeHtml(report.pageDisplayName)}</td>
          <td>${escapeHtml(report.type1)}</td>
          <td>${escapeHtml(report.type2)}</td>
          <td>${escapeHtml(formatReportTaskUsedtime(report.taskUsedtime))}</td>
          <td>${escapeHtml(report.content)}</td>
          <td>${escapeHtml(report.note)}</td>
        </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        margin: 0;
        padding: 24px;
        color: #1f2937;
        background: #f7f5f1;
      }
      h1 {
        margin: 0 0 16px;
        font-size: 24px;
      }
      p {
        margin: 0 0 20px;
        color: #4b5563;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        background: white;
      }
      th,
      td {
        padding: 10px 12px;
        border: 1px solid #d8d5cf;
        text-align: left;
        vertical-align: top;
        font-size: 13px;
      }
      th {
        background: #efebe5;
      }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(`${reports.length}건의 보고서`)}</p>
    <table>
      <thead>
        <tr>
          <th>일자</th>
          <th>프로젝트</th>
          <th>페이지</th>
          <th>TYPE1</th>
          <th>TYPE2</th>
          <th>시간</th>
          <th>내용</th>
          <th>메모</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
</html>`;
}
