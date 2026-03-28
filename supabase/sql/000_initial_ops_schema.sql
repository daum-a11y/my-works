create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  legacy_user_num integer,
  legacy_user_id text not null unique,
  name text not null,
  email text not null unique,
  user_level smallint not null default 0,
  user_active boolean not null default true,
  joined_at timestamptz not null default timezone('utc', now()),
  report_required boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.service_groups (
  id uuid primary key default gen_random_uuid(),
  legacy_svc_num integer,
  name text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.task_types (
  id uuid primary key default gen_random_uuid(),
  legacy_type_num integer,
  type1 text not null,
  type2 text not null,
  display_label text not null,
  requires_service_group boolean not null default false,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  legacy_project_id text,
  created_by_member_id uuid references public.members(id),
  project_type1 text not null default '',
  name text not null,
  platform text not null,
  service_group_id uuid references public.service_groups(id),
  report_url text not null default '',
  reporter_member_id uuid references public.members(id),
  reviewer_member_id uuid references public.members(id),
  start_date date not null,
  end_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_pages (
  id uuid primary key default gen_random_uuid(),
  legacy_page_id text,
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_member_id uuid references public.members(id),
  title text not null,
  url text not null default '',
  monitoring_month text,
  track_status text not null default '미개선',
  monitoring_in_progress boolean not null default false,
  qa_in_progress boolean not null default false,
  note text not null default '',
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint project_pages_track_status_check
    check (track_status in ('미개선', '개선', '일부', '중지'))
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  legacy_task_id text,
  member_id uuid not null references public.members(id) on delete cascade,
  created_by_member_id uuid references public.members(id),
  task_date date not null,
  project_id uuid references public.projects(id),
  project_page_id uuid references public.project_pages(id),
  task_type_id uuid references public.task_types(id),
  task_type1 text not null,
  task_type2 text not null,
  hours numeric(5, 1) not null default 0,
  content text not null,
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace view public.members_public_view as
select
  id,
  legacy_user_id,
  name,
  email,
  user_level,
  user_active,
  joined_at
from public.members;

create or replace view public.active_members_public_view as
select
  id,
  legacy_user_id,
  name,
  email,
  user_level,
  user_active,
  joined_at
from public.members
where user_active = true;

create or replace view public.project_pages_public_view as
select
  id,
  legacy_page_id,
  project_id,
  owner_member_id,
  title,
  url,
  monitoring_month,
  track_status,
  monitoring_in_progress,
  qa_in_progress,
  note,
  updated_at
from public.project_pages;

create index if not exists idx_tasks_member_date on public.tasks (member_id, task_date desc);
create index if not exists idx_project_pages_owner on public.project_pages (owner_member_id);
create index if not exists idx_projects_dates on public.projects (start_date, end_date);
create index if not exists idx_projects_name on public.projects (name);
create index if not exists idx_project_pages_lookup on public.project_pages (project_id, title, url);

drop trigger if exists members_set_updated_at on public.members;
create trigger members_set_updated_at
before update on public.members
for each row execute function public.set_updated_at();

drop trigger if exists service_groups_set_updated_at on public.service_groups;
create trigger service_groups_set_updated_at
before update on public.service_groups
for each row execute function public.set_updated_at();

drop trigger if exists task_types_set_updated_at on public.task_types;
create trigger task_types_set_updated_at
before update on public.task_types
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists project_pages_set_updated_at on public.project_pages;
create trigger project_pages_set_updated_at
before update on public.project_pages
for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create or replace function public.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.members
  where auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members
    where auth_user_id = auth.uid()
      and user_level = 1
      and user_active = true
  )
$$;

create or replace function public.next_member_legacy_user_id(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
  v_candidate text;
  v_suffix integer := 0;
begin
  v_base := lower(regexp_replace(split_part(coalesce(trim(p_email), ''), '@', 1), '[^a-z0-9]+', '-', 'g'));
  v_base := trim(both '-' from v_base);

  if v_base = '' then
    v_base := 'member';
  end if;

  v_candidate := v_base;

  while exists (
    select 1
    from public.members
    where legacy_user_id = v_candidate
  ) loop
    v_suffix := v_suffix + 1;
    v_candidate := v_base || '-' || v_suffix::text;
  end loop;

  return v_candidate;
end;
$$;

create or replace function public.bind_auth_session_member(
  p_auth_user_id uuid,
  p_email text default null
)
returns public.members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.members;
  v_email text := nullif(lower(trim(p_email)), '');
  v_display_name text;
  v_legacy_user_id text;
  v_members_count integer;
begin
  if p_auth_user_id is null then
    return null;
  end if;

  select *
  into v_member
  from public.members
  where auth_user_id = p_auth_user_id
  limit 1;

  if v_member.id is not null then
    return v_member;
  end if;

  if v_email is null then
    return null;
  end if;

  update public.members
  set
    auth_user_id = p_auth_user_id,
    email = v_email,
    updated_at = timezone('utc', now())
  where id = (
    select id
    from public.members
    where lower(email) = v_email
      and auth_user_id is null
    order by created_at
    limit 1
  )
  returning * into v_member;

  if v_member.id is not null then
    return v_member;
  end if;

  v_display_name := split_part(v_email, '@', 1);
  v_legacy_user_id := public.next_member_legacy_user_id(v_email);

  select count(*)
  into v_members_count
  from public.members;

  insert into public.members (
    auth_user_id,
    legacy_user_id,
    name,
    email,
    user_level,
    user_active,
    joined_at,
    report_required
  )
  values (
    p_auth_user_id,
    v_legacy_user_id,
    v_display_name,
    v_email,
    case when v_members_count = 0 then 1 else 0 end,
    true,
    timezone('utc', now()),
    true
  )
  returning * into v_member;

  return v_member;
end;
$$;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.email is not null then
    perform public.bind_auth_session_member(new.id, new.email);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_bind_member on auth.users;
create trigger on_auth_user_created_bind_member
after insert on auth.users
for each row execute function public.handle_auth_user_created();

create or replace function public.save_task(
  p_task_id uuid default null,
  p_task_date date default null,
  p_project_id uuid default null,
  p_project_page_id uuid default null,
  p_task_type1 text default null,
  p_task_type2 text default null,
  p_hours numeric default null,
  p_content text default null,
  p_note text default ''
)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid := public.current_member_id();
  v_task public.tasks;
begin
  if v_member_id is null then
    raise exception 'member not bound';
  end if;

  if p_task_date is null then
    raise exception 'task_date required';
  end if;

  if coalesce(trim(p_task_type1), '') = '' then
    raise exception 'task_type1 required';
  end if;

  if coalesce(trim(p_task_type2), '') = '' then
    raise exception 'task_type2 required';
  end if;

  if p_hours is null then
    raise exception 'hours required';
  end if;

  if coalesce(trim(p_content), '') = '' then
    raise exception 'content required';
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
      v_member_id,
      v_member_id,
      p_task_date,
      p_project_id,
      p_project_page_id,
      p_task_type1,
      p_task_type2,
      p_hours,
      p_content,
      coalesce(p_note, '')
    )
    returning * into v_task;
  else
    update public.tasks
    set
      task_date = p_task_date,
      project_id = p_project_id,
      project_page_id = p_project_page_id,
      task_type1 = p_task_type1,
      task_type2 = p_task_type2,
      hours = p_hours,
      content = p_content,
      note = coalesce(p_note, ''),
      updated_at = timezone('utc', now())
    where id = p_task_id
      and member_id = v_member_id
    returning * into v_task;

    if v_task is null then
      raise exception 'task not found';
    end if;
  end if;

  return v_task;
end;
$$;

create or replace function public.delete_task(
  p_task_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid := public.current_member_id();
begin
  if v_member_id is null then
    raise exception 'member not bound';
  end if;

  delete from public.tasks
  where id = p_task_id
    and member_id = v_member_id;
end;
$$;

create or replace function public.upsert_project(
  p_project_id uuid default null,
  p_project_type1 text default '',
  p_name text default null,
  p_platform text default null,
  p_service_group_id uuid default null,
  p_report_url text default '',
  p_reporter_member_id uuid default null,
  p_reviewer_member_id uuid default null,
  p_start_date date default null,
  p_end_date date default null,
  p_is_active boolean default true
)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid := public.current_member_id();
  v_project public.projects;
begin
  if v_member_id is null then
    raise exception 'member not bound';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'name required';
  end if;

  if coalesce(trim(p_platform), '') = '' then
    raise exception 'platform required';
  end if;

  if p_start_date is null then
    raise exception 'start_date required';
  end if;

  if p_end_date is null then
    raise exception 'end_date required';
  end if;

  if p_project_id is null then
    insert into public.projects (
      created_by_member_id,
      project_type1,
      name,
      platform,
      service_group_id,
      report_url,
      reporter_member_id,
      reviewer_member_id,
      start_date,
      end_date,
      is_active
    )
    values (
      v_member_id,
      coalesce(trim(p_project_type1), ''),
      p_name,
      p_platform,
      p_service_group_id,
      coalesce(p_report_url, ''),
      p_reporter_member_id,
      p_reviewer_member_id,
      p_start_date,
      p_end_date,
      p_is_active
    )
    returning * into v_project;
  else
    update public.projects
    set
      project_type1 = case
        when nullif(trim(p_project_type1), '') is null then public.projects.project_type1
        else trim(p_project_type1)
      end,
      name = p_name,
      platform = p_platform,
      service_group_id = p_service_group_id,
      report_url = coalesce(p_report_url, ''),
      reporter_member_id = p_reporter_member_id,
      reviewer_member_id = p_reviewer_member_id,
      start_date = p_start_date,
      end_date = p_end_date,
      is_active = p_is_active,
      updated_at = timezone('utc', now())
    where id = p_project_id
      and (
        created_by_member_id = v_member_id
        or reporter_member_id = v_member_id
        or public.current_user_is_admin()
      )
    returning * into v_project;

    if v_project is null then
      raise exception 'project not found';
    end if;
  end if;

  return v_project;
end;
$$;

create or replace function public.upsert_project_page(
  p_page_id uuid default null,
  p_project_id uuid default null,
  p_title text default null,
  p_url text default '',
  p_owner_member_id uuid default null,
  p_monitoring_month text default null,
  p_track_status text default '미개선',
  p_monitoring_in_progress boolean default false,
  p_qa_in_progress boolean default false,
  p_note text default ''
)
returns public.project_pages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid := public.current_member_id();
  v_page public.project_pages;
begin
  if v_member_id is null then
    raise exception 'member not bound';
  end if;

  if p_project_id is null then
    raise exception 'project_id required';
  end if;

  if coalesce(trim(p_title), '') = '' then
    raise exception 'title required';
  end if;

  if not exists (
    select 1
    from public.projects
    where id = p_project_id
      and (
        created_by_member_id = v_member_id
        or reporter_member_id = v_member_id
        or public.current_user_is_admin()
      )
  ) then
    raise exception 'project not found';
  end if;

  if p_page_id is null then
    insert into public.project_pages (
      project_id,
      owner_member_id,
      title,
      url,
      monitoring_month,
      track_status,
      monitoring_in_progress,
      qa_in_progress,
      note
    )
    values (
      p_project_id,
      coalesce(p_owner_member_id, v_member_id),
      p_title,
      coalesce(p_url, ''),
      p_monitoring_month,
      p_track_status,
      p_monitoring_in_progress,
      p_qa_in_progress,
      coalesce(p_note, '')
    )
    returning * into v_page;
  else
    update public.project_pages
    set
      project_id = p_project_id,
      owner_member_id = coalesce(p_owner_member_id, owner_member_id),
      title = p_title,
      url = coalesce(p_url, ''),
      monitoring_month = p_monitoring_month,
      track_status = p_track_status,
      monitoring_in_progress = p_monitoring_in_progress,
      qa_in_progress = p_qa_in_progress,
      note = coalesce(p_note, ''),
      updated_at = timezone('utc', now())
    where id = p_page_id
      and (
        owner_member_id = v_member_id
        or public.current_user_is_admin()
      )
    returning * into v_page;

    if v_page is null then
      raise exception 'project page not found';
    end if;
  end if;

  return v_page;
end;
$$;

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
  task_date date,
  project_id uuid,
  project_page_id uuid,
  task_type1 text,
  task_type2 text,
  hours numeric,
  content text,
  note text,
  updated_at timestamptz,
  member_name text,
  member_email text,
  project_name text,
  page_title text,
  service_group_id uuid,
  service_group_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.member_id,
    t.task_date,
    t.project_id,
    t.project_page_id,
    t.task_type1,
    t.task_type2,
    t.hours,
    t.content,
    t.note,
    t.updated_at,
    m.name as member_name,
    m.email as member_email,
    coalesce(p.name, '') as project_name,
    coalesce(pp.title, '') as page_title,
    p.service_group_id,
    coalesce(sg.name, '') as service_group_name
  from public.tasks t
  join public.members m on m.id = t.member_id
  left join public.projects p on p.id = t.project_id
  left join public.project_pages pp on pp.id = t.project_page_id
  left join public.service_groups sg on sg.id = p.service_group_id
  where public.current_user_is_admin()
    and (p_member_id is null or t.member_id = p_member_id)
    and (p_start_date is null or t.task_date >= p_start_date)
    and (p_end_date is null or t.task_date <= p_end_date)
    and (p_project_id is null or t.project_id = p_project_id)
    and (p_project_page_id is null or t.project_page_id = p_project_page_id)
    and (p_task_type1 is null or t.task_type1 = p_task_type1)
    and (p_task_type2 is null or t.task_type2 = p_task_type2)
    and (p_service_group_id is null or p.service_group_id = p_service_group_id)
    and (
      p_keyword is null
      or concat_ws(
        ' ',
        m.name,
        m.email,
        p.name,
        pp.title,
        t.task_type1,
        t.task_type2,
        t.content,
        t.note
      ) ilike '%' || p_keyword || '%'
    )
  order by t.task_date desc, t.updated_at desc
$$;

grant execute on function public.current_member_id() to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.next_member_legacy_user_id(text) to authenticated;
grant execute on function public.bind_auth_session_member(uuid, text) to authenticated;
grant execute on function public.save_task(uuid, date, uuid, uuid, text, text, numeric, text, text) to authenticated;
grant execute on function public.delete_task(uuid) to authenticated;
grant execute on function public.upsert_project(uuid, text, text, text, uuid, text, uuid, uuid, date, date, boolean) to authenticated;
grant execute on function public.upsert_project_page(uuid, uuid, text, text, uuid, text, text, boolean, boolean, text) to authenticated;
grant execute on function public.admin_search_tasks(uuid, date, date, uuid, uuid, text, text, uuid, text) to authenticated;

alter table public.members enable row level security;
alter table public.service_groups enable row level security;
alter table public.task_types enable row level security;
alter table public.projects enable row level security;
alter table public.project_pages enable row level security;
alter table public.tasks enable row level security;

create policy "members_self_select"
on public.members
for select
to authenticated
using (auth.uid() = auth_user_id or public.current_user_is_admin());

create policy "members_admin_insert"
on public.members
for insert
to authenticated
with check (public.current_user_is_admin());

create policy "members_admin_update"
on public.members
for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "members_admin_delete"
on public.members
for delete
to authenticated
using (public.current_user_is_admin());

create policy "service_groups_active_select"
on public.service_groups
for select
to authenticated
using (is_active = true or public.current_user_is_admin());

create policy "service_groups_admin_insert"
on public.service_groups
for insert
to authenticated
with check (public.current_user_is_admin());

create policy "service_groups_admin_update"
on public.service_groups
for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "service_groups_admin_delete"
on public.service_groups
for delete
to authenticated
using (public.current_user_is_admin());

create policy "task_types_active_select"
on public.task_types
for select
to authenticated
using (is_active = true or public.current_user_is_admin());

create policy "task_types_admin_insert"
on public.task_types
for insert
to authenticated
with check (public.current_user_is_admin());

create policy "task_types_admin_update"
on public.task_types
for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "task_types_admin_delete"
on public.task_types
for delete
to authenticated
using (public.current_user_is_admin());

create policy "projects_select_authenticated"
on public.projects
for select
to authenticated
using (true);

create policy "projects_write_owner_or_admin"
on public.projects
for all
to authenticated
using (
  created_by_member_id = public.current_member_id()
  or reporter_member_id = public.current_member_id()
  or public.current_user_is_admin()
)
with check (
  created_by_member_id = public.current_member_id()
  or reporter_member_id = public.current_member_id()
  or public.current_user_is_admin()
);

create policy "project_pages_select_owner_or_admin"
on public.project_pages
for select
to authenticated
using (
  owner_member_id = public.current_member_id()
  or public.current_user_is_admin()
);

create policy "project_pages_write_owner_or_admin"
on public.project_pages
for all
to authenticated
using (
  owner_member_id = public.current_member_id()
  or public.current_user_is_admin()
)
with check (
  owner_member_id = public.current_member_id()
  or public.current_user_is_admin()
);

create policy "tasks_select_own_or_admin"
on public.tasks
for select
to authenticated
using (
  member_id = public.current_member_id()
  or public.current_user_is_admin()
);

create policy "tasks_write_own_or_admin"
on public.tasks
for all
to authenticated
using (
  member_id = public.current_member_id()
  or public.current_user_is_admin()
)
with check (
  member_id = public.current_member_id()
  or public.current_user_is_admin()
);

grant select on public.members_public_view to authenticated;
grant select on public.active_members_public_view to authenticated;
grant select on public.project_pages_public_view to authenticated;
