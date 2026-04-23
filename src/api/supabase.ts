import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '../config/env';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  client ??= createClient(env.supabaseUrl, env.supabaseAnonKey);
  return client;
}

export function requireSupabaseClient(): SupabaseClient {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }
  return supabase;
}
