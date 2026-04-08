import type { ApiRecord, RawPagedResult } from '../api/api.types';
import { normalizePageStatus } from '../types/domain';
import { readBooleanFlag } from '../utils';
import type {
  AdminCostGroupItem,
  AdminPageOption,
  AdminPlatformItem,
  AdminProjectOption,
  AdminServiceGroupItem,
  AdminServiceGroupUsageSummary,
  AdminTaskSearchItem,
  AdminTaskSearchPage,
  AdminTaskTypeItem,
  AdminTaskTypeUsageSummary,
  MemberAdminItem,
} from '../pages/admin/admin.types';

function splitServiceName(name: string) {
  const normalized = String(name ?? '').trim();
  if (!normalized) {
    return { svcGroup: '', svcName: '' };
  }

  const [group, ...rest] = normalized.split(' > ');
  if (rest.length === 0) {
    return { svcGroup: normalized, svcName: normalized };
  }

  return {
    svcGroup: group.trim(),
    svcName: rest.join(' / ').trim(),
  };
}

function dedupeById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

export function mapAdminProjectRecord(record: ApiRecord): AdminProjectOption {
  const platformRecord = Array.isArray(record.platforms) ? record.platforms[0] : record.platforms;
  const platformName =
    platformRecord && typeof platformRecord === 'object'
      ? String((platformRecord as ApiRecord).name ?? '')
      : String(record.platform ?? '');
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
    projectType1: String(record.project_type1 ?? ''),
    platformId: record.platform_id ? String(record.platform_id) : null,
    platform: platformName,
    costGroupId:
      serviceGroupRecord && typeof serviceGroupRecord === 'object'
        ? String((serviceGroupRecord as ApiRecord).cost_group_id ?? '') || null
        : null,
    costGroupName:
      costGroupRecord && typeof costGroupRecord === 'object'
        ? String(costGroupRecord.name ?? '')
        : '',
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    reportUrl: String(record.report_url ?? ''),
    isActive: Boolean(record.is_active ?? true),
  };
}

export function mapAdminProjectRecords(records: ApiRecord[]): AdminProjectOption[] {
  return records.map(mapAdminProjectRecord);
}

export function mapAdminPageRecord(record: ApiRecord): AdminPageOption {
  return {
    id: String(record.id ?? ''),
    projectId: String(record.project_id ?? ''),
    title: String(record.title ?? ''),
    url: String(record.url ?? ''),
    trackStatus: normalizePageStatus(String(record.track_status ?? '미수정')),
    monitoringInProgress: Boolean(record.monitoring_in_progress ?? false),
    qaInProgress: Boolean(record.qa_in_progress ?? false),
  };
}

export function mapAdminPageRecords(records: ApiRecord[]): AdminPageOption[] {
  return records.map(mapAdminPageRecord);
}

export function mapAdminTaskRecord(record: ApiRecord): AdminTaskSearchItem {
  return {
    id: String(record.id ?? ''),
    memberId: String(record.member_id ?? ''),
    memberName: String(record.member_name ?? ''),
    memberEmail: String(record.member_email ?? ''),
    taskDate: String(record.task_date ?? ''),
    costGroupId: String(record.cost_group_id ?? ''),
    costGroupName: String(record.cost_group_name ?? ''),
    platform: String(record.platform ?? ''),
    projectId: record.project_id ? String(record.project_id) : null,
    projectName: String(record.project_name ?? ''),
    pageId: record.project_page_id ? String(record.project_page_id) : null,
    pageTitle: String(record.page_title ?? ''),
    pageUrl: String(record.page_url ?? ''),
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    serviceGroupName: String(record.service_group_name ?? ''),
    serviceName: String(record.service_name ?? ''),
    taskType1: String(record.task_type1 ?? ''),
    taskType2: String(record.task_type2 ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
    content: String(record.content ?? ''),
    note: String(record.note ?? ''),
    updatedAt: String(record.updated_at ?? ''),
  };
}

export function mapAdminTaskRecords(records: ApiRecord[]): AdminTaskSearchItem[] {
  return dedupeById(records.map(mapAdminTaskRecord));
}

export function mapAdminTaskPage(result: RawPagedResult): AdminTaskSearchPage {
  return {
    items: mapAdminTaskRecords(result.items),
    totalCount: result.totalCount,
  };
}

export function mapAdminTaskTypeRecord(record: ApiRecord): AdminTaskTypeItem {
  return {
    id: String(record.id ?? ''),
    type1: String(record.type1 ?? ''),
    type2: String(record.type2 ?? ''),
    displayLabel: String(record.display_label ?? `${record.type1 ?? ''} / ${record.type2 ?? ''}`),
    displayOrder: Number(record.display_order ?? 0),
    requiresServiceGroup: Boolean(record.requires_service_group ?? false),
    isActive: Boolean(record.is_active ?? true),
  };
}

export function mapAdminTaskTypeRecords(records: ApiRecord[]): AdminTaskTypeItem[] {
  return records.map(mapAdminTaskTypeRecord);
}

export function mapAdminCostGroupRecord(record: ApiRecord): AdminCostGroupItem {
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    isActive: Boolean(record.is_active ?? true),
  };
}

export function mapAdminCostGroupRecords(records: ApiRecord[]): AdminCostGroupItem[] {
  return records.map(mapAdminCostGroupRecord);
}

export function mapAdminPlatformRecord(record: ApiRecord): AdminPlatformItem {
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    isVisible: Boolean(record.is_visible ?? true),
  };
}

export function mapAdminPlatformRecords(records: ApiRecord[]): AdminPlatformItem[] {
  return records.map(mapAdminPlatformRecord);
}

export function mapAdminServiceGroupRecord(record: ApiRecord): AdminServiceGroupItem {
  const name = String(record.name ?? '');
  const parts = splitServiceName(name);
  const costGroupRecord = Array.isArray(record.cost_groups)
    ? record.cost_groups[0]
    : record.cost_groups;
  const costGroupName =
    costGroupRecord && typeof costGroupRecord === 'object'
      ? String((costGroupRecord as ApiRecord).name ?? '')
      : String(record.cost_group_name ?? '');

  return {
    id: String(record.id ?? ''),
    name,
    svcGroup: parts.svcGroup,
    svcName: parts.svcName,
    costGroupId: record.cost_group_id ? String(record.cost_group_id) : null,
    costGroupName,
    svcActive: Boolean(record.svc_active ?? record.is_active ?? true),
    displayOrder: Number(record.display_order ?? 0),
    isActive: Boolean(record.is_active ?? true),
  };
}

export function mapAdminServiceGroupRecords(records: ApiRecord[]): AdminServiceGroupItem[] {
  return records.map(mapAdminServiceGroupRecord);
}

export function mapMemberAdminRecord(record: ApiRecord): MemberAdminItem {
  const active = readBooleanFlag(record.user_active ?? record.is_active, true);
  const memberStatus =
    String(record.member_status ?? 'active') === 'pending' ? 'pending' : 'active';
  const authUserId = record.auth_user_id ? String(record.auth_user_id) : null;
  const accountId = String(record.account_id ?? '').trim();
  const email = String(record.email ?? '').trim();
  const reportRequired =
    typeof record.report_required === 'boolean'
      ? record.report_required
      : typeof record.report_required === 'number'
        ? record.report_required === 1
        : String(record.report_required ?? 0) === '1' ||
          String(record.report_required ?? false) === 'true';
  const queueReasons: string[] = [];

  if (!authUserId) {
    queueReasons.push('auth_unlinked');
  }
  if (!accountId) {
    queueReasons.push('account_id_missing');
  }
  if (!email) {
    queueReasons.push('email_missing');
  }
  if (!active) {
    queueReasons.push('inactive_candidate');
  }
  if (memberStatus === 'pending') {
    queueReasons.push('approval_pending');
  }

  return {
    id: String(record.id ?? ''),
    authUserId,
    accountId,
    name: String(record.name ?? ''),
    email,
    note: String(record.note ?? ''),
    role: Number(record.user_level ?? 0) === 1 ? 'admin' : 'user',
    userActive: active,
    memberStatus,
    reportRequired,
    isActive: active,
    authEmail: String(record.auth_email ?? record.email ?? ''),
    queueReasons,
    joinedAt: String(record.joined_at ?? record.created_at ?? ''),
    lastLoginAt: String(record.last_login_at ?? ''),
    updatedAt: String(record.updated_at ?? ''),
  };
}

export function mapMemberAdminRecords(records: ApiRecord[]): MemberAdminItem[] {
  return records.map(mapMemberAdminRecord);
}

export function mapAdminTaskTypeUsageSummary(rows: ApiRecord[]): AdminTaskTypeUsageSummary {
  return {
    taskCount: Number(rows[0]?.task_count ?? 0),
  };
}

export function mapAdminServiceGroupUsageSummary(rows: ApiRecord[]): AdminServiceGroupUsageSummary {
  return {
    projectCount: rows.length,
    projectNames: rows
      .map((row) => String(row.name ?? ''))
      .filter(Boolean)
      .slice(0, 5),
  };
}
