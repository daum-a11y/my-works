import { env } from "../../lib/env";
import { getSupabaseClient } from "../../lib/supabase";
import type {
  AdminLookupOption,
  AdminPageOption,
  AdminProjectOption,
  AdminTaskSaveInput,
  AdminTaskSearchFilters,
  AdminTaskSearchItem,
  MemberAdminItem,
  MemberAdminPayload,
} from "./admin-types";

function toNullableString(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function mapLookup(record: Record<string, unknown>): AdminLookupOption {
  return {
    id: String(record.id ?? ""),
    name: String(record.name ?? ""),
    isActive: Boolean(record.is_active ?? true),
    displayOrder: Number(record.display_order ?? 0),
    requiresServiceGroup: Boolean(record.requires_service_group ?? false),
  };
}

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

function mapMember(record: Record<string, unknown>): MemberAdminItem {
  return {
    id: String(record.id ?? ""),
    authUserId: record.auth_user_id ? String(record.auth_user_id) : null,
    legacyUserId: String(record.legacy_user_id ?? ""),
    name: String(record.name ?? ""),
    email: String(record.email ?? ""),
    department: String(record.department ?? ""),
    role: Number(record.user_level ?? 0) === 1 ? "admin" : "user",
    isActive: Boolean(record.is_active ?? true),
    authEmail: String(record.auth_email ?? ""),
    queueReasons: Array.isArray(record.queue_reasons)
      ? record.queue_reasons.map((item) => String(item))
      : [],
    updatedAt: String(record.updated_at ?? ""),
  };
}

function buildSearchRpcParams(filters: AdminTaskSearchFilters) {
  return {
    p_member_id: toNullableString(filters.memberId),
    p_start_date: toNullableString(filters.startDate),
    p_end_date: toNullableString(filters.endDate),
    p_project_id: toNullableString(filters.projectId),
    p_project_page_id: toNullableString(filters.pageId),
    p_task_type1: toNullableString(filters.taskType1),
    p_task_type2: toNullableString(filters.taskType2),
    p_service_group_id: toNullableString(filters.serviceGroupId),
    p_keyword: toNullableString(filters.keyword),
  };
}

function createUnconfiguredAdminClient() {
  const configurationError = new Error("Supabase 환경 변수가 설정되지 않았습니다.");

  return {
    async listTaskTypes() {
      return [] as AdminLookupOption[];
    },
    async listServiceGroups() {
      return [] as AdminLookupOption[];
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
    async exportTasksAdmin() {
      throw configurationError;
    },
    async listMembersAdmin() {
      return [] as MemberAdminItem[];
    },
    async saveMemberAdmin() {
      throw configurationError;
    },
  };
}

function createSupabaseAdminClient() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return createUnconfiguredAdminClient();
  }

  return {
    async listTaskTypes() {
      const { data, error } = await supabase
        .from("task_types")
        .select("id, name, display_order, is_active, requires_service_group")
        .order("display_order");
      if (error) throw error;
      return (data ?? []).map((record) => mapLookup(record as Record<string, unknown>));
    },

    async listServiceGroups() {
      const { data, error } = await supabase
        .from("service_groups")
        .select("id, name, display_order, is_active")
        .order("display_order");
      if (error) throw error;
      return (data ?? []).map((record) => mapLookup(record as Record<string, unknown>));
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
      const { data, error } = await supabase.rpc("admin_search_tasks", buildSearchRpcParams(filters));
      if (error) throw error;
      return (data ?? []).map((record) => mapTask(record as Record<string, unknown>));
    },

    async saveTaskAdmin(input: AdminTaskSaveInput) {
      const { data, error } = await supabase.rpc("admin_save_task", {
        p_task_id: input.id ?? null,
        p_member_id: input.memberId,
        p_task_date: input.taskDate,
        p_project_id: toNullableString(input.projectId),
        p_project_page_id: toNullableString(input.pageId),
        p_task_type1: input.taskType1,
        p_task_type2: input.taskType2,
        p_hours: input.hours,
        p_content: input.content,
        p_note: input.note,
      });
      if (error) throw error;
      return mapTask(data as Record<string, unknown>);
    },

    async deleteTaskAdmin(taskId: string) {
      const { error } = await supabase.rpc("admin_delete_task", { p_task_id: taskId });
      if (error) throw error;
    },

    async exportTasksAdmin(filters: AdminTaskSearchFilters) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("로그인 세션이 만료되었습니다.");
      }

      const response = await fetch(`${env.supabaseUrl}/functions/v1/export-tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: env.supabaseAnonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "내보내기에 실패했습니다.");
      }

      return {
        filename:
          response.headers.get("content-disposition")?.match(/filename="?([^\"]+)"?/)?.[1] ??
          `admin-tasks-${new Date().toISOString().slice(0, 10)}.csv`,
        content: await response.text(),
      };
    },

    async listMembersAdmin() {
      const { data, error } = await supabase.rpc("admin_list_members");
      if (error) throw error;
      return (data ?? []).map((record) => mapMember(record as Record<string, unknown>));
    },

    async saveMemberAdmin(payload: MemberAdminPayload) {
      const { data, error } = await supabase.rpc("admin_upsert_member", {
        p_member_id: payload.id ?? null,
        p_auth_user_id: payload.authUserId ?? null,
        p_legacy_user_id: payload.legacyUserId,
        p_name: payload.name,
        p_email: payload.email,
        p_department: payload.department,
        p_user_level: payload.role === "admin" ? 1 : 0,
        p_is_active: payload.isActive,
      });
      if (error) throw error;
      return mapMember(data as Record<string, unknown>);
    },
  };
}

export const adminDataClient = createSupabaseAdminClient();
