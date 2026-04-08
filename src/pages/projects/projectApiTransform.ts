export {
  toProject,
  toProjectPage,
  toPlatform,
  toServiceGroup,
  toTaskType,
} from '../reports/reportsApiTransform';
import type { ApiRecord } from '../../api/api.types';
import type { ProjectListRow } from '../../types/domain';
import { getToday, readBooleanFlag } from '../../utils';
import type { Member } from '../../types/domain';

export function toProjectListRow(record: ApiRecord): ProjectListRow {
  return {
    id: String(record.id),
    createdByMemberId: record.created_by_member_id ? String(record.created_by_member_id) : null,
    projectType1: String(record.project_type1 ?? ''),
    name: String(record.name ?? ''),
    platformId: record.platform_id ? String(record.platform_id) : null,
    platform: String(record.platform ?? ''),
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    serviceGroupName: String(record.service_group_name ?? '-'),
    reportUrl: String(record.report_url ?? ''),
    reporterMemberId: record.reporter_member_id ? String(record.reporter_member_id) : null,
    reporterDisplay: String(record.reporter_display ?? '-'),
    reviewerMemberId: record.reviewer_member_id ? String(record.reviewer_member_id) : null,
    reviewerDisplay: String(record.reviewer_display ?? '-'),
    startDate: String(record.start_date ?? getToday()),
    endDate: String(record.end_date ?? getToday()),
    isActive: Boolean(record.is_active ?? true),
    pageCount: Number(record.page_count ?? 0),
  };
}

export function toMember(record: ApiRecord): Member {
  const reportRequired =
    typeof record.report_required === 'boolean'
      ? record.report_required
      : typeof record.report_required === 'number'
        ? record.report_required === 1
        : String(record.report_required ?? 0) === '1' ||
          String(record.report_required ?? false) === 'true';

  return {
    id: String(record.id),
    accountId: String(record.account_id ?? ''),
    name: String(record.name ?? ''),
    email: String(record.email ?? ''),
    role: Number(record.user_level ?? 0) === 1 ? 'admin' : 'user',
    isActive: readBooleanFlag(record.user_active ?? record.is_active, true),
    status: String(record.member_status ?? 'active') === 'pending' ? 'pending' : 'active',
    reportRequired,
    joinedAt: String(record.joined_at ?? record.created_at ?? getToday()),
    authUserId: record.auth_user_id ? String(record.auth_user_id) : null,
  };
}
