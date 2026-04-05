import { getSupabaseClient } from '../../lib/supabase';
import { normalizePageStatus } from '../../lib/domain';
import { readBooleanFlag } from '../../lib/utils';
import { getPasswordRecoveryRedirectUrl } from '../auth/authUrls';
import type {
  AdminCostGroupItem,
  AdminCostGroupPayload,
  AdminPageOption,
  AdminPlatformItem,
  AdminPlatformPayload,
  AdminProjectOption,
  AdminServiceGroupItem,
  AdminServiceGroupPayload,
  AdminServiceGroupUsageSummary,
  AdminTaskSaveInput,
  AdminTaskSearchFilters,
  AdminTaskSearchItem,
  AdminTaskSearchPage,
  AdminTaskTypeItem,
  AdminTaskTypePayload,
  AdminTaskTypeUsageSummary,
  MemberAdminItem,
  MemberInvitePayload,
  MemberAdminPayload,
  MemberCreateResult,
  MemberPasswordResetPayload,
} from './admin-types';

interface AdminDataClient {
  listTaskTypes(): Promise<AdminTaskTypeItem[]>;
  listPlatforms(): Promise<AdminPlatformItem[]>;
  listCostGroups(): Promise<AdminCostGroupItem[]>;
  listServiceGroups(): Promise<AdminServiceGroupItem[]>;
  listProjects(): Promise<AdminProjectOption[]>;
  listProjectPages(): Promise<AdminPageOption[]>;
  getProjectAdminOption(projectId: string): Promise<AdminProjectOption | null>;
  listProjectPagesByProjectId(projectId: string): Promise<AdminPageOption[]>;
  searchReportProjectsAdmin(filters: {
    costGroupId: string;
    platform: string;
    projectType1: string;
    query: string;
  }): Promise<AdminProjectOption[]>;
  searchTasksAdmin(
    filters: AdminTaskSearchFilters,
    page: number,
    pageSize: number,
  ): Promise<AdminTaskSearchPage>;
  getTaskAdmin(taskId: string): Promise<AdminTaskSearchItem>;
  saveTaskAdmin(input: AdminTaskSaveInput): Promise<AdminTaskSearchItem>;
  deleteTaskAdmin(taskId: string): Promise<void>;
  listMembersAdmin(): Promise<MemberAdminItem[]>;
  saveMemberAdmin(payload: MemberAdminPayload): Promise<MemberAdminItem>;
  createMemberAdmin(payload: MemberAdminPayload): Promise<MemberCreateResult>;
  inviteMemberAdmin(payload: MemberInvitePayload): Promise<void>;
  resetMemberPasswordAdmin(payload: MemberPasswordResetPayload): Promise<void>;
  deleteMemberAdmin(memberId: string): Promise<'deleted' | 'deactivated'>;
  saveTaskTypeAdmin(payload: AdminTaskTypePayload): Promise<AdminTaskTypeItem>;
  getTaskTypeUsageSummary(
    taskTypeId: string,
    type1: string,
    type2: string,
  ): Promise<AdminTaskTypeUsageSummary>;
  deleteTaskTypeAdmin(taskTypeId: string): Promise<void>;
  replaceTaskTypeUsage(
    oldType1: string,
    oldType2: string,
    nextType1: string,
    nextType2: string,
  ): Promise<void>;
  saveServiceGroupAdmin(payload: AdminServiceGroupPayload): Promise<AdminServiceGroupItem>;
  saveCostGroupAdmin(payload: AdminCostGroupPayload): Promise<AdminCostGroupItem>;
  deleteCostGroupAdmin(costGroupId: string): Promise<void>;
  savePlatformAdmin(payload: AdminPlatformPayload): Promise<AdminPlatformItem>;
  deletePlatformAdmin(platformId: string): Promise<void>;
  getServiceGroupUsageSummary(serviceGroupId: string): Promise<AdminServiceGroupUsageSummary>;
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

function mapProject(record: Record<string, unknown>): AdminProjectOption {
  const platformRecord = Array.isArray(record.platforms) ? record.platforms[0] : record.platforms;
  const platformName =
    platformRecord && typeof platformRecord === 'object'
      ? String((platformRecord as Record<string, unknown>).name ?? '')
      : String(record.platform ?? '');
  const serviceGroupRecord = Array.isArray(record.service_groups)
    ? record.service_groups[0]
    : record.service_groups;
  const costGroupRecord =
    serviceGroupRecord &&
    typeof serviceGroupRecord === 'object' &&
    'cost_groups' in (serviceGroupRecord as Record<string, unknown>)
      ? Array.isArray((serviceGroupRecord as Record<string, unknown>).cost_groups)
        ? (
            (serviceGroupRecord as Record<string, unknown>).cost_groups as Record<string, unknown>[]
          )[0]
        : ((serviceGroupRecord as Record<string, unknown>).cost_groups as Record<
            string,
            unknown
          > | null)
      : null;
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    projectType1: String(record.project_type1 ?? ''),
    platformId: record.platform_id ? String(record.platform_id) : null,
    platform: platformName,
    costGroupId:
      serviceGroupRecord && typeof serviceGroupRecord === 'object'
        ? String((serviceGroupRecord as Record<string, unknown>).cost_group_id ?? '') || null
        : null,
    costGroupName:
      costGroupRecord && typeof costGroupRecord === 'object'
        ? String((costGroupRecord as Record<string, unknown>).name ?? '')
        : '',
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    reportUrl: String(record.report_url ?? ''),
    isActive: Boolean(record.is_active ?? true),
  };
}

function mapPage(record: Record<string, unknown>): AdminPageOption {
  return {
    id: String(record.id ?? ''),
    projectId: String(record.project_id ?? ''),
    title: String(record.title ?? ''),
    url: String(record.url ?? ''),
    trackStatus: normalizePageStatus(String(record.track_status ?? '미수정')),
    monitoringInProgress: Boolean(record.monitoring_in_progress ?? false),
    qaInProgress: Boolean(record.qa_in_progress ?? false),
  };
}

function mapTask(record: Record<string, unknown>): AdminTaskSearchItem {
  return {
    id: String(record.id ?? ''),
    memberId: String(record.member_id ?? ''),
    memberName: String(record.member_name ?? ''),
    memberEmail: String(record.member_email ?? ''),
    taskDate: String(record.task_date ?? ''),
    costGroupId: String(record.cost_group_id ?? ''),
    costGroupName: String(record.cost_group_name ?? ''),
    platform: String(record.platform ?? ''),
    projectId: record.project_id ? String(record.project_id) : null,
    projectName: String(record.project_name ?? ''),
    pageId: record.project_page_id ? String(record.project_page_id) : null,
    pageTitle: String(record.page_title ?? ''),
    pageUrl: String(record.page_url ?? ''),
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    serviceGroupName: String(record.service_group_name ?? ''),
    serviceName: String(record.service_name ?? ''),
    taskType1: String(record.task_type1 ?? ''),
    taskType2: String(record.task_type2 ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
    content: String(record.content ?? ''),
    note: String(record.note ?? ''),
    updatedAt: String(record.updated_at ?? ''),
  };
}

function mapTaskType(record: Record<string, unknown>): AdminTaskTypeItem {
  return {
    id: String(record.id ?? ''),
    type1: String(record.type1 ?? ''),
    type2: String(record.type2 ?? ''),
    displayLabel: String(record.display_label ?? `${record.type1 ?? ''} / ${record.type2 ?? ''}`),
    displayOrder: Number(record.display_order ?? 0),
    requiresServiceGroup: Boolean(record.requires_service_group ?? false),
    isActive: Boolean(record.is_active ?? true),
  };
}

function mapCostGroup(record: Record<string, unknown>): AdminCostGroupItem {
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    isActive: Boolean(record.is_active ?? true),
  };
}

function mapPlatform(record: Record<string, unknown>): AdminPlatformItem {
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    isVisible: Boolean(record.is_visible ?? true),
  };
}

function splitServiceName(name: string) {
  const normalized = String(name ?? '').trim();
  if (!normalized) {
    return { svcGroup: '', svcName: '' };
  }

  const [group, ...rest] = normalized.split(' / ');
  if (rest.length === 0) {
    return { svcGroup: normalized, svcName: normalized };
  }

  return {
    svcGroup: group.trim(),
    svcName: rest.join(' / ').trim(),
  };
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

function mapServiceGroup(record: Record<string, unknown>): AdminServiceGroupItem {
  const name = String(record.name ?? '');
  const parts = splitServiceName(name);
  const costGroupRecord = Array.isArray(record.cost_groups)
    ? record.cost_groups[0]
    : record.cost_groups;
  const costGroupName =
    costGroupRecord && typeof costGroupRecord === 'object'
      ? String((costGroupRecord as Record<string, unknown>).name ?? '')
      : String(record.cost_group_name ?? '');

  return {
    id: String(record.id ?? ''),
    name,
    svcGroup: parts.svcGroup,
    svcName: parts.svcName,
    costGroupId: record.cost_group_id ? String(record.cost_group_id) : null,
    costGroupName,
    svcActive: Boolean(record.svc_active ?? record.is_active ?? true),
    displayOrder: Number(record.display_order ?? 0),
    isActive: Boolean(record.is_active ?? true),
  };
}

function mapMember(record: Record<string, unknown>): MemberAdminItem {
  const active = readBooleanFlag(record.user_active ?? record.is_active, true);
  const memberStatus =
    String(record.member_status ?? 'active') === 'pending' ? 'pending' : 'active';
  const authUserId = record.auth_user_id ? String(record.auth_user_id) : null;
  const accountId = String(record.account_id ?? '').trim();
  const email = String(record.email ?? '').trim();
  const reportRequired =
    typeof record.report_required === 'boolean'
      ? record.report_required
      : typeof record.report_required === 'number'
        ? record.report_required === 1
        : String(record.report_required ?? 0) === '1' ||
          String(record.report_required ?? false) === 'true';
  const queueReasons: string[] = [];

  if (!authUserId) {
    queueReasons.push('auth_unlinked');
  }
  if (!accountId) {
    queueReasons.push('account_id_missing');
  }
  if (!email) {
    queueReasons.push('email_missing');
  }
  if (!active) {
    queueReasons.push('inactive_candidate');
  }
  if (memberStatus === 'pending') {
    queueReasons.push('approval_pending');
  }

  return {
    id: String(record.id ?? ''),
    authUserId,
    accountId,
    name: String(record.name ?? ''),
    email,
    note: String(record.note ?? ''),
    role: Number(record.user_level ?? 0) === 1 ? 'admin' : 'user',
    userActive: active,
    memberStatus,
    reportRequired,
    isActive: active,
    authEmail: String(record.auth_email ?? record.email ?? ''),
    queueReasons,
    joinedAt: String(record.joined_at ?? record.created_at ?? ''),
    lastLoginAt: String(record.last_login_at ?? ''),
    updatedAt: String(record.updated_at ?? ''),
  };
}

function dedupeAdminTasksById(items: AdminTaskSearchItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

async function fetchAdminTasks(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  filters: AdminTaskSearchFilters,
  page: number,
  pageSize: number,
): Promise<AdminTaskSearchPage> {
  const memberId = toNullableString(filters.memberId);
  const startDate = toNullableString(filters.startDate);
  const endDate = toNullableString(filters.endDate);
  const projectId = toNullableString(filters.projectId);
  const pageId = toNullableString(filters.pageId);
  const taskType1 = toNullableString(filters.taskType1);
  const taskType2 = toNullableString(filters.taskType2);
  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .rpc(
      'admin_search_tasks',
      {
        p_member_id: memberId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_project_id: projectId,
        p_project_page_id: pageId,
        p_task_type1: taskType1,
        p_task_type2: taskType2,
        p_cost_group_id: toNullableString(filters.costGroupId),
        p_keyword: toNullableString(filters.keyword),
      },
      { count: 'exact' },
    )
    .range(from, to);
  if (error) throw error;
  return {
    items: dedupeAdminTasksById(((data ?? []) as Record<string, unknown>[]).map(mapTask)),
    totalCount: count ?? 0,
  };
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
  return mapTask(rows[0] as Record<string, unknown>);
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
      return [] as AdminTaskTypeItem[];
    },
    async listPlatforms() {
      return [] as AdminPlatformItem[];
    },
    async listCostGroups() {
      return [] as AdminCostGroupItem[];
    },
    async listServiceGroups() {
      return [] as AdminServiceGroupItem[];
    },
    async listProjects() {
      return [] as AdminProjectOption[];
    },
    async listProjectPages() {
      return [] as AdminPageOption[];
    },
    async getProjectAdminOption() {
      throw configurationError;
    },
    async listProjectPagesByProjectId() {
      return [] as AdminPageOption[];
    },
    async searchReportProjectsAdmin() {
      return [] as AdminProjectOption[];
    },
    async searchTasksAdmin() {
      return { items: [], totalCount: 0 } as AdminTaskSearchPage;
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
      return [] as MemberAdminItem[];
    },
    async saveMemberAdmin() {
      throw configurationError;
    },
    async createMemberAdmin() {
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
    async saveServiceGroupAdmin() {
      throw configurationError;
    },
    async saveCostGroupAdmin() {
      throw configurationError;
    },
    async deleteCostGroupAdmin() {
      throw configurationError;
    },
    async savePlatformAdmin() {
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
      return (data ?? []).map((record) => mapTaskType(record as Record<string, unknown>));
    },

    async listPlatforms() {
      const { data, error } = await supabase
        .from('platforms')
        .select('id, name, display_order, is_visible')
        .order('display_order');
      if (error) throw error;
      return (data ?? []).map((record) => mapPlatform(record as Record<string, unknown>));
    },

    async listCostGroups() {
      const { data, error } = await supabase
        .from('cost_groups')
        .select('id, name, display_order, is_active')
        .order('display_order');
      if (error) throw error;
      return (data ?? []).map((record) => mapCostGroup(record as Record<string, unknown>));
    },

    async listServiceGroups() {
      const { data, error } = await supabase
        .from('service_groups')
        .select('id, name, cost_group_id, display_order, is_active, cost_groups(name)')
        .order('display_order');
      if (error) throw error;
      return (data ?? []).map((record) => mapServiceGroup(record as Record<string, unknown>));
    },

    async listProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select(
          'id, name, project_type1, platform_id, platform, service_group_id, report_url, is_active, platforms(name), service_groups(cost_group_id, cost_groups(name))',
        )
        .order('name');
      if (error) throw error;
      return (data ?? []).map((record) => mapProject(record as Record<string, unknown>));
    },

    async listProjectPages() {
      const { data, error } = await supabase
        .from('project_pages')
        .select('id, project_id, title, url, track_status, monitoring_in_progress, qa_in_progress')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((record) => mapPage(record as Record<string, unknown>));
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
      return data ? mapProject(data as Record<string, unknown>) : null;
    },

    async listProjectPagesByProjectId(projectId: string) {
      const { data, error } = await supabase
        .from('project_pages')
        .select('id, project_id, title, url, track_status, monitoring_in_progress, qa_in_progress')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((record) => mapPage(record as Record<string, unknown>));
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
      return ((data ?? []) as Record<string, unknown>[]).map(mapProject);
    },

    async searchTasksAdmin(filters: AdminTaskSearchFilters, page: number, pageSize: number) {
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
      return mapTask(rows[0] as Record<string, unknown>);
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
      return (data ?? []).map((record) => mapMember(record as Record<string, unknown>));
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
        return mapMember(data as Record<string, unknown>);
      }

      const { data, error } = await supabase
        .from('members')
        .insert(record)
        .select(
          'id, auth_user_id, account_id, name, email, note, user_level, user_active, member_status, report_required, joined_at, updated_at',
        )
        .single();
      if (error) throw error;
      return mapMember(data as Record<string, unknown>);
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

      const { data, error } = await supabase.functions.invoke('create-member', {
        body: {
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
      });

      if (error) {
        throw error;
      }

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

      const { error } = await supabase.functions.invoke('invite-member', {
        body: {
          email,
          accountId: payload.accountId.trim(),
          name: payload.name.trim(),
          role: payload.role,
          redirectTo: getPasswordRecoveryRedirectUrl(),
        },
      });

      if (error) {
        throw error;
      }
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
      const { data, error: countError } = await supabase.rpc('admin_get_member_task_count', {
        p_member_id: memberId,
      });
      if (countError) throw countError;
      const rows = Array.isArray(data) ? data : [];
      const count = Number(rows[0]?.task_count ?? 0);

      if (count > 0) {
        const { error } = await supabase
          .from('members')
          .update({ user_active: false })
          .eq('id', memberId);
        if (error) throw error;
        return 'deactivated';
      }

      const { error } = await supabase.from('members').delete().eq('id', memberId);
      if (error) throw error;
      return 'deleted';
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
      return mapTaskType(data as Record<string, unknown>);
    },

    async getTaskTypeUsageSummary(taskTypeId: string, type1: string, type2: string) {
      const { data, error } = await supabase.rpc('admin_get_task_type_usage_summary', {
        p_task_type_id: taskTypeId,
        p_type1: type1.trim(),
        p_type2: type2.trim(),
      });
      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      return {
        taskCount: Number(rows[0]?.task_count ?? 0),
      };
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

    async saveServiceGroupAdmin(payload: AdminServiceGroupPayload) {
      const name = composeServiceName(payload.svcGroup, payload.svcName) || payload.name;
      const { data, error } = await supabase
        .from('service_groups')
        .upsert(
          {
            id: payload.id ?? undefined,
            name,
            cost_group_id: payload.costGroupId,
            display_order: payload.displayOrder,
            is_active: payload.svcActive ?? payload.isActive,
          },
          { onConflict: 'id' },
        )
        .select('id, name, cost_group_id, display_order, is_active, cost_groups(name)')
        .single();
      if (error) throw error;
      return mapServiceGroup(data as Record<string, unknown>);
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
      return mapCostGroup(data as Record<string, unknown>);
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
      return mapPlatform(data as Record<string, unknown>);
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

      return {
        projectCount: (data ?? []).length,
        projectNames: (data ?? [])
          .map((row) => String(row.name ?? ''))
          .filter(Boolean)
          .slice(0, 5),
      };
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
