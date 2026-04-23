import type { ApiRecord } from './api.types';
import { requireSupabaseClient } from './supabase';
import type { Member } from '../types/domain';

export async function getDashboard(_member: Member) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_dashboard_snapshot');
  if (error) throw error;
  return data;
}

export async function getStats(_member: Member) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_stats');
  if (error) throw error;
  return data;
}

export async function getProjectStatsRows(filters: {
  startMonth: string;
  endMonth: string;
  taskType1: string | null;
  sortKey: string;
  sortDirection: 'asc' | 'desc';
}) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_project_stats_rows', {
    p_start_month: filters.startMonth,
    p_end_month: filters.endMonth,
    p_task_type1: filters.taskType1,
    p_sort_key: filters.sortKey,
    p_sort_direction: filters.sortDirection,
  });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function getMonitoringStatsRows(filters: {
  startMonth: string;
  endMonth: string;
  query: string | null;
  sortKey: string;
  sortDirection: 'asc' | 'desc';
}) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_monitoring_stats_rows', {
    p_start_month: filters.startMonth,
    p_end_month: filters.endMonth,
    p_task_type1: null,
    p_keyword: filters.query,
    p_sort_key: filters.sortKey,
    p_sort_direction: filters.sortDirection,
  });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}
