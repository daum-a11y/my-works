import type { ApiRecord } from './api.types';
import { requireSupabaseClient } from './supabase';
import type { AdminCostGroupPayload, AdminReorderPayload } from '../pages/admin/admin.types';

export async function getCostGroups() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.from('cost_groups').select('*').order('display_order');
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function listCostGroups() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('cost_groups')
    .select('id, name, display_order, is_active')
    .order('display_order');
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function saveCostGroupAdmin(payload: AdminCostGroupPayload) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('cost_groups')
    .upsert(
      {
        id: payload.id ?? undefined,
        name: payload.name,
        display_order: payload.displayOrder,
        is_active: payload.isActive,
      },
      { onConflict: 'id' },
    )
    .select('id, name, display_order, is_active')
    .single();
  if (error) throw error;
  return data as ApiRecord;
}

export async function reorderCostGroups(payload: AdminReorderPayload) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.rpc('admin_reorder_cost_groups', {
    p_cost_group_ids: payload.ids,
  });
  if (error) throw error;
}

export async function deleteCostGroupAdmin(costGroupId: string) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.from('cost_groups').delete().eq('id', costGroupId);
  if (error) throw error;
}

export async function replaceCostGroupUsage(
  oldCostGroupId: string,
  nextCostGroupId: string,
  dropExisting = false,
) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.rpc('admin_replace_cost_group_usage', {
    p_drop_existing: dropExisting,
    p_old_cost_group_id: oldCostGroupId,
    p_next_cost_group_id: nextCostGroupId,
  });
  if (error) throw error;
}
