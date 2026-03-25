import { getSupabaseClient } from "../../lib/supabase";
import type {
  AdminPageOption,
  AdminProjectOption,
  AdminServiceGroupItem,
  AdminServiceGroupPayload,
  AdminTaskSaveInput,
  AdminTaskSearchFilters,
  AdminTaskSearchItem,
  AdminTaskTypeItem,
  AdminTaskTypePayload,
  MemberAdminItem,
  MemberAdminPayload,
} from "./admin-types";

interface AdminDataClient {
  listTaskTypes(): Promise<AdminTaskTypeItem[]>;
  listServiceGroups(): Promise<AdminServiceGroupItem[]>;
  listProjects(): Promise<AdminProjectOption[]>;
  listProjectPages(): Promise<AdminPageOption[]>;
  searchTasksAdmin(filters: AdminTaskSearchFilters): Promise<AdminTaskSearchItem[]>;
  saveTaskAdmin(input: AdminTaskSaveInput): Promise<AdminTaskSearchItem>;
  deleteTaskAdmin(taskId: string): Promise<void>;
  listMembersAdmin(): Promise<MemberAdminItem[]>;
  saveMemberAdmin(payload: MemberAdminPayload): Promise<MemberAdminItem>;
  deleteMemberAdmin(memberId: string): Promise<void>;
  resetMemberPasswordAdmin(email: string): Promise<void>;
  saveTaskTypeAdmin(payload: AdminTaskTypePayload): Promise<AdminTaskTypeItem>;
  deleteTaskTypeAdmin(taskTypeId: string): Promise<void>;
  replaceTaskTypeUsage(oldType1: string, oldType2: string, nextType1: string, nextType2: string): Promise<void>;
  saveServiceGroupAdmin(payload: AdminServiceGroupPayload): Promise<AdminServiceGroupItem>;
  deleteServiceGroupAdmin(serviceGroupId: string): Promise<void>;
  replaceServiceGroupUsage(oldServiceGroupId: string | null, nextServiceGroupId: string): Promise<void>;
}

function toNullableString(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

const TASK_SELECT_COLUMNS =
  "id, member_id, task_date, project_id, project_page_id, task_type1, task_type2, hours, content, note, updated_at";

function mapProject(record: Record<string, unknown>): AdminProjectOption {
  return {
    id: String(record.id ?? ""),
    name: String(record.name ?? ""),
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    isActive: Boolean(record.is_active ?? true),
  };
}

function mapPage(record: Record<string, unknown>): AdminPageOption {
  return {
    id: String(record.id ?? ""),
    projectId: String(record.project_id ?? ""),
    title: String(record.title ?? ""),
    trackStatus: String(record.track_status ?? "미개선"),
    monitoringInProgress: Boolean(record.monitoring_in_progress ?? false),
    qaInProgress: Boolean(record.qa_in_progress ?? false),
  };
}

function mapTask(record: Record<string, unknown>): AdminTaskSearchItem {
  return {
    id: String(record.id ?? ""),
    memberId: String(record.member_id ?? ""),
    memberName: String(record.member_name ?? ""),
    memberEmail: String(record.member_email ?? ""),
    taskDate: String(record.task_date ?? ""),
    projectId: record.project_id ? String(record.project_id) : null,
    projectName: String(record.project_name ?? ""),
    pageId: record.project_page_id ? String(record.project_page_id) : null,
    pageTitle: String(record.page_title ?? ""),
    serviceGroupId: record.service_group_id ? String(record.service_group_id) : null,
    serviceGroupName: String(record.service_group_name ?? ""),
    taskType1: String(record.task_type1 ?? ""),
    taskType2: String(record.task_type2 ?? ""),
    hours: Number(record.hours ?? 0),
    content: String(record.content ?? ""),
    note: String(record.note ?? ""),
    updatedAt: String(record.updated_at ?? ""),
  };
}

function mapTaskType(record: Record<string, unknown>): AdminTaskTypeItem {
  return {
    id: String(record.id ?? ""),
    type1: String(record.type1 ?? ""),
    type2: String(record.type2 ?? ""),
    displayLabel: String(record.display_label ?? `${record.type1 ?? ""} / ${record.type2 ?? ""}`),
    displayOrder: Number(record.display_order ?? 0),
    requiresServiceGroup: Boolean(record.requires_service_group ?? false),
    isActive: Boolean(record.is_active ?? true),
  };
}

function mapServiceGroup(record: Record<string, unknown>): AdminServiceGroupItem {
  return {
    id: String(record.id ?? ""),
    name: String(record.name ?? ""),
    displayOrder: Number(record.display_order ?? 0),
    isActive: Boolean(record.is_active ?? true),
  };
}

function mapMember(record: Record<string, unknown>): MemberAdminItem {
  const active = Boolean(record.user_active ?? record.is_active ?? true);

  return {
    id: String(record.id ?? ""),
    authUserId: record.auth_user_id ? String(record.auth_user_id) : null,
    legacyUserId: String(record.legacy_user_id ?? ""),
    name: String(record.name ?? ""),
    email: String(record.email ?? ""),
    role: Number(record.user_level ?? 0) === 1 ? "admin" : "user",
    userActive: active,
    isActive: active,
    authEmail: String(record.auth_email ?? record.email ?? ""),
    queueReasons: [],
    updatedAt: String(record.updated_at ?? ""),
  };
}

async function loadAdminReferenceMaps(supabase: NonNullable<ReturnType<typeof getSupabaseClient>>) {
  const [membersResult, projectsResult, pagesResult, serviceGroupsResult] = await Promise.all([
    supabase.from("members").select("id, name, email"),
    supabase.from("projects").select("id, name, service_group_id"),
    supabase.from("project_pages").select("id, project_id, title"),
    supabase.from("service_groups").select("id, name"),
  ]);

  if (membersResult.error) throw membersResult.error;
  if (projectsResult.error) throw projectsResult.error;
  if (pagesResult.error) throw pagesResult.error;
  if (serviceGroupsResult.error) throw serviceGroupsResult.error;

  return {
    members: new Map((membersResult.data ?? []).map((record) => [String(record.id), record as Record<string, unknown>])),
    projects: new Map((projectsResult.data ?? []).map((record) => [String(record.id), record as Record<string, unknown>])),
    pages: new Map((pagesResult.data ?? []).map((record) => [String(record.id), record as Record<string, unknown>])),
    serviceGroups: new Map(
      (serviceGroupsResult.data ?? []).map((record) => [String(record.id), record as Record<string, unknown>]),
    ),
  };
}

function enrichTaskRecords(
  records: Record<string, unknown>[],
  maps: Awaited<ReturnType<typeof loadAdminReferenceMaps>>,
) {
  return records.map((record) => {
    const memberId = String(record.member_id ?? "");
    const projectId = record.project_id ? String(record.project_id) : null;
    const pageId = record.project_page_id ? String(record.project_page_id) : null;
    const member = maps.members.get(memberId);
    const project = projectId ? maps.projects.get(projectId) : undefined;
    const page = pageId ? maps.pages.get(pageId) : undefined;
    const serviceGroupId = project?.service_group_id ? String(project.service_group_id) : null;
    const serviceGroup = serviceGroupId ? maps.serviceGroups.get(serviceGroupId) : undefined;

    return mapTask({
      ...record,
      member_name: member?.name ?? "",
      member_email: member?.email ?? "",
      project_name: project?.name ?? "",
      page_title: page?.title ?? "",
      service_group_id: serviceGroupId,
      service_group_name: serviceGroup?.name ?? "",
    });
  });
}

function filterAdminTasks(items: AdminTaskSearchItem[], filters: AdminTaskSearchFilters) {
  const serviceGroupId = toNullableString(filters.serviceGroupId);
  const keyword = toNullableString(filters.keyword)?.toLowerCase() ?? "";

  return items.filter((item) => {
    if (serviceGroupId && item.serviceGroupId !== serviceGroupId) {
      return false;
    }

    if (keyword) {
      const haystack = [
        item.memberName,
        item.memberEmail,
        item.projectName,
        item.pageTitle,
        item.taskType1,
        item.taskType2,
        item.content,
        item.note,
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(keyword)) {
        return false;
      }
    }

    return true;
  });
}

async function fetchAdminTasks(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  filters: AdminTaskSearchFilters,
) {
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT_COLUMNS)
    .order("task_date", { ascending: false })
    .order("updated_at", { ascending: false });

  const memberId = toNullableString(filters.memberId);
  const startDate = toNullableString(filters.startDate);
  const endDate = toNullableString(filters.endDate);
  const projectId = toNullableString(filters.projectId);
  const pageId = toNullableString(filters.pageId);
  const taskType1 = toNullableString(filters.taskType1);
  const taskType2 = toNullableString(filters.taskType2);

  if (memberId) query = query.eq("member_id", memberId);
  if (startDate) query = query.gte("task_date", startDate);
  if (endDate) query = query.lte("task_date", endDate);
  if (projectId) query = query.eq("project_id", projectId);
  if (pageId) query = query.eq("project_page_id", pageId);
  if (taskType1) query = query.eq("task_type1", taskType1);
  if (taskType2) query = query.eq("task_type2", taskType2);

  const { data, error } = await query;
  if (error) throw error;

  const maps = await loadAdminReferenceMaps(supabase);
  return filterAdminTasks(
    enrichTaskRecords((data ?? []) as Record<string, unknown>[], maps),
    filters,
  );
}

async function fetchAdminTaskById(supabase: NonNullable<ReturnType<typeof getSupabaseClient>>, taskId: string) {
  const { data, error } = await supabase.from("tasks").select(TASK_SELECT_COLUMNS).eq("id", taskId).single();
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

  const { data, error } = await supabase.from("project_pages").select("project_id").eq("id", normalizedPageId).single();
  if (error) throw error;
  return data?.project_id ? String(data.project_id) : null;
}

function createUnconfiguredAdminClient(): AdminDataClient {
  const configurationError = new Error("Supabase 환경 변수가 설정되지 않았습니다.");

  return {
    async listTaskTypes() {
      return [] as AdminTaskTypeItem[];
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
      return [] as AdminTaskSearchItem[];
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
    async deleteMemberAdmin() {
      throw configurationError;
    },
    async resetMemberPasswordAdmin() {
      throw configurationError;
    },
    async saveTaskTypeAdmin() {
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
        .from("task_types")
        .select("id, type1, type2, display_label, display_order, is_active, requires_service_group")
        .order("display_order");
      if (error) throw error;
      return (data ?? []).map((record) => mapTaskType(record as Record<string, unknown>));
    },

    async listServiceGroups() {
      const { data, error } = await supabase
        .from("service_groups")
        .select("id, name, display_order, is_active")
        .order("display_order");
      if (error) throw error;
      return (data ?? []).map((record) => mapServiceGroup(record as Record<string, unknown>));
    },

    async listProjects() {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, service_group_id, is_active")
        .order("name");
      if (error) throw error;
      return (data ?? []).map((record) => mapProject(record as Record<string, unknown>));
    },

    async listProjectPages() {
      const { data, error } = await supabase
        .from("project_pages")
        .select("id, project_id, title, track_status, monitoring_in_progress, qa_in_progress")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((record) => mapPage(record as Record<string, unknown>));
    },

    async searchTasksAdmin(filters: AdminTaskSearchFilters) {
      return fetchAdminTasks(supabase, filters);
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
          .from("tasks")
          .update(record)
          .eq("id", input.id)
          .select("id")
          .single();
        if (error) throw error;
        return fetchAdminTaskById(supabase, String(data.id));
      }

      const { data, error } = await supabase.from("tasks").insert(record).select("id").single();
      if (error) throw error;
      return fetchAdminTaskById(supabase, String(data.id));
    },

    async deleteTaskAdmin(taskId: string) {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },

    async listMembersAdmin() {
      const { data, error } = await supabase
        .from("members")
        .select("id, auth_user_id, legacy_user_id, name, email, user_level, user_active, updated_at")
        .order("legacy_user_id");
      if (error) throw error;
      return (data ?? []).map((record) => mapMember(record as Record<string, unknown>));
    },

    async saveMemberAdmin(payload: MemberAdminPayload) {
      const record = {
        auth_user_id: payload.authUserId ?? null,
        legacy_user_id: payload.legacyUserId,
        name: payload.name,
        email: payload.email,
        user_level: payload.role === "admin" ? 1 : 0,
        user_active: payload.userActive ?? payload.isActive ?? true,
      };

      if (payload.id) {
        const { data, error } = await supabase
          .from("members")
          .update(record)
          .eq("id", payload.id)
          .select("id, auth_user_id, legacy_user_id, name, email, user_level, user_active, updated_at")
          .single();
        if (error) throw error;
        return mapMember(data as Record<string, unknown>);
      }

      const { data, error } = await supabase
        .from("members")
        .insert(record)
        .select("id, auth_user_id, legacy_user_id, name, email, user_level, user_active, updated_at")
        .single();
      if (error) throw error;
      return mapMember(data as Record<string, unknown>);
    },

    async deleteMemberAdmin(memberId: string) {
      const { error } = await supabase.from("members").delete().eq("id", memberId);
      if (error) throw error;
    },

    async resetMemberPasswordAdmin(email: string) {
      const normalizedEmail = email.trim();
      if (!normalizedEmail) {
        throw new Error("비밀번호 재설정 이메일을 보낼 주소가 없습니다.");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      if (error) {
        throw error;
      }
    },

    async saveTaskTypeAdmin(payload: AdminTaskTypePayload) {
      const { data, error } = await supabase
        .from("task_types")
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
          { onConflict: "id" },
        )
        .select("id, type1, type2, display_label, display_order, requires_service_group, is_active")
        .single();
      if (error) throw error;
      return mapTaskType(data as Record<string, unknown>);
    },

    async deleteTaskTypeAdmin(taskTypeId: string) {
      const { error } = await supabase.from("task_types").delete().eq("id", taskTypeId);
      if (error) throw error;
    },

    async replaceTaskTypeUsage(oldType1: string, oldType2: string, nextType1: string, nextType2: string) {
      const { error } = await supabase
        .from("tasks")
        .update({
          task_type1: nextType1,
          task_type2: nextType2,
        })
        .eq("task_type1", oldType1)
        .eq("task_type2", oldType2);

      if (error) throw error;
    },

    async saveServiceGroupAdmin(payload: AdminServiceGroupPayload) {
      const { data, error } = await supabase
        .from("service_groups")
        .upsert(
          {
            id: payload.id ?? undefined,
            name: payload.name,
            display_order: payload.displayOrder,
            is_active: payload.isActive,
          },
          { onConflict: "id" },
        )
        .select("id, name, display_order, is_active")
        .single();
      if (error) throw error;
      return mapServiceGroup(data as Record<string, unknown>);
    },

    async deleteServiceGroupAdmin(serviceGroupId: string) {
      const { error } = await supabase.from("service_groups").delete().eq("id", serviceGroupId);
      if (error) throw error;
    },

    async replaceServiceGroupUsage(oldServiceGroupId: string | null, nextServiceGroupId: string) {
      if (!oldServiceGroupId) {
        throw new Error("대체할 서비스그룹을 찾을 수 없습니다.");
      }

      const { error } = await supabase
        .from("projects")
        .update({
          service_group_id: nextServiceGroupId,
        })
        .eq("service_group_id", oldServiceGroupId);

      if (error) throw error;
    },
  };
}

export const adminDataClient = createSupabaseAdminClient();
