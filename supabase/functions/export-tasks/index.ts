import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ExportTaskFilters {
  startDate?: string;
  endDate?: string;
  memberId?: string;
  projectId?: string;
  pageId?: string;
  taskType1?: string;
  taskType2?: string;
  serviceGroupId?: string;
  keyword?: string;
}

function normalize(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function buildRpcParams(filters: ExportTaskFilters) {
  return {
    p_member_id: normalize(filters.memberId),
    p_start_date: normalize(filters.startDate),
    p_end_date: normalize(filters.endDate),
    p_project_id: normalize(filters.projectId),
    p_project_page_id: normalize(filters.pageId),
    p_task_type1: normalize(filters.taskType1),
    p_task_type2: normalize(filters.taskType2),
    p_service_group_id: normalize(filters.serviceGroupId),
    p_keyword: normalize(filters.keyword),
  };
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "").replaceAll('"', '""');
  return /[",\n]/.test(text) ? `"${text}"` : text;
}

function buildCsv(rows: Array<Record<string, unknown>>) {
  const header = ["작성일", "작성자", "이메일", "프로젝트", "페이지", "업무유형1", "업무유형2", "서비스그룹", "업무내용", "비고", "소요시간"];
  const lines = rows.map((row) =>
    [
      row.task_date,
      row.member_name,
      row.member_email,
      row.project_name,
      row.page_title,
      row.task_type1,
      row.task_type2,
      row.service_group_name,
      row.content,
      row.note,
      row.hours,
    ]
      .map(escapeCsv)
      .join(","),
  );

  return `\uFEFF${[header.map(escapeCsv).join(","), ...lines].join("\n")}`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const authHeader = request.headers.get("Authorization") ?? "";

  if (!supabaseUrl || !supabaseAnonKey || !authHeader) {
    return new Response("환경 설정 또는 인증 헤더가 없습니다.", { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response("인증 정보를 확인할 수 없습니다.", { status: 401, headers: corsHeaders });
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id, user_level, user_active")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (memberError) {
    return new Response(memberError.message, { status: 500, headers: corsHeaders });
  }

  if (!member || Number(member.user_level ?? 0) !== 1 || member.user_active !== true) {
    return new Response("관리자만 내보내기를 사용할 수 있습니다.", { status: 403, headers: corsHeaders });
  }

  let filters: ExportTaskFilters = {};
  try {
    filters = (await request.json()) as ExportTaskFilters;
  } catch {
    filters = {};
  }

  const { data, error } = await supabase.rpc("admin_search_tasks", buildRpcParams(filters));

  if (error) {
    return new Response(error.message, { status: 500, headers: corsHeaders });
  }

  const filename = `admin-tasks-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.csv`;

  return new Response(buildCsv((data ?? []) as Array<Record<string, unknown>>), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
