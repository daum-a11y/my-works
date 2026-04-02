import { getSupabaseClient } from '../../lib/supabase';
import { normalizePageStatus } from '../../lib/domain';
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
} from './admin-types';

interface AdminDataClient {
  listTaskTypes(): Promise<AdminTaskTypeItem[]>;
  listPlatforms(): Promise<AdminPlatformItem[]>;
  listCostGroups(): Promise<AdminCostGroupItem[]>;
  listServiceGroups(): Promise<AdminServiceGroupItem[]>;
  listProjects(): Promise<AdminProjectOption[]>;
  listProjectPages(): Promise<AdminPageOption[]>;
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
  inviteMemberAdmin(payload: MemberInvitePayload): Promise<void>;
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

const TASK_SELECT_COLUMNS =
  'id, member_id, task_date, project_id, project_page_id, task_type1, task_type2, hours, content, note, updated_at';

function mapProject(record: Record<string, unknown>): AdminProjectOption {
  const platformRecord = Array.isArray(record.platforms) ? record.platforms[0] : record.platforms;
  const platformName =
    platformRecord && typeof platformRecord === 'object'
      ? String((platformRecord as Record<string, unknown>).name ?? '')
      : String(record.platform ?? '');
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    projectType1: String(record.project_type1 ?? ''),
    platformId: record.platform_id ? String(record.platform_id) : null,
    platform: platformName,
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
    hours: Number(record.hours ?? 0),
    content: String(record.content ?? ''),
    note: String(record.note ?? ''),
    updatedAt: String(record.updated_at ?? ''),
  };
}

function mapTaskType(record: Record<string, unknown>): AdminTaskTypeItem {
  return {
    id: String(record.id ?? ''),
    legacyTypeNum:
      record.legacy_type_num == null || record.legacy_type_num === ''
        ? null
        : Number(record.legacy_type_num),
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
    legacyCostGroupCode:
      record.legacy_cost_group_code == null || record.legacy_cost_group_code === ''
        ? null
        : Number(record.legacy_cost_group_code),
    name: String(record.name ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    isActive: Boolean(record.is_active ?? true),
  };
}

function mapPlatform(record: Record<string, unknown>): AdminPlatformItem {
  return {
    id: String(record.id ?? ''),
    legacyPlatformName: record.legacy_platform_name ? String(record.legacy_platform_name) : null,
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
    legacySvcNum:
      record.legacy_svc_num == null || record.legacy_svc_num === ''
        ? null
        : Number(record.legacy_svc_num),
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
  const active = Boolean(record.user_active ?? record.is_active ?? true);
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

async function loadAdminReferenceMaps(supabase: NonNullable<ReturnType<typeof getSupabaseClient>>) {
  const [membersResult, projectsResult, pagesResult, serviceGroupsResult] = await Promise.all([
    supabase.from('members').select('id, name, email'),
    supabase.from('projects').select('id, name, platform, service_group_id'),
    supabase.from('project_pages').select('id, project_id, title, url'),
    supabase.from('service_groups').select('id, name, cost_group_id, cost_groups(name)'),
  ]);

  if (membersResult.error) throw membersResult.error;
  if (projectsResult.error) throw projectsResult.error;
  if (pagesResult.error) throw pagesResult.error;
  if (serviceGroupsResult.error) throw serviceGroupsResult.error;

  return {
    members: new Map(
      (membersResult.data ?? []).map((record) => [
        String(record.id),
        record as Record<string, unknown>,
      ]),
    ),
    projects: new Map(
      (projectsResult.data ?? []).map((record) => [
        String(record.id),
        record as Record<string, unknown>,
      ]),
    ),
    pages: new Map(
      (pagesResult.data ?? []).map((record) => [
        String(record.id),
        record as Record<string, unknown>,
      ]),
    ),
    serviceGroups: new Map(
      (serviceGroupsResult.data ?? []).map((record) => [
        String(record.id),
        record as Record<string, unknown>,
      ]),
    ),
  };
}

function enrichTaskRecords(
  records: Record<string, unknown>[],
  maps: Awaited<ReturnType<typeof loadAdminReferenceMaps>>,
) {
  return records.map((record) => {
    const memberId = String(record.member_id ?? '');
    const projectId = record.project_id ? String(record.project_id) : null;
    const pageId = record.project_page_id ? String(record.project_page_id) : null;
    const member = maps.members.get(memberId);
    const project = projectId ? maps.projects.get(projectId) : undefined;
    const page = pageId ? maps.pages.get(pageId) : undefined;
    const serviceGroupId = project?.service_group_id ? String(project.service_group_id) : null;
    const serviceGroup = serviceGroupId ? maps.serviceGroups.get(serviceGroupId) : undefined;

    return mapTask({
      ...record,
      member_name: member?.name ?? '',
      member_email: member?.email ?? '',
      platform: project?.platform ?? '',
      project_name: project?.name ?? '',
      page_title: page?.title ?? '',
      page_url: page?.url ?? '',
      service_group_id: serviceGroupId,
      service_group_name: serviceGroup?.svcGroup ?? '',
      service_name: serviceGroup?.svcName ?? '',
    });
  });
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
        p_service_group_id: toNullableString(filters.serviceGroupId),
        p_keyword: toNullableString(filters.keyword),
      },
      { count: 'exact' },
    )
    .range(from, to);
  if (error) throw error;

  const maps = await loadAdminReferenceMaps(supabase);
  return {
    items: dedupeAdminTasksById(enrichTaskRecords((data ?? []) as Record<string, unknown>[], maps)),
    totalCount: count ?? 0,
  };
}

async function fetchAdminTaskById(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  taskId: string,
) {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT_COLUMNS)
    .eq('id', taskId)
    .single();
  if (error) throw error;
  const maps = await loadAdminReferenceMaps(supabase);
  return enrichTaskRecords([data as Record<string, unknown>], maps)[0];
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
    async inviteMemberAdmin() {
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
        .select('id, legacy_platform_name, name, display_order, is_visible')
        .order('display_order');
      if (error) throw error;
      return (data ?? []).map((record) => mapPlatform(record as Record<string, unknown>));
    },

    async listCostGroups() {
      const { data, error } = await supabase
        .from('cost_groups')
        .select('id, legacy_cost_group_code, name, display_order, is_active')
        .order('display_order');
      if (error) throw error;
      return (data ?? []).map((record) => mapCostGroup(record as Record<string, unknown>));
    },

    async listServiceGroups() {
      const { data, error } = await supabase
        .from('service_groups')
        .select(
          'id, legacy_svc_num, name, cost_group_id, display_order, is_active, cost_groups(name)',
        )
        .order('display_order');
      if (error) throw error;
      return (data ?? []).map((record) => mapServiceGroup(record as Record<string, unknown>));
    },

    async listProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select(
          'id, name, project_type1, platform_id, platform, service_group_id, report_url, is_active, platforms(name)',
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

    async searchTasksAdmin(filters: AdminTaskSearchFilters, page: number, pageSize: number) {
      return fetchAdminTasks(supabase, filters, page, pageSize);
    },

    async getTaskAdmin(taskId: string) {
      return fetchAdminTaskById(supabase, taskId);
    },

    async saveTaskAdmin(input: AdminTaskSaveInput) {
      const record = {
        member_id: input.memberId,
        task_date: input.taskDate,
        project_id: await resolveProjectId(supabase, input.projectId, input.pageId),
        project_page_id: toNullableString(input.pageId),
        task_type1: input.taskType1,
        task_type2: input.taskType2,
        hours: input.hours,
        content: input.content,
        note: input.note,
      };

      if (input.id) {
        const { data, error } = await supabase
          .from('tasks')
          .update(record)
          .eq('id', input.id)
          .select('id')
          .single();
        if (error) throw error;
        return fetchAdminTaskById(supabase, String(data.id));
      }

      const { data, error } = await supabase.from('tasks').insert(record).select('id').single();
      if (error) throw error;
      return fetchAdminTaskById(supabase, String(data.id));
    },

    async deleteTaskAdmin(taskId: string) {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
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

    async deleteMemberAdmin(memberId: string) {
      const { count, error: countError } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('member_id', memberId);

      if (countError) throw countError;

      if ((count ?? 0) > 0) {
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
            legacy_type_num: payload.legacyTypeNum ?? null,
            type1: payload.type1,
            type2: payload.type2,
            display_label: payload.displayLabel,
            display_order: payload.displayOrder,
            requires_service_group: payload.requiresServiceGroup,
            is_active: payload.isActive,
          },
          { onConflict: 'id' },
        )
        .select(
          'id, legacy_type_num, type1, type2, display_label, display_order, requires_service_group, is_active',
        )
        .single();
      if (error) throw error;
      return mapTaskType(data as Record<string, unknown>);
    },

    async getTaskTypeUsageSummary(taskTypeId: string, type1: string, type2: string) {
      const taskIds = new Set<string>();

      const normalizedType1 = type1.trim();
      const normalizedType2 = type2.trim();

      const [byIdResult, byTextResult] = await Promise.all([
        supabase.from('tasks').select('id').eq('task_type_id', taskTypeId),
        supabase
          .from('tasks')
          .select('id')
          .eq('task_type1', normalizedType1)
          .eq('task_type2', normalizedType2),
      ]);

      if (byIdResult.error) throw byIdResult.error;
      if (byTextResult.error) throw byTextResult.error;

      for (const row of byIdResult.data ?? []) {
        taskIds.add(String(row.id));
      }

      for (const row of byTextResult.data ?? []) {
        taskIds.add(String(row.id));
      }

      return {
        taskCount: taskIds.size,
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
      const { error } = await supabase
        .from('tasks')
        .update({
          task_type1: nextType1,
          task_type2: nextType2,
        })
        .eq('task_type1', oldType1)
        .eq('task_type2', oldType2);

      if (error) throw error;
    },

    async saveServiceGroupAdmin(payload: AdminServiceGroupPayload) {
      const name = composeServiceName(payload.svcGroup, payload.svcName) || payload.name;
      const { data, error } = await supabase
        .from('service_groups')
        .upsert(
          {
            id: payload.id ?? undefined,
            legacy_svc_num: payload.legacySvcNum ?? null,
            name,
            cost_group_id: payload.costGroupId,
            display_order: payload.displayOrder,
            is_active: payload.svcActive ?? payload.isActive,
          },
          { onConflict: 'id' },
        )
        .select(
          'id, legacy_svc_num, name, cost_group_id, display_order, is_active, cost_groups(name)',
        )
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
            legacy_cost_group_code: payload.legacyCostGroupCode ?? null,
            name: payload.name.trim(),
            display_order: payload.displayOrder,
            is_active: payload.isActive,
          },
          { onConflict: 'id' },
        )
        .select('id, legacy_cost_group_code, name, display_order, is_active')
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
            legacy_platform_name: payload.legacyPlatformName ?? null,
            name: payload.name.trim(),
            display_order: payload.displayOrder,
            is_visible: payload.isVisible,
          },
          { onConflict: 'id' },
        )
        .select('id, legacy_platform_name, name, display_order, is_visible')
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
