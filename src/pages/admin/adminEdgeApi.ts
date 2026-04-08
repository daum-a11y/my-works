import { env } from '../../config/env';
import { getPasswordRecoveryRedirectUrl } from '../../auth/auth.util';
import { getSupabaseClient } from '../../api/supabase';

export function getAdminEdgeHeaders() {
  return {
    redirectTo: getPasswordRecoveryRedirectUrl(),
  };
}

export async function fetchAdminEdgeJson<TResponse>(
  functionName: string,
  payload: Record<string, unknown>,
) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  let accessToken = sessionData.session?.access_token ?? null;
  if (!accessToken) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) throw refreshError;
    accessToken = refreshed.session?.access_token ?? null;
  }
  if (!accessToken) {
    throw new Error('로그인이 만료되었습니다. 다시 로그인해 주세요.');
  }

  const response = await fetch(`${env.supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      apikey: env.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      redirectTo: payload.redirectTo ?? getPasswordRecoveryRedirectUrl(),
    }),
  });

  if (!response.ok) {
    let message = '요청 처리에 실패했습니다.';
    try {
      const errorPayload = await response.json();
      if (
        typeof errorPayload === 'object' &&
        errorPayload !== null &&
        typeof (errorPayload as { error?: unknown }).error === 'string'
      ) {
        message = (errorPayload as { error: string }).error.trim() || message;
      }
    } catch {
      const text = await response.text();
      if (text.trim()) {
        message = text.trim();
      }
    }
    throw new Error(message);
  }

  return (await response.json()) as TResponse;
}
