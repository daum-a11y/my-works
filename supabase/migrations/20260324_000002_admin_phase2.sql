alter table public.members
  add column if not exists department text not null default '';

create or replace function public.admin_search_tasks(
  p_member_id uuid default null,
  p_start_date date default null,
  p_end_date date default null,
  p_project_id uuid default null,
  p_project_page_id uuid default null,
  p_task_type1 text default null,
  p_task_type2 text default null,
  p_service_group_id uuid default null,
  p_keyword text default null
)
returns table (
  id uuid,
  member_id uuid,
  member_name text,
  member_email text,
  task_date date,
  project_id uuid,
  project_name text,
  project_page_id uuid,
  page_title text,
  service_group_id uuid,
  service_group_name text,
  task_type1 text,
  task_type2 text,
  hours numeric,
  content text,
  note text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception '관리자만 사용할 수 있습니다.';
  end if;

  return query
  select
    t.id,
    t.member_id,
    m.name,
    m.email,
    t.task_date,
    t.project_id,
    coalesce(p.name, ''),
    t.project_page_id,
    coalesce(pp.title, ''),
    p.service_group_id,
    coalesce(sg.name, ''),
    t.task_type1,
    t.task_type2,
    t.hours,
    t.content,
    t.note,
    t.updated_at
  from public.tasks t
  inner join public.members m on m.id = t.member_id
  left join public.projects p on p.id = t.project_id
  left join public.project_pages pp on pp.id = t.project_page_id
  left join public.service_groups sg on sg.id = p.service_group_id
  where (p_member_id is null or t.member_id = p_member_id)
    and (p_start_date is null or t.task_date >= p_start_date)
    and (p_end_date is null or t.task_date <= p_end_date)
    and (p_project_id is null or t.project_id = p_project_id)
    and (p_project_page_id is null or t.project_page_id = p_project_page_id)
    and (p_task_type1 is null or t.task_type1 = p_task_type1)
    and (p_task_type2 is null or t.task_type2 = p_task_type2)
    and (p_service_group_id is null or p.service_group_id = p_service_group_id)
    and (
      p_keyword is null
      or t.content ilike '%' || p_keyword || '%'
      or t.note ilike '%' || p_keyword || '%'
      or m.name ilike '%' || p_keyword || '%'
      or coalesce(m.email, '') ilike '%' || p_keyword || '%'
      or coalesce(p.name, '') ilike '%' || p_keyword || '%'
      or coalesce(pp.title, '') ilike '%' || p_keyword || '%'
    )
  order by t.task_date desc, t.updated_at desc;
end;
$$;

create or replace function public.admin_save_task(
  p_task_id uuid default null,
  p_member_id uuid,
  p_task_date date,
  p_project_id uuid default null,
  p_project_page_id uuid default null,
  p_task_type1 text,
  p_task_type2 text,
  p_hours numeric,
  p_content text,
  p_note text default ''
)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_member_id uuid := public.current_member_id();
  v_project_id uuid := p_project_id;
  v_page_project_id uuid;
  v_task public.tasks;
begin
  if not public.current_user_is_admin() then
    raise exception '관리자만 사용할 수 있습니다.';
  end if;

  if v_actor_member_id is null then
    raise exception '로그인한 멤버 정보를 찾을 수 없습니다.';
  end if;

  if p_member_id is null then
    raise exception '업무보고 대상 사용자가 필요합니다.';
  end if;

  if p_task_date is null then
    raise exception '작성일이 필요합니다.';
  end if;

  if nullif(btrim(coalesce(p_task_type1, '')), '') is null then
    raise exception '업무유형 1은 필수입니다.';
  end if;

  if nullif(btrim(coalesce(p_task_type2, '')), '') is null then
    raise exception '업무유형 2는 필수입니다.';
  end if;

  if nullif(btrim(coalesce(p_content, '')), '') is null then
    raise exception '업무내용은 필수입니다.';
  end if;

  if p_hours is null or p_hours < 0 then
    raise exception '소요시간은 0 이상이어야 합니다.';
  end if;

  if p_project_page_id is not null then
    select project_id
      into v_page_project_id
      from public.project_pages
     where id = p_project_page_id;

    if v_page_project_id is null then
      raise exception '존재하지 않는 페이지입니다.';
    end if;

    if v_project_id is not null and v_project_id <> v_page_project_id then
      raise exception '선택한 프로젝트와 페이지가 일치하지 않습니다.';
    end if;

    v_project_id := v_page_project_id;
  end if;

  if p_task_id is null then
    insert into public.tasks (
      member_id,
      created_by_member_id,
      task_date,
      project_id,
      project_page_id,
      task_type1,
      task_type2,
      hours,
      content,
      note
    )
    values (
      p_member_id,
      v_actor_member_id,
      p_task_date,
      v_project_id,
      p_project_page_id,
      btrim(p_task_type1),
      btrim(p_task_type2),
      p_hours,
      btrim(p_content),
      coalesce(p_note, '')
    )
    returning * into v_task;
  else
    update public.tasks
       set member_id = p_member_id,
           task_date = p_task_date,
           project_id = v_project_id,
           project_page_id = p_project_page_id,
           task_type1 = btrim(p_task_type1),
           task_type2 = btrim(p_task_type2),
           hours = p_hours,
           content = btrim(p_content),
           note = coalesce(p_note, '')
     where id = p_task_id
     returning * into v_task;

    if v_task.id is null then
      raise exception '수정할 업무보고를 찾을 수 없습니다.';
    end if;
  end if;

  return v_task;
end;
$$;

create or replace function public.admin_delete_task(
  p_task_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer := 0;
begin
  if not public.current_user_is_admin() then
    raise exception '관리자만 사용할 수 있습니다.';
  end if;

  delete from public.tasks
   where id = p_task_id;

  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

create or replace function public.admin_list_members()
returns table (
  id uuid,
  auth_user_id uuid,
  legacy_user_id text,
  name text,
  email text,
  department text,
  user_level smallint,
  is_active boolean,
  auth_email text,
  queue_reasons text[],
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.current_user_is_admin() then
    raise exception '관리자만 사용할 수 있습니다.';
  end if;

  return query
  select
    m.id,
    m.auth_user_id,
    m.legacy_user_id,
    m.name,
    m.email,
    coalesce(m.department, ''),
    m.user_level,
    m.is_active,
    coalesce(au.email::text, ''),
    array_remove(
      array[
        case when m.auth_user_id is null then 'auth_unlinked' end,
        case
          when m.auth_user_id is not null
            and au.id is not null
            and lower(coalesce(au.email::text, '')) <> lower(coalesce(m.email, ''))
          then 'email_mismatch'
        end,
        case when m.user_level not in (0, 1) then 'role_invalid' end,
        case when m.is_active = false then 'inactive_candidate' end
      ],
      null
    ),
    m.updated_at
  from public.members m
  left join auth.users au on au.id = m.auth_user_id
  order by m.name asc;
end;
$$;

create or replace function public.admin_upsert_member(
  p_member_id uuid default null,
  p_auth_user_id uuid default null,
  p_legacy_user_id text,
  p_name text,
  p_email text,
  p_department text default '',
  p_user_level smallint default 0,
  p_is_active boolean default true
)
returns public.members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.members;
begin
  if not public.current_user_is_admin() then
    raise exception '관리자만 사용할 수 있습니다.';
  end if;

  if nullif(btrim(coalesce(p_legacy_user_id, '')), '') is null then
    raise exception '레거시 사용자 ID는 필수입니다.';
  end if;

  if nullif(btrim(coalesce(p_name, '')), '') is null then
    raise exception '이름은 필수입니다.';
  end if;

  if nullif(btrim(coalesce(p_email, '')), '') is null then
    raise exception '이메일은 필수입니다.';
  end if;

  if p_user_level not in (0, 1) then
    raise exception '지원하지 않는 권한 값입니다.';
  end if;

  if p_member_id is null then
    insert into public.members (
      auth_user_id,
      legacy_user_id,
      name,
      email,
      department,
      user_level,
      is_active
    )
    values (
      p_auth_user_id,
      btrim(p_legacy_user_id),
      btrim(p_name),
      lower(btrim(p_email)),
      coalesce(p_department, ''),
      p_user_level,
      coalesce(p_is_active, true)
    )
    returning * into v_member;
  else
    update public.members
       set auth_user_id = p_auth_user_id,
           legacy_user_id = btrim(p_legacy_user_id),
           name = btrim(p_name),
           email = lower(btrim(p_email)),
           department = coalesce(p_department, ''),
           user_level = p_user_level,
           is_active = coalesce(p_is_active, true)
     where id = p_member_id
     returning * into v_member;

    if v_member.id is null then
      raise exception '수정할 사용자를 찾을 수 없습니다.';
    end if;
  end if;

  return v_member;
end;
$$;

grant execute on function public.admin_search_tasks(uuid, date, date, uuid, uuid, text, text, uuid, text) to authenticated;
grant execute on function public.admin_save_task(uuid, uuid, date, uuid, uuid, text, text, numeric, text, text) to authenticated;
grant execute on function public.admin_delete_task(uuid) to authenticated;
grant execute on function public.admin_list_members() to authenticated;
grant execute on function public.admin_upsert_member(uuid, uuid, text, text, text, text, smallint, boolean) to authenticated;
