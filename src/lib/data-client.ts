import { getSupabaseClient } from "./supabase";
import {
  type DashboardSnapshot,
  type Member,
  type OpsStore,
  type Project,
  type ProjectPage,
  type ReportFilters,
  type SaveProjectInput,
  type SaveProjectPageInput,
  type SaveTaskInput,
  type ServiceGroup,
  type StatsSnapshot,
  type Task,
  type TaskType,
} from "./domain";
import { getToday, sortStatus } from "./utils";

export interface OpsDataClient {
  mode: "supabase" | "unconfigured";
  getMembers(): Promise<Member[]>;
  getMemberByLegacyUserId(legacyUserId: string): Promise<Member | null>;
  getMemberByEmail(email: string): Promise<Member | null>;
  getMemberByAuthId(authUserId: string): Promise<Member | null>;
  bindAuthSessionMember(authUserId: string, email?: string | null): Promise<Member | null>;
  getTaskTypes(): Promise<TaskType[]>;
  getServiceGroups(): Promise<ServiceGroup[]>;
  getProjects(): Promise<Project[]>;
  saveProject(input: SaveProjectInput): Promise<Project>;
  getProjectPages(member: Member): Promise<ProjectPage[]>;
  getAllProjectPages(): Promise<ProjectPage[]>;
  saveProjectPage(input: SaveProjectPageInput): Promise<ProjectPage>;
  getTasks(member: Member): Promise<Task[]>;
  getAllTasks(member: Member): Promise<Task[]>;
  saveTask(member: Member, input: SaveTaskInput): Promise<Task>;
  deleteTask(member: Member, taskId: string): Promise<void>;
  searchTasks(member: Member, filters: ReportFilters): Promise<Task[]>;
  getDashboard(member: Member): Promise<DashboardSnapshot>;
  getStats(member: Member): Promise<StatsSnapshot>;
}

function buildDashboard(store: OpsStore): DashboardSnapshot {
  const membersById = new Map(store.members.map((member) => [member.id, member.name]));
  const projectsById = new Map(store.projects.map((project) => [project.id, project]));
  const pages = [...store.projectPages].sort((left, right) => sortStatus(left.trackStatus) - sortStatus(right.trackStatus));

  const toItem = (page: ProjectPage) => {
    const project = projectsById.get(page.projectId);
    return {
      pageId: page.id,
      projectName: project?.name ?? "미분류 프로젝트",
      platform: project?.platform ?? "-",
      pageTitle: page.title,
      ownerName: project?.reporterMemberId
        ? membersById.get(project.reporterMemberId) ?? "미지정"
        : page.ownerMemberId
          ? membersById.get(page.ownerMemberId) ?? "미지정"
          : "미지정",
      statusLabel: page.trackStatus,
      detail: page.note,
      reportUrl: project?.reportUrl ?? "",
      dueDate: page.qaInProgress ? project?.endDate ?? null : null,
    };
  };

  return {
    monitoring: pages.filter((page) => page.monitoringInProgress).map(toItem),
    qa: pages.filter((page) => page.qaInProgress).map(toItem),
  };
}

function buildStats(store: Pick<OpsStore, "projectPages" | "tasks">): StatsSnapshot {
  const totalHours = store.tasks.reduce((sum, task) => sum + task.hours, 0);
  const statusMap = new Map<string, number>();
  const typeMap = new Map<string, number>();

  for (const page of store.projectPages) {
    statusMap.set(page.trackStatus, (statusMap.get(page.trackStatus) ?? 0) + 1);
  }

  for (const task of store.tasks) {
    typeMap.set(task.taskType1, (typeMap.get(task.taskType1) ?? 0) + task.hours);
  }

  return {
    totalHours,
    totalTasks: store.tasks.length,
    monitoringInProgress: store.projectPages.filter((page) => page.monitoringInProgress).length,
    qaInProgress: store.projectPages.filter((page) => page.qaInProgress).length,
    statusBreakdown: Array.from(statusMap.entries()).map(([status, count]) => ({
      status: status as StatsSnapshot["statusBreakdown"][number]["status"],
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
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(message);
  }

  return data as Record<string, unknown>;
}

function buildTaskSearchText(
  task: Task,
  projectsById: Map<string, Project>,
  pagesById: Map<string, ProjectPage>,
) {
  const projectName = task.projectId ? projectsById.get(task.projectId)?.name ?? "" : "";
  const pageName = task.pageId ? pagesById.get(task.pageId)?.title ?? "" : "";

  return [projectName, pageName, task.content, task.note, task.taskType1, task.taskType2]
    .join(" ")
    .trim()
    .toLowerCase();
}

function createSupabaseClient(): OpsDataClient {
  const supabase = requireData(getSupabaseClient(), "Supabase is not configured.");

  return {
    mode: "supabase",
    async getMembers() {
      const { data, error } = await supabase.from("members_public_view").select("*").order("name");
      if (error) throw error;
      return (data ?? []).map(mapMemberRecord);
    },
    async getMemberByLegacyUserId(legacyUserId) {
      const normalized = legacyUserId.trim();
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .ilike("legacy_user_id", normalized)
        .maybeSingle();
      if (error) throw error;
      return data ? mapMemberRecord(data) : null;
    },
    async getMemberByEmail(email) {
      const { data, error } = await supabase.from("members").select("*").eq("email", email).maybeSingle();
      if (error) throw error;
      return data ? mapMemberRecord(data) : null;
    },
    async getMemberByAuthId(authUserId) {
      const { data, error } = await supabase.from("members").select("*").eq("auth_user_id", authUserId).maybeSingle();
      if (error) throw error;
      return data ? mapMemberRecord(data) : null;
    },
    async bindAuthSessionMember(authUserId, email) {
      const { data, error } = await supabase.rpc("bind_auth_session_member", {
        p_auth_user_id: authUserId,
        p_email: email ?? null,
      });
      if (error) throw error;
      return data ? mapMemberRecord(requireRecord(data, "사용자 연결 결과를 확인할 수 없습니다.")) : null;
    },
    async getTaskTypes() {
      const { data, error } = await supabase.from("task_types").select("*").order("display_order");
      if (error) throw error;
      return (data ?? []).map(mapTaskTypeRecord);
    },
    async getServiceGroups() {
      const { data, error } = await supabase.from("service_groups").select("*").order("display_order");
      if (error) throw error;
      return (data ?? []).map(mapServiceGroupRecord);
    },
    async getProjects() {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("is_active", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []).map(mapProjectRecord);
    },
    async saveProject(input) {
      const { data, error } = await supabase
        .rpc("upsert_project", {
          p_project_id: input.id ?? null,
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
      return mapProjectRecord(requireRecord(data, "프로젝트 저장 결과를 확인할 수 없습니다."));
    },
    async getProjectPages(member) {
      const { data, error } = await supabase
        .from("project_pages_public_view")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapProjectPageRecord);
    },
    async getAllProjectPages() {
      const { data, error } = await supabase
        .from("project_pages_public_view")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapProjectPageRecord);
    },
    async saveProjectPage(input) {
      const { data, error } = await supabase
        .rpc("upsert_project_page", {
          p_page_id: input.id ?? null,
          p_project_id: input.projectId,
          p_title: input.title,
          p_url: input.url,
          p_owner_member_id: input.ownerMemberId,
          p_track_status: input.trackStatus,
          p_monitoring_in_progress: input.monitoringInProgress,
          p_qa_in_progress: input.qaInProgress,
          p_note: input.note,
        })
        .single();
      if (error) throw error;
      return mapProjectPageRecord(requireRecord(data, "프로젝트 페이지 저장 결과를 확인할 수 없습니다."));
    },
    async getTasks(member) {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("member_id", member.id)
        .order("task_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapTaskRecord);
    },
    async getAllTasks(member) {
      let query = supabase.from("tasks").select("*").order("task_date", { ascending: false });
      if (member.role !== "admin") {
        query = query.eq("member_id", member.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapTaskRecord);
    },
    async saveTask(member, input) {
      const { data, error } = await supabase
        .rpc("save_task", {
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
      return mapTaskRecord(requireRecord(data, "업무보고 저장 결과를 확인할 수 없습니다."));
    },
    async deleteTask(member, taskId) {
      const { error } = await supabase.rpc("delete_task", {
        p_task_id: taskId,
      });
      if (error) throw error;
    },
    async searchTasks(member, filters) {
      let query = supabase.from("tasks").select("*").eq("member_id", member.id).order("task_date", { ascending: false });
      if (filters.startDate) query = query.gte("task_date", filters.startDate);
      if (filters.endDate) query = query.lte("task_date", filters.endDate);
      if (filters.projectId) query = query.eq("project_id", filters.projectId);
      if (filters.pageId) query = query.eq("project_page_id", filters.pageId);
      if (filters.taskType1) query = query.eq("task_type1", filters.taskType1);
      if (filters.taskType2) query = query.eq("task_type2", filters.taskType2);
      if (filters.minHours) query = query.gte("hours", Number.parseFloat(filters.minHours));
      if (filters.maxHours) query = query.lte("hours", Number.parseFloat(filters.maxHours));
      const { data, error } = await query;
      if (error) throw error;
      const tasks = (data ?? []).map(mapTaskRecord);

      if (!filters.query.trim()) {
        return tasks;
      }

      const [projects, pages] = await Promise.all([this.getProjects(), this.getProjectPages(member)]);
      const projectsById = new Map(projects.map((project) => [project.id, project] as const));
      const pagesById = new Map(pages.map((page) => [page.id, page] as const));
      const normalizedQuery = filters.query.trim().toLowerCase();

      return tasks.filter((task) =>
        buildTaskSearchText(task, projectsById, pagesById).includes(normalizedQuery),
      );
    },
    async getDashboard() {
      const [{ data: pages, error: pagesError }, { data: projects, error: projectError }, { data: members, error: membersError }] =
        await Promise.all([
          supabase.from("project_pages_public_view").select("*"),
          supabase.from("projects").select("*"),
          supabase.from("members_public_view").select("*"),
        ]);

      if (pagesError) throw pagesError;
      if (projectError) throw projectError;
      if (membersError) throw membersError;

      return buildDashboard({
        members: (members ?? []).map(mapMemberRecord),
        taskTypes: [],
        serviceGroups: [],
        projects: (projects ?? []).map(mapProjectRecord),
        projectPages: (pages ?? []).map(mapProjectPageRecord),
        tasks: [],
      });
    },
    async getStats() {
      const [{ data: pages, error: pagesError }, { data: tasks, error: tasksError }] = await Promise.all([
        supabase.from("project_pages_public_view").select("*"),
        supabase.from("tasks").select("*"),
      ]);
      if (pagesError) throw pagesError;
      if (tasksError) throw tasksError;

      return buildStats({
        projectPages: (pages ?? []).map(mapProjectPageRecord),
        tasks: (tasks ?? []).map(mapTaskRecord),
      });
    },
  };
}

function createUnconfiguredClient(): OpsDataClient {
  const fail = async (): Promise<never> => {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  };

  return {
    mode: "unconfigured",
    getMembers: fail,
    getMemberByLegacyUserId: fail,
    getMemberByEmail: fail,
    getMemberByAuthId: fail,
    bindAuthSessionMember: fail,
    getTaskTypes: fail,
    getServiceGroups: fail,
    getProjects: fail,
    saveProject: fail,
    getProjectPages: fail,
    getAllProjectPages: fail,
    saveProjectPage: fail,
    getTasks: fail,
    getAllTasks: fail,
    saveTask: fail,
    deleteTask: fail,
    searchTasks: fail,
    getDashboard: fail,
    getStats: fail,
  };
}

function mapMemberRecord(record: Record<string, unknown>): Member {
  return {
    id: String(record.id),
    legacyUserId: String(record.legacy_user_id ?? ""),
    name: String(record.name ?? ""),
    email: String(record.email ?? ""),
    role: Number(record.user_level ?? 0) === 1 ? "admin" : "user",
    isActive: Boolean(record.user_active ?? record.is_active ?? true),
    authUserId: record.auth_user_id ? String(record.auth_user_id) : null,
  };
}

function mapTaskTypeRecord(record: Record<string, unknown>): TaskType {
  return {
    id: String(record.id),
    legacyTypeId: String(record.legacy_type_id ?? ""),
    type1: String(record.type1 ?? ""),
    type2: String(record.type2 ?? ""),
    label: String(record.display_label ?? `${record.type1 ?? ""} / ${record.type2 ?? ""}`),
    displayOrder: Number(record.display_order ?? 0),
  };
}

function mapServiceGroupRecord(record: Record<string, unknown>): ServiceGroup {
  return {
    id: String(record.id),
    legacyServiceGroupId: String(record.legacy_service_group_id ?? ""),
    name: String(record.name ?? ""),
    displayOrder: Number(record.display_order ?? 0),
  };
}

function mapProjectRecord(record: Record<string, unknown>): Project {
  return {
    id: String(record.id),
    legacyProjectId: String(record.legacy_project_id ?? ""),
    createdByMemberId: record.created_by_member_id ? String(record.created_by_member_id) : null,
    name: String(record.name ?? ""),
    platform: String(record.platform ?? ""),
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    reportUrl: String(record.report_url ?? ""),
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
    legacyPageId: String(record.legacy_page_id ?? ""),
    projectId: String(record.project_id ?? ""),
    title: String(record.title ?? ""),
    url: String(record.url ?? ""),
    ownerMemberId: record.owner_member_id ? String(record.owner_member_id) : null,
    trackStatus: String(record.track_status ?? "미개선") as ProjectPage["trackStatus"],
    monitoringInProgress: Boolean(record.monitoring_in_progress ?? false),
    qaInProgress: Boolean(record.qa_in_progress ?? false),
    note: String(record.note ?? ""),
    updatedAt: String(record.updated_at ?? getToday()),
  };
}

function mapTaskRecord(record: Record<string, unknown>): Task {
  return {
    id: String(record.id),
    legacyTaskId: String(record.legacy_task_id ?? ""),
    memberId: String(record.member_id ?? ""),
    taskDate: String(record.task_date ?? getToday()),
    projectId: record.project_id ? String(record.project_id) : null,
    pageId: record.project_page_id ? String(record.project_page_id) : null,
    taskType1: String(record.task_type1 ?? ""),
    taskType2: String(record.task_type2 ?? ""),
    hours: Number(record.hours ?? 0),
    content: String(record.content ?? ""),
    note: String(record.note ?? ""),
    createdAt: String(record.created_at ?? getToday()),
    updatedAt: String(record.updated_at ?? getToday()),
  };
}

export const opsDataClient: OpsDataClient = getSupabaseClient() ? createSupabaseClient() : createUnconfiguredClient();
