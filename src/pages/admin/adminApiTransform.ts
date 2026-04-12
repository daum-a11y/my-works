import type { ApiRecord } from '../../api/api.types';
import { normalizeSubtaskStatus } from '../../types/domain';
import { readBooleanFlag } from '../../utils';
import type {
  AdminCostGroupItem,
  AdminSubtaskOption,
  AdminPlatformItem,
  AdminProjectOption,
  AdminServiceGroupItem,
  AdminTaskSearchItem,
  AdminTaskTypeItem,
  MemberAdminItem,
} from './admin.types';

function composeServiceName(serviceGroupName: string, serviceName: string) {
  if (!serviceGroupName && !serviceName) return '';
  if (!serviceGroupName) return serviceName;
  if (!serviceName) return serviceGroupName;
  return `${serviceGroupName} / ${serviceName}`;
}

function splitServiceName(name: string) {
  const normalized = String(name ?? '').trim();
  if (!normalized) return { serviceGroupName: '', serviceName: '' };
  const separator = normalized.indexOf(' / ');
  if (separator < 0) return { serviceGroupName: normalized, serviceName: '' };
  return {
    serviceGroupName: normalized.slice(0, separator).trim(),
    serviceName: normalized.slice(separator + 3).trim(),
  };
}

function readValue(record: ApiRecord, snakeKey: string, camelKey: string) {
  return record[snakeKey] ?? record[camelKey];
}

export function toAdminTaskType(record: ApiRecord): AdminTaskTypeItem {
  return {
    id: String(record.id ?? ''),
    type1: String(record.type1 ?? ''),
    type2: String(record.type2 ?? ''),
    note: String(record.note ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    requiresServiceGroup: Boolean(record.requires_service_group ?? false),
    isActive: Boolean(record.is_active ?? true),
  };
}

export function toAdminCostGroup(record: ApiRecord): AdminCostGroupItem {
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    isActive: Boolean(record.is_active ?? true),
  };
}

export function toAdminPlatform(record: ApiRecord): AdminPlatformItem {
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    isVisible: Boolean(record.is_visible ?? true),
  };
}

export function toAdminServiceGroup(record: ApiRecord): AdminServiceGroupItem {
  const fallback = splitServiceName(String(record.name ?? ''));
  const serviceGroupName =
    record.service_group_name == null
      ? fallback.serviceGroupName
      : String(record.service_group_name ?? '').trim();
  const serviceName =
    record.service_name == null ? fallback.serviceName : String(record.service_name ?? '').trim();
  const costGroupRecord = Array.isArray(record.cost_groups)
    ? record.cost_groups[0]
    : record.cost_groups;
  return {
    id: String(record.id ?? ''),
    name: composeServiceName(serviceGroupName, serviceName),
    serviceGroupName,
    serviceName,
    costGroupId: record.cost_group_id ? String(record.cost_group_id) : null,
    costGroupName:
      costGroupRecord && typeof costGroupRecord === 'object'
        ? String((costGroupRecord as ApiRecord).name ?? '')
        : String(record.cost_group_name ?? ''),
    svcActive: Boolean(record.svc_active ?? record.is_active ?? true),
    displayOrder: Number(record.display_order ?? 0),
    isActive: Boolean(record.is_active ?? true),
  };
}

export function toAdminProject(record: ApiRecord): AdminProjectOption {
  const platformRecord = Array.isArray(record.platforms) ? record.platforms[0] : record.platforms;
  const taskTypeRecord = Array.isArray(record.task_types)
    ? record.task_types[0]
    : record.task_types;
  const serviceGroupRecord = Array.isArray(record.service_groups)
    ? record.service_groups[0]
    : record.service_groups;
  const costGroupRecord =
    serviceGroupRecord &&
    typeof serviceGroupRecord === 'object' &&
    'cost_groups' in (serviceGroupRecord as ApiRecord)
      ? Array.isArray((serviceGroupRecord as ApiRecord).cost_groups)
        ? (((serviceGroupRecord as ApiRecord).cost_groups as ApiRecord[])[0] ?? null)
        : (((serviceGroupRecord as ApiRecord).cost_groups as ApiRecord | null) ?? null)
      : null;
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    taskTypeId: record.task_type_id ? String(record.task_type_id) : null,
    taskType1:
      taskTypeRecord && typeof taskTypeRecord === 'object'
        ? String((taskTypeRecord as ApiRecord).type1 ?? '')
        : String(record.task_type1 ?? ''),
    platformId: record.platform_id ? String(record.platform_id) : null,
    platform:
      platformRecord && typeof platformRecord === 'object'
        ? String((platformRecord as ApiRecord).name ?? '')
        : String(record.platform ?? ''),
    costGroupId:
      serviceGroupRecord && typeof serviceGroupRecord === 'object'
        ? String((serviceGroupRecord as ApiRecord).cost_group_id ?? '') || null
        : null,
    costGroupName:
      costGroupRecord && typeof costGroupRecord === 'object'
        ? String(costGroupRecord.name ?? '')
        : '',
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    serviceGroupName:
      serviceGroupRecord && typeof serviceGroupRecord === 'object'
        ? String((serviceGroupRecord as ApiRecord).service_group_name ?? '')
        : '',
    serviceName:
      serviceGroupRecord && typeof serviceGroupRecord === 'object'
        ? String((serviceGroupRecord as ApiRecord).service_name ?? '')
        : '',
    reportUrl: String(record.report_url ?? ''),
    isActive: Boolean(record.is_active ?? true),
  };
}

export function toAdminSubtask(record: ApiRecord): AdminSubtaskOption {
  return {
    id: String(record.id ?? ''),
    projectId: String(record.project_id ?? ''),
    title: String(record.title ?? ''),
    url: String(record.url ?? ''),
    trackStatus: normalizeSubtaskStatus(String(record.track_status ?? '미수정')),
    monitoringInProgress: Boolean(record.monitoring_in_progress ?? false),
    qaInProgress: Boolean(record.qa_in_progress ?? false),
  };
}

export function toAdminTask(record: ApiRecord): AdminTaskSearchItem {
  return {
    id: String(record.id ?? ''),
    memberId: String(record.member_id ?? ''),
    memberName: String(record.member_name ?? ''),
    memberEmail: String(record.member_email ?? ''),
    taskDate: String(record.task_date ?? ''),
    costGroupId: String(record.cost_group_id ?? ''),
    costGroupName: String(record.cost_group_name ?? ''),
    platform: record.platform == null ? null : String(record.platform),
    projectId: record.project_id ? String(record.project_id) : null,
    projectName: record.project_name == null ? null : String(record.project_name),
    subtaskId: record.project_subtask_id ? String(record.project_subtask_id) : null,
    subtaskTitle: record.subtask_title == null ? null : String(record.subtask_title),
    url: record.url == null ? null : String(record.url),
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    serviceGroupName: record.service_group_name == null ? null : String(record.service_group_name),
    serviceName: record.service_name == null ? null : String(record.service_name),
    taskType1: String(record.task_type1 ?? ''),
    taskType2: String(record.task_type2 ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
    content: String(record.content ?? ''),
    note: String(record.note ?? ''),
    updatedAt: String(record.updated_at ?? ''),
  };
}

export function toMemberAdmin(record: ApiRecord): MemberAdminItem {
  const active = readBooleanFlag(
    readValue(record, 'user_active', 'userActive') ?? readValue(record, 'is_active', 'isActive'),
    true,
  );
  const memberStatus =
    String(readValue(record, 'member_status', 'memberStatus') ?? 'active') === 'pending'
      ? 'pending'
      : 'active';
  const rawAuthUserId = readValue(record, 'auth_user_id', 'authUserId');
  const authUserId = rawAuthUserId ? String(rawAuthUserId) : null;
  const accountId = String(readValue(record, 'account_id', 'accountId') ?? '').trim();
  const email = String(record.email ?? '').trim();
  const rawReportRequired = readValue(record, 'report_required', 'reportRequired');
  const reportRequired =
    typeof rawReportRequired === 'boolean'
      ? rawReportRequired
      : typeof rawReportRequired === 'number'
        ? rawReportRequired === 1
        : String(rawReportRequired ?? 0) === '1' || String(rawReportRequired ?? false) === 'true';
  const queueReasons: string[] = [];
  if (!authUserId) queueReasons.push('auth_unlinked');
  if (!accountId) queueReasons.push('account_id_missing');
  if (!email) queueReasons.push('email_missing');
  if (!active) queueReasons.push('inactive_candidate');
  if (memberStatus === 'pending') queueReasons.push('approval_pending');
  return {
    id: String(record.id ?? ''),
    authUserId,
    accountId,
    name: String(record.name ?? ''),
    email,
    note: String(record.note ?? ''),
    role: Number(readValue(record, 'user_level', 'userLevel') ?? 0) === 1 ? 'admin' : 'user',
    userActive: active,
    memberStatus,
    reportRequired,
    isActive: active,
    authEmail: String(readValue(record, 'auth_email', 'authEmail') ?? record.email ?? ''),
    queueReasons,
    joinedAt: String(readValue(record, 'joined_at', 'joinedAt') ?? record.created_at ?? ''),
    lastLoginAt: String(readValue(record, 'last_login_at', 'lastLoginAt') ?? ''),
    updatedAt: String(readValue(record, 'updated_at', 'updatedAt') ?? ''),
  };
}
