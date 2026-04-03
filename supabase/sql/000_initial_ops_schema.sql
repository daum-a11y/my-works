create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  account_id text not null unique,
  name text not null,
  email text not null unique,
  note text not null default '',
  user_level smallint not null default 0,
  user_active boolean not null default true,
  member_status text not null default 'active',
  report_required boolean not null default true,
  joined_at timestamptz not null default timezone('utc', now()),
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint members_member_status_check
    check (member_status in ('pending', 'active'))
);

create table if not exists public.service_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cost_group_id uuid,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cost_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.service_groups
  drop constraint if exists service_groups_cost_group_id_fkey;

alter table public.service_groups
  add constraint service_groups_cost_group_id_fkey
  foreign key (cost_group_id) references public.cost_groups(id);

create table if not exists public.task_types (
  id uuid primary key default gen_random_uuid(),
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
  created_by_member_id uuid references public.members(id),
  project_type1 text not null default '',
  name text not null,
  platform_id uuid references public.platforms(id),
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
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_member_id uuid references public.members(id),
  title text not null,
  url text not null default '',
  monitoring_month text,
  track_status text not null default '미수정',
  monitoring_in_progress boolean not null default false,
  qa_in_progress boolean not null default false,
  note text not null default '',
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint project_pages_track_status_check
    check (track_status in ('미수정', '전체 수정', '일부 수정'))
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  created_by_member_id uuid references public.members(id),
  task_date date not null,
  cost_group_id uuid references public.cost_groups(id),
  project_id uuid references public.projects(id),
  project_page_id uuid references public.project_pages(id),
  task_type_id uuid references public.task_types(id),
  task_type1 text not null,
  task_type2 text not null,
  task_usedtime numeric(5, 1) not null default 0,
  content text not null,
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.tasks
  add column if not exists cost_group_id uuid;

alter table public.tasks
  drop constraint if exists tasks_cost_group_id_fkey;

alter table public.tasks
  add constraint tasks_cost_group_id_fkey
  foreign key (cost_group_id) references public.cost_groups(id);

insert into public.cost_groups (name, display_order, is_active)
select '내부', 0, true
where not exists (
  select 1
  from public.cost_groups
  where trim(name) = '내부'
);

update public.tasks t
set cost_group_id = coalesce(
  (
    select sg.cost_group_id
    from public.projects p
    left join public.service_groups sg on sg.id = p.service_group_id
    where p.id = t.project_id
  ),
  (
    select cg.id
    from public.cost_groups cg
    where trim(cg.name) = '내부'
    order by cg.display_order asc, cg.created_at asc
    limit 1
  )
)
where t.cost_group_id is null;

alter table public.tasks
  alter column cost_group_id set not null;

create index if not exists tasks_cost_group_id_idx on public.tasks(cost_group_id);
create index if not exists tasks_task_date_cost_group_id_idx on public.tasks(task_date, cost_group_id);

create or replace view public.members_public_view
with (security_invoker = true) as
select
  id,
  account_id,
  name,
  user_level,
  user_active,
  member_status,
  report_required,
  joined_at
from public.members;

create or replace view public.active_members_public_view
with (security_invoker = true) as
select
  id,
  account_id,
  name,
  user_level,
  user_active,
  member_status,
  report_required,
  joined_at
from public.members
where user_active = true;

create or replace view public.project_pages_public_view
with (security_invoker = true) as
select
  id,
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

drop trigger if exists cost_groups_set_updated_at on public.cost_groups;
create trigger cost_groups_set_updated_at
before update on public.cost_groups
for each row execute function public.set_updated_at();

drop trigger if exists platforms_set_updated_at on public.platforms;
create trigger platforms_set_updated_at
before update on public.platforms
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
    and user_active = true
    and member_status = 'active'
  limit 1
$$;

create or replace function public.current_user_is_active_member()
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
      and user_active = true
      and member_status = 'active'
  )
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
      and member_status = 'active'
  )
$$;

create or replace function public.next_member_account_id(p_email text)
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
    where account_id = v_candidate
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
  v_session_auth_user_id uuid := auth.uid();
  v_session_email text := nullif(lower(trim(coalesce(auth.jwt() ->> 'email', ''))), '');
  v_email text := nullif(lower(trim(p_email)), '');
begin
  if p_auth_user_id is null then
    return null;
  end if;

  if v_session_auth_user_id is not null and p_auth_user_id <> v_session_auth_user_id then
    raise exception 'auth user mismatch';
  end if;

  if v_email is null then
    v_email := v_session_email;
  end if;

  if v_session_auth_user_id is not null and v_session_email is not null and v_email <> v_session_email then
    raise exception 'auth email mismatch';
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

  return null;
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

drop function if exists public.save_task(uuid, date, uuid, uuid, text, text, numeric, text, text);

create or replace function public.save_task(
  p_task_id uuid default null,
  p_task_date date default null,
  p_cost_group_id uuid default null,
  p_project_id uuid default null,
  p_project_page_id uuid default null,
  p_task_type1 text default null,
  p_task_type2 text default null,
  p_task_usedtime numeric default null,
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
  v_project_cost_group_id uuid;
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

  if p_task_usedtime is null then
    raise exception 'task_usedtime required';
  end if;

  if p_cost_group_id is null then
    raise exception 'cost_group_id required';
  end if;

  if coalesce(trim(p_content), '') = '' then
    raise exception 'content required';
  end if;

  if not exists (
    select 1
    from public.cost_groups
    where id = p_cost_group_id
  ) then
    raise exception 'cost_group not found';
  end if;

  if p_project_id is not null then
    select sg.cost_group_id
    into v_project_cost_group_id
    from public.projects p
    left join public.service_groups sg on sg.id = p.service_group_id
    where p.id = p_project_id;

    if v_project_cost_group_id is distinct from p_cost_group_id then
      raise exception 'project cost_group mismatch';
    end if;
  end if;

  if p_task_id is null then
    insert into public.tasks (
      member_id,
      created_by_member_id,
      task_date,
      cost_group_id,
      project_id,
      project_page_id,
      task_type1,
      task_type2,
      task_usedtime,
      content,
      note
    )
    values (
      v_member_id,
      v_member_id,
      p_task_date,
      p_cost_group_id,
      p_project_id,
      p_project_page_id,
      p_task_type1,
      p_task_type2,
      p_task_usedtime,
      p_content,
      coalesce(p_note, '')
    )
    returning * into v_task;
  else
    update public.tasks
    set
      task_date = p_task_date,
      cost_group_id = p_cost_group_id,
      project_id = p_project_id,
      project_page_id = p_project_page_id,
      task_type1 = p_task_type1,
      task_type2 = p_task_type2,
      task_usedtime = p_task_usedtime,
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

drop function if exists public.search_tasks_json(uuid, date, date, date, uuid, uuid, text, text, numeric, numeric, text);

create or replace function public.get_dashboard_task_calendar(
  p_member_id uuid default null,
  p_month text default null
)
returns table (
  task_date date,
  task_usedtime numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with month_bounds as (
    select
      to_date(p_month || '-01', 'YYYY-MM-DD') as month_start,
      (to_date(p_month || '-01', 'YYYY-MM-DD') + interval '1 month')::date as month_end
  )
  select
    t.task_date,
    sum(t.task_usedtime) as task_usedtime
  from public.tasks t
  join month_bounds mb on true
  where public.current_member_id() is not null
    and p_month is not null
    and t.member_id = coalesce(p_member_id, public.current_member_id())
    and t.task_date >= mb.month_start
    and t.task_date < mb.month_end
  group by t.task_date
  order by t.task_date asc
$$;

drop function if exists public.get_tasks_by_date(uuid, date);

create or replace function public.get_tasks_by_date(
  p_member_id uuid default null,
  p_task_date date default null
)
returns table (
  id uuid,
  member_id uuid,
  task_date date,
  cost_group_id uuid,
  cost_group_name text,
  project_id uuid,
  project_page_id uuid,
  task_type1 text,
  task_type2 text,
  task_usedtime numeric,
  content text,
  note text,
  created_at timestamptz,
  updated_at timestamptz,
  platform text,
  service_group_name text,
  service_name text,
  project_display_name text,
  page_display_name text,
  page_url text
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
    t.cost_group_id,
    coalesce(cg.name, '') as cost_group_name,
    t.project_id,
    t.project_page_id,
    t.task_type1,
    t.task_type2,
    t.task_usedtime,
    t.content,
    t.note,
    t.created_at,
    t.updated_at
    ,
    coalesce(nullif(p.platform, ''), '-') as platform,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then ''
      when position(' / ' in sg.name) > 0 then split_part(sg.name, ' / ', 1)
      else sg.name
    end as service_group_name,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then ''
      when position(' / ' in sg.name) > 0 then coalesce(nullif(split_part(sg.name, ' / ', 2), ''), '')
      else sg.name
    end as service_name,
    coalesce(nullif(p.name, ''), '') as project_display_name,
    coalesce(nullif(pp.title, ''), '') as page_display_name,
    coalesce(pp.url, '') as page_url
  from public.tasks t
  left join public.cost_groups cg on cg.id = t.cost_group_id
  left join public.projects p on p.id = t.project_id
  left join public.project_pages pp on pp.id = t.project_page_id
  left join public.service_groups sg on sg.id = p.service_group_id
  where public.current_member_id() is not null
    and p_task_date is not null
    and (
      (public.current_user_is_admin() and t.member_id = coalesce(p_member_id, public.current_member_id()))
      or (
        not public.current_user_is_admin()
        and t.member_id = public.current_member_id()
        and (p_member_id is null or p_member_id = public.current_member_id())
      )
    )
    and t.task_date = p_task_date
  order by t.id desc
$$;

create or replace function public.get_task_activities()
returns table (
  member_id uuid,
  task_date date,
  task_usedtime numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.member_id,
    t.task_date,
    t.task_usedtime
  from public.tasks t
  where public.current_member_id() is not null
$$;

create or replace function public.get_resource_summary(
  p_member_id uuid default null,
  p_month text default null
)
returns table (
  member_id uuid,
  account_id text,
  member_name text,
  task_date date,
  task_usedtime numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with month_bounds as (
    select
      to_date(p_month || '-01', 'YYYY-MM-DD') as month_start,
      (to_date(p_month || '-01', 'YYYY-MM-DD') + interval '1 month')::date as month_end
  )
  select
    m.id as member_id,
    m.account_id,
    m.name as member_name,
    t.task_date,
    sum(t.task_usedtime) as task_usedtime
  from public.tasks t
  join public.members m on m.id = t.member_id
  join month_bounds mb on true
  where public.current_member_id() is not null
    and p_month is not null
    and m.user_active = true
    and (
      (public.current_user_is_admin() and (p_member_id is null or t.member_id = p_member_id))
      or (
        not public.current_user_is_admin()
        and t.member_id = public.current_member_id()
        and (p_member_id is null or p_member_id = public.current_member_id())
      )
    )
    and t.task_date >= mb.month_start
    and t.task_date < mb.month_end
  group by m.id, m.account_id, m.name, t.task_date
  order by m.account_id asc, t.task_date asc
$$;

create or replace function public.get_resource_type_summary(
  p_member_id uuid default null
)
returns table (
  year text,
  month text,
  task_type1 text,
  task_usedtime numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    to_char(t.task_date, 'YYYY') as year,
    to_char(t.task_date, 'MM') as month,
    t.task_type1,
    sum(t.task_usedtime) as task_usedtime
  from public.tasks t
  join public.members m on m.id = t.member_id
  where public.current_member_id() is not null
    and m.user_active = true
    and (
      (public.current_user_is_admin() and (p_member_id is null or t.member_id = p_member_id))
      or (
        not public.current_user_is_admin()
        and t.member_id = public.current_member_id()
        and (p_member_id is null or p_member_id = public.current_member_id())
      )
    )
  group by to_char(t.task_date, 'YYYY'), to_char(t.task_date, 'MM'), t.task_type1
  order by year desc, month desc, task_type1 asc
$$;

create or replace function public.get_resource_type_summary_years(
  p_member_id uuid default null
)
returns table (
  year text
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct to_char(t.task_date, 'YYYY') as year
  from public.tasks t
  join public.members m on m.id = t.member_id
  where public.current_member_id() is not null
    and m.user_active = true
    and (
      (public.current_user_is_admin() and (p_member_id is null or t.member_id = p_member_id))
      or (
        not public.current_user_is_admin()
        and t.member_id = public.current_member_id()
        and (p_member_id is null or p_member_id = public.current_member_id())
      )
    )
  order by year desc
$$;

create or replace function public.get_resource_type_summary_by_year(
  p_member_id uuid default null,
  p_year text default null
)
returns table (
  year text,
  month text,
  task_type1 text,
  task_usedtime numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    to_char(t.task_date, 'YYYY') as year,
    to_char(t.task_date, 'MM') as month,
    t.task_type1,
    sum(t.task_usedtime) as task_usedtime
  from public.tasks t
  join public.members m on m.id = t.member_id
  where public.current_member_id() is not null
    and p_year is not null
    and m.user_active = true
    and (
      (public.current_user_is_admin() and (p_member_id is null or t.member_id = p_member_id))
      or (
        not public.current_user_is_admin()
        and t.member_id = public.current_member_id()
        and (p_member_id is null or p_member_id = public.current_member_id())
      )
    )
    and to_char(t.task_date, 'YYYY') = p_year
  group by to_char(t.task_date, 'YYYY'), to_char(t.task_date, 'MM'), t.task_type1
  order by month desc, task_type1 asc
$$;

create or replace function public.get_resource_service_summary(
  p_member_id uuid default null
)
returns table (
  year text,
  month text,
  cost_group_name text,
  service_group_name text,
  service_name text,
  task_usedtime numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    to_char(t.task_date, 'YYYY') as year,
    to_char(t.task_date, 'MM') as month,
    cg.name as cost_group_name,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then split_part(sg.name, ' / ', 1)
      else sg.name
    end as service_group_name,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then coalesce(nullif(split_part(sg.name, ' / ', 2), ''), '미분류')
      else sg.name
    end as service_name,
    sum(t.task_usedtime) as task_usedtime
  from public.tasks t
  join public.members m on m.id = t.member_id
  join public.cost_groups cg on cg.id = t.cost_group_id
  left join public.projects p on p.id = t.project_id
  left join public.service_groups sg on sg.id = p.service_group_id
  left join public.task_types tt
    on tt.type1 = t.task_type1
   and tt.type2 = t.task_type2
  where public.current_member_id() is not null
    and m.user_active = true
    and (
      (public.current_user_is_admin() and (p_member_id is null or t.member_id = p_member_id))
      or (
        not public.current_user_is_admin()
        and t.member_id = public.current_member_id()
        and (p_member_id is null or p_member_id = public.current_member_id())
      )
    )
    and coalesce(tt.requires_service_group, t.project_id is not null)
  group by
    to_char(t.task_date, 'YYYY'),
    to_char(t.task_date, 'MM'),
    cg.name,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then split_part(sg.name, ' / ', 1)
      else sg.name
    end,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then coalesce(nullif(split_part(sg.name, ' / ', 2), ''), '미분류')
      else sg.name
    end
  order by year desc, month desc, cost_group_name asc, service_group_name asc, service_name asc
$$;

create or replace function public.get_resource_service_summary_years(
  p_member_id uuid default null
)
returns table (
  year text
)
language sql
stable
security definer
set search_path = public
as $$
  select distinct to_char(t.task_date, 'YYYY') as year
  from public.tasks t
  join public.members m on m.id = t.member_id
  left join public.projects p on p.id = t.project_id
  left join public.task_types tt
    on tt.type1 = t.task_type1
   and tt.type2 = t.task_type2
  where public.current_member_id() is not null
    and m.user_active = true
    and (
      (public.current_user_is_admin() and (p_member_id is null or t.member_id = p_member_id))
      or (
        not public.current_user_is_admin()
        and t.member_id = public.current_member_id()
        and (p_member_id is null or p_member_id = public.current_member_id())
      )
    )
    and coalesce(tt.requires_service_group, t.project_id is not null)
  order by year desc
$$;

create or replace function public.get_resource_service_summary_by_year(
  p_member_id uuid default null,
  p_year text default null
)
returns table (
  year text,
  month text,
  cost_group_name text,
  service_group_name text,
  service_name text,
  task_usedtime numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    to_char(t.task_date, 'YYYY') as year,
    to_char(t.task_date, 'MM') as month,
    coalesce(cg.name, '미분류') as cost_group_name,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then split_part(sg.name, ' / ', 1)
      else sg.name
    end as service_group_name,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then nullif(split_part(sg.name, ' / ', 2), '')
      else sg.name
    end as service_name,
    sum(t.task_usedtime) as task_usedtime
  from public.tasks t
  join public.members m on m.id = t.member_id
  left join public.projects p on p.id = t.project_id
  left join public.service_groups sg on sg.id = p.service_group_id
  left join public.cost_groups cg on cg.id = sg.cost_group_id
  left join public.task_types tt
    on tt.type1 = t.task_type1
   and tt.type2 = t.task_type2
  where public.current_member_id() is not null
    and p_year is not null
    and m.user_active = true
    and (
      (public.current_user_is_admin() and (p_member_id is null or t.member_id = p_member_id))
      or (
        not public.current_user_is_admin()
        and t.member_id = public.current_member_id()
        and (p_member_id is null or p_member_id = public.current_member_id())
      )
    )
    and to_char(t.task_date, 'YYYY') = p_year
    and coalesce(tt.requires_service_group, t.project_id is not null)
  group by
    to_char(t.task_date, 'YYYY'),
    to_char(t.task_date, 'MM'),
    coalesce(cg.name, '미분류'),
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then split_part(sg.name, ' / ', 1)
      else sg.name
    end,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then coalesce(nullif(split_part(sg.name, ' / ', 2), ''), '미분류')
      else sg.name
    end
  order by month desc, cost_group_name asc, service_group_name asc, service_name asc
$$;

drop function if exists public.get_resource_month_report(uuid, text);

create or replace function public.get_resource_month_report(
  p_member_id uuid default null,
  p_month text default null
)
returns table (
  member_id uuid,
  account_id text,
  task_date date,
  cost_group_id uuid,
  task_type1 text,
  task_type2 text,
  task_usedtime numeric,
  is_service_task boolean,
  cost_group_name text,
  service_group_name text,
  service_name text
)
language sql
stable
security definer
set search_path = public
as $$
  with month_bounds as (
    select
      to_date(p_month || '-01', 'YYYY-MM-DD') as month_start,
      (to_date(p_month || '-01', 'YYYY-MM-DD') + interval '1 month')::date as month_end
  )
  select
    t.member_id,
    m.account_id,
    t.task_date,
    t.cost_group_id,
    t.task_type1,
    t.task_type2,
    t.task_usedtime,
    coalesce(tt.requires_service_group, t.project_id is not null) as is_service_task,
    cg.name as cost_group_name,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then split_part(sg.name, ' / ', 1)
      else sg.name
    end as service_group_name,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then coalesce(nullif(split_part(sg.name, ' / ', 2), ''), '미분류')
      else sg.name
    end as service_name
  from public.tasks t
  join public.members m on m.id = t.member_id
  join month_bounds mb on true
  join public.cost_groups cg on cg.id = t.cost_group_id
  left join public.projects p on p.id = t.project_id
  left join public.service_groups sg on sg.id = p.service_group_id
  left join public.task_types tt
    on tt.type1 = t.task_type1
   and tt.type2 = t.task_type2
  where public.current_member_id() is not null
    and p_month is not null
    and m.user_active = true
    and (
      (public.current_user_is_admin() and (p_member_id is null or t.member_id = p_member_id))
      or (
        not public.current_user_is_admin()
        and t.member_id = public.current_member_id()
        and (p_member_id is null or p_member_id = public.current_member_id())
      )
    )
    and t.task_date >= mb.month_start
    and t.task_date < mb.month_end
  order by t.task_date asc, m.account_id asc, t.id asc
$$;

create or replace function public.get_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with page_rows as (
    select
      pp.track_status,
      pp.note,
      p.start_date,
      p.end_date,
      pp.monitoring_month
    from public.project_pages pp
    join public.projects p on p.id = pp.project_id
  ),
  status_counts as (
    select
      pr.track_status as status,
      count(*)::bigint as count
    from page_rows pr
    group by pr.track_status
  ),
  type_counts as (
    select
      t.task_type1 as type,
      sum(t.task_usedtime) as task_usedtime
    from public.tasks t
    group by t.task_type1
  ),
  monitoring_count as (
    select count(*)::bigint as count
    from page_rows pr
    where regexp_replace(coalesce(pr.monitoring_month, ''), '\D', '', 'g') <> ''
      and (
        case
          when length(regexp_replace(coalesce(pr.monitoring_month, ''), '\D', '', 'g')) = 4
            then
              '20' || left(regexp_replace(pr.monitoring_month, '\D', '', 'g'), 2) || '-' ||
              right(regexp_replace(pr.monitoring_month, '\D', '', 'g'), 2)
          else ''
        end
      ) in (
        to_char(date_trunc('month', current_date), 'YYYY-MM'),
        to_char(date_trunc('month', current_date - interval '1 month'), 'YYYY-MM')
      )
      and coalesce(pr.note, '') !~ 'agit_date:\s*\d{4}-\d{2}-\d{2}'
      and pr.track_status <> '미수정'
  ),
  qa_count as (
    select count(*)::bigint as count
    from page_rows pr
    where pr.start_date <= current_date
      and pr.end_date > current_date
  ),
  task_totals as (
    select
      count(*)::bigint as total_tasks,
      coalesce(sum(t.task_usedtime), 0) as total_task_usedtime
    from public.tasks t
  )
  select jsonb_build_object(
    'total_task_usedtime', tt.total_task_usedtime,
    'total_tasks', tt.total_tasks,
    'monitoring_in_progress', mc.count,
    'qa_in_progress', qc.count,
    'status_breakdown',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'status', sc.status,
              'count', sc.count
            )
            order by sc.status
          )
          from status_counts sc
        ),
        '[]'::jsonb
      ),
    'type_breakdown',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'type', tc.type,
              'task_usedtime', tc.task_usedtime
            )
            order by tc.type
          )
          from type_counts tc
        ),
        '[]'::jsonb
      )
  )
  from task_totals tt
  cross join monitoring_count mc
  cross join qa_count qc
$$;

create or replace function public.get_monitoring_stats_rows()
returns table (
  page_id uuid,
  project_id uuid,
  title text,
  url text,
  owner_member_id uuid,
  monitoring_month text,
  track_status text,
  monitoring_in_progress boolean,
  qa_in_progress boolean,
  note text,
  updated_at timestamptz,
  service_group_name text,
  project_name text,
  platform text,
  assignee_display text,
  report_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pp.id as page_id,
    p.id as project_id,
    pp.title,
    pp.url,
    pp.owner_member_id,
    coalesce(pp.monitoring_month, '') as monitoring_month,
    pp.track_status,
    pp.monitoring_in_progress,
    pp.qa_in_progress,
    coalesce(pp.note, '') as note,
    pp.updated_at,
    coalesce(sg.name, '-') as service_group_name,
    p.name as project_name,
    coalesce(nullif(p.platform, ''), '-') as platform,
    coalesce(
      nullif(concat_ws(' ', nullif(owner.account_id, ''), nullif(owner.name, '')), ''),
      '미지정'
    ) as assignee_display,
    coalesce(p.report_url, '') as report_url
  from public.project_pages pp
  join public.projects p on p.id = pp.project_id
  left join public.service_groups sg on sg.id = p.service_group_id
  left join public.members owner on owner.id = pp.owner_member_id
  order by pp.updated_at desc, pp.id desc
$$;

create or replace function public.get_qa_stats_projects()
returns table (
  id uuid,
  type1 text,
  name text,
  service_group_name text,
  report_url text,
  reporter_display text,
  start_date date,
  end_date date,
  is_active boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.project_type1 as type1,
    p.name,
    coalesce(sg.name, '-') as service_group_name,
    coalesce(p.report_url, '') as report_url,
    coalesce(
      nullif(concat_ws(' ', nullif(reporter.account_id, ''), nullif(reporter.name, '')), ''),
      '미지정'
    ) as reporter_display,
    p.start_date,
    p.end_date,
    p.is_active
  from public.projects p
  left join public.service_groups sg on sg.id = p.service_group_id
  left join public.members reporter on reporter.id = p.reporter_member_id
  where lower(trim(p.project_type1)) in ('qa', '접근성테스트')
  order by p.end_date desc, p.name asc
$$;

drop function if exists public.search_tasks_export(uuid, date, date, uuid, uuid, text, text, numeric, numeric, text);

create or replace function public.search_tasks_export(
  p_member_id uuid default null,
  p_start_date date default null,
  p_end_date date default null,
  p_project_id uuid default null,
  p_project_page_id uuid default null,
  p_task_type1 text default null,
  p_task_type2 text default null,
  p_min_task_usedtime numeric default null,
  p_max_task_usedtime numeric default null,
  p_keyword text default null
)
returns table (
  id uuid,
  member_id uuid,
  task_date date,
  cost_group_id uuid,
  cost_group_name text,
  project_id uuid,
  project_page_id uuid,
  task_type1 text,
  task_type2 text,
  task_usedtime numeric,
  content text,
  note text,
  created_at timestamptz,
  updated_at timestamptz
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
    t.cost_group_id,
    cg.name as cost_group_name,
    t.project_id,
    t.project_page_id,
    t.task_type1,
    t.task_type2,
    t.task_usedtime,
    t.content,
    t.note,
    t.created_at,
    t.updated_at,
    coalesce(nullif(p.platform, ''), '-') as platform,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then split_part(sg.name, ' / ', 1)
      else sg.name
    end as service_group_name,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then coalesce(nullif(split_part(sg.name, ' / ', 2), ''), '미분류')
      else sg.name
    end as service_name,
    coalesce(nullif(p.name, ''), '-') as project_display_name,
    coalesce(nullif(pp.title, ''), '-') as page_display_name,
    coalesce(pp.url, '') as page_url
  from public.tasks t
  join public.cost_groups cg on cg.id = t.cost_group_id
  left join public.projects p on p.id = t.project_id
  left join public.project_pages pp on pp.id = t.project_page_id
  left join public.service_groups sg on sg.id = p.service_group_id
  where public.current_member_id() is not null
    and (
      (public.current_user_is_admin() and (p_member_id is null or t.member_id = p_member_id))
      or (
        not public.current_user_is_admin()
        and t.member_id = public.current_member_id()
        and (p_member_id is null or p_member_id = public.current_member_id())
      )
    )
    and (p_start_date is null or t.task_date >= p_start_date)
    and (p_end_date is null or t.task_date <= p_end_date)
    and (p_project_id is null or t.project_id = p_project_id)
    and (p_project_page_id is null or t.project_page_id = p_project_page_id)
    and (p_task_type1 is null or t.task_type1 = p_task_type1)
    and (p_task_type2 is null or t.task_type2 = p_task_type2)
    and (p_min_task_usedtime is null or t.task_usedtime >= p_min_task_usedtime)
    and (p_max_task_usedtime is null or t.task_usedtime <= p_max_task_usedtime)
    and (
      p_keyword is null
      or concat_ws(
        ' ',
        coalesce(p.name, ''),
        coalesce(pp.title, ''),
        t.task_type1,
        t.task_type2,
        t.content,
        t.note
      ) ilike '%' || p_keyword || '%'
    )
  order by t.task_date desc, t.id desc
$$;

drop function if exists public.search_tasks_page(uuid, date, date, uuid, uuid, text, text, numeric, numeric, text);

create or replace function public.search_tasks_page(
  p_member_id uuid default null,
  p_start_date date default null,
  p_end_date date default null,
  p_project_id uuid default null,
  p_project_page_id uuid default null,
  p_task_type1 text default null,
  p_task_type2 text default null,
  p_min_task_usedtime numeric default null,
  p_max_task_usedtime numeric default null,
  p_keyword text default null
)
returns table (
  id uuid,
  member_id uuid,
  task_date date,
  cost_group_id uuid,
  cost_group_name text,
  task_type1 text,
  task_type2 text,
  task_usedtime numeric,
  content text,
  note text,
  updated_at timestamptz,
  platform text,
  service_group_name text,
  service_name text,
  project_display_name text,
  page_display_name text,
  page_url text
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
    t.cost_group_id,
    cg.name as cost_group_name,
    t.task_type1,
    t.task_type2,
    t.task_usedtime,
    t.content,
    t.note,
    t.updated_at,
    coalesce(nullif(p.platform, ''), '-') as platform,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then split_part(sg.name, ' / ', 1)
      else sg.name
    end as service_group_name,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then coalesce(nullif(split_part(sg.name, ' / ', 2), ''), '미분류')
      else sg.name
    end as service_name,
    coalesce(nullif(p.name, ''), '-') as project_display_name,
    coalesce(nullif(pp.title, ''), '-') as page_display_name,
    coalesce(pp.url, '') as page_url
  from public.tasks t
  join public.cost_groups cg on cg.id = t.cost_group_id
  left join public.projects p on p.id = t.project_id
  left join public.project_pages pp on pp.id = t.project_page_id
  left join public.service_groups sg on sg.id = p.service_group_id
  where public.current_member_id() is not null
    and t.member_id = coalesce(p_member_id, public.current_member_id())
    and (p_start_date is null or t.task_date >= p_start_date)
    and (p_end_date is null or t.task_date <= p_end_date)
    and (p_project_id is null or t.project_id = p_project_id)
    and (p_project_page_id is null or t.project_page_id = p_project_page_id)
    and (p_task_type1 is null or t.task_type1 = p_task_type1)
    and (p_task_type2 is null or t.task_type2 = p_task_type2)
    and (p_min_task_usedtime is null or t.task_usedtime >= p_min_task_usedtime)
    and (p_max_task_usedtime is null or t.task_usedtime <= p_max_task_usedtime)
    and (
      p_keyword is null
      or concat_ws(
        ' ',
        coalesce(t.content, ''),
        coalesce(t.note, ''),
        coalesce(t.task_type1, ''),
        coalesce(t.task_type2, ''),
        coalesce(p.name, ''),
        coalesce(pp.title, '')
      ) ilike '%' || p_keyword || '%'
    )
  order by t.task_date desc, t.id desc
$$;

create or replace function public.admin_get_member_task_count(
  p_member_id uuid
)
returns table (
  task_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint as task_count
  from public.tasks t
  where public.current_user_is_admin()
    and t.member_id = p_member_id
$$;

create or replace function public.touch_member_last_login(
  p_auth_user_id uuid default null,
  p_email text default null
)
returns public.members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.members;
  v_member_id uuid;
begin
  v_member := public.bind_auth_session_member(p_auth_user_id, p_email);
  v_member_id := v_member.id;

  if v_member_id is null or coalesce(v_member.user_active, false) is not true then
    return null;
  end if;

  update public.members
  set
    last_login_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where id = v_member_id
  returning * into v_member;

  return v_member;
end;
$$;

create or replace function public.upsert_project(
  p_project_id uuid default null,
  p_project_type1 text default '',
  p_name text default null,
  p_platform_id uuid default null,
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
  v_platform_name text;
begin
  if v_member_id is null then
    raise exception 'member not bound';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'name required';
  end if;

  if p_platform_id is null then
    raise exception 'platform required';
  end if;

  select name
  into v_platform_name
  from public.platforms
  where id = p_platform_id;

  if coalesce(trim(v_platform_name), '') = '' then
    raise exception 'platform not found';
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
      platform_id,
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
      p_platform_id,
      v_platform_name,
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
      platform_id = p_platform_id,
      platform = v_platform_name,
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
  p_track_status text default '미수정',
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

drop function if exists public.admin_get_task(uuid);

create or replace function public.admin_get_task(
  p_task_id uuid
)
returns table (
  id uuid,
  member_id uuid,
  task_date date,
  cost_group_id uuid,
  cost_group_name text,
  project_id uuid,
  project_page_id uuid,
  task_type1 text,
  task_type2 text,
  task_usedtime numeric,
  content text,
  note text,
  updated_at timestamptz,
  member_name text,
  member_email text,
  project_name text,
  page_title text,
  page_url text,
  platform text,
  service_group_id uuid,
  service_group_name text,
  service_name text
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
    t.cost_group_id,
    cg.name as cost_group_name,
    t.project_id,
    t.project_page_id,
    t.task_type1,
    t.task_type2,
    t.task_usedtime,
    t.content,
    t.note,
    t.updated_at,
    m.name as member_name,
    m.email as member_email,
    coalesce(p.name, '') as project_name,
    coalesce(pp.title, '') as page_title,
    coalesce(pp.url, '') as page_url,
    coalesce(p.platform, '') as platform,
    p.service_group_id,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then split_part(sg.name, ' / ', 1)
      else sg.name
    end as service_group_name,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then coalesce(nullif(split_part(sg.name, ' / ', 2), ''), '미분류')
      else sg.name
    end as service_name
  from public.tasks t
  join public.members m on m.id = t.member_id
  join public.cost_groups cg on cg.id = t.cost_group_id
  left join public.projects p on p.id = t.project_id
  left join public.project_pages pp on pp.id = t.project_page_id
  left join public.service_groups sg on sg.id = p.service_group_id
  where public.current_user_is_admin()
    and t.id = p_task_id
$$;

drop function if exists public.admin_save_task(uuid, uuid, date, uuid, uuid, text, text, numeric, text, text);

create or replace function public.admin_save_task(
  p_task_id uuid default null,
  p_member_id uuid default null,
  p_task_date date default null,
  p_cost_group_id uuid default null,
  p_project_id uuid default null,
  p_project_page_id uuid default null,
  p_task_type1 text default null,
  p_task_type2 text default null,
  p_task_usedtime numeric default null,
  p_content text default '',
  p_note text default ''
)
returns table (
  id uuid,
  member_id uuid,
  task_date date,
  cost_group_id uuid,
  cost_group_name text,
  project_id uuid,
  project_page_id uuid,
  task_type1 text,
  task_type2 text,
  task_usedtime numeric,
  content text,
  note text,
  updated_at timestamptz,
  member_name text,
  member_email text,
  project_name text,
  page_title text,
  page_url text,
  platform text,
  service_group_id uuid,
  service_group_name text,
  service_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks;
  v_project_cost_group_id uuid;
begin
  if not public.current_user_is_admin() then
    raise exception 'admin only';
  end if;

  if p_member_id is null then
    raise exception 'member_id required';
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

  if p_task_usedtime is null then
    raise exception 'task_usedtime required';
  end if;

  if p_cost_group_id is null then
    raise exception 'cost_group_id required';
  end if;

  if not exists (
    select 1
    from public.cost_groups
    where id = p_cost_group_id
  ) then
    raise exception 'cost_group not found';
  end if;

  if p_project_id is not null then
    select sg.cost_group_id
    into v_project_cost_group_id
    from public.projects p
    left join public.service_groups sg on sg.id = p.service_group_id
    where p.id = p_project_id;

    if v_project_cost_group_id is distinct from p_cost_group_id then
      raise exception 'project cost_group mismatch';
    end if;
  end if;

  if p_task_id is null then
    insert into public.tasks (
      member_id,
      created_by_member_id,
      task_date,
      cost_group_id,
      project_id,
      project_page_id,
      task_type1,
      task_type2,
      task_usedtime,
      content,
      note
    )
    values (
      p_member_id,
      public.current_member_id(),
      p_task_date,
      p_cost_group_id,
      p_project_id,
      p_project_page_id,
      trim(p_task_type1),
      trim(p_task_type2),
      p_task_usedtime,
      coalesce(p_content, ''),
      coalesce(p_note, '')
    )
    returning * into v_task;
  else
    update public.tasks
    set
      member_id = p_member_id,
      task_date = p_task_date,
      cost_group_id = p_cost_group_id,
      project_id = p_project_id,
      project_page_id = p_project_page_id,
      task_type1 = trim(p_task_type1),
      task_type2 = trim(p_task_type2),
      task_usedtime = p_task_usedtime,
      content = coalesce(p_content, ''),
      note = coalesce(p_note, ''),
      updated_at = timezone('utc', now())
    where id = p_task_id
    returning * into v_task;

    if v_task is null then
      raise exception 'task not found';
    end if;
  end if;

  return query
  select * from public.admin_get_task(v_task.id);
end;
$$;

create or replace function public.admin_delete_task(
  p_task_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'admin only';
  end if;

  delete from public.tasks
  where id = p_task_id;
end;
$$;

create or replace function public.admin_get_task_type_usage_summary(
  p_task_type_id uuid,
  p_type1 text,
  p_type2 text
)
returns table (
  task_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with matched as (
    select t.id
    from public.tasks t
    where t.task_type_id = p_task_type_id
    union
    select t.id
    from public.tasks t
    where t.task_type1 = p_type1
      and t.task_type2 = p_type2
  )
  select count(*)::bigint as task_count
  from matched
  where public.current_user_is_admin()
$$;

create or replace function public.admin_replace_task_type_usage(
  p_old_type1 text,
  p_old_type2 text,
  p_next_type1 text,
  p_next_type2 text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'admin only';
  end if;

  update public.tasks
  set
    task_type1 = p_next_type1,
    task_type2 = p_next_type2,
    updated_at = timezone('utc', now())
  where task_type1 = p_old_type1
    and task_type2 = p_old_type2;
end;
$$;

drop function if exists public.admin_search_tasks(uuid, date, date, uuid, uuid, text, text, uuid, text);

create or replace function public.admin_search_tasks(
  p_member_id uuid default null,
  p_start_date date default null,
  p_end_date date default null,
  p_project_id uuid default null,
  p_project_page_id uuid default null,
  p_task_type1 text default null,
  p_task_type2 text default null,
  p_cost_group_id uuid default null,
  p_keyword text default null
)
returns table (
  id uuid,
  member_id uuid,
  task_date date,
  cost_group_id uuid,
  cost_group_name text,
  project_id uuid,
  project_page_id uuid,
  task_type1 text,
  task_type2 text,
  task_usedtime numeric,
  content text,
  note text,
  updated_at timestamptz,
  member_name text,
  member_email text,
  project_name text,
  page_title text,
  page_url text,
  platform text,
  service_group_id uuid,
  service_group_name text,
  service_name text
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
    t.cost_group_id,
    cg.name as cost_group_name,
    t.project_id,
    t.project_page_id,
    t.task_type1,
    t.task_type2,
    t.task_usedtime,
    t.content,
    t.note,
    t.updated_at,
    m.name as member_name,
    m.email as member_email,
    coalesce(p.name, '') as project_name,
    coalesce(pp.title, '') as page_title,
    coalesce(pp.url, '') as page_url,
    coalesce(p.platform, '') as platform,
    p.service_group_id,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then split_part(sg.name, ' / ', 1)
      else sg.name
    end as service_group_name,
    case
      when coalesce(sg.name, '') = '' or sg.name = '미분류' then '미분류'
      when position(' / ' in sg.name) > 0 then coalesce(nullif(split_part(sg.name, ' / ', 2), ''), '미분류')
      else sg.name
    end as service_name
  from public.tasks t
  join public.members m on m.id = t.member_id
  join public.cost_groups cg on cg.id = t.cost_group_id
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
    and (p_cost_group_id is null or t.cost_group_id = p_cost_group_id)
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
grant execute on function public.current_user_is_active_member() to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.next_member_account_id(text) to authenticated;
grant execute on function public.bind_auth_session_member(uuid, text) to authenticated;
grant execute on function public.touch_member_last_login(uuid, text) to authenticated;
grant execute on function public.save_task(uuid, date, uuid, uuid, uuid, text, text, numeric, text, text) to authenticated;
grant execute on function public.delete_task(uuid) to authenticated;
grant execute on function public.get_tasks_by_date(uuid, date) to authenticated;
grant execute on function public.get_task_activities() to authenticated;
grant execute on function public.get_dashboard_task_calendar(uuid, text) to authenticated;
grant execute on function public.get_resource_summary(uuid, text) to authenticated;
grant execute on function public.get_resource_type_summary(uuid) to authenticated;
grant execute on function public.get_resource_type_summary_years(uuid) to authenticated;
grant execute on function public.get_resource_type_summary_by_year(uuid, text) to authenticated;
grant execute on function public.get_resource_service_summary(uuid) to authenticated;
grant execute on function public.get_resource_service_summary_years(uuid) to authenticated;
grant execute on function public.get_resource_service_summary_by_year(uuid, text) to authenticated;
grant execute on function public.get_resource_month_report(uuid, text) to authenticated;
grant execute on function public.get_stats() to authenticated;
grant execute on function public.get_monitoring_stats_rows() to authenticated;
grant execute on function public.get_qa_stats_projects() to authenticated;
grant execute on function public.search_tasks_export(uuid, date, date, uuid, uuid, text, text, numeric, numeric, text) to authenticated;
grant execute on function public.search_tasks_page(uuid, date, date, uuid, uuid, text, text, numeric, numeric, text) to authenticated;
grant execute on function public.admin_get_task(uuid) to authenticated;
grant execute on function public.admin_save_task(uuid, uuid, date, uuid, uuid, uuid, text, text, numeric, text, text) to authenticated;
grant execute on function public.admin_delete_task(uuid) to authenticated;
grant execute on function public.admin_get_task_type_usage_summary(uuid, text, text) to authenticated;
grant execute on function public.admin_replace_task_type_usage(text, text, text, text) to authenticated;
grant execute on function public.admin_get_member_task_count(uuid) to authenticated;
grant execute on function public.upsert_project(uuid, text, text, uuid, uuid, text, uuid, uuid, date, date, boolean) to authenticated;
grant execute on function public.upsert_project_page(uuid, uuid, text, text, uuid, text, text, boolean, boolean, text) to authenticated;
grant execute on function public.admin_search_tasks(uuid, date, date, uuid, uuid, text, text, uuid, text) to authenticated;

alter table public.members enable row level security;
alter table public.service_groups enable row level security;
alter table public.cost_groups enable row level security;
alter table public.platforms enable row level security;
alter table public.task_types enable row level security;
alter table public.projects enable row level security;
alter table public.project_pages enable row level security;
alter table public.tasks enable row level security;

create policy "members_active_directory_select"
on public.members
for select
to authenticated
using (
  (public.current_user_is_active_member() and user_active = true)
  or public.current_user_is_admin()
);

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
using (
  public.current_user_is_active_member()
);

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

create policy "cost_groups_active_select"
on public.cost_groups
for select
to authenticated
using (
  public.current_user_is_active_member()
);

create policy "cost_groups_admin_insert"
on public.cost_groups
for insert
to authenticated
with check (public.current_user_is_admin());

create policy "cost_groups_admin_update"
on public.cost_groups
for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "cost_groups_admin_delete"
on public.cost_groups
for delete
to authenticated
using (public.current_user_is_admin());

create policy "platforms_active_select"
on public.platforms
for select
to authenticated
using (
  public.current_user_is_active_member()
);

create policy "platforms_admin_insert"
on public.platforms
for insert
to authenticated
with check (public.current_user_is_admin());

create policy "platforms_admin_update"
on public.platforms
for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

create policy "platforms_admin_delete"
on public.platforms
for delete
to authenticated
using (public.current_user_is_admin());

create policy "task_types_active_select"
on public.task_types
for select
to authenticated
using (
  public.current_user_is_active_member()
  and (is_active = true or public.current_user_is_admin())
);

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
using (public.current_user_is_active_member());

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

create policy "project_pages_select_active_member"
on public.project_pages
for select
to authenticated
using (public.current_user_is_active_member());

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
