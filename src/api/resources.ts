import type { ApiRecord } from './api.types';
import { requireSupabaseClient } from './supabase';
import type { Member } from '../types/domain';

export async function getResourceSummary(member: Member, month: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_resource_summary', {
    p_member_id: member.role === 'admin' ? null : member.id,
    p_month: month,
  });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function getResourceSummaryMembers(member: Member) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_resource_summary_members', {
    p_member_id: member.role === 'admin' ? null : member.id,
  });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function getResourceTypeSummaryYears(member: Member) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_resource_type_summary_years', {
    p_member_id: member.role === 'admin' ? null : member.id,
  });
  if (error) throw error;
  return ((data ?? []) as ApiRecord[]).map((record) => String(record.year ?? ''));
}

export async function getResourceTypeSummaryByYear(member: Member, year: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_resource_type_summary_by_year', {
    p_member_id: member.role === 'admin' ? null : member.id,
    p_year: year,
  });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function getResourceServiceSummaryYears(member: Member) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_resource_service_summary_years', {
    p_member_id: member.role === 'admin' ? null : member.id,
  });
  if (error) throw error;
  return ((data ?? []) as ApiRecord[]).map((record) => String(record.year ?? ''));
}

export async function getResourceServiceSummaryByYear(member: Member, year: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_resource_service_summary_by_year', {
    p_member_id: member.role === 'admin' ? null : member.id,
    p_year: year,
  });
  if (error) throw error;
  return (data ?? []) as ApiRecord[];
}

export async function getResourceMonthReport(member: Member, month: string) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_resource_month_report', {
    p_member_id: member.role === 'admin' ? null : member.id,
    p_month: month,
  });
  if (error) throw error;
  return data;
}
