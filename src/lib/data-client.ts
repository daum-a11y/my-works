import { getSupabaseClient } from './supabase';
import {
  type DashboardSnapshot,
  type Member,
  normalizePageStatus,
  type OpsStore,
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
  type TaskType,
} from './domain';
import { getToday } from './utils';

function monthKeyFromMonitoringMonth(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 4) {
    return `20${digits.slice(0, 2)}-${digits.slice(2, 4)}`;
  }
  return '';
}

function hasAgitDate(note: string) {
  return /agit_date:\s*\d{4}-\d{2}-\d{2}/.test(note);
}

function getCurrentMonthKey(reference = new Date()) {
  return `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, '0')}`;
}

function getPreviousMonthKey(reference = new Date()) {
  const previous = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}`;
}

function isDashboardMonitoringPage(page: ProjectPage, reference = new Date()) {
  const monthKey = monthKeyFromMonitoringMonth(page.monitoringMonth);
  if (!monthKey) {
    return false;
  }

  return (
    (monthKey === getCurrentMonthKey(reference) || monthKey === getPreviousMonthKey(reference)) &&
    !hasAgitDate(page.note) &&
    page.trackStatus !== '미수정'
  );
}

function isDashboardQaPage(
  page: ProjectPage,
  project: Project | undefined,
  reference = new Date(),
) {
  if (!project) {
    return false;
  }

  const today = reference.toISOString().slice(0, 10);
  return project.startDate <= today && project.endDate > today;
}

export interface OpsDataClient {
  mode: 'supabase' | 'unconfigured';
  getMembers(): Promise<Member[]>;
  getMemberByAccountId(accountId: string): Promise<Member | null>;
  getMemberByEmail(email: string): Promise<Member | null>;
  getMemberByAuthId(authUserId: string): Promise<Member | null>;
  bindAuthSessionMember(authUserId: string, email?: string | null): Promise<Member | null>;
  touchMemberLastLogin(authUserId: string, email?: string | null): Promise<Member | null>;
  getTaskTypes(): Promise<TaskType[]>;
  getServiceGroups(): Promise<ServiceGroup[]>;
  getProjects(): Promise<Project[]>;
  saveProject(input: SaveProjectInput): Promise<Project>;
  deleteProject(projectId: string): Promise<void>;
  getProjectPages(member: Member): Promise<ProjectPage[]>;
  getAllProjectPages(): Promise<ProjectPage[]>;
  saveProjectPage(input: SaveProjectPageInput): Promise<ProjectPage>;
  deleteProjectPage(pageId: string): Promise<void>;
  getTasks(member: Member): Promise<Task[]>;
  getAllTasks(member: Member): Promise<Task[]>;
  getTaskActivities(): Promise<TaskActivity[]>;
  saveTask(member: Member, input: SaveTaskInput): Promise<Task>;
  deleteTask(member: Member, taskId: string): Promise<void>;
  searchTasks(member: Member, filters: ReportFilters): Promise<Task[]>;
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
        projectName: project.name || '미분류 프로젝트',
        startDate: project.startDate,
        endDate: project.endDate,
      })),
  };
}

function buildStats(store: Pick<OpsStore, 'projectPages' | 'projects' | 'tasks'>): StatsSnapshot {
  const totalHours = store.tasks.reduce((sum, task) => sum + task.hours, 0);
  const statusMap = new Map<string, number>();
  const typeMap = new Map<string, number>();
  const projectsById = new Map(store.projects.map((project) => [project.id, project] as const));

  for (const page of store.projectPages) {
    statusMap.set(page.trackStatus, (statusMap.get(page.trackStatus) ?? 0) + 1);
  }

  for (const task of store.tasks) {
    typeMap.set(task.taskType1, (typeMap.get(task.taskType1) ?? 0) + task.hours);
  }

  return {
    totalHours,
    totalTasks: store.tasks.length,
    monitoringInProgress: store.projectPages.filter((page) => isDashboardMonitoringPage(page))
      .length,
    qaInProgress: store.projectPages.filter((page) =>
      isDashboardQaPage(page, projectsById.get(page.projectId)),
    ).length,
    statusBreakdown: Array.from(statusMap.entries()).map(([status, count]) => ({
      status: status as StatsSnapshot['statusBreakdown'][number]['status'],
      count,
    })),
    typeBreakdown: Array.from(typeMap.entries()).map(([type, hours]) => ({ type, hours })),
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

function buildTaskSearchText(
  task: Task,
  projectsById: Map<string, Project>,
  pagesById: Map<string, ProjectPage>,
) {
  const projectName = task.projectId ? (projectsById.get(task.projectId)?.name ?? '') : '';
  const pageName = task.pageId ? (pagesById.get(task.pageId)?.title ?? '') : '';

  return [projectName, pageName, task.content, task.note, task.taskType1, task.taskType2]
    .join(' ')
    .trim()
    .toLowerCase();
}

function createSupabaseClient(): OpsDataClient {
  const supabase = requireData(getSupabaseClient(), 'Supabase is not configured.');
  const taskSelectColumns =
    'id, legacy_task_id, member_id, task_date, project_id, project_page_id, task_type1, task_type2, hours, content, note, created_at, updated_at';

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
      let member = await this.getMemberByAuthId(authUserId);

      if (!member && email) {
        member = await this.bindAuthSessionMember(authUserId, email);
      }

      if (!member) {
        return null;
      }

      const { data, error } = await supabase
        .from('members')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', member.id)
        .select('*')
        .single();

      if (error) throw error;
      return mapMemberRecord(data as Record<string, unknown>);
    },
    async getTaskTypes() {
      const { data, error } = await supabase.from('task_types').select('*').order('display_order');
      if (error) throw error;
      return (data ?? []).map(mapTaskTypeRecord);
    },
    async getServiceGroups() {
      const { data, error } = await supabase
        .from('service_groups')
        .select('*')
        .order('display_order');
      if (error) throw error;
      return (data ?? []).map(mapServiceGroupRecord);
    },
    async getProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('is_active', { ascending: false })
        .order('name');
      if (error) throw error;
      return (data ?? []).map(mapProjectRecord);
    },
    async saveProject(input) {
      const { data, error } = await supabase
        .rpc('upsert_project', {
          p_project_id: input.id ?? null,
          p_project_type1: input.projectType1,
          p_name: input.name,
          p_platform: input.platform,
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
    async getTasks(member) {
      const { data, error } = await supabase
        .from('tasks')
        .select(taskSelectColumns)
        .eq('member_id', member.id)
        .order('task_date', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapTaskRecord);
    },
    async getAllTasks(member) {
      let query = supabase
        .from('tasks')
        .select(taskSelectColumns)
        .order('task_date', { ascending: false });
      if (member.role !== 'admin') {
        query = query.eq('member_id', member.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapTaskRecord);
    },
    async getTaskActivities() {
      const { data, error } = await supabase.from('tasks').select('member_id, task_date, hours');
      if (error) throw error;
      return (data ?? []).map(mapTaskActivityRecord);
    },
    async saveTask(input) {
      const { data, error } = await supabase
        .rpc('save_task', {
          p_task_id: input.id ?? null,
          p_task_date: input.taskDate,
          p_project_id: input.projectId || null,
          p_project_page_id: input.pageId || null,
          p_task_type1: input.taskType1,
          p_task_type2: input.taskType2,
          p_hours: input.hours,
          p_content: input.content,
          p_note: input.note,
        })
        .single();
      if (error) throw error;
      return mapTaskRecord(requireRecord(data, '업무보고 저장 결과를 확인할 수 없습니다.'));
    },
    async deleteTask(taskId) {
      const { error } = await supabase.rpc('delete_task', {
        p_task_id: taskId,
      });
      if (error) throw error;
    },
    async searchTasks(member, filters) {
      let query = supabase
        .from('tasks')
        .select(taskSelectColumns)
        .eq('member_id', member.id)
        .order('task_date', { ascending: false });
      if (filters.startDate) query = query.gte('task_date', filters.startDate);
      if (filters.endDate) query = query.lte('task_date', filters.endDate);
      if (filters.projectId) query = query.eq('project_id', filters.projectId);
      if (filters.pageId) query = query.eq('project_page_id', filters.pageId);
      if (filters.taskType1) query = query.eq('task_type1', filters.taskType1);
      if (filters.taskType2) query = query.eq('task_type2', filters.taskType2);
      if (filters.minHours) query = query.gte('hours', Number.parseFloat(filters.minHours));
      if (filters.maxHours) query = query.lte('hours', Number.parseFloat(filters.maxHours));
      const { data, error } = await query;
      if (error) throw error;
      const tasks = (data ?? []).map(mapTaskRecord);

      if (!filters.query.trim()) {
        return tasks;
      }

      const [projects, pages] = await Promise.all([
        this.getProjects(),
        this.getProjectPages(member),
      ]);
      const projectsById = new Map(projects.map((project) => [project.id, project] as const));
      const pagesById = new Map(pages.map((page) => [page.id, page] as const));
      const normalizedQuery = filters.query.trim().toLowerCase();

      return tasks.filter((task) =>
        buildTaskSearchText(task, projectsById, pagesById).includes(normalizedQuery),
      );
    },
    async getDashboard() {
      const [
        { data: projects, error: projectError },
        { data: members, error: membersError },
        { data: serviceGroups, error: serviceGroupsError },
      ] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('members_public_view').select('*'),
        supabase.from('service_groups').select('*'),
      ]);

      if (projectError) throw projectError;
      if (membersError) throw membersError;
      if (serviceGroupsError) throw serviceGroupsError;

      return buildDashboard({
        members: (members ?? []).map(mapMemberRecord),
        taskTypes: [],
        serviceGroups: (serviceGroups ?? []).map(mapServiceGroupRecord),
        projects: (projects ?? []).map(mapProjectRecord),
        projectPages: [],
        tasks: [],
      });
    },
    async getStats() {
      const [
        { data: pages, error: pagesError },
        { data: tasks, error: tasksError },
        { data: projects, error: projectsError },
      ] = await Promise.all([
        supabase.from('project_pages_public_view').select('*'),
        supabase.from('tasks').select(taskSelectColumns),
        supabase.from('projects').select('*'),
      ]);
      if (pagesError) throw pagesError;
      if (tasksError) throw tasksError;
      if (projectsError) throw projectsError;

      return buildStats({
        projects: (projects ?? []).map(mapProjectRecord),
        projectPages: (pages ?? []).map(mapProjectPageRecord),
        tasks: (tasks ?? []).map(mapTaskRecord),
      });
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
    getServiceGroups: fail,
    getProjects: fail,
    saveProject: fail,
    deleteProject: fail,
    getProjectPages: fail,
    getAllProjectPages: fail,
    saveProjectPage: fail,
    deleteProjectPage: fail,
    getTasks: fail,
    getAllTasks: fail,
    getTaskActivities: fail,
    saveTask: fail,
    deleteTask: fail,
    searchTasks: fail,
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
    isActive: Boolean(record.user_active ?? record.is_active ?? true),
    reportRequired,
    joinedAt: String(record.joined_at ?? record.created_at ?? getToday()),
    authUserId: record.auth_user_id ? String(record.auth_user_id) : null,
  };
}

function mapTaskActivityRecord(record: Record<string, unknown>): TaskActivity {
  return {
    memberId: String(record.member_id ?? ''),
    taskDate: String(record.task_date ?? getToday()),
    hours: Number(record.hours ?? 0),
  };
}

function mapTaskTypeRecord(record: Record<string, unknown>): TaskType {
  return {
    id: String(record.id),
    legacyTypeId: String(record.legacy_type_id ?? ''),
    type1: String(record.type1 ?? ''),
    type2: String(record.type2 ?? ''),
    label: String(record.display_label ?? `${record.type1 ?? ''} / ${record.type2 ?? ''}`),
    displayOrder: Number(record.display_order ?? 0),
    requiresServiceGroup: Boolean(record.requires_service_group ?? false),
  };
}

function mapServiceGroupRecord(record: Record<string, unknown>): ServiceGroup {
  return {
    id: String(record.id),
    legacyServiceGroupId: String(record.legacy_service_group_id ?? ''),
    name: String(record.name ?? ''),
    displayOrder: Number(record.display_order ?? 0),
  };
}

function mapProjectRecord(record: Record<string, unknown>): Project {
  return {
    id: String(record.id),
    legacyProjectId: String(record.legacy_project_id ?? ''),
    createdByMemberId: record.created_by_member_id ? String(record.created_by_member_id) : null,
    projectType1: String(record.project_type1 ?? ''),
    name: String(record.name ?? ''),
    platform: String(record.platform ?? ''),
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
    legacyPageId: String(record.legacy_page_id ?? ''),
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
    legacyTaskId: String(record.legacy_task_id ?? ''),
    memberId: String(record.member_id ?? ''),
    taskDate: String(record.task_date ?? getToday()),
    projectId: record.project_id ? String(record.project_id) : null,
    pageId: record.project_page_id ? String(record.project_page_id) : null,
    taskType1: String(record.task_type1 ?? ''),
    taskType2: String(record.task_type2 ?? ''),
    hours: Number(record.hours ?? 0),
    content: String(record.content ?? ''),
    note: String(record.note ?? ''),
    createdAt: String(record.created_at ?? getToday()),
    updatedAt: String(record.updated_at ?? getToday()),
  };
}

export const opsDataClient: OpsDataClient = getSupabaseClient()
  ? createSupabaseClient()
  : createUnconfiguredClient();
