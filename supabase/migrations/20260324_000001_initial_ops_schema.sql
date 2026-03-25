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

create or replace view public.active_members_public_view as
select
  id,
  legacy_user_id,
  name,
  email,
  user_level
from public.members
where user_active = true;

create index if not exists idx_tasks_member_date on public.tasks (member_id, task_date desc);
create index if not exists idx_project_pages_owner on public.project_pages (owner_member_id);
create index if not exists idx_projects_dates on public.projects (start_date, end_date);

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
as $$
  select exists (
    select 1
    from public.members
    where auth_user_id = auth.uid()
      and user_level = 1
      and user_active = true
  )
$$;

create or replace function public.save_task(
  p_task_id uuid default null,
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
  v_member_id uuid := public.current_member_id();
  v_task public.tasks;
begin
  if v_member_id is null then
    raise exception 'member not bound';
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
  p_name text,
  p_platform text,
  p_service_group_id uuid default null,
  p_report_url text default '',
  p_reporter_member_id uuid default null,
  p_reviewer_member_id uuid default null,
  p_start_date date,
  p_end_date date,
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

  if p_project_id is null then
    insert into public.projects (
      created_by_member_id,
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
  p_project_id uuid,
  p_title text,
  p_url text default '',
  p_owner_member_id uuid default null,
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

  if p_page_id is null then
    insert into public.project_pages (
      project_id,
      owner_member_id,
      title,
      url,
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

grant execute on function public.save_task(uuid, date, uuid, uuid, text, text, numeric, text, text) to authenticated;
grant execute on function public.delete_task(uuid) to authenticated;
grant execute on function public.upsert_project(uuid, text, text, uuid, text, uuid, uuid, date, date, boolean) to authenticated;
grant execute on function public.upsert_project_page(uuid, uuid, text, text, uuid, text, boolean, boolean, text) to authenticated;

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

create policy "members_self_update"
on public.members
for update
to authenticated
using (auth.uid() = auth_user_id or public.current_user_is_admin())
with check (auth.uid() = auth_user_id or public.current_user_is_admin());

create policy "service_groups_active_select"
on public.service_groups
for select
to authenticated
using (is_active = true or public.current_user_is_admin());

create policy "task_types_active_select"
on public.task_types
for select
to authenticated
using (is_active = true or public.current_user_is_admin());

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

grant select on public.active_members_public_view to authenticated;

comment on table public.members is '1차 사용자/관리자 구분과 auth binding만 유지한다.';
comment on table public.tasks is '개인 업무보고, 개인 검색/다운로드의 기준 테이블.';
comment on table public.projects is '프로젝트 마스터. AppInfo/추천모니터링과 직접 연결된 테이블은 별도 생성하지 않는다.';
comment on table public.project_pages is '페이지 마스터와 트래킹 상태. 대시보드/모니터링 통계의 직접 소스.';
