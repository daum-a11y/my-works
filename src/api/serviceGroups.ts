import type { ApiRecord } from './api.types';
import { requireSupabaseClient } from './supabase';
import type { AdminReorderPayload, AdminServiceGroupPayload } from '../pages/admin/admin.types';

const serviceGroupSelect =
  'id, service_group_name, service_name, name, cost_group_id, display_order, is_active, cost_groups(name)';

export async function getServiceGroups() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('service_groups')
    .select(serviceGroupSelect)
    .order('display_order');
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function listServiceGroups() {
  return getServiceGroups();
}

export async function saveServiceGroupAdmin(payload: AdminServiceGroupPayload) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('service_groups')
    .upsert(
      {
        id: payload.id ?? undefined,
        service_group_name: payload.serviceGroupName,
        service_name: payload.serviceName,
        name: payload.name,
        cost_group_id: payload.costGroupId,
        display_order: payload.displayOrder,
        is_active: payload.svcActive ?? payload.isActive,
      },
      { onConflict: 'id' },
    )
    .select(serviceGroupSelect)
    .single();
  if (error) throw error;
  return data as ApiRecord;
}

export async function reorderServiceGroups(payload: AdminReorderPayload) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.rpc('admin_reorder_service_groups', {
    p_service_group_ids: payload.ids,
  });
  if (error) throw error;
}

export async function getServiceGroupUsageSummary(serviceGroupId: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select('id, name')
    .eq('service_group_id', serviceGroupId)
    .order('name');
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function deleteServiceGroupAdmin(serviceGroupId: string) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.from('service_groups').delete().eq('id', serviceGroupId);
  if (error) throw error;
}

export async function replaceServiceGroupUsage(
  oldServiceGroupId: string,
  nextServiceGroupId: string,
  dropExisting = false,
) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.rpc('admin_replace_service_group_usage', {
    p_drop_existing: dropExisting,
    p_old_service_group_id: oldServiceGroupId,
    p_next_service_group_id: nextServiceGroupId,
  });
  if (error) throw error;
}
