import type { ApiRecord } from '../api/api.types';
import type { Member } from '../types/domain';
import { getToday, readBooleanFlag } from '../utils';

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
