import type { ApiRecord } from '../../api/api.types';
import {
  normalizeSubtaskStatus,
  type CostGroup,
  type Platform,
  type Project,
  type ProjectSubtask,
  type ReportProjectOptionRow,
  type ServiceGroup,
  type Task,
  type TaskType,
} from '../../types/domain';
import { getToday, readBooleanFlag } from '../../utils';

function readValue(record: ApiRecord, snakeKey: string, camelKey: string) {
  return record[snakeKey] ?? record[camelKey];
}

function composeServiceGroupLabel(serviceGroupName: string, serviceName: string) {
  if (!serviceGroupName && !serviceName) {
    return '';
  }
  if (!serviceGroupName) {
    return serviceName;
  }
  if (!serviceName) {
    return serviceGroupName;
  }
  return `${serviceGroupName} / ${serviceName}`;
}

function splitServiceGroupLabel(value: string) {
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

export function toTask(record: ApiRecord): Task {
  return {
    id: String(record.id),
    memberId: String(readValue(record, 'member_id', 'memberId') ?? ''),
    taskDate: String(readValue(record, 'task_date', 'taskDate') ?? getToday()),
    costGroupId: String(readValue(record, 'cost_group_id', 'costGroupId') ?? ''),
    costGroupName: String(readValue(record, 'cost_group_name', 'costGroupName') ?? ''),
    projectId: readValue(record, 'project_id', 'projectId')
      ? String(readValue(record, 'project_id', 'projectId'))
      : null,
    subtaskId: readValue(record, 'project_subtask_id', 'subtaskId')
      ? String(readValue(record, 'project_subtask_id', 'subtaskId'))
      : null,
    taskType1: String(readValue(record, 'task_type1', 'taskType1') ?? ''),
    taskType2: String(readValue(record, 'task_type2', 'taskType2') ?? ''),
    taskUsedtime: Number(readValue(record, 'task_usedtime', 'taskUsedtime') ?? 0),
    content: String(record.content ?? ''),
    note: String(record.note ?? ''),
    createdAt: String(readValue(record, 'created_at', 'createdAt') ?? getToday()),
    updatedAt: String(readValue(record, 'updated_at', 'updatedAt') ?? getToday()),
    platform: record.platform == null ? null : String(record.platform),
    serviceGroupName:
      readValue(record, 'service_group_name', 'serviceGroupName') == null
        ? null
        : String(readValue(record, 'service_group_name', 'serviceGroupName')),
    serviceName:
      readValue(record, 'service_name', 'serviceName') == null
        ? null
        : String(readValue(record, 'service_name', 'serviceName')),
    projectName:
      readValue(record, 'project_name', 'projectName') == null
        ? null
        : String(readValue(record, 'project_name', 'projectName')),
    subtaskTitle:
      readValue(record, 'subtask_title', 'subtaskTitle') == null
        ? null
        : String(readValue(record, 'subtask_title', 'subtaskTitle')),
    url: readValue(record, 'url', 'url') == null ? null : String(readValue(record, 'url', 'url')),
  };
}

export function toTaskType(record: ApiRecord): TaskType {
  const type1 = String(record.type1 ?? '');
  const type2 = String(record.type2 ?? '');
  return {
    id: String(record.id ?? ''),
    type1,
    type2,
    label: [type1, type2].filter(Boolean).join(' / '),
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
  const serviceGroupNameRaw = readValue(record, 'service_group_name', 'serviceGroupName');
  const serviceNameRaw = readValue(record, 'service_name', 'serviceName');
  const fallback = splitServiceGroupLabel(String(record.name ?? ''));
  const serviceGroupName =
    serviceGroupNameRaw == null ? fallback.serviceGroupName : String(serviceGroupNameRaw);
  const serviceName = serviceNameRaw == null ? fallback.serviceName : String(serviceNameRaw);
  return {
    id: String(record.id ?? ''),
    serviceGroupName,
    serviceName,
    name: composeServiceGroupLabel(serviceGroupName, serviceName),
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
  const taskType = Array.isArray(record.task_types) ? record.task_types[0] : record.task_types;
  const platform = Array.isArray(record.platforms) ? record.platforms[0] : record.platforms;
  return {
    id: String(record.id),
    createdByMemberId: readValue(record, 'created_by_member_id', 'createdByMemberId')
      ? String(readValue(record, 'created_by_member_id', 'createdByMemberId'))
      : null,
    taskTypeId: readValue(record, 'task_type_id', 'taskTypeId')
      ? String(readValue(record, 'task_type_id', 'taskTypeId'))
      : null,
    taskType1:
      taskType && typeof taskType === 'object'
        ? String((taskType as ApiRecord).type1 ?? '')
        : String(readValue(record, 'task_type1', 'taskType1') ?? ''),
    name: String(record.name ?? ''),
    platformId: readValue(record, 'platform_id', 'platformId')
      ? String(readValue(record, 'platform_id', 'platformId'))
      : null,
    platform:
      platform && typeof platform === 'object'
        ? String((platform as ApiRecord).name ?? '')
        : String(record.platform ?? ''),
    serviceGroupId: readValue(record, 'service_group_id', 'serviceGroupId')
      ? String(readValue(record, 'service_group_id', 'serviceGroupId'))
      : null,
    reportUrl: String(readValue(record, 'report_url', 'reportUrl') ?? ''),
    reporterMemberId: readValue(record, 'reporter_member_id', 'reporterMemberId')
      ? String(readValue(record, 'reporter_member_id', 'reporterMemberId'))
      : null,
    reviewerMemberId: readValue(record, 'reviewer_member_id', 'reviewerMemberId')
      ? String(readValue(record, 'reviewer_member_id', 'reviewerMemberId'))
      : null,
    startDate: String(readValue(record, 'start_date', 'startDate') ?? getToday()),
    endDate: String(readValue(record, 'end_date', 'endDate') ?? getToday()),
    isActive: Boolean(readValue(record, 'is_active', 'isActive') ?? true),
  };
}

export function toProjectSubtask(record: ApiRecord): ProjectSubtask {
  return {
    id: String(record.id),
    projectId: String(readValue(record, 'project_id', 'projectId') ?? ''),
    title: String(record.title ?? ''),
    url: String(record.url ?? ''),
    ownerMemberId: readValue(record, 'owner_member_id', 'ownerMemberId')
      ? String(readValue(record, 'owner_member_id', 'ownerMemberId'))
      : null,
    monitoringMonth: String(readValue(record, 'monitoring_month', 'monitoringMonth') ?? ''),
    trackStatus: normalizeSubtaskStatus(
      String(readValue(record, 'track_status', 'trackStatus') ?? '미수정'),
    ),
    monitoringInProgress: Boolean(
      readValue(record, 'monitoring_in_progress', 'monitoringInProgress') ?? false,
    ),
    qaInProgress: Boolean(readValue(record, 'qa_in_progress', 'qaInProgress') ?? false),
    note: String(record.note ?? ''),
    updatedAt: String(readValue(record, 'updated_at', 'updatedAt') ?? getToday()),
  };
}

export function toReportProjectOption(record: ApiRecord): ReportProjectOptionRow {
  return {
    id: String(record.id ?? ''),
    taskTypeId: readValue(record, 'task_type_id', 'taskTypeId')
      ? String(readValue(record, 'task_type_id', 'taskTypeId'))
      : null,
    taskType1: String(readValue(record, 'task_type1', 'taskType1') ?? ''),
    name: String(record.name ?? ''),
    platform: record.platform == null ? null : String(record.platform),
    serviceGroupId: readValue(record, 'service_group_id', 'serviceGroupId')
      ? String(readValue(record, 'service_group_id', 'serviceGroupId'))
      : null,
    serviceGroupName:
      readValue(record, 'service_group_name', 'serviceGroupName') == null
        ? null
        : String(readValue(record, 'service_group_name', 'serviceGroupName')),
    serviceName:
      readValue(record, 'service_name', 'serviceName') == null
        ? null
        : String(readValue(record, 'service_name', 'serviceName')),
    costGroupId: readValue(record, 'cost_group_id', 'costGroupId')
      ? String(readValue(record, 'cost_group_id', 'costGroupId'))
      : null,
    costGroupName:
      readValue(record, 'cost_group_name', 'costGroupName') == null
        ? null
        : String(readValue(record, 'cost_group_name', 'costGroupName')),
    reportUrl:
      readValue(record, 'report_url', 'reportUrl') == null
        ? null
        : String(readValue(record, 'report_url', 'reportUrl')),
  };
}
