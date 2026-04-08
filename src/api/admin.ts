import { getSupabaseClient } from './supabase';
import type { ApiRecord, RawPagedResult } from './api.types';
import { env } from '../config/env';
import { getPasswordRecoveryRedirectUrl } from '../auth/authUrls';
import type {
  AdminCostGroupPayload,
  AdminPlatformPayload,
  AdminReorderPayload,
  AdminServiceGroupPayload,
  AdminTaskSaveInput,
  AdminTaskSearchFilters,
  AdminTaskTypePayload,
  MemberInvitePayload,
  MemberAdminPayload,
  MemberCreateResult,
  MemberPasswordResetPayload,
} from '../pages/admin/admin.types';

interface AdminDataClient {
  listTaskTypes(): Promise<ApiRecord[]>;
  listPlatforms(): Promise<ApiRecord[]>;
  listCostGroups(): Promise<ApiRecord[]>;
  listServiceGroups(): Promise<ApiRecord[]>;
  listProjects(): Promise<ApiRecord[]>;
  listProjectPages(): Promise<ApiRecord[]>;
  getProjectAdminOption(projectId: string): Promise<ApiRecord | null>;
  listProjectPagesByProjectId(projectId: string): Promise<ApiRecord[]>;
  searchReportProjectsAdmin(filters: {
    costGroupId: string;
    platform: string;
    projectType1: string;
    query: string;
  }): Promise<ApiRecord[]>;
  searchTasksAdmin(
    filters: AdminTaskSearchFilters,
    page: number,
    pageSize: number,
  ): Promise<RawPagedResult>;
  getTaskAdmin(taskId: string): Promise<ApiRecord>;
  saveTaskAdmin(input: AdminTaskSaveInput): Promise<ApiRecord>;
  deleteTaskAdmin(taskId: string): Promise<void>;
  listMembersAdmin(): Promise<ApiRecord[]>;
  saveMemberAdmin(payload: MemberAdminPayload): Promise<ApiRecord>;
  createMemberAdmin(payload: MemberAdminPayload): Promise<MemberCreateResult>;
  inviteMemberAdmin(payload: MemberInvitePayload): Promise<void>;
  resetMemberPasswordAdmin(payload: MemberPasswordResetPayload): Promise<void>;
  deleteMemberAdmin(memberId: string): Promise<'deleted' | 'deactivated'>;
  saveTaskTypeAdmin(payload: AdminTaskTypePayload): Promise<ApiRecord>;
  getTaskTypeUsageSummary(taskTypeId: string, type1: string, type2: string): Promise<ApiRecord[]>;
  deleteTaskTypeAdmin(taskTypeId: string): Promise<void>;
  replaceTaskTypeUsage(
    oldType1: string,
    oldType2: string,
    nextType1: string,
    nextType2: string,
  ): Promise<void>;
  reorderTaskTypes(payload: AdminReorderPayload): Promise<void>;
  saveServiceGroupAdmin(payload: AdminServiceGroupPayload): Promise<ApiRecord>;
  reorderServiceGroups(payload: AdminReorderPayload): Promise<void>;
  saveCostGroupAdmin(payload: AdminCostGroupPayload): Promise<ApiRecord>;
  reorderCostGroups(payload: AdminReorderPayload): Promise<void>;
  deleteCostGroupAdmin(costGroupId: string): Promise<void>;
  savePlatformAdmin(payload: AdminPlatformPayload): Promise<ApiRecord>;
  reorderPlatforms(payload: AdminReorderPayload): Promise<void>;
  deletePlatformAdmin(platformId: string): Promise<void>;
  getServiceGroupUsageSummary(serviceGroupId: string): Promise<ApiRecord[]>;
  deleteServiceGroupAdmin(serviceGroupId: string): Promise<void>;
  replaceServiceGroupUsage(
    oldServiceGroupId: string | null,
    nextServiceGroupId: string,
  ): Promise<void>;
}

function toNullableString(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function composeServiceName(serviceGroup: string, serviceName: string) {
  const normalizedGroup = serviceGroup.trim();
  const normalizedName = serviceName.trim();

  if (!normalizedGroup && !normalizedName) {
    return '';
  }
  if (!normalizedGroup) {
    return normalizedName;
  }
  if (!normalizedName) {
    return normalizedGroup;
  }
  return `${normalizedGroup} / ${normalizedName}`;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function getEdgeFunctionAuthHeaders(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  let accessToken = sessionData.session?.access_token ?? null;

  if (!accessToken) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      throw refreshError;
    }

    accessToken = refreshed.session?.access_token ?? null;
  }

  if (!accessToken) {
    throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
  }

  return {
    apikey: env.supabaseAnonKey,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

async function invokeAdminEdgeFunction<TResponse>(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  functionName: string,
  body: Record<string, unknown>,
  fallbackMessage: string,
): Promise<TResponse> {
  const headers = await getEdgeFunctionAuthHeaders(supabase);
  const response = await fetch(`${env.supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let message = fallbackMessage;

    try {
      const payload = await response.json();
      if (isObjectRecord(payload) && typeof payload.error === 'string' && payload.error.trim()) {
        message = payload.error.trim();
      }
    } catch {
      try {
        const text = (await response.text()).trim();
        if (text) {
          message = text;
        }
      } catch {
        // Ignore parse failures and keep fallback message.
      }
    }

    throw new Error(message);
  }

  return (await response.json()) as TResponse;
}

async function fetchAdminTasks(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  filters: AdminTaskSearchFilters,
  page: number,
  pageSize: number,
): Promise<RawPagedResult> {
  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .rpc(
      'admin_search_tasks',
      {
        p_member_id: toNullableString(filters.memberId),
        p_start_date: toNullableString(filters.startDate),
        p_end_date: toNullableString(filters.endDate),
        p_project_id: toNullableString(filters.projectId),
        p_project_page_id: toNullableString(filters.pageId),
        p_task_type1: toNullableString(filters.taskType1),
        p_task_type2: toNullableString(filters.taskType2),
        p_cost_group_id: toNullableString(filters.costGroupId),
        p_keyword: toNullableString(filters.keyword),
      },
      { count: 'exact' },
    )
    .range(from, to);
  if (error) throw error;
  return { items: (data ?? []) as ApiRecord[], totalCount: count ?? 0 };
}

async function fetchAdminTaskById(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  taskId: string,
) {
  const { data, error } = await supabase.rpc('admin_get_task', {
    p_task_id: taskId,
  });
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) {
    throw new Error('업무보고를 찾을 수 없습니다.');
  }
  return rows[0] as ApiRecord;
}

async function resolveProjectId(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  projectId: string,
  pageId: string,
) {
  const normalizedProjectId = toNullableString(projectId);
  if (normalizedProjectId) {
    return normalizedProjectId;
  }

  const normalizedPageId = toNullableString(pageId);
  if (!normalizedPageId) {
    return null;
  }

  const { data, error } = await supabase
    .from('project_pages')
    .select('project_id')
    .eq('id', normalizedPageId)
    .single();
  if (error) throw error;
  return data?.project_id ? String(data.project_id) : null;
}

function createUnconfiguredAdminClient(): AdminDataClient {
  const configurationError = new Error('Supabase 환경 변수가 설정되지 않았습니다.');

  return {
    async listTaskTypes() {
      return [];
    },
    async listPlatforms() {
      return [];
    },
    async listCostGroups() {
      return [];
    },
    async listServiceGroups() {
      return [];
    },
    async listProjects() {
      return [];
    },
    async listProjectPages() {
      return [];
    },
    async getProjectAdminOption() {
      throw configurationError;
    },
    async listProjectPagesByProjectId() {
      return [];
    },
    async searchReportProjectsAdmin() {
      return [];
    },
    async searchTasksAdmin() {
      return { items: [], totalCount: 0 };
    },
    async getTaskAdmin() {
      throw configurationError;
    },
    async saveTaskAdmin() {
      throw configurationError;
    },
    async deleteTaskAdmin() {
      throw configurationError;
    },
    async listMembersAdmin() {
      return [];
    },
    async createMemberAdmin() {
      throw configurationError;
    },
    async saveMemberAdmin() {
      throw configurationError;
    },
    async inviteMemberAdmin() {
      throw configurationError;
    },
    async resetMemberPasswordAdmin() {
      throw configurationError;
    },
    async deleteMemberAdmin() {
      throw configurationError;
    },
    async saveTaskTypeAdmin() {
      throw configurationError;
    },
    async getTaskTypeUsageSummary() {
      throw configurationError;
    },
    async deleteTaskTypeAdmin() {
      throw configurationError;
    },
    async replaceTaskTypeUsage() {
      throw configurationError;
    },
    async reorderTaskTypes() {
      throw configurationError;
    },
    async saveServiceGroupAdmin() {
      throw configurationError;
    },
    async reorderServiceGroups() {
      throw configurationError;
    },
    async saveCostGroupAdmin() {
      throw configurationError;
    },
    async reorderCostGroups() {
      throw configurationError;
    },
    async deleteCostGroupAdmin() {
      throw configurationError;
    },
    async savePlatformAdmin() {
      throw configurationError;
    },
    async reorderPlatforms() {
      throw configurationError;
    },
    async deletePlatformAdmin() {
      throw configurationError;
    },
    async getServiceGroupUsageSummary() {
      throw configurationError;
    },
    async deleteServiceGroupAdmin() {
      throw configurationError;
    },
    async replaceServiceGroupUsage() {
      throw configurationError;
    },
  };
}

function createSupabaseAdminClient(): AdminDataClient {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return createUnconfiguredAdminClient();
  }

  return {
    async listTaskTypes() {
      const { data, error } = await supabase
        .from('task_types')
        .select('id, type1, type2, display_label, display_order, is_active, requires_service_group')
        .order('display_order');
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async listPlatforms() {
      const { data, error } = await supabase
        .from('platforms')
        .select('id, name, display_order, is_visible')
        .order('display_order');
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async listCostGroups() {
      const { data, error } = await supabase
        .from('cost_groups')
        .select('id, name, display_order, is_active')
        .order('display_order');
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async listServiceGroups() {
      const { data, error } = await supabase
        .from('service_groups')
        .select('id, name, cost_group_id, display_order, is_active, cost_groups(name)')
        .order('display_order');
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async listProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select(
          'id, name, project_type1, platform_id, platform, service_group_id, report_url, is_active, platforms(name), service_groups(cost_group_id, cost_groups(name))',
        )
        .order('name');
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async listProjectPages() {
      const { data, error } = await supabase
        .from('project_pages')
        .select('id, project_id, title, url, track_status, monitoring_in_progress, qa_in_progress')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async getProjectAdminOption(projectId: string) {
      const { data, error } = await supabase
        .from('projects')
        .select(
          'id, name, project_type1, platform_id, platform, service_group_id, report_url, is_active, platforms(name), service_groups(cost_group_id, cost_groups(name))',
        )
        .eq('id', projectId)
        .maybeSingle();
      if (error) throw error;
      return (data as ApiRecord | null) ?? null;
    },
    async listProjectPagesByProjectId(projectId: string) {
      const { data, error } = await supabase
        .from('project_pages')
        .select('id, project_id, title, url, track_status, monitoring_in_progress, qa_in_progress')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async searchReportProjectsAdmin(filters) {
      let query = supabase
        .from('projects')
        .select(
          'id, name, project_type1, platform_id, platform, service_group_id, report_url, is_active, platforms(name), service_groups!inner(cost_group_id, cost_groups(name))',
        )
        .eq('is_active', true)
        .order('name')
        .limit(60);

      if (filters.costGroupId.trim()) {
        query = query.eq('service_groups.cost_group_id', filters.costGroupId.trim());
      }
      if (filters.platform.trim()) {
        query = query.eq('platform', filters.platform.trim());
      }
      if (filters.projectType1.trim()) {
        query = query.eq('project_type1', filters.projectType1.trim());
      }
      if (filters.query.trim()) {
        query = query.ilike('name', `%${filters.query.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async searchTasksAdmin(filters, page, pageSize) {
      return fetchAdminTasks(supabase, filters, page, pageSize);
    },
    async getTaskAdmin(taskId: string) {
      return fetchAdminTaskById(supabase, taskId);
    },
    async saveTaskAdmin(input: AdminTaskSaveInput) {
      const { data, error } = await supabase.rpc('admin_save_task', {
        p_task_id: input.id ?? null,
        p_member_id: input.memberId,
        p_task_date: input.taskDate,
        p_cost_group_id: input.costGroupId,
        p_project_id: await resolveProjectId(supabase, input.projectId, input.pageId),
        p_project_page_id: toNullableString(input.pageId),
        p_task_type1: input.taskType1,
        p_task_type2: input.taskType2,
        p_task_usedtime: input.taskUsedtime,
        p_content: input.content,
        p_note: input.note,
      });
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      if (rows.length === 0) {
        throw new Error('저장된 업무보고를 확인할 수 없습니다.');
      }
      return rows[0] as ApiRecord;
    },
    async deleteTaskAdmin(taskId: string) {
      const { error } = await supabase.rpc('admin_delete_task', {
        p_task_id: taskId,
      });
      if (error) throw error;
    },
    async listMembersAdmin() {
      const { data, error } = await supabase
        .from('members')
        .select(
          'id, auth_user_id, account_id, name, email, note, user_level, user_active, member_status, report_required, joined_at, last_login_at, updated_at',
        )
        .order('joined_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async saveMemberAdmin(payload: MemberAdminPayload) {
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
    },
    async createMemberAdmin(payload: MemberAdminPayload) {
      const email = payload.email.trim().toLowerCase();
      const accountId = payload.accountId.trim();
      const name = payload.name.trim();

      if (!email) {
        throw new Error('초대할 이메일을 입력해 주세요.');
      }

      if (!accountId) {
        throw new Error('ID를 입력해 주세요.');
      }

      if (!name) {
        throw new Error('이름을 입력해 주세요.');
      }

      const data = await invokeAdminEdgeFunction<{
        action?: string;
        memberId?: string | null;
      }>(
        supabase,
        'invite-member',
        {
          email,
          accountId,
          name,
          note: payload.note,
          role: payload.role,
          userActive: payload.userActive ?? payload.isActive ?? true,
          memberStatus: payload.memberStatus,
          reportRequired: payload.reportRequired ?? true,
          redirectTo: getPasswordRecoveryRedirectUrl(),
        },
        '사용자 추가에 실패했습니다.',
      );

      return {
        action: data?.action === 'updated' ? 'updated' : 'created',
        memberId: String(data?.memberId ?? ''),
      };
    },
    async inviteMemberAdmin(payload: MemberInvitePayload) {
      const email = payload.email.trim().toLowerCase();
      if (!email) {
        throw new Error('초대 메일을 보낼 이메일을 입력해 주세요.');
      }

      await invokeAdminEdgeFunction(
        supabase,
        'invite-member',
        {
          email,
          accountId: payload.accountId.trim(),
          name: payload.name.trim(),
          role: payload.role,
          redirectTo: getPasswordRecoveryRedirectUrl(),
        },
        '초대 메일 발송에 실패했습니다.',
      );
    },
    async resetMemberPasswordAdmin(payload: MemberPasswordResetPayload) {
      const email = payload.email.trim().toLowerCase();
      if (!email) {
        throw new Error('비밀번호 재설정 메일을 보낼 이메일을 입력해 주세요.');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordRecoveryRedirectUrl(),
      });

      if (error) {
        throw error;
      }
    },
    async deleteMemberAdmin(memberId: string) {
      const data = await invokeAdminEdgeFunction<{
        result?: 'deleted' | 'deactivated';
      }>(supabase, 'delete-member', { memberId }, '사용자 삭제에 실패했습니다.');

      if (data?.result !== 'deleted' && data?.result !== 'deactivated') {
        throw new Error('사용자 삭제 결과를 확인할 수 없습니다.');
      }

      return data.result;
    },
    async saveTaskTypeAdmin(payload: AdminTaskTypePayload) {
      const { data, error } = await supabase
        .from('task_types')
        .upsert(
          {
            id: payload.id ?? undefined,
            type1: payload.type1,
            type2: payload.type2,
            display_label: payload.displayLabel,
            display_order: payload.displayOrder,
            requires_service_group: payload.requiresServiceGroup,
            is_active: payload.isActive,
          },
          { onConflict: 'id' },
        )
        .select('id, type1, type2, display_label, display_order, requires_service_group, is_active')
        .single();
      if (error) throw error;
      return data as ApiRecord;
    },
    async getTaskTypeUsageSummary(taskTypeId: string, type1: string, type2: string) {
      const { data, error } = await supabase.rpc('admin_get_task_type_usage_summary', {
        p_task_type_id: taskTypeId,
        p_type1: type1.trim(),
        p_type2: type2.trim(),
      });
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as ApiRecord[];
    },
    async deleteTaskTypeAdmin(taskTypeId: string) {
      const { error } = await supabase.from('task_types').delete().eq('id', taskTypeId);
      if (error) throw error;
    },
    async replaceTaskTypeUsage(
      oldType1: string,
      oldType2: string,
      nextType1: string,
      nextType2: string,
    ) {
      const { error } = await supabase.rpc('admin_replace_task_type_usage', {
        p_old_type1: oldType1,
        p_old_type2: oldType2,
        p_next_type1: nextType1,
        p_next_type2: nextType2,
      });
      if (error) throw error;
    },
    async reorderTaskTypes(payload: AdminReorderPayload) {
      const { error } = await supabase.rpc('admin_reorder_task_types', {
        p_task_type_ids: payload.ids,
      });
      if (error) throw error;
    },
    async saveServiceGroupAdmin(payload: AdminServiceGroupPayload) {
      const { data, error } = await supabase
        .from('service_groups')
        .upsert(
          {
            id: payload.id ?? undefined,
            name: composeServiceName(payload.svcGroup, payload.svcName) || payload.name,
            cost_group_id: payload.costGroupId,
            display_order: payload.displayOrder,
            is_active: payload.svcActive ?? payload.isActive,
          },
          { onConflict: 'id' },
        )
        .select('id, name, cost_group_id, display_order, is_active, cost_groups(name)')
        .single();
      if (error) throw error;
      return data as ApiRecord;
    },
    async reorderServiceGroups(payload: AdminReorderPayload) {
      const { error } = await supabase.rpc('admin_reorder_service_groups', {
        p_service_group_ids: payload.ids,
      });
      if (error) throw error;
    },
    async saveCostGroupAdmin(payload: AdminCostGroupPayload) {
      const { data, error } = await supabase
        .from('cost_groups')
        .upsert(
          {
            id: payload.id ?? undefined,
            name: payload.name.trim(),
            display_order: payload.displayOrder,
            is_active: payload.isActive,
          },
          { onConflict: 'id' },
        )
        .select('id, name, display_order, is_active')
        .single();
      if (error) throw error;
      return data as ApiRecord;
    },
    async reorderCostGroups(payload: AdminReorderPayload) {
      const { error } = await supabase.rpc('admin_reorder_cost_groups', {
        p_cost_group_ids: payload.ids,
      });
      if (error) throw error;
    },
    async savePlatformAdmin(payload: AdminPlatformPayload) {
      const { data, error } = await supabase
        .from('platforms')
        .upsert(
          {
            id: payload.id ?? undefined,
            name: payload.name.trim(),
            display_order: payload.displayOrder,
            is_visible: payload.isVisible,
          },
          { onConflict: 'id' },
        )
        .select('id, name, display_order, is_visible')
        .single();
      if (error) throw error;
      return data as ApiRecord;
    },
    async reorderPlatforms(payload: AdminReorderPayload) {
      const { error } = await supabase.rpc('admin_reorder_platforms', {
        p_platform_ids: payload.ids,
      });
      if (error) throw error;
    },
    async deleteCostGroupAdmin(costGroupId: string) {
      const { error } = await supabase.from('cost_groups').delete().eq('id', costGroupId);
      if (error) throw error;
    },
    async deletePlatformAdmin(platformId: string) {
      const { error } = await supabase.from('platforms').delete().eq('id', platformId);
      if (error) throw error;
    },
    async getServiceGroupUsageSummary(serviceGroupId: string) {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('service_group_id', serviceGroupId)
        .order('name');
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async deleteServiceGroupAdmin(serviceGroupId: string) {
      const { error } = await supabase.from('service_groups').delete().eq('id', serviceGroupId);
      if (error) throw error;
    },
    async replaceServiceGroupUsage(oldServiceGroupId: string | null, nextServiceGroupId: string) {
      if (!oldServiceGroupId) {
        throw new Error('대체할 서비스그룹을 찾을 수 없습니다.');
      }

      const { error } = await supabase
        .from('projects')
        .update({
          service_group_id: nextServiceGroupId,
        })
        .eq('service_group_id', oldServiceGroupId);

      if (error) throw error;
    },
  };
}

export const adminDataClient = createSupabaseAdminClient();
