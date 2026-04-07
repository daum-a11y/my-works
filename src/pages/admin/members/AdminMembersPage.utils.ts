import type { MemberAdminItem } from '../admin.types';
import type { MemberFilterState } from './AdminMembersPage.types';

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function createInitialFilters(): MemberFilterState {
  return {
    status: 'all',
    keyword: '',
  };
}

export function matchesMemberFilters(member: MemberAdminItem, filters: MemberFilterState) {
  if (filters.status === 'active' && !member.userActive) {
    return false;
  }

  if (filters.status === 'inactive' && member.userActive) {
    return false;
  }

  const queryText = normalizeText(filters.keyword);

  if (!queryText) {
    return true;
  }

  return normalizeText(
    [member.name, member.accountId, member.email, member.authEmail].join(' '),
  ).includes(queryText);
}
