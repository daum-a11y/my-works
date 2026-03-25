import type { ReportFilters as OpsReportFilters } from "../../lib/domain";

export type ReportFilters = OpsReportFilters;

export const REPORT_TYPE1_OPTIONS = [
  "기획",
  "개발",
  "QA",
  "운영",
  "지원",
] as const;

export const REPORT_TYPE2_OPTIONS = [
  "작성",
  "수정",
  "검토",
  "배포",
  "점검",
  "회의",
  "지원",
] as const;

export const PERSONAL_REPORT_OWNER = {
  id: "me",
  name: "운영 사용자",
} as const;

export type ReportType1 = (typeof REPORT_TYPE1_OPTIONS)[number];
export type ReportType2 = (typeof REPORT_TYPE2_OPTIONS)[number];

export interface ReportRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  reportDate: string;
  projectId: string;
  pageId: string;
  projectName: string;
  pageName: string;
  type1: ReportType1;
  type2: ReportType2;
  workHours: number;
  content: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDraft {
  reportDate: string;
  projectId: string;
  pageId: string;
  type1: ReportType1;
  type2: ReportType2;
  workHours: string;
  content: string;
  note: string;
}

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  query: "",
  projectId: "",
  pageId: "",
  taskType1: "",
  taskType2: "",
  startDate: "",
  endDate: "",
  minHours: "",
  maxHours: "",
};

function isoToDateInput(value: string) {
  return value.slice(0, 10);
}

export function getTodayInputValue(referenceDate = new Date()) {
  return referenceDate.toISOString().slice(0, 10);
}

export function createEmptyReportDraft(referenceDate = new Date()): ReportDraft {
  return {
    reportDate: getTodayInputValue(referenceDate),
    projectId: "",
    pageId: "",
    type1: REPORT_TYPE1_OPTIONS[0],
    type2: REPORT_TYPE2_OPTIONS[0],
    workHours: "1.0",
    content: "",
    note: "",
  };
}

export function draftFromReport(report: ReportRecord): ReportDraft {
  return {
    reportDate: isoToDateInput(report.reportDate),
    projectId: report.projectId,
    pageId: report.pageId,
    type1: report.type1,
    type2: report.type2,
    workHours: report.workHours.toFixed(1),
    content: report.content,
    note: report.note,
  };
}

export function buildReportFromDraft(
  draft: ReportDraft,
  options: {
    existing?: ReportRecord;
    now?: Date;
  } = {},
): ReportRecord {
  const now = options.now ?? new Date();
  const existing = options.existing;
  return {
    id: existing?.id ?? `report-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    ownerId: existing?.ownerId ?? PERSONAL_REPORT_OWNER.id,
    ownerName: existing?.ownerName ?? PERSONAL_REPORT_OWNER.name,
    reportDate: draft.reportDate,
    projectId: draft.projectId,
    pageId: draft.pageId,
    projectName: existing?.projectName ?? "",
    pageName: existing?.pageName ?? "",
    type1: draft.type1,
    type2: draft.type2,
    workHours: Number.parseFloat(draft.workHours) || 0,
    content: draft.content.trim(),
    note: draft.note.trim(),
    createdAt: existing?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function sortReportsDescending(reports: ReportRecord[]) {
  return [...reports].sort((left, right) => {
    if (left.reportDate !== right.reportDate) {
      return right.reportDate.localeCompare(left.reportDate);
    }

    if (left.updatedAt !== right.updatedAt) {
      return right.updatedAt.localeCompare(left.updatedAt);
    }

    return right.id.localeCompare(left.id);
  });
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function reportMatchesFilters(
  report: ReportRecord,
  filters: ReportFilters,
) {
  const searchText = normalizeText(filters.query);
  const minHours = filters.minHours ? Number.parseFloat(filters.minHours) : null;
  const maxHours = filters.maxHours ? Number.parseFloat(filters.maxHours) : null;

  if (searchText) {
    const searchable = [
      report.reportDate,
      report.projectName,
      report.pageName,
      report.type1,
      report.type2,
      report.content,
      report.note,
    ]
      .join(" ")
      .toLowerCase();

    if (!searchable.includes(searchText)) {
      return false;
    }
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

  if (minHours !== null && report.workHours < minHours) {
    return false;
  }

  if (maxHours !== null && report.workHours > maxHours) {
    return false;
  }

  return true;
}

export function formatReportHours(value: number) {
  return `${value.toFixed(1)}h`;
}

export function formatReportDate(value: string) {
  return value.replaceAll("-", ".");
}
