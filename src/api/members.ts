import type { ApiRecord } from './api.types';
import {
  callMemberAccountFunction,
  getMemberPasswordRecoveryRedirectUrl,
} from './memberAccounts';
import { requireSupabaseClient } from './supabase';
import type {
  MemberAdminPayload,
  MemberCreateResult,
  MemberInvitePayload,
  MemberPasswordResetPayload,
} from '../pages/admin/admin.types';

export async function getMembers() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.from('members_public_view').select('*').order('name');
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function getMemberByAccountId(accountId: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .ilike('account_id', accountId)
    .maybeSingle();
  if (error) throw error;
  return (data as ApiRecord | null) ?? null;
}

export async function getMemberByEmail(email: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) throw error;
  return (data as ApiRecord | null) ?? null;
}

export async function getMemberByAuthId(authUserId: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  if (error) throw error;
  return (data as ApiRecord | null) ?? null;
}

export async function bindAuthSessionMember(authUserId: string, email?: string | null) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('bind_auth_session_member', {
    p_auth_user_id: authUserId,
    p_email: email ?? null,
  });
  if (error) throw error;
  return (data as ApiRecord | null) ?? null;
}

export async function touchMemberLastLogin(authUserId: string, email?: string | null) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('touch_member_last_login', {
    p_auth_user_id: authUserId,
    p_email: email ?? null,
  });
  if (error) throw error;
  return (data as ApiRecord | null) ?? null;
}

export async function listMembersAdmin() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('members')
    .select(
      'id, auth_user_id, account_id, name, email, note, user_level, user_active, member_status, report_required, joined_at, last_login_at, updated_at',
    )
    .order('joined_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function saveMemberAdmin(payload: MemberAdminPayload) {
  const supabase = requireSupabaseClient();
  const record = {
    auth_user_id: payload.authUserId ?? null,
    account_id: payload.accountId,
    name: payload.name,
    email: payload.email,
    note: payload.note,
    user_level: payload.role === 'admin' ? 1 : 0,
    user_active: payload.userActive ?? payload.isActive ?? true,
    member_status: payload.memberStatus,
    report_required: payload.reportRequired ?? true,
  };
  if (payload.id) {
    const { data, error } = await supabase
      .from('members')
      .update(record)
      .eq('id', payload.id)
      .select(
        'id, auth_user_id, account_id, name, email, note, user_level, user_active, member_status, report_required, joined_at, updated_at',
      )
      .single();
    if (error) throw error;
    return data as ApiRecord;
  }

  const { data, error } = await supabase
    .from('members')
    .insert(record)
    .select(
      'id, auth_user_id, account_id, name, email, note, user_level, user_active, member_status, report_required, joined_at, updated_at',
    )
    .single();
  if (error) throw error;
  return data as ApiRecord;
}

export async function createMemberAdmin(
  payload: MemberAdminPayload,
): Promise<MemberCreateResult> {
  const data = await callMemberAccountFunction<{
    action?: string;
    memberId?: string | null;
  }>('invite-member', {
    email: payload.email,
    accountId: payload.accountId,
    name: payload.name,
    note: payload.note,
    role: payload.role,
    userActive: payload.userActive ?? payload.isActive ?? true,
    memberStatus: payload.memberStatus,
    reportRequired: payload.reportRequired ?? true,
  });
  return {
    action: data?.action === 'updated' ? 'updated' : 'created',
    memberId: String(data?.memberId ?? ''),
  };
}

export async function inviteMemberAdmin(payload: MemberInvitePayload) {
  await callMemberAccountFunction('invite-member', {
    email: payload.email,
    accountId: payload.accountId,
    name: payload.name,
    role: payload.role,
  });
}

export async function resetMemberPasswordAdmin(payload: MemberPasswordResetPayload) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(payload.email, {
    redirectTo: getMemberPasswordRecoveryRedirectUrl(),
  });
  if (error) throw error;
}

export async function deleteMemberAdmin(memberId: string) {
  const data = await callMemberAccountFunction<{ result?: 'deleted' | 'deactivated' }>(
    'delete-member',
    { memberId },
  );
  if (data?.result !== 'deleted' && data?.result !== 'deactivated') {
    throw new Error('사용자 삭제 결과를 확인할 수 없습니다.');
  }
  return data.result;
}
