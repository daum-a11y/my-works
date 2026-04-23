import type { ApiRecord } from './api.types';
import { requireSupabaseClient } from './supabase';
import type { Member, SaveProjectInput, SaveProjectSubtaskInput } from '../types/domain';

const projectSelect =
  '*, platforms(name), task_types(type1), service_groups(service_group_name, service_name, name, cost_group_id, cost_groups(name))';

const projectOptionSelect =
  'id, name, task_type_id, platform_id, service_group_id, report_url, is_active, task_types(type1), platforms(name), service_groups(service_group_name, service_name, name, cost_group_id, cost_groups(name))';

export async function getProjects() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select(projectSelect)
    .order('is_active', { ascending: false })
    .order('name');
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function searchProjectsPage(
  filters: { startDate: string | null; endDate: string | null; query: string | null },
  page: number,
  pageSize: number,
) {
  const supabase = requireSupabaseClient();
  const from = Math.max(0, (page - 1) * pageSize);
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .rpc(
      'search_projects_page',
      {
        p_start_date: filters.startDate,
        p_end_date: filters.endDate,
        p_keyword: filters.query,
      },
      { count: 'exact' },
    )
    .range(from, to);
  if (error) throw error;
  return { items: (data ?? []) as ApiRecord[], totalCount: count ?? 0 };
}

export async function searchReportProjects(filters: {
  costGroupId: string | null;
  platform: string | null;
  taskType1: string | null;
  query: string | null;
}) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('search_report_projects', {
    p_cost_group_id: filters.costGroupId,
    p_platform: filters.platform,
    p_task_type1: filters.taskType1,
    p_keyword: filters.query,
  });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function getProject(projectId: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select(projectSelect)
    .eq('id', projectId)
    .maybeSingle();
  if (error) throw error;
  return (data as ApiRecord | null) ?? null;
}

export async function saveProject(input: SaveProjectInput) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .rpc('upsert_project', {
      p_project_id: input.id ?? null,
      p_task_type_id: input.taskTypeId,
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
  return data as ApiRecord;
}

export async function deleteProject(projectId: string) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw error;
}

export async function getProjectSubtasks(_member: Member) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('project_subtasks_public_view')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function getAllProjectSubtasks() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('project_subtasks_public_view')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function getProjectSubtasksByProjectId(projectId: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('project_subtasks_public_view')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function getProjectSubtasksByProjectIds(projectIds: string[]) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('project_subtasks_public_view')
    .select('*')
    .in('project_id', projectIds)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function saveProjectSubtask(input: SaveProjectSubtaskInput) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .rpc('upsert_project_subtask', {
      p_subtask_id: input.id ?? null,
      p_project_id: input.projectId,
      p_title: input.title,
      p_url: input.url,
      p_owner_member_id: input.ownerMemberId,
      p_task_date: input.taskDate ?? null,
      p_task_status: input.taskStatus,
      p_note: input.note,
    })
    .single();
  if (error) throw error;
  return data as ApiRecord;
}

export async function deleteProjectSubtask(subtaskId: string) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.from('project_subtasks').delete().eq('id', subtaskId);
  if (error) throw error;
}

export async function listProjects() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.from('projects').select(projectOptionSelect).order('name');
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function listProjectSubtasks() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('project_subtasks')
    .select('id, project_id, title, url, task_status')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function getProjectAdminOption(projectId: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select(projectOptionSelect)
    .eq('id', projectId)
    .maybeSingle();
  if (error) throw error;
  return (data as ApiRecord | null) ?? null;
}

export async function listProjectSubtasksByProjectId(projectId: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('project_subtasks')
    .select('id, project_id, title, url, task_status')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function searchReportProjectsAdmin(filters: {
  costGroupId: string | null;
  platform: string | null;
  taskType1: string | null;
  query: string | null;
}) {
  const supabase = requireSupabaseClient();
  let query = supabase
    .from('projects')
    .select(
      'id, name, task_type_id, platform_id, service_group_id, report_url, is_active, task_types(type1), platforms(name), service_groups!inner(service_group_name, service_name, name, cost_group_id, cost_groups(name))',
    )
    .eq('is_active', true)
    .order('name')
    .limit(60);
  if (filters.costGroupId) query = query.eq('service_groups.cost_group_id', filters.costGroupId);
  if (filters.platform) query = query.eq('platforms.name', filters.platform);
  if (filters.taskType1) query = query.eq('task_types.type1', filters.taskType1);
  if (filters.query) query = query.ilike('name', `%${filters.query}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}
