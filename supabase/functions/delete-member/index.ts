import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

type DeleteMemberPayload = {
  memberId?: string;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('Authorization');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !authorization) {
    return json({ error: 'Function is not configured.' }, { status: 500 });
  }

  const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();

  if (userError || !user) {
    return json({ error: '인증된 관리자만 사용자를 삭제할 수 있습니다.' }, { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const normalizedUserEmail = String(user.email ?? '')
    .trim()
    .toLowerCase();
  let callerMember: {
    id: string;
    user_level: number;
    user_active: boolean;
    auth_user_id?: string | null;
  } | null = null;

  const { data: linkedMember, error: linkedMemberError } = await adminClient
    .from('members')
    .select('id, user_level, user_active, auth_user_id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (linkedMemberError) {
    return json({ error: linkedMemberError.message }, { status: 500 });
  }

  callerMember = linkedMember;

  if (!callerMember && normalizedUserEmail) {
    const { data: emailMatchedMember, error: emailMatchedMemberError } = await adminClient
      .from('members')
      .select('id, user_level, user_active, auth_user_id')
      .ilike('email', normalizedUserEmail)
      .maybeSingle();

    if (emailMatchedMemberError) {
      return json({ error: emailMatchedMemberError.message }, { status: 500 });
    }

    callerMember = emailMatchedMember;

    if (callerMember && !callerMember.auth_user_id) {
      const { error: bindError } = await adminClient
        .from('members')
        .update({ auth_user_id: user.id })
        .eq('id', callerMember.id)
        .is('auth_user_id', null);

      if (bindError) {
        return json({ error: bindError.message }, { status: 500 });
      }

      callerMember = {
        ...callerMember,
        auth_user_id: user.id,
      };
    }
  }

  if (
    !callerMember ||
    Number(callerMember.user_level ?? 0) !== 1 ||
    callerMember.user_active !== true
  ) {
    return json({ error: '관리자만 사용자를 삭제할 수 있습니다.' }, { status: 403 });
  }

  const payload = (await request.json()) as DeleteMemberPayload;
  const memberId = String(payload.memberId ?? '').trim();

  if (!memberId) {
    return json({ error: '삭제할 사용자 정보가 없습니다.' }, { status: 400 });
  }

  const { data: targetMember, error: memberError } = await adminClient
    .from('members')
    .select('id, auth_user_id, email')
    .eq('id', memberId)
    .maybeSingle();

  if (memberError) {
    return json({ error: memberError.message }, { status: 500 });
  }

  if (!targetMember) {
    return json({ error: '삭제할 사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
  }

  const { data: taskRows, error: taskCountError } = await adminClient.rpc(
    'admin_get_member_task_count',
    {
      p_member_id: memberId,
    },
  );

  if (taskCountError) {
    return json({ error: taskCountError.message }, { status: 500 });
  }

  const taskCount = Number((Array.isArray(taskRows) ? taskRows[0]?.task_count : 0) ?? 0);

  if (taskCount > 0) {
    const { error: deactivateError } = await adminClient
      .from('members')
      .update({ user_active: false })
      .eq('id', memberId);

    if (deactivateError) {
      return json({ error: deactivateError.message }, { status: 500 });
    }

    return json({ result: 'deactivated' });
  }

  if (targetMember.auth_user_id) {
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(
      String(targetMember.auth_user_id),
    );

    if (deleteAuthError) {
      return json({ error: deleteAuthError.message }, { status: 500 });
    }
  }

  const { error: deleteMemberError } = await adminClient
    .from('members')
    .delete()
    .eq('id', memberId);

  if (deleteMemberError) {
    return json({ error: deleteMemberError.message }, { status: 500 });
  }

  return json({ result: 'deleted' });
});
