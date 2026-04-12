import { getSupabaseClient } from './supabase';
import type { ApiRecord, RawPagedResult } from './api.types';
import type {
  AdminCostGroupPayload,
  AdminPlatformPayload,
  AdminReorderPayload,
  AdminServiceGroupPayload,
  AdminTaskSaveInput,
  AdminTaskTypePayload,
  MemberInvitePayload,
  MemberAdminPayload,
  MemberCreateResult,
  MemberPasswordResetPayload,
} from '../pages/admin/admin.types';
import { fetchAdminEdgeJson, getAdminEdgeHeaders } from '../pages/admin/adminEdgeApi';

export interface AdminDataClient {
  listTaskTypes(): Promise<ApiRecord[]>;
  listPlatforms(): Promise<ApiRecord[]>;
  listCostGroups(): Promise<ApiRecord[]>;
  listServiceGroups(): Promise<ApiRecord[]>;
  listProjects(): Promise<ApiRecord[]>;
  listProjectPages(): Promise<ApiRecord[]>;
  getProjectAdminOption(projectId: string): Promise<ApiRecord | null>;
  listProjectPagesByProjectId(projectId: string): Promise<ApiRecord[]>;
  searchReportProjectsAdmin(filters: {
    costGroupId: string | null;
    platform: string | null;
    projectType1: string | null;
    query: string | null;
  }): Promise<ApiRecord[]>;
  searchTasksAdmin(
    filters: {
      memberId: string | null;
      startDate: string | null;
      endDate: string | null;
      costGroupId: string | null;
      projectId: string | null;
      pageId: string | null;
      taskType1: string | null;
      taskType2: string | null;
      keyword: string | null;
    },
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
  replacePlatformUsage(oldPlatformId: string, nextPlatformId: string): Promise<void>;
  getServiceGroupUsageSummary(serviceGroupId: string): Promise<ApiRecord[]>;
  deleteServiceGroupAdmin(serviceGroupId: string): Promise<void>;
  replaceServiceGroupUsage(oldServiceGroupId: string, nextServiceGroupId: string): Promise<void>;
}

const supabase = getSupabaseClient();
const configurationErrorMessage = 'Supabase 환경 변수가 설정되지 않았습니다.';

const unconfiguredAdminClient: AdminDataClient = {
  async listTaskTypes() {
    throw new Error(configurationErrorMessage);
  },
  async listPlatforms() {
    throw new Error(configurationErrorMessage);
  },
  async listCostGroups() {
    throw new Error(configurationErrorMessage);
  },
  async listServiceGroups() {
    throw new Error(configurationErrorMessage);
  },
  async listProjects() {
    throw new Error(configurationErrorMessage);
  },
  async listProjectPages() {
    throw new Error(configurationErrorMessage);
  },
  async getProjectAdminOption() {
    throw new Error(configurationErrorMessage);
  },
  async listProjectPagesByProjectId() {
    throw new Error(configurationErrorMessage);
  },
  async searchReportProjectsAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async searchTasksAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async getTaskAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async saveTaskAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async deleteTaskAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async listMembersAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async saveMemberAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async createMemberAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async inviteMemberAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async resetMemberPasswordAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async deleteMemberAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async saveTaskTypeAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async getTaskTypeUsageSummary() {
    throw new Error(configurationErrorMessage);
  },
  async deleteTaskTypeAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async replaceTaskTypeUsage() {
    throw new Error(configurationErrorMessage);
  },
  async reorderTaskTypes() {
    throw new Error(configurationErrorMessage);
  },
  async saveServiceGroupAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async reorderServiceGroups() {
    throw new Error(configurationErrorMessage);
  },
  async saveCostGroupAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async reorderCostGroups() {
    throw new Error(configurationErrorMessage);
  },
  async deleteCostGroupAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async savePlatformAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async reorderPlatforms() {
    throw new Error(configurationErrorMessage);
  },
  async deletePlatformAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async replacePlatformUsage() {
    throw new Error(configurationErrorMessage);
  },
  async getServiceGroupUsageSummary() {
    throw new Error(configurationErrorMessage);
  },
  async deleteServiceGroupAdmin() {
    throw new Error(configurationErrorMessage);
  },
  async replaceServiceGroupUsage() {
    throw new Error(configurationErrorMessage);
  },
};

const configuredAdminClient: AdminDataClient = !supabase
  ? unconfiguredAdminClient
  : {
      async listTaskTypes() {
        const { data, error } = await supabase
          .from('task_types')
          .select('id, type1, type2, note, display_order, is_active, requires_service_group')
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
          .select(
            'id, service_group_name, service_name, name, cost_group_id, display_order, is_active, cost_groups(name)',
          )
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
          .select(
            'id, project_id, title, url, track_status, monitoring_in_progress, qa_in_progress',
          )
          .order('updated_at', { ascending: false });
        if (error) throw error;
        return (data ?? []) as ApiRecord[];
      },
      async getProjectAdminOption(projectId) {
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
      async listProjectPagesByProjectId(projectId) {
        const { data, error } = await supabase
          .from('project_pages')
          .select(
            'id, project_id, title, url, track_status, monitoring_in_progress, qa_in_progress',
          )
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
        if (filters.costGroupId)
          query = query.eq('service_groups.cost_group_id', filters.costGroupId);
        if (filters.platform) query = query.eq('platform', filters.platform);
        if (filters.projectType1) query = query.eq('project_type1', filters.projectType1);
        if (filters.query) query = query.ilike('name', `%${filters.query}%`);
        const { data, error } = await query;
        if (error) throw error;
        return (data ?? []) as ApiRecord[];
      },
      async searchTasksAdmin(filters, page, pageSize) {
        const from = Math.max(0, (page - 1) * pageSize);
        const to = from + pageSize - 1;
        const { data, error, count } = await supabase
          .rpc(
            'admin_search_tasks',
            {
              p_member_id: filters.memberId,
              p_start_date: filters.startDate,
              p_end_date: filters.endDate,
              p_project_id: filters.projectId,
              p_project_page_id: filters.pageId,
              p_task_type1: filters.taskType1,
              p_task_type2: filters.taskType2,
              p_cost_group_id: filters.costGroupId,
              p_keyword: filters.keyword,
            },
            { count: 'exact' },
          )
          .range(from, to);
        if (error) throw error;
        return { items: (data ?? []) as ApiRecord[], totalCount: count ?? 0 };
      },
      async getTaskAdmin(taskId) {
        const { data, error } = await supabase.rpc('admin_get_task', {
          p_task_id: taskId,
        });
        if (error) throw error;
        const rows = Array.isArray(data) ? data : [];
        if (rows.length === 0) throw new Error('업무보고를 찾을 수 없습니다.');
        return rows[0] as ApiRecord;
      },
      async saveTaskAdmin(input) {
        const { data, error } = await supabase.rpc('admin_save_task', {
          p_task_id: input.id ?? null,
          p_member_id: input.memberId,
          p_task_date: input.taskDate,
          p_cost_group_id: input.costGroupId,
          p_project_id: input.projectId || null,
          p_project_page_id: input.pageId || null,
          p_task_type1: input.taskType1,
          p_task_type2: input.taskType2,
          p_task_usedtime: input.taskUsedtime,
          p_url: input.pageUrl,
          p_content: input.content,
          p_note: input.note,
        });
        if (error) throw error;
        const rows = Array.isArray(data) ? data : [];
        if (rows.length === 0) throw new Error('저장된 업무보고를 확인할 수 없습니다.');
        return rows[0] as ApiRecord;
      },
      async deleteTaskAdmin(taskId) {
        const { error } = await supabase.rpc('admin_delete_task', { p_task_id: taskId });
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
      async saveMemberAdmin(payload) {
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
      async createMemberAdmin(payload) {
        const data = await fetchAdminEdgeJson<{
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
      },
      async inviteMemberAdmin(payload) {
        await fetchAdminEdgeJson('invite-member', {
          email: payload.email,
          accountId: payload.accountId,
          name: payload.name,
          role: payload.role,
        });
      },
      async resetMemberPasswordAdmin(payload) {
        const { error } = await supabase.auth.resetPasswordForEmail(payload.email, {
          redirectTo: getAdminEdgeHeaders().redirectTo,
        });
        if (error) throw error;
      },
      async deleteMemberAdmin(memberId) {
        const data = await fetchAdminEdgeJson<{ result?: 'deleted' | 'deactivated' }>(
          'delete-member',
          { memberId },
        );
        if (data?.result !== 'deleted' && data?.result !== 'deactivated') {
          throw new Error('사용자 삭제 결과를 확인할 수 없습니다.');
        }
        return data.result;
      },
      async saveTaskTypeAdmin(payload) {
        const { data, error } = await supabase
          .from('task_types')
          .upsert(
            {
              id: payload.id ?? undefined,
              type1: payload.type1,
              type2: payload.type2,
              note: payload.note,
              display_order: payload.displayOrder,
              requires_service_group: payload.requiresServiceGroup,
              is_active: payload.isActive,
            },
            { onConflict: 'id' },
          )
          .select('id, type1, type2, note, display_order, requires_service_group, is_active')
          .single();
        if (error) throw error;
        return data as ApiRecord;
      },
      async getTaskTypeUsageSummary(taskTypeId, type1, type2) {
        const { data, error } = await supabase.rpc('admin_get_task_type_usage_summary', {
          p_task_type_id: taskTypeId,
          p_type1: type1,
          p_type2: type2,
        });
        if (error) throw error;
        return (Array.isArray(data) ? data : []) as ApiRecord[];
      },
      async deleteTaskTypeAdmin(taskTypeId) {
        const { error } = await supabase.from('task_types').delete().eq('id', taskTypeId);
        if (error) throw error;
      },
      async replaceTaskTypeUsage(oldType1, oldType2, nextType1, nextType2) {
        const { error } = await supabase.rpc('admin_replace_task_type_usage', {
          p_old_type1: oldType1,
          p_old_type2: oldType2,
          p_next_type1: nextType1,
          p_next_type2: nextType2,
        });
        if (error) throw error;
      },
      async reorderTaskTypes(payload) {
        const { error } = await supabase.rpc('admin_reorder_task_types', {
          p_task_type_ids: payload.ids,
        });
        if (error) throw error;
      },
      async saveServiceGroupAdmin(payload) {
        const { data, error } = await supabase
          .from('service_groups')
          .upsert(
            {
              id: payload.id ?? undefined,
              service_group_name: payload.serviceGroupName,
              service_name: payload.serviceName,
              name: payload.name,
              cost_group_id: payload.costGroupId,
              display_order: payload.displayOrder,
              is_active: payload.svcActive ?? payload.isActive,
            },
            { onConflict: 'id' },
          )
          .select(
            'id, service_group_name, service_name, name, cost_group_id, display_order, is_active, cost_groups(name)',
          )
          .single();
        if (error) throw error;
        return data as ApiRecord;
      },
      async reorderServiceGroups(payload) {
        const { error } = await supabase.rpc('admin_reorder_service_groups', {
          p_service_group_ids: payload.ids,
        });
        if (error) throw error;
      },
      async saveCostGroupAdmin(payload) {
        const { data, error } = await supabase
          .from('cost_groups')
          .upsert(
            {
              id: payload.id ?? undefined,
              name: payload.name,
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
      async reorderCostGroups(payload) {
        const { error } = await supabase.rpc('admin_reorder_cost_groups', {
          p_cost_group_ids: payload.ids,
        });
        if (error) throw error;
      },
      async deleteCostGroupAdmin(costGroupId) {
        const { error } = await supabase.from('cost_groups').delete().eq('id', costGroupId);
        if (error) throw error;
      },
      async savePlatformAdmin(payload) {
        const { data, error } = await supabase
          .from('platforms')
          .upsert(
            {
              id: payload.id ?? undefined,
              name: payload.name,
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
      async reorderPlatforms(payload) {
        const { error } = await supabase.rpc('admin_reorder_platforms', {
          p_platform_ids: payload.ids,
        });
        if (error) throw error;
      },
      async deletePlatformAdmin(platformId) {
        const { error } = await supabase.from('platforms').delete().eq('id', platformId);
        if (error) throw error;
      },
      async replacePlatformUsage(oldPlatformId, nextPlatformId) {
        const { error } = await supabase.rpc('admin_replace_platform_usage', {
          p_old_platform_id: oldPlatformId,
          p_next_platform_id: nextPlatformId,
        });
        if (!error) return;

        const rpcError = error as unknown as ApiRecord;
        const rpcMissing =
          Number(rpcError.status ?? 0) === 404 ||
          String(rpcError.code ?? '') === 'PGRST202' ||
          String(rpcError.message ?? '').includes('admin_replace_platform_usage');

        if (!rpcMissing) throw error;

        if (oldPlatformId === nextPlatformId) {
          throw new Error('변경할 플랫폼이 현재 플랫폼과 같습니다.');
        }

        const { data: platformRows, error: platformsError } = await supabase
          .from('platforms')
          .select('id, name, is_visible')
          .in('id', [oldPlatformId, nextPlatformId]);
        if (platformsError) throw platformsError;

        const oldPlatform = (platformRows ?? []).find((item) => item.id === oldPlatformId);
        const nextPlatform = (platformRows ?? []).find((item) => item.id === nextPlatformId);

        if (!oldPlatform) {
          throw new Error('현재 플랫폼을 찾을 수 없습니다.');
        }
        if (!nextPlatform) {
          throw new Error('변경할 플랫폼을 찾을 수 없습니다.');
        }
        if (nextPlatform.is_visible !== true) {
          throw new Error('노출 중인 플랫폼으로만 전환할 수 있습니다.');
        }

        const { error: projectsError } = await supabase
          .from('projects')
          .update({
            platform_id: nextPlatformId,
            platform: String(nextPlatform.name ?? ''),
          })
          .eq('platform_id', oldPlatformId);
        if (projectsError) throw projectsError;

        const { error: sourcePlatformError } = await supabase
          .from('platforms')
          .update({ is_visible: false })
          .eq('id', oldPlatformId);
        if (sourcePlatformError) throw sourcePlatformError;
      },
      async getServiceGroupUsageSummary(serviceGroupId) {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name')
          .eq('service_group_id', serviceGroupId)
          .order('name');
        if (error) throw error;
        return (data ?? []) as ApiRecord[];
      },
      async deleteServiceGroupAdmin(serviceGroupId) {
        const { error } = await supabase.from('service_groups').delete().eq('id', serviceGroupId);
        if (error) throw error;
      },
      async replaceServiceGroupUsage(oldServiceGroupId, nextServiceGroupId) {
        const { error } = await supabase
          .from('projects')
          .update({ service_group_id: nextServiceGroupId })
          .eq('service_group_id', oldServiceGroupId);
        if (error) throw error;
      },
    };

export const adminDataClient = configuredAdminClient;
