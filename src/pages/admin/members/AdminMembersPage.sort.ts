import type { MemberAdminItem, MemberAdminPayload } from '../admin.types';

export type AdminMembersSortKey =
  | 'accountId'
  | 'name'
  | 'email'
  | 'role'
  | 'userActive'
  | 'memberStatus'
  | 'reportRequired'
  | 'joinedAt'
  | 'lastLoginAt';

export interface AdminMembersSortState {
  key: AdminMembersSortKey;
  direction: 'asc' | 'desc';
}

function compareText(left: string, right: string) {
  return left.localeCompare(right, 'ko');
}

function getRoleRank(role: MemberAdminPayload['role']) {
  return role === 'admin' ? 0 : 1;
}

function getMemberStatusRank(status: MemberAdminItem['memberStatus']) {
  return status === 'active' ? 0 : 1;
}

function getBooleanRank(value: boolean) {
  return value ? 0 : 1;
}

function getSortValue(member: MemberAdminItem, key: AdminMembersSortKey) {
  switch (key) {
    case 'accountId':
      return member.accountId;
    case 'name':
      return member.name;
    case 'email':
      return member.email;
    case 'role':
      return getRoleRank(member.role);
    case 'userActive':
      return getBooleanRank(member.userActive);
    case 'memberStatus':
      return getMemberStatusRank(member.memberStatus);
    case 'reportRequired':
      return getBooleanRank(member.reportRequired);
    case 'joinedAt':
      return member.joinedAt;
    case 'lastLoginAt':
      return member.lastLoginAt;
  }
}

export function sortMembers(members: readonly MemberAdminItem[], sortState: AdminMembersSortState) {
  const direction = sortState.direction === 'asc' ? 1 : -1;

  return [...members].sort((left, right) => {
    const leftValue = getSortValue(left, sortState.key);
    const rightValue = getSortValue(right, sortState.key);

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      const delta = leftValue - rightValue;
      if (delta !== 0) {
        return delta * direction;
      }
    } else {
      const delta = compareText(String(leftValue ?? ''), String(rightValue ?? ''));
      if (delta !== 0) {
        return delta * direction;
      }
    }

    return compareText(left.accountId, right.accountId);
  });
}
