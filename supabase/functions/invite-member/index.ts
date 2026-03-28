import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type InvitePayload = {
  email?: string;
  legacyUserId?: string;
  name?: string;
  role?: "user" | "admin";
  redirectTo?: string;
};

function json(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !authorization) {
    return json({ error: "Function is not configured." }, { status: 500 });
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
    return json({ error: "인증된 관리자만 초대할 수 있습니다." }, { status: 401 });
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: member, error: memberError } = await adminClient
    .from("members")
    .select("user_level, user_active")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (memberError) {
    return json({ error: memberError.message }, { status: 500 });
  }

  if (!member || Number(member.user_level ?? 0) !== 1 || member.user_active !== true) {
    return json({ error: "관리자만 초대 메일을 보낼 수 있습니다." }, { status: 403 });
  }

  const payload = (await request.json()) as InvitePayload;
  const email = String(payload.email ?? "").trim().toLowerCase();
  const legacyUserId = String(payload.legacyUserId ?? "").trim();
  const name = String(payload.name ?? "").trim();
  const role = payload.role === "admin" ? "admin" : "user";
  const redirectTo = String(payload.redirectTo ?? "").trim();

  if (!email) {
    return json({ error: "초대할 이메일이 필요합니다." }, { status: 400 });
  }

  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: redirectTo || undefined,
    data: {
      legacy_user_id: legacyUserId,
      name,
      role,
    },
  });

  if (inviteError) {
    return json({ error: inviteError.message }, { status: 400 });
  }

  return json({ ok: true });
});
