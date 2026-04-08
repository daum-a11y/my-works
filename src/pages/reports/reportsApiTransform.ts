import type { ApiRecord } from '../../api/api.types';
import {
  normalizePageStatus,
  type CostGroup,
  type Platform,
  type Project,
  type ProjectPage,
  type ReportProjectOptionRow,
  type ServiceGroup,
  type Task,
  type TaskType,
} from '../../types/domain';
import { getToday, readBooleanFlag } from '../../utils';

export function toTask(record: ApiRecord): Task {
  return {
    id: String(record.id),
    memberId: String(record.member_id ?? ''),
    taskDate: String(record.task_date ?? getToday()),
    costGroupId: String(record.cost_group_id ?? ''),
    costGroupName: String(record.cost_group_name ?? ''),
    projectId: record.project_id ? String(record.project_id) : null,
    pageId: record.project_page_id ? String(record.project_page_id) : null,
    taskType1: String(record.task_type1 ?? ''),
    taskType2: String(record.task_type2 ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
    content: String(record.content ?? ''),
    note: String(record.note ?? ''),
    createdAt: String(record.created_at ?? getToday()),
    updatedAt: String(record.updated_at ?? getToday()),
    platform: String(record.platform ?? '-'),
    serviceGroupName: String(record.service_group_name ?? ''),
    serviceName: String(record.service_name ?? ''),
    projectDisplayName: String(record.project_display_name ?? ''),
    pageDisplayName: String(record.page_display_name ?? ''),
    pageUrl: String(record.page_url ?? ''),
  };
}

export function toTaskType(record: ApiRecord): TaskType {
  return {
    id: String(record.id ?? ''),
    type1: String(record.type1 ?? ''),
    type2: String(record.type2 ?? ''),
    label: String(record.display_label ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    requiresServiceGroup: Boolean(record.requires_service_group ?? false),
    isActive: Boolean(record.is_active ?? true),
  };
}

export function toPlatform(record: ApiRecord): Platform {
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    isVisible: readBooleanFlag(record.is_visible, true),
  };
}

export function toCostGroup(record: ApiRecord): CostGroup {
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    isActive: Boolean(record.is_active ?? true),
  };
}

export function toServiceGroup(record: ApiRecord): ServiceGroup {
  const costGroup = Array.isArray(record.cost_groups) ? record.cost_groups[0] : record.cost_groups;
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    costGroupId: record.cost_group_id ? String(record.cost_group_id) : null,
    costGroupName:
      costGroup && typeof costGroup === 'object'
        ? String((costGroup as ApiRecord).name ?? '')
        : String(record.cost_group_name ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    isActive: Boolean(record.is_active ?? true),
  };
}

export function toProject(record: ApiRecord): Project {
  return {
    id: String(record.id),
    createdByMemberId: record.created_by_member_id ? String(record.created_by_member_id) : null,
    projectType1: String(record.project_type1 ?? ''),
    name: String(record.name ?? ''),
    platformId: record.platform_id ? String(record.platform_id) : null,
    platform: String(record.platform ?? ''),
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    reportUrl: String(record.report_url ?? ''),
    reporterMemberId: record.reporter_member_id ? String(record.reporter_member_id) : null,
    reviewerMemberId: record.reviewer_member_id ? String(record.reviewer_member_id) : null,
    startDate: String(record.start_date ?? getToday()),
    endDate: String(record.end_date ?? getToday()),
    isActive: Boolean(record.is_active ?? true),
  };
}

export function toProjectPage(record: ApiRecord): ProjectPage {
  return {
    id: String(record.id),
    projectId: String(record.project_id ?? ''),
    title: String(record.title ?? ''),
    url: String(record.url ?? ''),
    ownerMemberId: record.owner_member_id ? String(record.owner_member_id) : null,
    monitoringMonth: String(record.monitoring_month ?? ''),
    trackStatus: normalizePageStatus(String(record.track_status ?? '미수정')),
    monitoringInProgress: Boolean(record.monitoring_in_progress ?? false),
    qaInProgress: Boolean(record.qa_in_progress ?? false),
    note: String(record.note ?? ''),
    updatedAt: String(record.updated_at ?? getToday()),
  };
}

export function toReportProjectOption(record: ApiRecord): ReportProjectOptionRow {
  return {
    id: String(record.id ?? ''),
    projectType1: String(record.project_type1 ?? ''),
    name: String(record.name ?? ''),
    platform: String(record.platform ?? ''),
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    serviceGroupName: String(record.service_group_name ?? ''),
    serviceName: String(record.service_name ?? ''),
    costGroupId: record.cost_group_id ? String(record.cost_group_id) : null,
    costGroupName: String(record.cost_group_name ?? ''),
    reportUrl: String(record.report_url ?? ''),
  };
}
