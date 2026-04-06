import { getSupabaseClient } from './supabase';
import {
  type CostGroup,
  type DashboardTaskCalendarDay,
  type DashboardSnapshot,
  type Member,
  type MonitoringStatsRow,
  normalizePageStatus,
  type PagedResult,
  type Platform,
  type Project,
  type ProjectListRow,
  type ProjectPage,
  type QaStatsProjectRow,
  type ReportFilters,
  type SaveProjectInput,
  type SaveProjectPageInput,
  type SaveTaskInput,
  type ServiceGroup,
  type StatsSnapshot,
  type TaskActivity,
  type Task,
  type ResourceMonthReportRow,
  type ResourceMonthReport,
  type ResourceMonthReportMemberTotal,
  type ResourceMonthReportServiceDetailRow,
  type ResourceMonthReportServiceSummaryRow,
  type ResourceMonthReportTypeRow,
  type ReportProjectOptionRow,
  type ResourceSummaryMemberRow,
  type ResourceServiceSummaryRow,
  type ResourceSummaryDayRow,
  type ResourceTypeSummaryRow,
  type SearchTaskRow,
  type TaskType,
} from '../types/domain';
import { getToday, readBooleanFlag } from '../utils';

export interface DataClient {
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
  ): Promise<PagedResult<ProjectListRow>>;
  searchReportProjects(filters: {
    costGroupId: string;
    platform: string;
    projectType1: string;
    query: string;
  }): Promise<ReportProjectOptionRow[]>;
  getProject(projectId: string): Promise<Project | null>;
  saveProject(input: SaveProjectInput): Promise<Project>;
  deleteProject(projectId: string): Promise<void>;
  getProjectPages(member: Member): Promise<ProjectPage[]>;
  getAllProjectPages(): Promise<ProjectPage[]>;
  getProjectPagesByProjectId(projectId: string): Promise<ProjectPage[]>;
  getProjectPagesByProjectIds(projectIds: string[]): Promise<ProjectPage[]>;
  saveProjectPage(input: SaveProjectPageInput): Promise<ProjectPage>;
  deleteProjectPage(pageId: string): Promise<void>;
  getTasksByDate(member: Member, taskDate: string): Promise<Task[]>;
  getDashboardTaskCalendar(member: Member, month: string): Promise<DashboardTaskCalendarDay[]>;
  getResourceSummary(member: Member, month: string): Promise<ResourceSummaryDayRow[]>;
  getResourceSummaryMembers(member: Member): Promise<ResourceSummaryMemberRow[]>;
  getResourceTypeSummary(member: Member): Promise<ResourceTypeSummaryRow[]>;
  getResourceTypeSummaryYears(member: Member): Promise<string[]>;
  getResourceTypeSummaryByYear(member: Member, year: string): Promise<ResourceTypeSummaryRow[]>;
  getResourceServiceSummary(member: Member): Promise<ResourceServiceSummaryRow[]>;
  getResourceServiceSummaryYears(member: Member): Promise<string[]>;
  getResourceServiceSummaryByYear(
    member: Member,
    year: string,
  ): Promise<ResourceServiceSummaryRow[]>;
  getResourceMonthReport(member: Member, month: string): Promise<ResourceMonthReport>;
  getTaskActivities(): Promise<TaskActivity[]>;
  saveTask(member: Member, input: SaveTaskInput): Promise<Task>;
  deleteTask(member: Member, taskId: string): Promise<void>;
  exportTasks(member: Member, filters: ReportFilters): Promise<SearchTaskRow[]>;
  searchTasksPage(
    member: Member,
    filters: ReportFilters,
    page: number,
    pageSize: number,
  ): Promise<PagedResult<SearchTaskRow>>;
  getDashboard(member: Member): Promise<DashboardSnapshot>;
  getStats(member: Member): Promise<StatsSnapshot>;
  getMonitoringStatsRows(): Promise<MonitoringStatsRow[]>;
  getQaStatsProjects(): Promise<QaStatsProjectRow[]>;
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

function dedupeProjectListRowsById(projects: ProjectListRow[]) {
  const seen = new Set<string>();

  return projects.filter((project) => {
    if (seen.has(project.id)) {
      return false;
    }

    seen.add(project.id);
    return true;
  });
}

function dedupeReportProjectOptionsById(projects: ReportProjectOptionRow[]) {
  const seen = new Set<string>();

  return projects.filter((project) => {
    if (seen.has(project.id)) {
      return false;
    }

    seen.add(project.id);
    return true;
  });
}

function createSupabaseClient(): DataClient {
  const supabase = requireData(getSupabaseClient(), 'Supabase is not configured.');

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
      const { data, error, count } = await supabase
        .rpc(
          'search_projects_page',
          {
            p_start_date: filters.startDate || null,
            p_end_date: filters.endDate || null,
            p_keyword: query.trim() || null,
          },
          { count: 'exact' },
        )
        .range(from, to);
      if (error) throw error;

      return {
        items: dedupeProjectListRowsById(
          ((data ?? []) as Record<string, unknown>[]).map(mapProjectListRowRecord),
        ),
        totalCount: count ?? 0,
      };
    },
    async searchReportProjects(filters) {
      const { data, error } = await supabase.rpc('search_report_projects', {
        p_cost_group_id: filters.costGroupId || null,
        p_platform: filters.platform || null,
        p_project_type1: filters.projectType1 || null,
        p_keyword: filters.query.trim() || null,
      });
      if (error) throw error;
      return dedupeReportProjectOptionsById(
        ((data ?? []) as Record<string, unknown>[]).map(mapReportProjectOptionRowRecord),
      );
    },
    async getProject(projectId) {
      const { data, error } = await supabase
        .from('projects')
        .select('*, platforms(name)')
        .eq('id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapProjectRecord(data as Record<string, unknown>) : null;
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
    async getProjectPagesByProjectId(projectId) {
      const { data, error } = await supabase
        .from('project_pages_public_view')
        .select('*')
        .eq('project_id', projectId)
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
      const { data, error } = await supabase.rpc('get_tasks_by_date', {
        p_member_id: member.id,
        p_task_date: taskDate,
      });
      if (error) throw error;
      return dedupeTasksById(((data ?? []) as Record<string, unknown>[]).map(mapTaskRecord));
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
    async getResourceSummaryMembers(member) {
      const { data, error } = await supabase.rpc('get_resource_summary_members', {
        p_member_id: member.role === 'admin' ? null : member.id,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapResourceSummaryMemberRowRecord);
    },
    async getResourceTypeSummary(member) {
      const { data, error } = await supabase.rpc('get_resource_type_summary', {
        p_member_id: member.role === 'admin' ? null : member.id,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapResourceTypeSummaryRowRecord);
    },
    async getResourceTypeSummaryYears(member) {
      const { data, error } = await supabase.rpc('get_resource_type_summary_years', {
        p_member_id: member.role === 'admin' ? null : member.id,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map((record) => String(record.year ?? ''));
    },
    async getResourceTypeSummaryByYear(member, year) {
      const { data, error } = await supabase.rpc('get_resource_type_summary_by_year', {
        p_member_id: member.role === 'admin' ? null : member.id,
        p_year: year,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapResourceTypeSummaryRowRecord);
    },
    async getResourceServiceSummaryYears(member) {
      const { data, error } = await supabase.rpc('get_resource_service_summary_years', {
        p_member_id: member.role === 'admin' ? null : member.id,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map((record) => String(record.year ?? ''));
    },
    async getResourceServiceSummary(member) {
      const { data, error } = await supabase.rpc('get_resource_service_summary', {
        p_member_id: member.role === 'admin' ? null : member.id,
      });
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapResourceServiceSummaryRowRecord);
    },
    async getResourceServiceSummaryByYear(member, year) {
      const { data, error } = await supabase.rpc('get_resource_service_summary_by_year', {
        p_member_id: member.role === 'admin' ? null : member.id,
        p_year: year,
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
      return mapResourceMonthReportData(data);
    },
    async getTaskActivities() {
      const { data, error } = await supabase.rpc('get_task_activities');
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
          p_cost_group_id: input.costGroupId,
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
      return dedupeSearchTaskRowsById(
        ((data ?? []) as Record<string, unknown>[]).map(mapSearchTaskRowRecord),
      );
    },
    async searchTasksPage(member, filters, page, pageSize) {
      const from = Math.max(0, (page - 1) * pageSize);
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .rpc(
          'search_tasks_page',
          {
            p_member_id: member.id,
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
          },
          { count: 'exact' },
        )
        .range(from, to);
      if (error) throw error;

      return {
        items: dedupeSearchTaskRowsById(
          ((data ?? []) as Record<string, unknown>[]).map(mapSearchTaskRowRecord),
        ),
        totalCount: count ?? 0,
      };
    },
    async getDashboard() {
      const { data, error } = await supabase.rpc('get_dashboard_snapshot');
      if (error) throw error;

      return {
        inProgressProjects: ((data ?? []) as Record<string, unknown>[]).map(
          mapDashboardProjectItemRecord,
        ),
      };
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
    async getMonitoringStatsRows() {
      const { data, error } = await supabase.rpc('get_monitoring_stats_rows');
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapMonitoringStatsRowRecord);
    },
    async getQaStatsProjects() {
      const { data, error } = await supabase.rpc('get_qa_stats_projects');
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(mapQaStatsProjectRowRecord);
    },
  };
}

function createUnconfiguredClient(): DataClient {
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
    searchReportProjects: fail,
    getProject: fail,
    saveProject: fail,
    deleteProject: fail,
    getProjectPages: fail,
    getAllProjectPages: fail,
    getProjectPagesByProjectId: fail,
    getProjectPagesByProjectIds: fail,
    saveProjectPage: fail,
    deleteProjectPage: fail,
    getTasksByDate: fail,
    getDashboardTaskCalendar: fail,
    getResourceSummary: fail,
    getResourceSummaryMembers: fail,
    getResourceTypeSummary: fail,
    getResourceTypeSummaryYears: fail,
    getResourceTypeSummaryByYear: fail,
    getResourceServiceSummary: fail,
    getResourceServiceSummaryYears: fail,
    getResourceServiceSummaryByYear: fail,
    getResourceMonthReport: fail,
    getTaskActivities: fail,
    saveTask: fail,
    deleteTask: fail,
    exportTasks: fail,
    searchTasksPage: fail,
    getDashboard: fail,
    getStats: fail,
    getMonitoringStatsRows: fail,
    getQaStatsProjects: fail,
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

function mapMonitoringStatsRowRecord(record: Record<string, unknown>): MonitoringStatsRow {
  return {
    pageId: String(record.page_id ?? ''),
    projectId: String(record.project_id ?? ''),
    title: String(record.title ?? ''),
    url: String(record.url ?? ''),
    ownerMemberId: record.owner_member_id ? String(record.owner_member_id) : null,
    monitoringMonth: String(record.monitoring_month ?? ''),
    trackStatus: normalizePageStatus(String(record.track_status ?? '미수정')),
    monitoringInProgress: Boolean(record.monitoring_in_progress ?? false),
    qaInProgress: Boolean(record.qa_in_progress ?? false),
    note: String(record.note ?? ''),
    updatedAt: String(record.updated_at ?? ''),
    serviceGroupName: String(record.service_group_name ?? '-'),
    projectName: String(record.project_name ?? '-'),
    platform: String(record.platform ?? '-'),
    assigneeDisplay: String(record.assignee_display ?? '미지정'),
    reportUrl: String(record.report_url ?? ''),
  };
}

function mapQaStatsProjectRowRecord(record: Record<string, unknown>): QaStatsProjectRow {
  return {
    id: String(record.id ?? ''),
    type1: String(record.type1 ?? ''),
    name: String(record.name ?? ''),
    serviceGroupName: String(record.service_group_name ?? '-'),
    reportUrl: String(record.report_url ?? ''),
    reporterDisplay: String(record.reporter_display ?? '미지정'),
    startDate: String(record.start_date ?? ''),
    endDate: String(record.end_date ?? ''),
    isActive: Boolean(record.is_active ?? true),
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

function mapDashboardProjectItemRecord(record: Record<string, unknown>) {
  return {
    projectId: String(record.project_id ?? ''),
    type1: String(record.type1 ?? '-'),
    projectName: String(record.project_name ?? '-'),
    platform: String(record.platform ?? '-'),
    serviceGroupName: String(record.service_group_name ?? '-'),
    startDate: String(record.start_date ?? getToday()),
    endDate: String(record.end_date ?? getToday()),
  } satisfies DashboardSnapshot['inProgressProjects'][number];
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

function mapResourceSummaryMemberRowRecord(
  record: Record<string, unknown>,
): ResourceSummaryMemberRow {
  return {
    id: String(record.id ?? ''),
    accountId: String(record.account_id ?? ''),
    name: String(record.name ?? ''),
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
    costGroupId: String(record.cost_group_id ?? ''),
    taskType1: String(record.task_type1 ?? ''),
    taskType2: String(record.task_type2 ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
    isServiceTask: Boolean(record.is_service_task ?? false),
    costGroupName: String(record.cost_group_name ?? ''),
    serviceGroupName: String(record.service_group_name ?? ''),
    serviceName: String(record.service_name ?? ''),
  };
}

function mapResourceMonthReportData(data: unknown): ResourceMonthReport {
  if (Array.isArray(data)) {
    return aggregateResourceMonthReport(
      data.map((record) => mapResourceMonthReportRowRecord(record as Record<string, unknown>)),
    );
  }

  if (data && typeof data === 'object') {
    return mapResourceMonthReportRecord(data as Record<string, unknown>);
  }

  return {
    typeRows: [],
    serviceSummaryRows: [],
    serviceDetailRows: [],
    memberTotals: [],
  };
}

function aggregateResourceMonthReport(rows: ResourceMonthReportRow[]): ResourceMonthReport {
  const typeGrouped = new Map<
    string,
    Map<string, { minutes: number; requiresServiceGroup: boolean }>
  >();
  const serviceSummaryGrouped = new Map<string, Map<string, Map<string, number>>>();
  const serviceDetailGrouped = new Map<string, Map<string, Map<string, Map<string, number>>>>();
  const memberTotals = new Map<string, ResourceMonthReportMemberTotal>();

  for (const row of rows) {
    const type1 = row.taskType1 || '미분류';
    const type2 = row.taskType2 || '미분류';
    const minutes = Math.round(row.taskUsedtime);
    const requiresServiceGroup = row.isServiceTask;

    const typeItems =
      typeGrouped.get(type1) ??
      new Map<string, { minutes: number; requiresServiceGroup: boolean }>();
    const currentType = typeItems.get(type2) ?? { minutes: 0, requiresServiceGroup };
    currentType.minutes += minutes;
    currentType.requiresServiceGroup = currentType.requiresServiceGroup || requiresServiceGroup;
    typeItems.set(type2, currentType);
    typeGrouped.set(type1, typeItems);

    const currentMember = memberTotals.get(row.memberId) ?? {
      id: row.memberId,
      accountId: row.accountId,
      totalMinutes: 0,
    };
    currentMember.totalMinutes += minutes;
    memberTotals.set(row.memberId, currentMember);

    if (!requiresServiceGroup) {
      continue;
    }

    const costGroupName = row.costGroupName || '미분류';
    const serviceGroupName = row.serviceGroupName || '미분류';
    const serviceName = row.serviceName || '미분류';

    const summaryServiceGroups =
      serviceSummaryGrouped.get(costGroupName) ?? new Map<string, Map<string, number>>();
    const summaryNames = summaryServiceGroups.get(serviceGroupName) ?? new Map<string, number>();
    summaryNames.set(serviceName, (summaryNames.get(serviceName) ?? 0) + minutes);
    summaryServiceGroups.set(serviceGroupName, summaryNames);
    serviceSummaryGrouped.set(costGroupName, summaryServiceGroups);

    const detailServiceGroups =
      serviceDetailGrouped.get(costGroupName) ??
      new Map<string, Map<string, Map<string, number>>>();
    const detailNames =
      detailServiceGroups.get(serviceGroupName) ?? new Map<string, Map<string, number>>();
    const detailTypes = detailNames.get(serviceName) ?? new Map<string, number>();
    detailTypes.set(type1, (detailTypes.get(type1) ?? 0) + minutes);
    detailNames.set(serviceName, detailTypes);
    detailServiceGroups.set(serviceGroupName, detailNames);
    serviceDetailGrouped.set(costGroupName, detailServiceGroups);
  }

  const typeRows: ResourceMonthReportTypeRow[] = Array.from(typeGrouped.entries())
    .map(([type1, items]) => {
      const mappedItems = Array.from(items.entries())
        .map(([type2, item]) => ({
          type2,
          minutes: item.minutes,
          requiresServiceGroup: item.requiresServiceGroup,
        }))
        .sort(
          (left, right) =>
            Number(right.requiresServiceGroup) - Number(left.requiresServiceGroup) ||
            left.type2.localeCompare(right.type2),
        );

      return {
        type1,
        totalMinutes: mappedItems.reduce((sum, item) => sum + item.minutes, 0),
        requiresServiceGroup: mappedItems.some((item) => item.requiresServiceGroup),
        items: mappedItems,
      };
    })
    .sort(
      (left, right) =>
        Number(right.requiresServiceGroup) - Number(left.requiresServiceGroup) ||
        left.type1.localeCompare(right.type1),
    );

  const serviceSummaryRows: ResourceMonthReportServiceSummaryRow[] = Array.from(
    serviceSummaryGrouped.entries(),
  )
    .flatMap(([costGroup, serviceGroups]) =>
      Array.from(serviceGroups.entries()).map(([group, names]) => ({
        costGroup,
        group,
        totalMinutes: Array.from(names.values()).reduce((sum, value) => sum + value, 0),
        names: Array.from(names.entries())
          .map(([name, minutes]) => ({ name, minutes }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      })),
    )
    .sort(
      (left, right) =>
        left.costGroup.localeCompare(right.costGroup) || left.group.localeCompare(right.group),
    );

  const serviceDetailRows: ResourceMonthReportServiceDetailRow[] = Array.from(
    serviceDetailGrouped.entries(),
  )
    .flatMap(([costGroup, serviceGroups]) =>
      Array.from(serviceGroups.entries()).map(([group, names]) => ({
        costGroup,
        group,
        totalMinutes: Array.from(names.values())
          .flatMap((items) => Array.from(items.values()))
          .reduce((sum, value) => sum + value, 0),
        names: Array.from(names.entries())
          .map(([name, items]) => ({
            name,
            items: Array.from(items.entries())
              .map(([type1, minutes]) => ({ type1, minutes }))
              .sort((left, right) => left.type1.localeCompare(right.type1)),
          }))
          .sort((left, right) => left.name.localeCompare(right.name)),
      })),
    )
    .sort(
      (left, right) =>
        left.costGroup.localeCompare(right.costGroup) || left.group.localeCompare(right.group),
    );

  return {
    typeRows,
    serviceSummaryRows,
    serviceDetailRows,
    memberTotals: Array.from(memberTotals.values()).filter((item) => item.totalMinutes > 0),
  };
}

function mapResourceMonthReportRecord(record: Record<string, unknown>): ResourceMonthReport {
  return {
    typeRows: mapResourceMonthReportTypeRows(record.type_rows),
    serviceSummaryRows: mapResourceMonthReportServiceSummaryRows(record.service_summary_rows),
    serviceDetailRows: mapResourceMonthReportServiceDetailRows(record.service_detail_rows),
    memberTotals: mapResourceMonthReportMemberTotals(record.member_totals),
  };
}

function mapResourceMonthReportTypeRows(value: unknown): ResourceMonthReportTypeRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const record = requireRecord(entry, '월간 타입 집계 형식이 올바르지 않습니다.');
    return {
      type1: String(record.type1 ?? ''),
      totalMinutes: Number(record.totalMinutes ?? record.total_minutes ?? 0),
      requiresServiceGroup: Boolean(
        record.requiresServiceGroup ?? record.requires_service_group ?? false,
      ),
      items: Array.isArray(record.items)
        ? record.items.map((item) => {
            const itemRecord = requireRecord(item, '월간 타입 상세 형식이 올바르지 않습니다.');
            return {
              type2: String(itemRecord.type2 ?? ''),
              minutes: Number(itemRecord.minutes ?? 0),
              requiresServiceGroup: Boolean(
                itemRecord.requiresServiceGroup ?? itemRecord.requires_service_group ?? false,
              ),
            };
          })
        : [],
    };
  });
}

function mapResourceMonthReportServiceSummaryRows(
  value: unknown,
): ResourceMonthReportServiceSummaryRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const record = requireRecord(entry, '월간 서비스 요약 형식이 올바르지 않습니다.');
    return {
      costGroup: String(record.costGroup ?? record.cost_group ?? ''),
      group: String(record.group ?? ''),
      totalMinutes: Number(record.totalMinutes ?? record.total_minutes ?? 0),
      names: Array.isArray(record.names)
        ? record.names.map((name) => {
            const nameRecord = requireRecord(name, '월간 서비스 이름 형식이 올바르지 않습니다.');
            return {
              name: String(nameRecord.name ?? ''),
              minutes: Number(nameRecord.minutes ?? 0),
            };
          })
        : [],
    };
  });
}

function mapResourceMonthReportServiceDetailRows(
  value: unknown,
): ResourceMonthReportServiceDetailRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const record = requireRecord(entry, '월간 서비스 상세 형식이 올바르지 않습니다.');
    return {
      costGroup: String(record.costGroup ?? record.cost_group ?? ''),
      group: String(record.group ?? ''),
      totalMinutes: Number(record.totalMinutes ?? record.total_minutes ?? 0),
      names: Array.isArray(record.names)
        ? record.names.map((name) => {
            const nameRecord = requireRecord(
              name,
              '월간 서비스 상세 이름 형식이 올바르지 않습니다.',
            );
            return {
              name: String(nameRecord.name ?? ''),
              items: Array.isArray(nameRecord.items)
                ? nameRecord.items.map((item) => {
                    const itemRecord = requireRecord(
                      item,
                      '월간 서비스 타입 형식이 올바르지 않습니다.',
                    );
                    return {
                      type1: String(itemRecord.type1 ?? ''),
                      minutes: Number(itemRecord.minutes ?? 0),
                    };
                  })
                : [],
            };
          })
        : [],
    };
  });
}

function mapResourceMonthReportMemberTotals(value: unknown): ResourceMonthReportMemberTotal[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const record = requireRecord(entry, '월간 멤버 합계 형식이 올바르지 않습니다.');
    return {
      id: String(record.id ?? ''),
      accountId: String(record.accountId ?? record.account_id ?? ''),
      totalMinutes: Number(record.totalMinutes ?? record.total_minutes ?? 0),
    };
  });
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

function mapProjectListRowRecord(record: Record<string, unknown>): ProjectListRow {
  return {
    id: String(record.id),
    createdByMemberId: record.created_by_member_id ? String(record.created_by_member_id) : null,
    projectType1: String(record.project_type1 ?? ''),
    name: String(record.name ?? ''),
    platformId: record.platform_id ? String(record.platform_id) : null,
    platform: String(record.platform ?? ''),
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    serviceGroupName: String(record.service_group_name ?? '-'),
    reportUrl: String(record.report_url ?? ''),
    reporterMemberId: record.reporter_member_id ? String(record.reporter_member_id) : null,
    reporterDisplay: String(record.reporter_display ?? '-'),
    reviewerMemberId: record.reviewer_member_id ? String(record.reviewer_member_id) : null,
    reviewerDisplay: String(record.reviewer_display ?? '-'),
    startDate: String(record.start_date ?? getToday()),
    endDate: String(record.end_date ?? getToday()),
    isActive: Boolean(record.is_active ?? true),
    pageCount: Number(record.page_count ?? 0),
  };
}

function mapReportProjectOptionRowRecord(record: Record<string, unknown>): ReportProjectOptionRow {
  return {
    id: String(record.id ?? ''),
    projectType1: String(record.project_type1 ?? ''),
    name: String(record.name ?? ''),
    platform: String(record.platform ?? ''),
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    serviceGroupName: String(record.service_group_name ?? ''),
    serviceName: String(record.service_name ?? ''),
    costGroupId: record.cost_group_id ? String(record.cost_group_id) : null,
    costGroupName: String(record.cost_group_name ?? ''),
    reportUrl: String(record.report_url ?? ''),
  };
}

function mapTaskRecord(record: Record<string, unknown>): Task {
  return {
    id: String(record.id),
    memberId: String(record.member_id ?? ''),
    taskDate: String(record.task_date ?? getToday()),
    costGroupId: String(record.cost_group_id ?? ''),
    costGroupName: String(record.cost_group_name ?? ''),
    projectId: record.project_id ? String(record.project_id) : null,
    pageId: record.project_page_id ? String(record.project_page_id) : null,
    taskType1: String(record.task_type1 ?? ''),
    taskType2: String(record.task_type2 ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
    content: String(record.content ?? ''),
    note: String(record.note ?? ''),
    createdAt: String(record.created_at ?? getToday()),
    updatedAt: String(record.updated_at ?? getToday()),
    platform: String(record.platform ?? '-'),
    serviceGroupName: String(record.service_group_name ?? ''),
    serviceName: String(record.service_name ?? ''),
    projectDisplayName: String(record.project_display_name ?? ''),
    pageDisplayName: String(record.page_display_name ?? ''),
    pageUrl: String(record.page_url ?? ''),
  };
}

function mapSearchTaskRowRecord(record: Record<string, unknown>): SearchTaskRow {
  return {
    id: String(record.id ?? ''),
    taskDate: String(record.task_date ?? getToday()),
    costGroupId: String(record.cost_group_id ?? ''),
    costGroupName: String(record.cost_group_name ?? ''),
    taskType1: String(record.task_type1 ?? ''),
    taskType2: String(record.task_type2 ?? ''),
    taskUsedtime: Number(record.task_usedtime ?? 0),
    content: String(record.content ?? ''),
    note: String(record.note ?? ''),
    updatedAt: String(record.updated_at ?? getToday()),
    platform: String(record.platform ?? '-'),
    serviceGroupName: String(record.service_group_name ?? '-'),
    serviceName: String(record.service_name ?? '-'),
    projectDisplayName: String(record.project_display_name ?? '-'),
    pageDisplayName: String(record.page_display_name ?? '-'),
    pageUrl: String(record.page_url ?? ''),
  };
}

function dedupeSearchTaskRowsById(items: SearchTaskRow[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

export const dataClient: DataClient = getSupabaseClient()
  ? createSupabaseClient()
  : createUnconfiguredClient();
