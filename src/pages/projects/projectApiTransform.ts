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

function readValue(record: ApiRecord, snakeKey: string, camelKey: string) {
  return record[snakeKey] ?? record[camelKey];
}

export function toProjectListRow(record: ApiRecord): ProjectListRow {
  return {
    id: String(record.id),
    createdByMemberId: readValue(record, 'created_by_member_id', 'createdByMemberId')
      ? String(readValue(record, 'created_by_member_id', 'createdByMemberId'))
      : null,
    projectType1: String(readValue(record, 'project_type1', 'projectType1') ?? ''),
    name: String(record.name ?? ''),
    platformId: readValue(record, 'platform_id', 'platformId')
      ? String(readValue(record, 'platform_id', 'platformId'))
      : null,
    platform: record.platform == null ? null : String(record.platform),
    serviceGroupId: readValue(record, 'service_group_id', 'serviceGroupId')
      ? String(readValue(record, 'service_group_id', 'serviceGroupId'))
      : null,
    serviceGroupName:
      readValue(record, 'service_group_name', 'serviceGroupName') == null
        ? null
        : String(readValue(record, 'service_group_name', 'serviceGroupName')),
    reportUrl:
      readValue(record, 'report_url', 'reportUrl') == null
        ? null
        : String(readValue(record, 'report_url', 'reportUrl')),
    reporterMemberId: readValue(record, 'reporter_member_id', 'reporterMemberId')
      ? String(readValue(record, 'reporter_member_id', 'reporterMemberId'))
      : null,
    reporterDisplay:
      readValue(record, 'reporter_display', 'reporterDisplay') == null
        ? null
        : String(readValue(record, 'reporter_display', 'reporterDisplay')),
    reviewerMemberId: readValue(record, 'reviewer_member_id', 'reviewerMemberId')
      ? String(readValue(record, 'reviewer_member_id', 'reviewerMemberId'))
      : null,
    reviewerDisplay:
      readValue(record, 'reviewer_display', 'reviewerDisplay') == null
        ? null
        : String(readValue(record, 'reviewer_display', 'reviewerDisplay')),
    startDate: String(readValue(record, 'start_date', 'startDate') ?? getToday()),
    endDate: String(readValue(record, 'end_date', 'endDate') ?? getToday()),
    isActive: Boolean(readValue(record, 'is_active', 'isActive') ?? true),
    pageCount: Number(readValue(record, 'page_count', 'pageCount') ?? 0),
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
