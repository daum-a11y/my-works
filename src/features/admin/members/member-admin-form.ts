import type { MemberAdminItem, MemberAdminPayload } from '../admin-types';

export function createMemberDraft(member?: MemberAdminItem): MemberAdminPayload {
  if (!member) {
    return {
      accountId: '',
      name: '',
      email: '',
      role: 'user',
      userActive: true,
      isActive: true,
      authUserId: null,
    };
  }

  return {
    id: member.id,
    authUserId: member.authUserId,
    accountId: member.accountId,
    name: member.name,
    email: member.email,
    role: member.role,
    userActive: member.userActive,
    isActive: member.userActive,
  };
}

export function normalizeMemberDraft(draft: MemberAdminPayload): MemberAdminPayload {
  const active = draft.userActive ?? draft.isActive ?? true;

  return {
    ...draft,
    email: draft.email.trim() || draft.accountId.trim(),
    userActive: active,
    isActive: active,
  };
}
