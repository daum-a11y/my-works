import type { ApiRecord, RawPagedResult } from './api.types';
import { requireSupabaseClient } from './supabase';
import type { AdminTaskSaveInput } from '../pages/admin/admin.types';
import type { Member, ReportFilters, SaveTaskInput } from '../types/domain';

type AdminTaskFilters = {
  memberId: string | null;
  startDate: string | null;
  endDate: string | null;
  costGroupId: string | null;
  platformId: string | null;
  serviceGroupId: string | null;
  projectId: string | null;
  subtaskId: string | null;
  taskTypeId: string | null;
  taskType1: string | null;
  taskType2: string | null;
  keyword: string | null;
};

export async function getTasksByDate(member: Member, taskDate: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_tasks_by_date', {
    p_member_id: member.id,
    p_task_date: taskDate,
  });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function getDashboardTaskCalendar(member: Member, month: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_dashboard_task_calendar', {
    p_member_id: member.role === 'admin' ? member.id : null,
    p_month: month,
  });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function getTaskActivities() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_task_activities');
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function saveTask(_member: Member, input: SaveTaskInput) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .rpc('save_task', {
      p_task_id: input.id ?? null,
      p_task_date: input.taskDate,
      p_cost_group_id: input.costGroupId,
      p_project_id: input.projectId,
      p_project_subtask_id: input.subtaskId,
      p_task_type1: input.taskType1,
      p_task_type2: input.taskType2,
      p_task_usedtime: input.taskUsedtime,
      p_url: input.url,
      p_content: input.content,
      p_note: input.note,
    })
    .single();
  if (error) throw error;
  return data as ApiRecord;
}

export async function deleteTask(_member: Member, taskId: string) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.rpc('delete_task', {
    p_task_id: taskId,
  });
  if (error) throw error;
}

export async function exportTasks(
  member: Member,
  filters: Omit<ReportFilters, 'query'> & { query: string | null },
) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('search_tasks_export', {
    p_member_id: member.role === 'admin' ? null : member.id,
    p_start_date: filters.startDate || null,
    p_end_date: filters.endDate || null,
    p_project_id: filters.projectId || null,
    p_project_subtask_id: filters.subtaskId || null,
    p_task_type1: filters.taskType1 || null,
    p_task_type2: filters.taskType2 || null,
    p_min_task_usedtime: filters.minTaskUsedtime
      ? Number.parseFloat(filters.minTaskUsedtime)
      : null,
    p_max_task_usedtime: filters.maxTaskUsedtime
      ? Number.parseFloat(filters.maxTaskUsedtime)
      : null,
    p_keyword: filters.query,
  });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function searchTasksPage(
  member: Member,
  filters: Omit<ReportFilters, 'query'> & { query: string | null },
  page: number,
  pageSize: number,
) {
  const supabase = requireSupabaseClient();
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
        p_project_subtask_id: filters.subtaskId || null,
        p_task_type1: filters.taskType1 || null,
        p_task_type2: filters.taskType2 || null,
        p_min_task_usedtime: filters.minTaskUsedtime
          ? Number.parseFloat(filters.minTaskUsedtime)
          : null,
        p_max_task_usedtime: filters.maxTaskUsedtime
          ? Number.parseFloat(filters.maxTaskUsedtime)
          : null,
        p_keyword: filters.query,
      },
      { count: 'exact' },
    )
    .range(from, to);
  if (error) throw error;
  return { items: (data ?? []) as ApiRecord[], totalCount: count ?? 0 };
}

export async function searchTasksAdmin(
  filters: AdminTaskFilters,
  page: number,
  pageSize: number,
): Promise<RawPagedResult> {
  const supabase = requireSupabaseClient();
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
        p_project_subtask_id: filters.subtaskId,
        p_platform_id: filters.platformId,
        p_service_group_id: filters.serviceGroupId,
        p_task_type_id: filters.taskTypeId,
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
}

export async function getTaskAdmin(taskId: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('admin_get_task', {
    p_task_id: taskId,
  });
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) throw new Error('업무보고를 찾을 수 없습니다.');
  return rows[0] as ApiRecord;
}

export async function saveTaskAdmin(input: AdminTaskSaveInput) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('admin_save_task', {
    p_task_id: input.id ?? null,
    p_member_id: input.memberId,
    p_task_date: input.taskDate,
    p_cost_group_id: input.costGroupId,
    p_project_id: input.projectId || null,
    p_project_subtask_id: input.subtaskId || null,
    p_task_type1: input.taskType1,
    p_task_type2: input.taskType2,
    p_task_usedtime: input.taskUsedtime,
    p_url: input.url,
    p_content: input.content,
    p_note: input.note,
  });
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) throw new Error('저장된 업무보고를 확인할 수 없습니다.');
  return rows[0] as ApiRecord;
}

export async function deleteTaskAdmin(taskId: string) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.rpc('admin_delete_task', { p_task_id: taskId });
  if (error) throw error;
}
