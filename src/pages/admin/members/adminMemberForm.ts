import type { MemberAdminItem, MemberAdminPayload } from '../admin.types';

export function createMemberDraft(member?: MemberAdminItem): MemberAdminPayload {
  if (!member) {
    return {
      accountId: '',
      name: '',
      email: '',
      note: '',
      role: 'user',
      userActive: true,
      memberStatus: 'pending',
      reportRequired: true,
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
    note: member.note,
    role: member.role,
    userActive: member.userActive,
    memberStatus: member.memberStatus,
    reportRequired: member.reportRequired,
    isActive: member.userActive,
  };
}

export function normalizeMemberDraft(draft: MemberAdminPayload): MemberAdminPayload {
  const active = draft.userActive ?? draft.isActive ?? true;

  return {
    ...draft,
    email: draft.email.trim() || draft.accountId.trim(),
    userActive: active,
    memberStatus: draft.memberStatus ?? 'pending',
    reportRequired: draft.reportRequired ?? true,
    isActive: active,
  };
}
