import { getSupabaseClient } from './supabase';
import type { ApiRecord, RawPagedResult } from './api.types';
import type {
  Member,
  ReportFilters,
  SaveProjectInput,
  SaveProjectPageInput,
  SaveTaskInput,
} from '../types/domain';

export interface DataClient {
  mode: 'supabase' | 'unconfigured';
  getMembers(): Promise<ApiRecord[]>;
  getMemberByAccountId(accountId: string): Promise<ApiRecord | null>;
  getMemberByEmail(email: string): Promise<ApiRecord | null>;
  getMemberByAuthId(authUserId: string): Promise<ApiRecord | null>;
  bindAuthSessionMember(authUserId: string, email?: string | null): Promise<ApiRecord | null>;
  touchMemberLastLogin(authUserId: string, email?: string | null): Promise<ApiRecord | null>;
  getTaskTypes(): Promise<ApiRecord[]>;
  getPlatforms(): Promise<ApiRecord[]>;
  getCostGroups(): Promise<ApiRecord[]>;
  getServiceGroups(): Promise<ApiRecord[]>;
  getProjects(): Promise<ApiRecord[]>;
  searchProjectsPage(
    filters: { startDate: string; endDate: string },
    query: string,
    page: number,
    pageSize: number,
  ): Promise<RawPagedResult>;
  searchReportProjects(filters: {
    costGroupId: string;
    platform: string;
    projectType1: string;
    query: string;
  }): Promise<ApiRecord[]>;
  getProject(projectId: string): Promise<ApiRecord | null>;
  saveProject(input: SaveProjectInput): Promise<ApiRecord>;
  deleteProject(projectId: string): Promise<void>;
  getProjectPages(member: Member): Promise<ApiRecord[]>;
  getAllProjectPages(): Promise<ApiRecord[]>;
  getProjectPagesByProjectId(projectId: string): Promise<ApiRecord[]>;
  getProjectPagesByProjectIds(projectIds: string[]): Promise<ApiRecord[]>;
  saveProjectPage(input: SaveProjectPageInput): Promise<ApiRecord>;
  deleteProjectPage(pageId: string): Promise<void>;
  getTasksByDate(member: Member, taskDate: string): Promise<ApiRecord[]>;
  getDashboardTaskCalendar(member: Member, month: string): Promise<ApiRecord[]>;
  getResourceSummary(member: Member, month: string): Promise<ApiRecord[]>;
  getResourceSummaryMembers(member: Member): Promise<ApiRecord[]>;
  getResourceTypeSummary(member: Member): Promise<ApiRecord[]>;
  getResourceTypeSummaryYears(member: Member): Promise<string[]>;
  getResourceTypeSummaryByYear(member: Member, year: string): Promise<ApiRecord[]>;
  getResourceServiceSummary(member: Member): Promise<ApiRecord[]>;
  getResourceServiceSummaryYears(member: Member): Promise<string[]>;
  getResourceServiceSummaryByYear(member: Member, year: string): Promise<ApiRecord[]>;
  getResourceMonthReport(member: Member, month: string): Promise<unknown>;
  getTaskActivities(): Promise<ApiRecord[]>;
  saveTask(member: Member, input: SaveTaskInput): Promise<ApiRecord>;
  deleteTask(member: Member, taskId: string): Promise<void>;
  exportTasks(member: Member, filters: ReportFilters): Promise<ApiRecord[]>;
  searchTasksPage(
    member: Member,
    filters: ReportFilters,
    page: number,
    pageSize: number,
  ): Promise<RawPagedResult>;
  getDashboard(member: Member): Promise<unknown>;
  getStats(member: Member): Promise<unknown>;
  getMonitoringStatsRows(): Promise<ApiRecord[]>;
  getQaStatsProjects(): Promise<ApiRecord[]>;
}

function requireData<T>(data: T | null, message: string): T {
  if (data == null) {
    throw new Error(message);
  }

  return data;
}

function requireRecord(data: unknown, message: string): ApiRecord {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(message);
  }

  return data as ApiRecord;
}

function createSupabaseClient(): DataClient {
  const supabase = requireData(getSupabaseClient(), 'Supabase is not configured.');

  return {
    mode: 'supabase',
    async getMembers() {
      const { data, error } = await supabase.from('members_public_view').select('*').order('name');
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async getMemberByAccountId(accountId) {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .ilike('account_id', accountId.trim())
        .maybeSingle();
      if (error) throw error;
      return (data as ApiRecord | null) ?? null;
    },
    async getMemberByEmail(email) {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (error) throw error;
      return (data as ApiRecord | null) ?? null;
    },
    async getMemberByAuthId(authUserId) {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', authUserId)
        .maybeSingle();
      if (error) throw error;
      return (data as ApiRecord | null) ?? null;
    },
    async bindAuthSessionMember(authUserId, email) {
      const { data, error } = await supabase.rpc('bind_auth_session_member', {
        p_auth_user_id: authUserId,
        p_email: email ?? null,
      });
      if (error) throw error;
      return data ? requireRecord(data, '사용자 연결 결과를 확인할 수 없습니다.') : null;
    },
    async touchMemberLastLogin(authUserId, email) {
      const { data, error } = await supabase.rpc('touch_member_last_login', {
        p_auth_user_id: authUserId,
        p_email: email ?? null,
      });
      if (error) throw error;
      return data ? requireRecord(data, '사용자 로그인 상태를 확인할 수 없습니다.') : null;
    },
    async getTaskTypes() {
      const { data, error } = await supabase.from('task_types').select('*').order('display_order');
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async getPlatforms() {
      const { data, error } = await supabase.from('platforms').select('*').order('display_order');
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async getCostGroups() {
      const { data, error } = await supabase.from('cost_groups').select('*').order('display_order');
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async getServiceGroups() {
      const { data, error } = await supabase
        .from('service_groups')
        .select('id, name, cost_group_id, display_order, is_active, cost_groups(name)')
        .order('display_order');
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async getProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select('*, platforms(name)')
        .order('is_active', { ascending: false })
        .order('name');
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
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
      return { items: (data ?? []) as ApiRecord[], totalCount: count ?? 0 };
    },
    async searchReportProjects(filters) {
      const { data, error } = await supabase.rpc('search_report_projects', {
        p_cost_group_id: filters.costGroupId || null,
        p_platform: filters.platform || null,
        p_project_type1: filters.projectType1 || null,
        p_keyword: filters.query.trim() || null,
      });
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async getProject(projectId) {
      const { data, error } = await supabase
        .from('projects')
        .select('*, platforms(name)')
        .eq('id', projectId)
        .maybeSingle();
      if (error) throw error;
      return (data as ApiRecord | null) ?? null;
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
      return requireRecord(data, '프로젝트 저장 결과를 확인할 수 없습니다.');
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
      return (data ?? []) as ApiRecord[];
    },
    async getAllProjectPages() {
      const { data, error } = await supabase
        .from('project_pages_public_view')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async getProjectPagesByProjectId(projectId) {
      const { data, error } = await supabase
        .from('project_pages_public_view')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
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
      return (data ?? []) as ApiRecord[];
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
      return requireRecord(data, '프로젝트 페이지 저장 결과를 확인할 수 없습니다.');
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
      return (data ?? []) as ApiRecord[];
    },
    async getDashboardTaskCalendar(member, month) {
      const { data, error } = await supabase.rpc('get_dashboard_task_calendar', {
        p_member_id: member.role === 'admin' ? member.id : null,
        p_month: month,
      });
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async getResourceSummary(member, month) {
      const { data, error } = await supabase.rpc('get_resource_summary', {
        p_member_id: member.role === 'admin' ? null : member.id,
        p_month: month,
      });
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async getResourceSummaryMembers(member) {
      const { data, error } = await supabase.rpc('get_resource_summary_members', {
        p_member_id: member.role === 'admin' ? null : member.id,
      });
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async getResourceTypeSummary(member) {
      const { data, error } = await supabase.rpc('get_resource_type_summary', {
        p_member_id: member.role === 'admin' ? null : member.id,
      });
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async getResourceTypeSummaryYears(member) {
      const { data, error } = await supabase.rpc('get_resource_type_summary_years', {
        p_member_id: member.role === 'admin' ? null : member.id,
      });
      if (error) throw error;
      return ((data ?? []) as ApiRecord[]).map((record) => String(record.year ?? ''));
    },
    async getResourceTypeSummaryByYear(member, year) {
      const { data, error } = await supabase.rpc('get_resource_type_summary_by_year', {
        p_member_id: member.role === 'admin' ? null : member.id,
        p_year: year,
      });
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async getResourceServiceSummaryYears(member) {
      const { data, error } = await supabase.rpc('get_resource_service_summary_years', {
        p_member_id: member.role === 'admin' ? null : member.id,
      });
      if (error) throw error;
      return ((data ?? []) as ApiRecord[]).map((record) => String(record.year ?? ''));
    },
    async getResourceServiceSummary(member) {
      const { data, error } = await supabase.rpc('get_resource_service_summary', {
        p_member_id: member.role === 'admin' ? null : member.id,
      });
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async getResourceServiceSummaryByYear(member, year) {
      const { data, error } = await supabase.rpc('get_resource_service_summary_by_year', {
        p_member_id: member.role === 'admin' ? null : member.id,
        p_year: year,
      });
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async getResourceMonthReport(member, month) {
      const { data, error } = await supabase.rpc('get_resource_month_report', {
        p_member_id: member.role === 'admin' ? null : member.id,
        p_month: month,
      });
      if (error) throw error;
      return data;
    },
    async getTaskActivities() {
      const { data, error } = await supabase.rpc('get_task_activities');
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
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
      return requireRecord(data, '업무보고 저장 결과를 확인할 수 없습니다.');
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
      return (data ?? []) as ApiRecord[];
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
      return { items: (data ?? []) as ApiRecord[], totalCount: count ?? 0 };
    },
    async getDashboard() {
      const { data, error } = await supabase.rpc('get_dashboard_snapshot');
      if (error) throw error;
      return data;
    },
    async getStats() {
      const { data, error } = await supabase.rpc('get_stats');
      if (error) throw error;
      return data;
    },
    async getMonitoringStatsRows() {
      const { data, error } = await supabase.rpc('get_monitoring_stats_rows');
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
    },
    async getQaStatsProjects() {
      const { data, error } = await supabase.rpc('get_qa_stats_projects');
      if (error) throw error;
      return (data ?? []) as ApiRecord[];
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

export const dataClient: DataClient = getSupabaseClient()
  ? createSupabaseClient()
  : createUnconfiguredClient();
