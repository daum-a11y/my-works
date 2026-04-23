import type { ApiRecord } from './api.types';
import { requireSupabaseClient } from './supabase';
import type { AdminReorderPayload, AdminTaskTypePayload } from '../pages/admin/admin.types';

export async function getTaskTypes() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('task_types')
    .select('id, type1, type2, requires_service_group, display_order, is_active')
    .order('display_order');
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function listTaskTypes() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('task_types')
    .select('id, type1, type2, note, display_order, is_active, requires_service_group')
    .order('display_order');
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function saveTaskTypeAdmin(payload: AdminTaskTypePayload) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('task_types')
    .upsert(
      {
        id: payload.id ?? undefined,
        type1: payload.type1,
        type2: payload.type2,
        note: payload.note,
        display_order: payload.displayOrder,
        requires_service_group: payload.requiresServiceGroup,
        is_active: payload.isActive,
      },
      { onConflict: 'id' },
    )
    .select('id, type1, type2, note, display_order, requires_service_group, is_active')
    .single();
  if (error) throw error;
  return data as ApiRecord;
}

export async function getTaskTypeUsageSummary(taskTypeId: string, type1: string, type2: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('admin_get_task_type_usage_summary', {
    p_task_type_id: taskTypeId,
    p_type1: type1,
    p_type2: type2,
  });
  if (error) throw error;
  return (Array.isArray(data) ? data : []) as ApiRecord[];
}

export async function deleteTaskTypeAdmin(taskTypeId: string) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.from('task_types').delete().eq('id', taskTypeId);
  if (error) throw error;
}

export async function replaceTaskTypeUsage(
  oldType1: string,
  oldType2: string,
  nextType1: string,
  nextType2: string,
) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.rpc('admin_replace_task_type_usage', {
    p_old_type1: oldType1,
    p_old_type2: oldType2,
    p_next_type1: nextType1,
    p_next_type2: nextType2,
  });
  if (error) throw error;
}

export async function replaceTaskTypeUsageById(
  oldTaskTypeId: string,
  nextTaskTypeId: string,
  dropExisting = false,
) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.rpc('admin_replace_task_type_usage_by_id', {
    p_drop_existing: dropExisting,
    p_old_task_type_id: oldTaskTypeId,
    p_next_task_type_id: nextTaskTypeId,
  });
  if (error) throw error;
}

export async function reorderTaskTypes(payload: AdminReorderPayload) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.rpc('admin_reorder_task_types', {
    p_task_type_ids: payload.ids,
  });
  if (error) throw error;
}
