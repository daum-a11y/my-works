import { getSupabaseClient } from './supabase';
import {
  type CostGroup,
  type DashboardTaskCalendarDay,
  type DashboardSnapshot,
  type Member,
  normalizePageStatus,
  type OpsStore,
  type PagedResult,
  type Platform,
  type Project,
  type ProjectPage,
  type ReportFilters,
  type SaveProjectInput,
  type SaveProjectPageInput,
  type SaveTaskInput,
  type ServiceGroup,
  type StatsSnapshot,
  type TaskActivity,
  type Task,
  type ResourceMonthReportRow,
  type ResourceServiceSummaryRow,
  type ResourceSummaryDayRow,
  type ResourceTypeSummaryRow,
  type TaskType,
} from './domain';
import { getToday, readBooleanFlag } from './utils';

export interface OpsDataClient {
  mode: 'supabase' | 'unconfigured';
  getMembers(): Promise<Member[]>;
  getMemberByAccountId(accountId: string): Promise<Member | null>;
  getMemberByEmail(email: string): Promise<Member | null>;
  getMemberByAuthId(authUserId: string): Promise<Member | null>;
  bindAuthSessionMember(authUserId: string, email?: string | null): Promise<Member | null>;
  touchMemberLastLogin(authUserId: string, email?: string | null): Promise<Member | null>;
  getTaskTypes(): Promise<TaskType[]>;
  getPlatforms(): Promise<Platform[]>;
  getCostGroups(): Promise<CostGroup[]>;
  getServiceGroups(): Promise<ServiceGroup[]>;
  getProjects(): Promise<Project[]>;
  searchProjectsPage(
    filters: { startDate: string; endDate: string },
    query: string,
    page: number,
    pageSize: number,
  ): Promise<PagedResult<Project>>;
  saveProject(input: SaveProjectInput): Promise<Project>;
  deleteProject(projectId: string): Promise<void>;
  getProjectPages(member: Member): Promise<ProjectPage[]>;
  getAllProjectPages(): Promise<ProjectPage[]>;
  getProjectPagesByProjectIds(projectIds: string[]): Promise<ProjectPage[]>;
  saveProjectPage(input: SaveProjectPageInput): Promise<ProjectPage>;
  deleteProjectPage(pageId: string): Promise<void>;
  getTasksByDate(member: Member, taskDate: string): Promise<Task[]>;
  getDashboardTaskCalendar(member: Member, month: string): Promise<DashboardTaskCalendarDay[]>;
  getResourceSummary(member: Member, month: string): Promise<ResourceSummaryDayRow[]>;
  getResourceTypeSummary(member: Member): Promise<ResourceTypeSummaryRow[]>;
  getResourceServiceSummary(member: Member): Promise<ResourceServiceSummaryRow[]>;
  getResourceMonthReport(member: Member, month: string): Promise<ResourceMonthReportRow[]>;
  getTaskActivities(): Promise<TaskActivity[]>;
  saveTask(member: Member, input: SaveTaskInput): Promise<Task>;
  deleteTask(member: Member, taskId: string): Promise<void>;
  exportTasks(member: Member, filters: ReportFilters): Promise<Task[]>;
  searchTasksPage(
    member: Member,
    filters: ReportFilters,
    page: number,
    pageSize: number,
  ): Promise<PagedResult<Task>>;
  getDashboard(member: Member): Promise<DashboardSnapshot>;
  getStats(member: Member): Promise<StatsSnapshot>;
}

function buildDashboard(store: OpsStore): DashboardSnapshot {
  const serviceGroupsById = new Map(store.serviceGroups.map((group) => [group.id, group.name]));
  const today = new Date().toISOString().slice(0, 10);

  return {
    inProgressProjects: [...store.projects]
      .filter((project) => project.startDate <= today && project.endDate >= today)
      .sort((left, right) => left.endDate.localeCompare(right.endDate))
      .map((project) => ({
        projectId: project.id,
        type1: project.projectType1 || '-',
        platform: project.platform || '-',
        serviceGroupName: project.serviceGroupId
          ? (serviceGroupsById.get(project.serviceGroupId) ?? '-')
          : '-',
        projectName: project.name || '-',
        startDate: project.startDate,
        endDate: project.endDate,
      })),
  };
}

function requireData<T>(data: T | null, message: string): T {
  if (data == null) {
    throw new Error(message);
  }

  return data;
}

function requireRecord(data: unknown, message: string): Record<string, unknown> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(message);
  }

  return data as Record<string, unknown>;
}

function dedupeTasksById(tasks: Task[]) {
  const seen = new Set<string>();

  return tasks.filter((task) => {
    if (seen.has(task.id)) {
      return false;
    }

    seen.add(task.id);
    return true;
  });
}

function dedupeProjectsById(projects: Project[]) {
  const seen = new Set<string>();

  return projects.filter((project) => {
    if (seen.has(project.id)) {
      return false;
    }

    seen.add(project.id);
    return true;
  });
}

function escapeLikeQuery(value: string) {
  return value.replaceAll('%', '\\%').replaceAll('_', '\\_').trim();
}

function buildInFilter(ids: string[]) {
  return ids.join(',');
}

function normalizeSearchQuery(value: string) {
  return value.trim().toLowerCase();
}

function createSupabaseClient(): OpsDataClient {
  const supabase = requireData(getSupabaseClient(), 'Supabase is not configured.');
  const taskSelectColumns =
    'id, member_id, task_date, project_id, project_page_id, task_type1, task_type2, task_usedtime, content, note, created_at, updated_at';

  return {
    mode: 'supabase',
    async getMembers() {
      const { data, error } = await supabase.from('members_public_view').select('*').order('name');
      if (error) throw error;
      return (data ?? []).map(mapMemberRecord);
    },
    async getMemberByAccountId(accountId) {
      const normalized = accountId.trim();
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .ilike('account_id', normalized)
        .maybeSingle();
      if (error) throw error;
      return data ? mapMemberRecord(data) : null;
    },
    async getMemberByEmail(email) {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (error) throw error;
      return data ? mapMemberRecord(data) : null;
    },
    async getMemberByAuthId(authUserId) {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapMemberRecord(data) : null;
    },
    async bindAuthSessionMember(authUserId, email) {
      const { data, error } = await supabase.rpc('bind_auth_session_member', {
        p_auth_user_id: authUserId,
        p_email: email ?? null,
      });
      if (error) throw error;
      return data
        ? mapMemberRecord(requireRecord(data, '사용자 연결 결과를 확인할 수 없습니다.'))
        : null;
    },
    async touchMemberLastLogin(authUserId, email) {
      const { data, error } = await supabase.rpc('touch_member_last_login', {
        p_auth_user_id: authUserId,
        p_email: email ?? null,
      });
      if (error) throw error;
      return data
        ? mapMemberRecord(requireRecord(data, '사용자 로그인 상태를 확인할 수 없습니다.'))
        : null;
    },
    async getTaskTypes() {
      const { data, error } = await supabase.from('task_types').select('*').order('display_order');
      if (error) throw error;
      return (data ?? []).map(mapTaskTypeRecord);
    },
    async getPlatforms() {
      const { data, error } = await supabase.from('platforms').select('*').order('display_order');
      if (error) throw error;
      return (data ?? []).map(mapPlatformRecord);
    },
    async getCostGroups() {
      const { data, error } = await supabase.from('cost_groups').select('*').order('display_order');
      if (error) throw error;
      return (data ?? []).map(mapCostGroupRecord);
    },
    async getServiceGroups() {
      const { data, error } = await supabase
        .from('service_groups')
        .select('id, name, cost_group_id, display_order, is_active, cost_groups(name)')
        .order('display_order');
      if (error) throw error;
      return (data ?? []).map((record) => mapServiceGroupRecord(record as Record<string, unknown>));
    },
    async getProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select('*, platforms(name)')
        .order('is_active', { ascending: false })
        .order('name');
      if (error) throw error;
      return (data ?? []).map(mapProjectRecord);
    },
    async searchProjectsPage(filters, query, page, pageSize) {
      const from = Math.max(0, (page - 1) * pageSize);
      const to = from + pageSize - 1;
      const normalizedQuery = normalizeSearchQuery(query);
      let matchedServiceGroupIds: string[] = [];
      let matchedMemberIds: string[] = [];

      if (normalizedQuery) {
        const [serviceGroups, members] = await Promise.all([
          this.getServiceGroups(),
          this.getMembers(),
        ]);
        matchedServiceGroupIds = serviceGroups
          .filter((group) => group.name.toLowerCase().includes(normalizedQuery))
          .map((group) => group.id);
        matchedMemberIds = members
          .filter((item) =>
            [item.accountId, item.name, item.email]
              .join(' ')
              .toLowerCase()
              .includes(normalizedQuery),
          )
          .map((item) => item.id);
      }

      let queryBuilder = supabase
        .from('projects')
        .select('*, platforms(name)', { count: 'exact' })
        .order('is_active', { ascending: false })
        .order('start_date', { ascending: false })
        .order('name');

      if (filters.startDate) queryBuilder = queryBuilder.gte('end_date', filters.startDate);
      if (filters.endDate) queryBuilder = queryBuilder.lte('start_date', filters.endDate);

      if (normalizedQuery) {
        const safeQuery = escapeLikeQuery(normalizedQuery);
        const orFilters = [
          `project_type1.ilike.*${safeQuery}*`,
          `name.ilike.*${safeQuery}*`,
          `platform.ilike.*${safeQuery}*`,
          `report_url.ilike.*${safeQuery}*`,
          `start_date.ilike.*${safeQuery}*`,
          `end_date.ilike.*${safeQuery}*`,
        ];

        if (matchedServiceGroupIds.length > 0) {
          orFilters.push(`service_group_id.in.(${buildInFilter(matchedServiceGroupIds)})`);
        }
        if (matchedMemberIds.length > 0) {
          const memberFilter = buildInFilter(matchedMemberIds);
          orFilters.push(`reporter_member_id.in.(${memberFilter})`);
          orFilters.push(`reviewer_member_id.in.(${memberFilter})`);
        }

        queryBuilder = queryBuilder.or(orFilters.join(','));
      }

      const { data, error, count } = await queryBuilder.range(from, to);
      if (error) throw error;

      return {
        items: dedupeProjectsById((data ?? []).map(mapProjectRecord)),
        totalCount: count ?? 0,
      };
    },
    async saveProject(input) {
      const { data, error } = await supabase
        .rpc('upsert_project', {
          p_project_id: input.id ?? null,
          p_project_type1: input.projectType1,
          p_name: input.name,
          p_platform_id: input.platformId,
          p_service_group_id: input.serviceGroupId,
          p_report_url: input.reportUrl,
          p_reporter_member_id: input.reporterMemberId,
          p_reviewer_member_id: input.reviewerMemberId,
          p_start_date: input.startDate,
          p_end_date: input.endDate,
          p_is_active: input.isActive,
        })
        .single();
      if (error) throw error;
      return mapProjectRecord(requireRecord(data, '프로젝트 저장 결과를 확인할 수 없습니다.'));
    },
    async deleteProject(projectId) {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
    },
    async getProjectPages() {
      const { data, error } = await supabase
        .from('project_pages_public_view')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapProjectPageRecord);
    },
    async getAllProjectPages() {
      const { data, error } = await supabase
        .from('project_pages_public_view')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapProjectPageRecord);
    },
    async getProjectPagesByProjectIds(projectIds) {
      if (projectIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('project_pages_public_view')
        .select('*')
        .in('project_id', projectIds)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapProjectPageRecord);
    },
    async saveProjectPage(input) {
      const { data, error } = await supabase
        .rpc('upsert_project_page', {
          p_page_id: input.id ?? null,
          p_project_id: input.projectId,
          p_title: input.title,
          p_url: input.url,
          p_owner_member_id: input.ownerMemberId,
          p_monitoring_month: input.monitoringMonth ?? null,
          p_track_status: input.trackStatus,
          p_monitoring_in_progress: input.monitoringInProgress,
          p_qa_in_progress: input.qaInProgress,
          p_note: input.note,
        })
        .single();
      if (error) throw error;
      return mapProjectPageRecord(
        requireRecord(data, '프로젝트 페이지 저장 결과를 확인할 수 없습니다.'),
      );
    },
    async deleteProjectPage(pageId) {
      const { error } = await supabase.from('project_pages').delete().eq('id', pageId);
      if (error) throw error;
    },
    async getTasksByDate(member, taskDate) {
      const { data, error } = await supabase
        .from('tasks')
        .select(taskSelectColumns)
        .eq('member_id', member.id)
        .eq('task_date', taskDate)
        .order('id', { ascending: false });
      if (error) throw error;
      return dedupeTasksById((data ?? []).map(mapTaskRecord));
    },
    async getDashboardTaskCalendar(member, month) {
      const { data, error } = await supabase.rpc('get_dashboard_task_calendar', {
        p_member_id: member.role === 'admin' ? member.id : null,
        p_month: month,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapDashboardTaskCalendarDayRecord);
    },
    async getResourceSummary(member, month) {
      const { data, error } = await supabase.rpc('get_resource_summary', {
        p_member_id: member.role === 'admin' ? null : member.id,
        p_month: month,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapResourceSummaryDayRowRecord);
    },
    async getResourceTypeSummary(member) {
      const { data, error } = await supabase.rpc('get_resource_type_summary', {
        p_member_id: member.role === 'admin' ? null : member.id,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapResourceTypeSummaryRowRecord);
    },
    async getResourceServiceSummary(member) {
      const { data, error } = await supabase.rpc('get_resource_service_summary', {
        p_member_id: member.role === 'admin' ? null : member.id,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapResourceServiceSummaryRowRecord);
    },
    async getResourceMonthReport(member, month) {
      const { data, error } = await supabase.rpc('get_resource_month_report', {
        p_member_id: member.role === 'admin' ? null : member.id,
        p_month: month,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapResourceMonthReportRowRecord);
    },
    async getTaskActivities() {
      const { data, error } = await supabase
        .from('tasks')
        .select('member_id, task_date, task_usedtime');
      if (error) throw error;
      return (data ?? []).map(mapTaskActivityRecord);
    },
    async saveTask(_member, input) {
      const taskDate = String(input.taskDate ?? '').trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(taskDate)) {
        throw new Error(`task_date invalid (client): "${taskDate}"`);
      }

      const { data, error } = await supabase
        .rpc('save_task', {
          p_task_id: input.id ?? null,
          p_task_date: taskDate,
          p_project_id: input.projectId || null,
          p_project_page_id: input.pageId || null,
          p_task_type1: input.taskType1,
          p_task_type2: input.taskType2,
          p_task_usedtime: input.taskUsedtime,
          p_content: input.content,
          p_note: input.note,
        })
        .single();
      if (error) {
        throw new Error(
          `${error.message}${error.code ? ` | ${error.code}` : ''} | taskDate=${taskDate}`,
        );
      }
      return mapTaskRecord(requireRecord(data, '업무보고 저장 결과를 확인할 수 없습니다.'));
    },
    async deleteTask(_member, taskId) {
      const { error } = await supabase.rpc('delete_task', {
        p_task_id: taskId,
      });
      if (error) throw error;
    },
    async exportTasks(member, filters) {
      const { data, error } = await supabase.rpc('search_tasks_export', {
        p_member_id: member.role === 'admin' ? null : member.id,
        p_start_date: filters.startDate || null,
        p_end_date: filters.endDate || null,
        p_project_id: filters.projectId || null,
        p_project_page_id: filters.pageId || null,
        p_task_type1: filters.taskType1 || null,
        p_task_type2: filters.taskType2 || null,
        p_min_task_usedtime: filters.minTaskUsedtime
          ? Number.parseFloat(filters.minTaskUsedtime)
          : null,
        p_max_task_usedtime: filters.maxTaskUsedtime
          ? Number.parseFloat(filters.maxTaskUsedtime)
          : null,
        p_keyword: filters.query.trim() || null,
      });
      if (error) throw error;
      return dedupeTasksById(((data ?? []) as Record<string, unknown>[]).map(mapTaskRecord));
    },
    async searchTasksPage(member, filters, page, pageSize) {
      const from = Math.max(0, (page - 1) * pageSize);
      const to = from + pageSize - 1;
      const normalizedQuery = normalizeSearchQuery(filters.query);
      let queryBuilder = supabase
        .from('tasks')
        .select(taskSelectColumns, { count: 'exact' })
        .eq('member_id', member.id)
        .order('task_date', { ascending: false })
        .order('id', { ascending: false });

      if (filters.startDate) queryBuilder = queryBuilder.gte('task_date', filters.startDate);
      if (filters.endDate) queryBuilder = queryBuilder.lte('task_date', filters.endDate);
      if (filters.projectId) queryBuilder = queryBuilder.eq('project_id', filters.projectId);
      if (filters.pageId) queryBuilder = queryBuilder.eq('project_page_id', filters.pageId);
      if (filters.taskType1) queryBuilder = queryBuilder.eq('task_type1', filters.taskType1);
      if (filters.taskType2) queryBuilder = queryBuilder.eq('task_type2', filters.taskType2);
      if (filters.minTaskUsedtime)
        queryBuilder = queryBuilder.gte(
          'task_usedtime',
          Number.parseFloat(filters.minTaskUsedtime),
        );
      if (filters.maxTaskUsedtime)
        queryBuilder = queryBuilder.lte(
          'task_usedtime',
          Number.parseFloat(filters.maxTaskUsedtime),
        );

      if (normalizedQuery) {
        const [projects, pages] = await Promise.all([
          this.getProjects(),
          this.getProjectPages(member),
        ]);
        const matchedProjectIds = projects
          .filter((project) => project.name.toLowerCase().includes(normalizedQuery))
          .map((project) => project.id);
        const matchedPageIds = pages
          .filter((page) => page.title.toLowerCase().includes(normalizedQuery))
          .map((page) => page.id);
        const safeQuery = escapeLikeQuery(normalizedQuery);
        const orFilters = [
          `content.ilike.*${safeQuery}*`,
          `note.ilike.*${safeQuery}*`,
          `task_type1.ilike.*${safeQuery}*`,
          `task_type2.ilike.*${safeQuery}*`,
        ];

        if (matchedProjectIds.length > 0) {
          orFilters.push(`project_id.in.(${buildInFilter(matchedProjectIds)})`);
        }
        if (matchedPageIds.length > 0) {
          orFilters.push(`project_page_id.in.(${buildInFilter(matchedPageIds)})`);
        }

        queryBuilder = queryBuilder.or(orFilters.join(','));
      }

      const { data, error, count } = await queryBuilder.range(from, to);
      if (error) throw error;

      return {
        items: dedupeTasksById((data ?? []).map(mapTaskRecord)),
        totalCount: count ?? 0,
      };
    },
    async getDashboard() {
      const [
        { data: projects, error: projectError },
        { data: members, error: membersError },
        { data: costGroups, error: costGroupsError },
        { data: serviceGroups, error: serviceGroupsError },
      ] = await Promise.all([
        supabase.from('projects').select('*, platforms(name)'),
        supabase.from('members_public_view').select('*'),
        supabase.from('cost_groups').select('*'),
        supabase
          .from('service_groups')
          .select('id, name, cost_group_id, display_order, is_active, cost_groups(name)'),
      ]);

      if (projectError) throw projectError;
      if (membersError) throw membersError;
      if (costGroupsError) throw costGroupsError;
      if (serviceGroupsError) throw serviceGroupsError;

      return buildDashboard({
        members: (members ?? []).map(mapMemberRecord),
        platforms: [],
        costGroups: (costGroups ?? []).map(mapCostGroupRecord),
        taskTypes: [],
        serviceGroups: (serviceGroups ?? []).map((record) =>
          mapServiceGroupRecord(record as Record<string, unknown>),
        ),
        projects: (projects ?? []).map(mapProjectRecord),
        projectPages: [],
        tasks: [],
      });
    },
    async getStats() {
      const { data, error } = await supabase.rpc('get_stats');
      if (error) throw error;

      const record = requireRecord(data, '통계 결과를 확인할 수 없습니다.');
      const statusBreakdownRaw = Array.isArray(record.status_breakdown)
        ? record.status_breakdown
        : [];
      const typeBreakdownRaw = Array.isArray(record.type_breakdown) ? record.type_breakdown : [];

      return {
        totalTaskUsedtime: Number(record.total_task_usedtime ?? 0),
        totalTasks: Number(record.total_tasks ?? 0),
        monitoringInProgress: Number(record.monitoring_in_progress ?? 0),
        qaInProgress: Number(record.qa_in_progress ?? 0),
        statusBreakdown: statusBreakdownRaw.map((item) => {
          const row = requireRecord(item, '상태 통계 결과를 확인할 수 없습니다.');
          return {
            status: String(
              row.status ?? '미수정',
            ) as StatsSnapshot['statusBreakdown'][number]['status'],
            count: Number(row.count ?? 0),
          };
        }),
        typeBreakdown: typeBreakdownRaw.map((item) => {
          const row = requireRecord(item, '업무유형 통계 결과를 확인할 수 없습니다.');
          return {
            type: String(row.type ?? ''),
            taskUsedtime: Number(row.task_usedtime ?? 0),
          };
        }),
      };
    },
  };
}

function createUnconfiguredClient(): OpsDataClient {
  const fail = async (): Promise<never> => {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  };

  return {
    mode: 'unconfigured',
    getMembers: fail,
    getMemberByAccountId: fail,
    getMemberByEmail: fail,
    getMemberByAuthId: fail,
    bindAuthSessionMember: fail,
    touchMemberLastLogin: fail,
    getTaskTypes: fail,
    getPlatforms: fail,
    getCostGroups: fail,
    getServiceGroups: fail,
    getProjects: fail,
    searchProjectsPage: fail,
    saveProject: fail,
    deleteProject: fail,
    getProjectPages: fail,
    getAllProjectPages: fail,
    getProjectPagesByProjectIds: fail,
    saveProjectPage: fail,
    deleteProjectPage: fail,
    getTasksByDate: fail,
    getDashboardTaskCalendar: fail,
    getResourceSummary: fail,
    getResourceTypeSummary: fail,
    getResourceServiceSummary: fail,
    getResourceMonthReport: fail,
    getTaskActivities: fail,
    saveTask: fail,
    deleteTask: fail,
    exportTasks: fail,
    searchTasksPage: fail,
    getDashboard: fail,
    getStats: fail,
  };
}

function mapMemberRecord(record: Record<string, unknown>): Member {
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

function mapTaskActivityRecord(record: Record<string, unknown>): TaskActivity {
  return {
    memberId: String(record.member_id ?? ''),
    taskDate: String(record.task_date ?? getToday()),
    taskUsedtime: Number(record.task_usedtime ?? 0),
  };
}

function mapDashboardTaskCalendarDayRecord(
  record: Record<string, unknown>,
): DashboardTaskCalendarDay {
  return {
    taskDate: String(record.task_date ?? getToday()),
    taskUsedtime: Number(record.task_usedtime ?? 0),
  };
}

function mapResourceSummaryDayRowRecord(record: Record<string, unknown>): ResourceSummaryDayRow {
  return {
    memberId: String(record.member_id ?? ''),
    accountId: String(record.account_id ?? ''),
    memberName: String(record.member_name ?? ''),
    taskDate: String(record.task_date ?? getToday()),
    taskUsedtime: Number(record.task_usedtime ?? 0),
  };
}

function mapResourceTypeSummaryRowRecord(record: Record<string, unknown>): ResourceTypeSummaryRow {
  return {
    year: String(record.year ?? ''),
    month: String(record.month ?? ''),
    taskType1: String(record.task_type1 ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
  };
}

function mapResourceServiceSummaryRowRecord(
  record: Record<string, unknown>,
): ResourceServiceSummaryRow {
  return {
    year: String(record.year ?? ''),
    month: String(record.month ?? ''),
    costGroupName: String(record.cost_group_name ?? ''),
    serviceGroupName: String(record.service_group_name ?? ''),
    serviceName: String(record.service_name ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
  };
}

function mapResourceMonthReportRowRecord(record: Record<string, unknown>): ResourceMonthReportRow {
  return {
    memberId: String(record.member_id ?? ''),
    accountId: String(record.account_id ?? ''),
    taskDate: String(record.task_date ?? getToday()),
    taskType1: String(record.task_type1 ?? ''),
    taskType2: String(record.task_type2 ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
    isServiceTask: Boolean(record.is_service_task ?? false),
    costGroupName: String(record.cost_group_name ?? ''),
    serviceGroupName: String(record.service_group_name ?? ''),
    serviceName: String(record.service_name ?? ''),
  };
}

function mapTaskTypeRecord(record: Record<string, unknown>): TaskType {
  return {
    id: String(record.id),
    type1: String(record.type1 ?? ''),
    type2: String(record.type2 ?? ''),
    label: String(record.display_label ?? `${record.type1 ?? ''} / ${record.type2 ?? ''}`),
    displayOrder: Number(record.display_order ?? 0),
    requiresServiceGroup: Boolean(record.requires_service_group ?? false),
    isActive: Boolean(record.is_active ?? true),
  };
}

function mapCostGroupRecord(record: Record<string, unknown>): CostGroup {
  return {
    id: String(record.id),
    name: String(record.name ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    isActive: Boolean(record.is_active ?? true),
  };
}

function mapPlatformRecord(record: Record<string, unknown>): Platform {
  return {
    id: String(record.id),
    name: String(record.name ?? ''),
    displayOrder: Number(record.display_order ?? 0),
    isVisible: Boolean(record.is_visible ?? true),
  };
}

function mapServiceGroupRecord(record: Record<string, unknown>): ServiceGroup {
  const costGroupRecord = Array.isArray(record.cost_groups)
    ? record.cost_groups[0]
    : record.cost_groups;
  const costGroupName =
    costGroupRecord && typeof costGroupRecord === 'object'
      ? String((costGroupRecord as Record<string, unknown>).name ?? '')
      : String(record.cost_group_name ?? '');

  return {
    id: String(record.id),
    name: String(record.name ?? ''),
    costGroupId: record.cost_group_id ? String(record.cost_group_id) : null,
    costGroupName,
    displayOrder: Number(record.display_order ?? 0),
    isActive: Boolean(record.is_active ?? true),
  };
}

function mapProjectRecord(record: Record<string, unknown>): Project {
  const platformRecord = Array.isArray(record.platforms) ? record.platforms[0] : record.platforms;
  const platformName =
    platformRecord && typeof platformRecord === 'object'
      ? String((platformRecord as Record<string, unknown>).name ?? '')
      : String(record.platform ?? '');
  return {
    id: String(record.id),
    createdByMemberId: record.created_by_member_id ? String(record.created_by_member_id) : null,
    projectType1: String(record.project_type1 ?? ''),
    name: String(record.name ?? ''),
    platformId: record.platform_id ? String(record.platform_id) : null,
    platform: platformName,
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    reportUrl: String(record.report_url ?? ''),
    reporterMemberId: record.reporter_member_id ? String(record.reporter_member_id) : null,
    reviewerMemberId: record.reviewer_member_id ? String(record.reviewer_member_id) : null,
    startDate: String(record.start_date ?? getToday()),
    endDate: String(record.end_date ?? getToday()),
    isActive: Boolean(record.is_active ?? true),
  };
}

function mapProjectPageRecord(record: Record<string, unknown>): ProjectPage {
  return {
    id: String(record.id),
    projectId: String(record.project_id ?? ''),
    title: String(record.title ?? ''),
    url: String(record.url ?? ''),
    ownerMemberId: record.owner_member_id ? String(record.owner_member_id) : null,
    monitoringMonth: String(record.monitoring_month ?? ''),
    trackStatus: normalizePageStatus(String(record.track_status ?? '미수정')),
    monitoringInProgress: Boolean(record.monitoring_in_progress ?? false),
    qaInProgress: Boolean(record.qa_in_progress ?? false),
    note: String(record.note ?? ''),
    updatedAt: String(record.updated_at ?? getToday()),
  };
}

function mapTaskRecord(record: Record<string, unknown>): Task {
  return {
    id: String(record.id),
    memberId: String(record.member_id ?? ''),
    taskDate: String(record.task_date ?? getToday()),
    projectId: record.project_id ? String(record.project_id) : null,
    pageId: record.project_page_id ? String(record.project_page_id) : null,
    taskType1: String(record.task_type1 ?? ''),
    taskType2: String(record.task_type2 ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
    content: String(record.content ?? ''),
    note: String(record.note ?? ''),
    createdAt: String(record.created_at ?? getToday()),
    updatedAt: String(record.updated_at ?? getToday()),
  };
}

export const opsDataClient: OpsDataClient = getSupabaseClient()
  ? createSupabaseClient()
  : createUnconfiguredClient();
