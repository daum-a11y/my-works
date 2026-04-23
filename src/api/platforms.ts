import type { ApiRecord } from './api.types';
import { requireSupabaseClient } from './supabase';
import type { AdminPlatformPayload, AdminReorderPayload } from '../pages/admin/admin.types';

export async function getPlatforms() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.from('platforms').select('*').order('display_order');
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function listPlatforms() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('platforms')
    .select('id, name, display_order, is_visible')
    .order('display_order');
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function savePlatformAdmin(payload: AdminPlatformPayload) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('platforms')
    .upsert(
      {
        id: payload.id ?? undefined,
        name: payload.name,
        display_order: payload.displayOrder,
        is_visible: payload.isVisible,
      },
      { onConflict: 'id' },
    )
    .select('id, name, display_order, is_visible')
    .single();
  if (error) throw error;
  return data as ApiRecord;
}

export async function reorderPlatforms(payload: AdminReorderPayload) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.rpc('admin_reorder_platforms', {
    p_platform_ids: payload.ids,
  });
  if (error) throw error;
}

export async function deletePlatformAdmin(platformId: string) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.from('platforms').delete().eq('id', platformId);
  if (error) throw error;
}

export async function replacePlatformUsage(
  oldPlatformId: string,
  nextPlatformId: string,
  dropExisting = false,
) {
  const supabase = requireSupabaseClient();
  const { error } = await supabase.rpc('admin_replace_platform_usage', {
    p_drop_existing: dropExisting,
    p_old_platform_id: oldPlatformId,
    p_next_platform_id: nextPlatformId,
  });
  if (!error) return;

      const rpcError = error as unknown as ApiRecord;
      const rpcMissing =
        Number(rpcError.status ?? 0) === 404 ||
        String(rpcError.code ?? '') === 'PGRST202' ||
        String(rpcError.message ?? '').includes('admin_replace_platform_usage');

      if (!rpcMissing) throw error;

      if (oldPlatformId === nextPlatformId) {
        throw new Error('변경할 플랫폼이 현재 플랫폼과 같습니다.');
      }

      const { data: platformRows, error: platformsError } = await supabase
        .from('platforms')
        .select('id, name, is_visible')
        .in('id', [oldPlatformId, nextPlatformId]);
      if (platformsError) throw platformsError;

      const oldPlatform = (platformRows ?? []).find((item) => item.id === oldPlatformId);
      const nextPlatform = (platformRows ?? []).find((item) => item.id === nextPlatformId);

      if (!oldPlatform) {
        throw new Error('현재 플랫폼을 찾을 수 없습니다.');
      }
      if (!nextPlatform) {
        throw new Error('변경할 플랫폼을 찾을 수 없습니다.');
      }
      if (nextPlatform.is_visible !== true) {
        throw new Error('노출 중인 플랫폼으로만 전환할 수 있습니다.');
      }

      const { error: projectsError } = await supabase
        .from('projects')
        .update({
          platform_id: nextPlatformId,
          platform: String(nextPlatform.name ?? ''),
        })
        .eq('platform_id', oldPlatformId);
      if (projectsError) throw projectsError;

      const sourcePlatformRequest = dropExisting
        ? supabase.from('platforms').delete().eq('id', oldPlatformId)
        : supabase.from('platforms').update({ is_visible: false }).eq('id', oldPlatformId);
      const { error: sourcePlatformError } = await sourcePlatformRequest;
  if (sourcePlatformError) throw sourcePlatformError;
}
