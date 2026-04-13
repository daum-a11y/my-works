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

drop function if exists public.get_project_stats_rows();
drop function if exists public.get_project_stats_rows(text, text, text, text, text);
drop function if exists public.get_project_stats_rows(text, text, text, text, text, text);
drop function if exists public.get_project_stats_rows(text, text, text, text);

create or replace function public.get_project_stats_rows(
  p_start_month text,
  p_end_month text,
  p_task_type1 text default null,
  p_sort_key text default 'month',
  p_sort_direction text default 'desc'
)
returns table (
  project_id uuid,
  type1 text,
  project_name text,
  platform text,
  cost_group_name text,
  service_group_name text,
  service_name text,
  report_url text,
  reporter_account_id text,
  reporter_name text,
  reviewer_account_id text,
  reviewer_name text,
  start_date date,
  end_date date,
  subtask_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select
      to_date(p_start_month || '-01', 'YYYY-MM-DD') as start_date,
      (to_date(p_end_month || '-01', 'YYYY-MM-DD') + interval '1 month' - interval '1 day')::date
        as end_date
  )
  select
    p.id as project_id,
    tt.type1,
    p.name as project_name,
    nullif(pl.name, '') as platform,
    nullif(cg.name, '') as cost_group_name,
    nullif(public.resolve_service_group_name(sg.service_group_name, sg.name), '') as service_group_name,
    nullif(public.resolve_service_name(sg.service_name, sg.name), '') as service_name,
    nullif(p.report_url, '') as report_url,
    nullif(reporter.account_id, '') as reporter_account_id,
    nullif(reporter.name, '') as reporter_name,
    nullif(reviewer.account_id, '') as reviewer_account_id,
    nullif(reviewer.name, '') as reviewer_name,
    p.start_date,
    p.end_date,
    count(pp.id)::bigint as subtask_count
  from public.projects p
  cross join params
  left join public.task_types tt on tt.id = p.task_type_id
  left join public.platforms pl on pl.id = p.platform_id
  left join public.service_groups sg on sg.id = p.service_group_id
  left join public.cost_groups cg on cg.id = sg.cost_group_id
  left join public.members reporter on reporter.id = p.reporter_member_id
  left join public.members reviewer on reviewer.id = p.reviewer_member_id
  left join public.project_subtasks pp on pp.project_id = p.id
  where public.current_member_id() is not null
    and p.end_date >= params.start_date
    and p.end_date <= params.end_date
    and (nullif(trim(coalesce(p_task_type1, '')), '') is null or tt.type1 = p_task_type1)
  group by
    p.id,
    tt.type1,
    p.name,
    pl.name,
    cg.name,
    sg.service_group_name,
    sg.service_name,
    sg.name,
    p.report_url,
    reporter.account_id,
    reporter.name,
    reviewer.account_id,
    reviewer.name,
    p.start_date,
    p.end_date
  order by
    case when p_sort_key = 'month' and lower(p_sort_direction) = 'asc' then p.end_date end asc,
    case when p_sort_key = 'month' and lower(p_sort_direction) <> 'asc' then p.end_date end desc,
    case when p_sort_key = 'type1' and lower(p_sort_direction) = 'asc' then tt.type1 end asc,
    case when p_sort_key = 'type1' and lower(p_sort_direction) <> 'asc' then tt.type1 end desc,
    case when p_sort_key = 'costGroupName' and lower(p_sort_direction) = 'asc' then cg.name end asc,
    case when p_sort_key = 'costGroupName' and lower(p_sort_direction) <> 'asc' then cg.name end desc,
    case when p_sort_key = 'serviceGroupName' and lower(p_sort_direction) = 'asc'
      then public.resolve_service_group_name(sg.service_group_name, sg.name) end asc,
    case when p_sort_key = 'serviceGroupName' and lower(p_sort_direction) <> 'asc'
      then public.resolve_service_group_name(sg.service_group_name, sg.name) end desc,
    case when p_sort_key = 'projectName' and lower(p_sort_direction) = 'asc' then p.name end asc,
    case when p_sort_key = 'projectName' and lower(p_sort_direction) <> 'asc' then p.name end desc,
    case when p_sort_key = 'platform' and lower(p_sort_direction) = 'asc' then pl.name end asc,
    case when p_sort_key = 'platform' and lower(p_sort_direction) <> 'asc' then pl.name end desc,
    case
      when p_sort_key = 'reporterAccountId' and lower(p_sort_direction) = 'asc'
        then nullif(reporter.account_id, '')
    end asc,
    case
      when p_sort_key = 'reporterAccountId' and lower(p_sort_direction) <> 'asc'
        then nullif(reporter.account_id, '')
    end desc,
    case
      when p_sort_key = 'reviewerAccountId' and lower(p_sort_direction) = 'asc'
        then nullif(reviewer.account_id, '')
    end asc,
    case
      when p_sort_key = 'reviewerAccountId' and lower(p_sort_direction) <> 'asc'
        then nullif(reviewer.account_id, '')
    end desc,
    case when p_sort_key = 'subtaskCount' and lower(p_sort_direction) = 'asc' then count(pp.id) end asc,
    case when p_sort_key = 'subtaskCount' and lower(p_sort_direction) <> 'asc' then count(pp.id) end desc,
    p.end_date desc,
    p.name asc,
    p.id desc
$$;

create or replace function public.set_audit_member_ids()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_member_id uuid := public.current_member_id();
begin
  if tg_op = 'INSERT' and new.created_by_member_id is null then
    new.created_by_member_id = v_member_id;
  end if;

  if v_member_id is not null then
    new.updated_by_member_id = v_member_id;
  end if;

  return new;
end;
$$;

create or replace function public.compose_service_group_label(
  p_svc_group text,
  p_svc_name text
)
returns text
language sql
immutable
as $$
  select case
    when coalesce(nullif(trim(p_svc_group), ''), nullif(trim(p_svc_name), '')) is null then null
    when nullif(trim(p_svc_group), '') is null then trim(p_svc_name)
    when nullif(trim(p_svc_name), '') is null then trim(p_svc_group)
    else trim(p_svc_group) || ' / ' || trim(p_svc_name)
  end
$$;

create or replace function public.resolve_service_group_name(
  p_svc_group text,
  p_name text default null
)
returns text
language sql
immutable
as $$
  select case
    when nullif(trim(p_svc_group), '') is not null then trim(p_svc_group)
    when nullif(trim(p_name), '') is null then null
    when position(' / ' in p_name) > 0 then split_part(trim(p_name), ' / ', 1)
    else trim(p_name)
  end
$$;

create or replace function public.resolve_service_name(
  p_svc_name text,
  p_name text default null
)
returns text
language sql
immutable
as $$
  select case
    when nullif(trim(p_svc_name), '') is not null then trim(p_svc_name)
    when nullif(trim(p_name), '') is null then null
    when position(' / ' in p_name) > 0 then nullif(split_part(trim(p_name), ' / ', 2), '')
    else null
  end
$$;

create or replace function public.resolve_task_type_id(
  p_task_type1 text,
  p_task_type2 text
)
returns uuid
language sql
stable
set search_path = public
as $$
  select tt.id
  from public.task_types tt
  where tt.type1 = trim(coalesce(p_task_type1, ''))
    and tt.type2 = trim(coalesce(p_task_type2, ''))
  order by tt.is_active desc, tt.display_order asc, tt.created_at asc
  limit 1
$$;

create or replace function public.sync_service_group_name()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.service_group_name := public.resolve_service_group_name(new.service_group_name, new.name);
  new.service_name := public.resolve_service_name(new.service_name, new.name);
  new.name := public.compose_service_group_label(new.service_group_name, new.service_name);
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
  created_by_member_id uuid references public.members(id),
  updated_by_member_id uuid references public.members(id),
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
  service_group_name text,
  service_name text,
  name text not null,
  cost_group_id uuid,
  created_by_member_id uuid references public.members(id),
  updated_by_member_id uuid references public.members(id),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.service_groups
  add column if not exists service_group_name text;

alter table public.service_groups
  add column if not exists service_name text;

alter table public.service_groups
  add column if not exists created_by_member_id uuid references public.members(id);

alter table public.service_groups
  add column if not exists updated_by_member_id uuid references public.members(id);

alter table public.service_groups
  alter column service_group_name drop not null;

alter table public.service_groups
  alter column service_name drop not null;

update public.service_groups
set
  service_group_name = public.resolve_service_group_name(service_group_name, name),
  service_name = public.resolve_service_name(service_name, name),
  name = public.compose_service_group_label(
    public.resolve_service_group_name(service_group_name, name),
    public.resolve_service_name(service_name, name)
  )
where
  coalesce(trim(service_group_name), '') = ''
  or coalesce(trim(service_name), '') = ''
  or name is distinct from public.compose_service_group_label(
    public.resolve_service_group_name(service_group_name, name),
    public.resolve_service_name(service_name, name)
  );

create table if not exists public.cost_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by_member_id uuid references public.members(id),
  updated_by_member_id uuid references public.members(id),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by_member_id uuid references public.members(id),
  updated_by_member_id uuid references public.members(id),
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

drop trigger if exists service_groups_sync_name on public.service_groups;

create trigger service_groups_sync_name
before insert or update on public.service_groups
for each row
execute function public.sync_service_group_name();

create table if not exists public.task_types (
  id uuid primary key default gen_random_uuid(),
  type1 text not null,
  type2 text not null,
  note text,
  created_by_member_id uuid references public.members(id),
  updated_by_member_id uuid references public.members(id),
  requires_service_group boolean not null default false,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.task_types
  add column if not exists note text;

alter table public.task_types
  add column if not exists created_by_member_id uuid references public.members(id);

alter table public.task_types
  add column if not exists updated_by_member_id uuid references public.members(id);

alter table public.task_types
  drop column if exists display_label;

alter table public.task_types
  drop column if exists type_etc;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_by_member_id uuid references public.members(id),
  updated_by_member_id uuid references public.members(id),
  task_type_id uuid not null references public.task_types(id),
  name text not null,
  platform_id uuid not null references public.platforms(id),
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

do $$
begin
  if to_regclass('public.project_subtasks') is null
    and to_regclass('public.project_pages') is not null then
    alter table public.project_pages rename to project_subtasks;
  end if;
end
$$;

create table if not exists public.project_subtasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_member_id uuid references public.members(id),
  created_by_member_id uuid references public.members(id),
  updated_by_member_id uuid references public.members(id),
  title text not null,
  url text not null default '',
  task_date text,
  task_status text not null default '미수정',
  note text not null default '',
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint project_subtasks_task_status_check
    check (task_status in ('미수정', '전체 수정', '일부 수정'))
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'project_subtasks'
      and column_name = 'task_month'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'project_subtasks'
      and column_name = 'task_date'
  ) then
    alter table public.project_subtasks
      rename column task_month to task_date;
  end if;
end
$$;

alter table public.project_subtasks
  add column if not exists owner_member_id uuid references public.members(id);

alter table public.project_subtasks
  add column if not exists created_by_member_id uuid references public.members(id);

alter table public.project_subtasks
  add column if not exists updated_by_member_id uuid references public.members(id);

alter table public.project_subtasks
  add column if not exists url text not null default '';

alter table public.project_subtasks
  add column if not exists task_date text;

alter table public.project_subtasks
  add column if not exists task_status text not null default '미수정';

alter table public.project_subtasks
  add column if not exists note text not null default '';

alter table public.project_subtasks
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.project_subtasks
  add column if not exists created_at timestamptz not null default timezone('utc', now());

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.project_subtasks'::regclass
      and conname = 'project_pages_pkey'
  ) and not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.project_subtasks'::regclass
      and conname = 'project_subtasks_pkey'
  ) then
    alter table public.project_subtasks
      rename constraint project_pages_pkey to project_subtasks_pkey;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.project_subtasks'::regclass
      and conname = 'project_pages_track_status_check'
  ) and not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.project_subtasks'::regclass
      and conname = 'project_subtasks_task_status_check'
  ) then
    alter table public.project_subtasks
      rename constraint project_pages_track_status_check to project_subtasks_task_status_check;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.project_subtasks'::regclass
      and conname = 'project_subtasks_track_status_check'
  ) and not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.project_subtasks'::regclass
      and conname = 'project_subtasks_task_status_check'
  ) then
    alter table public.project_subtasks
      rename constraint project_subtasks_track_status_check to project_subtasks_task_status_check;
  end if;
end
$$;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  created_by_member_id uuid references public.members(id),
  updated_by_member_id uuid references public.members(id),
  task_date date not null,
  cost_group_id uuid references public.cost_groups(id),
  project_id uuid references public.projects(id),
  project_subtask_id uuid references public.project_subtasks(id),
  task_type_id uuid references public.task_types(id),
  task_usedtime numeric(5, 1) not null default 0,
  url text not null default '',
  content text not null,
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name = 'project_page_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name = 'project_subtask_id'
  ) then
    alter table public.tasks rename column project_page_id to project_subtask_id;
  end if;
end
$$;

alter table public.tasks
  add column if not exists project_subtask_id uuid;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_project_page_id_fkey'
  ) and not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_project_subtask_id_fkey'
  ) then
    alter table public.tasks
      rename constraint tasks_project_page_id_fkey to tasks_project_subtask_id_fkey;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_project_subtask_id_fkey'
  ) then
    alter table public.tasks
      add constraint tasks_project_subtask_id_fkey
      foreign key (project_subtask_id) references public.project_subtasks(id);
  end if;
end
$$;

alter table public.tasks
  add column if not exists cost_group_id uuid;

alter table public.tasks
  add column if not exists url text not null default '';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name = 'task_type1'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name = 'task_type2'
  ) then
    execute $sql$
      update public.tasks
      set task_type_id = public.resolve_task_type_id(task_type1, task_type2)
      where task_type_id is distinct from public.resolve_task_type_id(task_type1, task_type2)
    $sql$;
  end if;
end
$$;

alter table public.tasks
  drop column if exists task_type1;

alter table public.tasks
  drop column if exists task_type2;

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

create or replace view public.project_subtasks_public_view
with (security_invoker = true) as
select
  id,
  project_id,
  owner_member_id,
  title,
  url,
  task_date,
  task_status,
  note,
  updated_at
from public.project_subtasks;

create index if not exists idx_tasks_member_date on public.tasks (member_id, task_date desc);

do $$
begin
  if to_regclass('public.idx_project_subtasks_owner') is null
    and to_regclass('public.idx_project_pages_owner') is not null then
    alter index public.idx_project_pages_owner rename to idx_project_subtasks_owner;
  end if;

  if to_regclass('public.idx_project_subtasks_lookup') is null
    and to_regclass('public.idx_project_pages_lookup') is not null then
    alter index public.idx_project_pages_lookup rename to idx_project_subtasks_lookup;
  end if;
end
$$;

create index if not exists idx_project_subtasks_owner on public.project_subtasks (owner_member_id);
create index if not exists idx_projects_dates on public.projects (start_date, end_date);
create index if not exists idx_projects_name on public.projects (name);
create index if not exists idx_project_subtasks_lookup on public.project_subtasks (project_id, title, url);

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

drop trigger if exists project_pages_set_updated_at on public.project_subtasks;
drop trigger if exists project_subtasks_set_updated_at on public.project_subtasks;
create trigger project_subtasks_set_updated_at
before update on public.project_subtasks
for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists members_set_audit_member_ids on public.members;
create trigger members_set_audit_member_ids
before insert or update on public.members
for each row execute function public.set_audit_member_ids();

drop trigger if exists service_groups_set_audit_member_ids on public.service_groups;
create trigger service_groups_set_audit_member_ids
before insert or update on public.service_groups
for each row execute function public.set_audit_member_ids();

drop trigger if exists cost_groups_set_audit_member_ids on public.cost_groups;
create trigger cost_groups_set_audit_member_ids
before insert or update on public.cost_groups
for each row execute function public.set_audit_member_ids();

drop trigger if exists platforms_set_audit_member_ids on public.platforms;
create trigger platforms_set_audit_member_ids
before insert or update on public.platforms
for each row execute function public.set_audit_member_ids();

drop trigger if exists task_types_set_audit_member_ids on public.task_types;
create trigger task_types_set_audit_member_ids
before insert or update on public.task_types
for each row execute function public.set_audit_member_ids();

drop trigger if exists projects_set_audit_member_ids on public.projects;
create trigger projects_set_audit_member_ids
before insert or update on public.projects
for each row execute function public.set_audit_member_ids();

drop trigger if exists project_pages_set_audit_member_ids on public.project_subtasks;
drop trigger if exists project_subtasks_set_audit_member_ids on public.project_subtasks;
create trigger project_subtasks_set_audit_member_ids
before insert or update on public.project_subtasks
for each row execute function public.set_audit_member_ids();

drop trigger if exists tasks_set_audit_member_ids on public.tasks;
create trigger tasks_set_audit_member_ids
before insert or update on public.tasks
for each row execute function public.set_audit_member_ids();

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

create or replace function public.admin_find_auth_user_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_auth_user_id uuid;
begin
  if current_setting('request.jwt.claim.role', true) <> 'service_role'
    and not public.current_user_is_admin() then
    raise exception 'admin only';
  end if;

  if v_email is null then
    return null;
  end if;

  select u.id
  into v_auth_user_id
  from auth.users u
  where lower(coalesce(u.email, '')) = v_email
  order by u.created_at desc
  limit 1;

  return v_auth_user_id;
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

drop function if exists public.save_task(uuid, date, uuid, uuid, uuid, text, text, numeric, text, text, text);

create or replace function public.save_task(
  p_task_id uuid default null,
  p_task_date date default null,
  p_cost_group_id uuid default null,
  p_project_id uuid default null,
  p_project_subtask_id uuid default null,
  p_task_type1 text default null,
  p_task_type2 text default null,
  p_task_usedtime numeric default null,
  p_url text default '',
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
  v_task_type_id uuid;
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

  v_task_type_id := public.resolve_task_type_id(p_task_type1, p_task_type2);

  if v_task_type_id is null then
    raise exception 'task_type not found';
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
      project_subtask_id,
      task_type_id,
      task_usedtime,
      url,
      content,
      note
    )
    values (
      v_member_id,
      v_member_id,
      p_task_date,
      p_cost_group_id,
      p_project_id,
      p_project_subtask_id,
      v_task_type_id,
      p_task_usedtime,
      coalesce(p_url, ''),
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
      project_subtask_id = p_project_subtask_id,
      task_type_id = v_task_type_id,
      task_usedtime = p_task_usedtime,
      url = coalesce(p_url, ''),
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

drop function if exists public.get_dashboard_snapshot();

create or replace function public.get_dashboard_snapshot()
returns table (
  project_id uuid,
  type1 text,
  project_name text,
  platform text,
  cost_group_name text,
  service_group_name text,
  start_date date,
  end_date date
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as project_id,
    nullif(ptt.type1, '') as type1,
    p.name as project_name,
    nullif(pl.name, '') as platform,
    nullif(cg.name, '') as cost_group_name,
    nullif(public.resolve_service_group_name(sg.service_group_name, sg.name), '') as service_group_name,
    p.start_date,
    p.end_date
  from public.projects p
  left join public.task_types ptt on ptt.id = p.task_type_id
  left join public.platforms pl on pl.id = p.platform_id
  left join public.service_groups sg on sg.id = p.service_group_id
  left join public.cost_groups cg on cg.id = sg.cost_group_id
  where public.current_member_id() is not null
    and p.start_date <= current_date
    and p.end_date >= current_date
  order by p.end_date asc, p.name asc
$$;

drop function if exists public.get_tasks_by_date(uuid, date);

create or replace function public.get_tasks_by_date(
  p_member_id uuid default null,
  p_task_date date default null
)
returns table (
  id uuid,
  member_id uuid,
  member_account_id text,
  task_date date,
  cost_group_id uuid,
  cost_group_name text,
  project_id uuid,
  project_subtask_id uuid,
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
  project_name text,
  subtask_title text,
  url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.member_id,
    m.account_id as member_account_id,
    t.task_date,
    t.cost_group_id,
    nullif(cg.name, '') as cost_group_name,
    t.project_id,
    t.project_subtask_id,
    coalesce(tt.type1, '') as task_type1,
    coalesce(tt.type2, '') as task_type2,
    t.task_usedtime,
    t.content,
    t.note,
    t.created_at,
    t.updated_at
    ,
    nullif(pl.name, '') as platform,
    nullif(public.resolve_service_group_name(sg.service_group_name, sg.name), '') as service_group_name,
    nullif(public.resolve_service_name(sg.service_name, sg.name), '') as service_name,
    p.name as project_name,
    pp.title as subtask_title,
    t.url
  from public.tasks t
  left join public.cost_groups cg on cg.id = t.cost_group_id
  left join public.task_types tt on tt.id = t.task_type_id
  left join public.projects p on p.id = t.project_id
  left join public.platforms pl on pl.id = p.platform_id
  left join public.project_subtasks pp on pp.id = t.project_subtask_id
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

create or replace function public.get_resource_summary_members(
  p_member_id uuid default null
)
returns table (
  id uuid,
  account_id text,
  name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id,
    m.account_id,
    m.name
  from public.members m
  where public.current_member_id() is not null
    and (
      (public.current_user_is_admin() and (p_member_id is null or m.id = p_member_id))
      or (
        not public.current_user_is_admin()
        and m.id = public.current_member_id()
        and (p_member_id is null or p_member_id = public.current_member_id())
      )
    )
  order by m.account_id asc
$$;

create or replace function public.get_resource_type_summary(
  p_member_id uuid default null
)
returns table (
  year text,
  month text,
  task_type1 text,
  task_type2 text,
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
    coalesce(tt.type1, '미분류') as task_type1,
    coalesce(tt.type2, '미분류') as task_type2,
    sum(t.task_usedtime) as task_usedtime
  from public.tasks t
  left join public.task_types tt on tt.id = t.task_type_id
  where public.current_member_id() is not null
    and (
      (public.current_user_is_admin() and (p_member_id is null or t.member_id = p_member_id))
      or (
        not public.current_user_is_admin()
        and t.member_id = public.current_member_id()
        and (p_member_id is null or p_member_id = public.current_member_id())
      )
    )
  group by
    to_char(t.task_date, 'YYYY'),
    to_char(t.task_date, 'MM'),
    coalesce(tt.type1, '미분류'),
    coalesce(tt.type2, '미분류')
  order by year desc, month desc, task_type1 asc, task_type2 asc
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
  select extract(year from t.task_date)::text as year
  from public.tasks t
  where public.current_member_id() is not null
    and (
      (public.current_user_is_admin() and (p_member_id is null or t.member_id = p_member_id))
      or (
        not public.current_user_is_admin()
        and t.member_id = public.current_member_id()
        and (p_member_id is null or p_member_id = public.current_member_id())
      )
    )
  group by extract(year from t.task_date)
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
  task_type2 text,
  task_usedtime numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with year_bounds as (
    select
      to_date(p_year || '-01-01', 'YYYY-MM-DD') as year_start,
      (to_date(p_year || '-01-01', 'YYYY-MM-DD') + interval '1 year')::date as year_end
  )
  select
    to_char(t.task_date, 'YYYY') as year,
    to_char(t.task_date, 'MM') as month,
    coalesce(tt.type1, '미분류') as task_type1,
    coalesce(tt.type2, '미분류') as task_type2,
    sum(t.task_usedtime) as task_usedtime
  from public.tasks t
  left join public.task_types tt on tt.id = t.task_type_id
  join year_bounds yb on true
  where public.current_member_id() is not null
    and p_year is not null
    and (
      (public.current_user_is_admin() and (p_member_id is null or t.member_id = p_member_id))
      or (
        not public.current_user_is_admin()
        and t.member_id = public.current_member_id()
        and (p_member_id is null or p_member_id = public.current_member_id())
      )
    )
    and t.task_date >= yb.year_start
    and t.task_date < yb.year_end
  group by
    to_char(t.task_date, 'YYYY'),
    to_char(t.task_date, 'MM'),
    coalesce(tt.type1, '미분류'),
    coalesce(tt.type2, '미분류')
  order by month desc, task_type1 asc, task_type2 asc
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
    coalesce(cg.name, '미분류') as cost_group_name,
    public.resolve_service_group_name(sg.service_group_name, sg.name) as service_group_name,
    public.resolve_service_name(sg.service_name, sg.name) as service_name,
    sum(t.task_usedtime) as task_usedtime
  from public.tasks t
  left join public.cost_groups cg on cg.id = t.cost_group_id
  left join public.projects p on p.id = t.project_id
  left join public.service_groups sg on sg.id = p.service_group_id
  left join public.task_types tt on tt.id = t.task_type_id
  where public.current_member_id() is not null
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
    coalesce(cg.name, '미분류'),
    public.resolve_service_group_name(sg.service_group_name, sg.name),
    public.resolve_service_name(sg.service_name, sg.name)
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
  select extract(year from t.task_date)::text as year
  from public.tasks t
  left join public.task_types tt on tt.id = t.task_type_id
  where public.current_member_id() is not null
    and (
      (public.current_user_is_admin() and (p_member_id is null or t.member_id = p_member_id))
      or (
        not public.current_user_is_admin()
        and t.member_id = public.current_member_id()
        and (p_member_id is null or p_member_id = public.current_member_id())
      )
    )
    and coalesce(tt.requires_service_group, t.project_id is not null)
  group by extract(year from t.task_date)
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
  with year_bounds as (
    select
      to_date(p_year || '-01-01', 'YYYY-MM-DD') as year_start,
      (to_date(p_year || '-01-01', 'YYYY-MM-DD') + interval '1 year')::date as year_end
  )
  select
    to_char(t.task_date, 'YYYY') as year,
    to_char(t.task_date, 'MM') as month,
    coalesce(cg.name, '미분류') as cost_group_name,
    public.resolve_service_group_name(sg.service_group_name, sg.name) as service_group_name,
    nullif(public.resolve_service_name(sg.service_name, sg.name), '') as service_name,
    sum(t.task_usedtime) as task_usedtime
  from public.tasks t
  join year_bounds yb on true
  left join public.cost_groups cg on cg.id = t.cost_group_id
  left join public.projects p on p.id = t.project_id
  left join public.service_groups sg on sg.id = p.service_group_id
  left join public.task_types tt on tt.id = t.task_type_id
  where public.current_member_id() is not null
    and p_year is not null
    and (
      (public.current_user_is_admin() and (p_member_id is null or t.member_id = p_member_id))
      or (
        not public.current_user_is_admin()
        and t.member_id = public.current_member_id()
        and (p_member_id is null or p_member_id = public.current_member_id())
      )
    )
    and t.task_date >= yb.year_start
    and t.task_date < yb.year_end
    and coalesce(tt.requires_service_group, t.project_id is not null)
  group by
    to_char(t.task_date, 'YYYY'),
    to_char(t.task_date, 'MM'),
    coalesce(cg.name, '미분류'),
    public.resolve_service_group_name(sg.service_group_name, sg.name),
    public.resolve_service_name(sg.service_name, sg.name)
  order by month desc, cost_group_name asc, service_group_name asc, service_name asc
$$;

drop function if exists public.get_resource_month_report(uuid, text);

create or replace function public.get_resource_month_report(
  p_member_id uuid default null,
  p_month text default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with month_bounds as (
    select
      to_date(p_month || '-01', 'YYYY-MM-DD') as month_start,
      (to_date(p_month || '-01', 'YYYY-MM-DD') + interval '1 month')::date as month_end
  ),
  base_rows as (
    select
      t.member_id,
      m.account_id,
      coalesce(tt.type1, '미분류') as task_type1,
      coalesce(tt.type2, '미분류') as task_type2,
      t.task_usedtime,
      coalesce(tt.requires_service_group, t.project_id is not null) as is_service_task,
      coalesce(cg.name, '미분류') as cost_group_name,
      public.resolve_service_group_name(sg.service_group_name, sg.name) as service_group_name,
      public.resolve_service_name(sg.service_name, sg.name) as service_name
    from public.tasks t
    join public.members m on m.id = t.member_id
    join month_bounds mb on true
    join public.cost_groups cg on cg.id = t.cost_group_id
    left join public.projects p on p.id = t.project_id
    left join public.service_groups sg on sg.id = p.service_group_id
    left join public.task_types tt on tt.id = t.task_type_id
    where public.current_member_id() is not null
      and p_month is not null
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
  )
  select
    jsonb_build_object(
      'type_rows',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'type1', type_group.type1,
              'totalMinutes', type_group.total_minutes,
              'requiresServiceGroup', type_group.requires_service_group,
              'items', type_group.items
            )
            order by type_group.requires_service_group desc, type_group.type1 asc
          )
          from (
            select
              br.task_type1 as type1,
              sum(br.task_usedtime) as total_minutes,
              bool_or(br.is_service_task) as requires_service_group,
              coalesce(
                (
                  select jsonb_agg(
                    jsonb_build_object(
                      'type2', type_item.type2,
                      'minutes', type_item.minutes,
                      'requiresServiceGroup', type_item.requires_service_group
                    )
                    order by type_item.requires_service_group desc, type_item.type2 asc
                  )
                  from (
                    select
                      br2.task_type2 as type2,
                      sum(br2.task_usedtime) as minutes,
                      bool_or(br2.is_service_task) as requires_service_group
                    from base_rows br2
                    where br2.task_type1 = br.task_type1
                    group by br2.task_type2
                  ) type_item
                ),
                '[]'::jsonb
              ) as items
            from base_rows br
            group by br.task_type1
          ) type_group
        ),
        '[]'::jsonb
      ),
      'service_summary_rows',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'costGroup', summary_group.cost_group,
              'group', summary_group.service_group,
              'totalMinutes', summary_group.total_minutes,
              'names', summary_group.names
            )
            order by summary_group.cost_group asc, summary_group.service_group asc
          )
          from (
            select
              br.cost_group_name as cost_group,
              br.service_group_name as service_group,
              sum(br.task_usedtime) as total_minutes,
              coalesce(
                (
                  select jsonb_agg(
                    jsonb_build_object(
                      'name', summary_name.service_name,
                      'minutes', summary_name.minutes
                    )
                    order by summary_name.service_name asc
                  )
                  from (
                    select
                      br2.service_name,
                      sum(br2.task_usedtime) as minutes
                    from base_rows br2
                    where br2.is_service_task
                      and br2.cost_group_name = br.cost_group_name
                      and br2.service_group_name = br.service_group_name
                    group by br2.service_name
                  ) summary_name
                ),
                '[]'::jsonb
              ) as names
            from base_rows br
            where br.is_service_task
            group by br.cost_group_name, br.service_group_name
          ) summary_group
        ),
        '[]'::jsonb
      ),
      'non_service_summary_rows',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'costGroup', non_service_group.cost_group,
              'type1', non_service_group.type1,
              'totalMinutes', non_service_group.total_minutes,
              'items', non_service_group.items
            )
            order by non_service_group.cost_group asc, non_service_group.type1 asc
          )
          from (
            select
              br.cost_group_name as cost_group,
              br.task_type1 as type1,
              sum(br.task_usedtime) as total_minutes,
              coalesce(
                (
                  select jsonb_agg(
                    jsonb_build_object(
                      'type2', non_service_item.type2,
                      'minutes', non_service_item.minutes
                    )
                    order by non_service_item.type2 asc
                  )
                  from (
                    select
                      br2.task_type2 as type2,
                      sum(br2.task_usedtime) as minutes
                    from base_rows br2
                    where not br2.is_service_task
                      and not (br2.task_type1 = '휴무' and br2.task_type2 = '무급휴가')
                      and br2.cost_group_name = br.cost_group_name
                      and br2.task_type1 = br.task_type1
                    group by br2.task_type2
                  ) non_service_item
                ),
                '[]'::jsonb
              ) as items
            from base_rows br
            where not br.is_service_task
              and not (br.task_type1 = '휴무' and br.task_type2 = '무급휴가')
            group by br.cost_group_name, br.task_type1
          ) non_service_group
        ),
        '[]'::jsonb
      ),
      'service_detail_rows',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'costGroup', detail_group.cost_group,
              'group', detail_group.service_group,
              'totalMinutes', detail_group.total_minutes,
              'names', detail_group.names
            )
            order by detail_group.cost_group asc, detail_group.service_group asc
          )
          from (
            select
              br.cost_group_name as cost_group,
              br.service_group_name as service_group,
              sum(br.task_usedtime) as total_minutes,
              coalesce(
                (
                  select jsonb_agg(
                    jsonb_build_object(
                      'name', detail_name.service_name,
                      'items', detail_name.items
                    )
                    order by detail_name.service_name asc
                  )
                  from (
                    select
                      br2.service_name,
                      coalesce(
                        (
                          select jsonb_agg(
                            jsonb_build_object(
                              'type1', detail_type.task_type1,
                              'minutes', detail_type.minutes
                            )
                            order by detail_type.task_type1 asc
                          )
                          from (
                            select
                              br3.task_type1,
                              sum(br3.task_usedtime) as minutes
                            from base_rows br3
                            where br3.is_service_task
                              and br3.cost_group_name = br.cost_group_name
                              and br3.service_group_name = br.service_group_name
                              and br3.service_name = br2.service_name
                            group by br3.task_type1
                          ) detail_type
                        ),
                        '[]'::jsonb
                      ) as items
                    from base_rows br2
                    where br2.is_service_task
                      and br2.cost_group_name = br.cost_group_name
                      and br2.service_group_name = br.service_group_name
                    group by br2.service_name
                  ) detail_name
                ),
                '[]'::jsonb
              ) as names
            from base_rows br
            where br.is_service_task
            group by br.cost_group_name, br.service_group_name
          ) detail_group
        ),
        '[]'::jsonb
      ),
      'member_totals',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', member_total.member_id,
              'accountId', member_total.account_id,
              'totalMinutes', member_total.total_minutes
            )
            order by member_total.account_id asc
          )
          from (
            select
              br.member_id,
              br.account_id,
              sum(br.task_usedtime) as total_minutes
            from base_rows br
            group by br.member_id, br.account_id
            having sum(br.task_usedtime) > 0
          ) member_total
        ),
        '[]'::jsonb
      )
    )
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
      pp.task_status,
      pp.note,
      p.start_date,
      p.end_date,
      pp.task_date
    from public.project_subtasks pp
    join public.projects p on p.id = pp.project_id
  ),
  status_counts as (
    select
      pr.task_status as status,
      count(*)::bigint as count
    from page_rows pr
    group by pr.task_status
  ),
  type_counts as (
    select
      coalesce(tt.type1, '미분류') as type,
      sum(t.task_usedtime) as task_usedtime
    from public.tasks t
    left join public.task_types tt on tt.id = t.task_type_id
    group by coalesce(tt.type1, '미분류')
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
$$;

drop function if exists public.get_monitoring_stats_rows();
drop function if exists public.get_monitoring_stats_rows(text, text, text, text);
drop function if exists public.get_monitoring_stats_rows(text, text, text, text, text);

create or replace function public.get_monitoring_stats_rows(
  p_start_month text,
  p_end_month text,
  p_task_type1 text default null,
  p_sort_key text default 'month',
  p_sort_direction text default 'desc'
)
returns table (
  subtask_id uuid,
  project_id uuid,
  type1 text,
  title text,
  url text,
  owner_member_id uuid,
  task_date text,
  task_status text,
  note text,
  updated_at timestamptz,
  cost_group_name text,
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
  with base as (
    select
      pp.id as subtask_id,
      p.id as project_id,
      tt.type1,
      pp.title,
      pp.url,
      pp.owner_member_id,
      pp.task_date,
      pp.task_status,
      nullif(pp.note, '') as note,
      pp.updated_at,
      nullif(cg.name, '') as cost_group_name,
      nullif(public.resolve_service_group_name(sg.service_group_name, sg.name), '') as service_group_name,
      p.name as project_name,
      nullif(pl.name, '') as platform,
      nullif(concat_ws(' ', nullif(owner.account_id, ''), nullif(owner.name, '')), '') as assignee_display,
      nullif(p.report_url, '') as report_url,
      case
        when regexp_replace(coalesce(pp.task_date, ''), '\D', '', 'g') ~ '^\d{4}$'
          then to_date('20' || regexp_replace(pp.task_date, '\D', '', 'g') || '01', 'YYYYMMDD')
        when regexp_replace(coalesce(pp.task_date, ''), '\D', '', 'g') ~ '^\d{6}$'
          then to_date(regexp_replace(pp.task_date, '\D', '', 'g') || '01', 'YYYYMMDD')
        when regexp_replace(coalesce(pp.task_date, ''), '\D', '', 'g') ~ '^\d{8}$'
          then to_date(regexp_replace(pp.task_date, '\D', '', 'g'), 'YYYYMMDD')
        else null
      end as task_date_value,
      case pp.task_status
        when '미수정' then 0
        when '일부 수정' then 1
        when '전체 수정' then 2
        else 99
      end as task_status_order
    from public.project_subtasks pp
    join public.projects p on p.id = pp.project_id
    left join public.task_types tt on tt.id = p.task_type_id
    left join public.platforms pl on pl.id = p.platform_id
    left join public.service_groups sg on sg.id = p.service_group_id
    left join public.cost_groups cg on cg.id = sg.cost_group_id
    left join public.members owner on owner.id = pp.owner_member_id
  )
  select
    subtask_id,
    project_id,
    type1,
    title,
    url,
    owner_member_id,
    task_date,
    task_status,
    note,
    updated_at,
    cost_group_name,
    service_group_name,
    project_name,
    platform,
    assignee_display,
    report_url
  from base
  where task_date_value is not null
    and task_date_value >= to_date(p_start_month || '-01', 'YYYY-MM-DD')
    and task_date_value <= (to_date(p_end_month || '-01', 'YYYY-MM-DD') + interval '1 month' - interval '1 day')::date
    and (p_task_type1 is null or type1 = p_task_type1)
  order by
    case when p_sort_key = 'month' and lower(p_sort_direction) = 'asc' then task_date_value end asc,
    case when p_sort_key = 'month' and lower(p_sort_direction) <> 'asc' then task_date_value end desc,
    case when p_sort_key = 'costGroupName' and lower(p_sort_direction) = 'asc' then cost_group_name end asc,
    case when p_sort_key = 'costGroupName' and lower(p_sort_direction) <> 'asc' then cost_group_name end desc,
    case when p_sort_key = 'serviceGroupName' and lower(p_sort_direction) = 'asc' then service_group_name end asc,
    case when p_sort_key = 'serviceGroupName' and lower(p_sort_direction) <> 'asc' then service_group_name end desc,
    case when p_sort_key = 'projectName' and lower(p_sort_direction) = 'asc' then project_name end asc,
    case when p_sort_key = 'projectName' and lower(p_sort_direction) <> 'asc' then project_name end desc,
    case when p_sort_key = 'platform' and lower(p_sort_direction) = 'asc' then platform end asc,
    case when p_sort_key = 'platform' and lower(p_sort_direction) <> 'asc' then platform end desc,
    case when p_sort_key = 'title' and lower(p_sort_direction) = 'asc' then title end asc,
    case when p_sort_key = 'title' and lower(p_sort_direction) <> 'asc' then title end desc,
    case when p_sort_key = 'assigneeDisplay' and lower(p_sort_direction) = 'asc' then assignee_display end asc,
    case when p_sort_key = 'assigneeDisplay' and lower(p_sort_direction) <> 'asc' then assignee_display end desc,
    case when p_sort_key in ('trackStatus', 'taskStatus') and lower(p_sort_direction) = 'asc' then task_status_order end asc,
    case when p_sort_key in ('trackStatus', 'taskStatus') and lower(p_sort_direction) <> 'asc' then task_status_order end desc,
    updated_at desc,
    title asc,
    subtask_id desc
$$;

drop function if exists public.search_tasks_export(uuid, date, date, uuid, uuid, text, text, numeric, numeric, text);

create or replace function public.search_tasks_export(
  p_member_id uuid default null,
  p_start_date date default null,
  p_end_date date default null,
  p_project_id uuid default null,
  p_project_subtask_id uuid default null,
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
  project_subtask_id uuid,
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
  project_name text,
  subtask_title text,
  url text
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
    t.project_subtask_id,
    coalesce(tt.type1, '') as task_type1,
    coalesce(tt.type2, '') as task_type2,
    t.task_usedtime,
    t.content,
    t.note,
    t.created_at,
    t.updated_at,
    nullif(pl.name, '') as platform,
    nullif(public.resolve_service_group_name(sg.service_group_name, sg.name), '') as service_group_name,
    nullif(public.resolve_service_name(sg.service_name, sg.name), '') as service_name,
    p.name as project_name,
    pp.title as subtask_title,
    t.url
  from public.tasks t
  join public.cost_groups cg on cg.id = t.cost_group_id
  left join public.task_types tt on tt.id = t.task_type_id
  left join public.projects p on p.id = t.project_id
  left join public.platforms pl on pl.id = p.platform_id
  left join public.project_subtasks pp on pp.id = t.project_subtask_id
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
    and (p_project_subtask_id is null or t.project_subtask_id = p_project_subtask_id)
    and (p_task_type1 is null or tt.type1 = p_task_type1)
    and (p_task_type2 is null or tt.type2 = p_task_type2)
    and (p_min_task_usedtime is null or t.task_usedtime >= p_min_task_usedtime)
    and (p_max_task_usedtime is null or t.task_usedtime <= p_max_task_usedtime)
    and (
      p_keyword is null
      or concat_ws(
        ' ',
        coalesce(p.name, ''),
        coalesce(pp.title, ''),
        coalesce(tt.type1, ''),
        coalesce(tt.type2, ''),
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
  p_project_subtask_id uuid default null,
  p_task_type1 text default null,
  p_task_type2 text default null,
  p_min_task_usedtime numeric default null,
  p_max_task_usedtime numeric default null,
  p_keyword text default null
)
returns table (
  id uuid,
  member_id uuid,
  member_account_id text,
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
  project_name text,
  subtask_title text,
  url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.member_id,
    m.account_id as member_account_id,
    t.task_date,
    t.cost_group_id,
    cg.name as cost_group_name,
    coalesce(tt.type1, '') as task_type1,
    coalesce(tt.type2, '') as task_type2,
    t.task_usedtime,
    t.content,
    t.note,
    t.updated_at,
    nullif(pl.name, '') as platform,
    nullif(public.resolve_service_group_name(sg.service_group_name, sg.name), '') as service_group_name,
    nullif(public.resolve_service_name(sg.service_name, sg.name), '') as service_name,
    p.name as project_name,
    pp.title as subtask_title,
    t.url
  from public.tasks t
  join public.cost_groups cg on cg.id = t.cost_group_id
  left join public.task_types tt on tt.id = t.task_type_id
  left join public.projects p on p.id = t.project_id
  left join public.platforms pl on pl.id = p.platform_id
  left join public.project_subtasks pp on pp.id = t.project_subtask_id
  left join public.service_groups sg on sg.id = p.service_group_id
  where public.current_member_id() is not null
    and t.member_id = coalesce(p_member_id, public.current_member_id())
    and (p_start_date is null or t.task_date >= p_start_date)
    and (p_end_date is null or t.task_date <= p_end_date)
    and (p_project_id is null or t.project_id = p_project_id)
    and (p_project_subtask_id is null or t.project_subtask_id = p_project_subtask_id)
    and (p_task_type1 is null or tt.type1 = p_task_type1)
    and (p_task_type2 is null or tt.type2 = p_task_type2)
    and (p_min_task_usedtime is null or t.task_usedtime >= p_min_task_usedtime)
    and (p_max_task_usedtime is null or t.task_usedtime <= p_max_task_usedtime)
    and (
      p_keyword is null
      or concat_ws(
        ' ',
        coalesce(t.content, ''),
        coalesce(t.note, ''),
        coalesce(tt.type1, ''),
        coalesce(tt.type2, ''),
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

drop function if exists public.upsert_project(uuid, text, text, uuid, uuid, text, uuid, uuid, date, date, boolean);
drop function if exists public.upsert_project(uuid, uuid, text, uuid, uuid, text, uuid, uuid, date, date, boolean);

create or replace function public.upsert_project(
  p_project_id uuid default null,
  p_task_type_id uuid default null,
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

  if not exists (select 1 from public.platforms where id = p_platform_id) then
    raise exception 'platform not found';
  end if;

  if p_task_type_id is null then
    raise exception 'project type required';
  end if;

  if not exists (
    select 1
    from public.task_types
    where id = p_task_type_id
      and requires_service_group = true
  ) then
    raise exception 'project type not found';
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
      task_type_id,
      name,
      platform_id,
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
      p_task_type_id,
      p_name,
      p_platform_id,
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
      task_type_id = p_task_type_id,
      name = p_name,
      platform_id = p_platform_id,
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

drop function if exists public.search_projects_page(date, date, text);

create or replace function public.search_projects_page(
  p_start_date date default null,
  p_end_date date default null,
  p_keyword text default null
)
returns table (
  id uuid,
  created_by_member_id uuid,
  task_type_id uuid,
  task_type1 text,
  name text,
  platform_id uuid,
  platform text,
  cost_group_name text,
  service_group_id uuid,
  service_group_name text,
  service_name text,
  report_url text,
  reporter_member_id uuid,
  reporter_display text,
  reviewer_member_id uuid,
  reviewer_display text,
  start_date date,
  end_date date,
  is_active boolean,
  subtask_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.created_by_member_id,
    p.task_type_id,
    ptt.type1,
    p.name,
    p.platform_id,
    nullif(pl.name, '') as platform,
    nullif(cg.name, '') as cost_group_name,
    p.service_group_id,
    nullif(public.resolve_service_group_name(sg.service_group_name, sg.name), '') as service_group_name,
    nullif(public.resolve_service_name(sg.service_name, sg.name), '') as service_name,
    nullif(p.report_url, '') as report_url,
    p.reporter_member_id,
    nullif(concat_ws(' ', nullif(reporter.account_id, ''), nullif(reporter.name, '')), '') as reporter_display,
    p.reviewer_member_id,
    nullif(concat_ws(' ', nullif(reviewer.account_id, ''), nullif(reviewer.name, '')), '') as reviewer_display,
    p.start_date,
    p.end_date,
    p.is_active,
    count(pp.id)::bigint as subtask_count
  from public.projects p
  left join public.task_types ptt on ptt.id = p.task_type_id
  left join public.platforms pl on pl.id = p.platform_id
  left join public.service_groups sg on sg.id = p.service_group_id
  left join public.cost_groups cg on cg.id = sg.cost_group_id
  left join public.members reporter on reporter.id = p.reporter_member_id
  left join public.members reviewer on reviewer.id = p.reviewer_member_id
  left join public.project_subtasks pp on pp.project_id = p.id
  where public.current_member_id() is not null
    and (p_start_date is null or p.end_date >= p_start_date)
    and (p_end_date is null or p.start_date <= p_end_date)
    and (
      p_keyword is null
      or concat_ws(
        ' ',
        coalesce(ptt.type1, ''),
        coalesce(p.name, ''),
        coalesce(pl.name, ''),
        coalesce(cg.name, ''),
        coalesce(p.report_url, ''),
        coalesce(public.compose_service_group_label(sg.service_group_name, sg.service_name), ''),
        coalesce(reporter.account_id, ''),
        coalesce(reporter.name, ''),
        coalesce(reviewer.account_id, ''),
        coalesce(reviewer.name, ''),
        coalesce(to_char(p.start_date, 'YYYY-MM-DD'), ''),
        coalesce(to_char(p.end_date, 'YYYY-MM-DD'), '')
      ) ilike '%' || p_keyword || '%'
    )
  group by
    p.id,
    p.created_by_member_id,
    p.task_type_id,
    ptt.type1,
    p.name,
    p.platform_id,
    pl.name,
    cg.name,
    p.service_group_id,
    sg.service_group_name,
    sg.service_name,
    sg.name,
    p.report_url,
    p.reporter_member_id,
    reporter.account_id,
    reporter.name,
    p.reviewer_member_id,
    reviewer.account_id,
    reviewer.name,
    p.start_date,
    p.end_date,
    p.is_active
  order by p.is_active desc, p.start_date desc, p.name asc
$$;

create or replace function public.search_report_projects(
  p_cost_group_id uuid default null,
  p_platform text default null,
  p_task_type1 text default null,
  p_keyword text default null
)
returns table (
  id uuid,
  task_type_id uuid,
  task_type1 text,
  name text,
  platform text,
  service_group_id uuid,
  service_group_name text,
  service_name text,
  cost_group_id uuid,
  cost_group_name text,
  report_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.task_type_id,
    ptt.type1,
    p.name,
    nullif(pl.name, '') as platform,
    p.service_group_id,
    nullif(public.resolve_service_group_name(sg.service_group_name, sg.name), '') as service_group_name,
    nullif(public.resolve_service_name(sg.service_name, sg.name), '') as service_name,
    sg.cost_group_id,
    nullif(cg.name, '') as cost_group_name,
    nullif(p.report_url, '') as report_url
  from public.projects p
  left join public.task_types ptt on ptt.id = p.task_type_id
  left join public.platforms pl on pl.id = p.platform_id
  join public.service_groups sg on sg.id = p.service_group_id
  left join public.cost_groups cg on cg.id = sg.cost_group_id
  where public.current_member_id() is not null
    and p.is_active = true
    and (p_cost_group_id is null or sg.cost_group_id = p_cost_group_id)
    and (p_platform is null or pl.name = p_platform)
    and (p_task_type1 is null or ptt.type1 = p_task_type1)
    and (
      p_keyword is null
      or concat_ws(
        ' ',
        coalesce(ptt.type1, ''),
        coalesce(p.name, ''),
        coalesce(pl.name, ''),
        coalesce(public.compose_service_group_label(sg.service_group_name, sg.service_name), ''),
        coalesce(cg.name, ''),
        coalesce(p.report_url, '')
      ) ilike '%' || p_keyword || '%'
    )
  order by p.name asc
  limit 60
$$;

create or replace function public.upsert_project_subtask(
  p_subtask_id uuid default null,
  p_project_id uuid default null,
  p_title text default null,
  p_url text default '',
  p_owner_member_id uuid default null,
  p_task_date text default null,
  p_task_status text default '미수정',
  p_note text default ''
)
returns public.project_subtasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid := public.current_member_id();
  v_subtask public.project_subtasks;
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

  if p_subtask_id is null then
    insert into public.project_subtasks (
      project_id,
      owner_member_id,
      title,
      url,
      task_date,
      task_status,
      note
    )
    values (
      p_project_id,
      coalesce(p_owner_member_id, v_member_id),
      p_title,
      coalesce(p_url, ''),
      p_task_date,
      p_task_status,
      coalesce(p_note, '')
    )
    returning * into v_subtask;
  else
    update public.project_subtasks
    set
      project_id = p_project_id,
      owner_member_id = coalesce(p_owner_member_id, owner_member_id),
      title = p_title,
      url = coalesce(p_url, ''),
      task_date = p_task_date,
      task_status = p_task_status,
      note = coalesce(p_note, ''),
      updated_at = timezone('utc', now())
    where id = p_subtask_id
      and (
        owner_member_id = v_member_id
        or public.current_user_is_admin()
      )
    returning * into v_subtask;

    if v_subtask is null then
      raise exception 'project subtask not found';
    end if;
  end if;

  return v_subtask;
end;
$$;

drop function if exists public.admin_get_task(uuid);

create or replace function public.admin_get_task(
  p_task_id uuid
)
returns table (
  id uuid,
  member_id uuid,
  member_account_id text,
  task_date date,
  cost_group_id uuid,
  cost_group_name text,
  project_id uuid,
  project_subtask_id uuid,
  task_type1 text,
  task_type2 text,
  task_usedtime numeric,
  content text,
  note text,
  updated_at timestamptz,
  member_name text,
  member_email text,
  project_name text,
  subtask_title text,
  url text,
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
    m.account_id as member_account_id,
    t.task_date,
    t.cost_group_id,
    cg.name as cost_group_name,
    t.project_id,
    t.project_subtask_id,
    coalesce(tt.type1, '') as task_type1,
    coalesce(tt.type2, '') as task_type2,
    t.task_usedtime,
    t.content,
    t.note,
    t.updated_at,
    m.name as member_name,
    m.email as member_email,
    p.name as project_name,
    pp.title as subtask_title,
    t.url,
    nullif(pl.name, '') as platform,
    p.service_group_id,
    nullif(public.resolve_service_group_name(sg.service_group_name, sg.name), '') as service_group_name,
    nullif(public.resolve_service_name(sg.service_name, sg.name), '') as service_name
  from public.tasks t
  join public.members m on m.id = t.member_id
  join public.cost_groups cg on cg.id = t.cost_group_id
  left join public.task_types tt on tt.id = t.task_type_id
  left join public.projects p on p.id = t.project_id
  left join public.platforms pl on pl.id = p.platform_id
  left join public.project_subtasks pp on pp.id = t.project_subtask_id
  left join public.service_groups sg on sg.id = p.service_group_id
  where public.current_user_is_admin()
    and t.id = p_task_id
$$;

drop function if exists public.admin_save_task(uuid, uuid, date, uuid, uuid, uuid, text, text, numeric, text, text, text);

create or replace function public.admin_save_task(
  p_task_id uuid default null,
  p_member_id uuid default null,
  p_task_date date default null,
  p_cost_group_id uuid default null,
  p_project_id uuid default null,
  p_project_subtask_id uuid default null,
  p_task_type1 text default null,
  p_task_type2 text default null,
  p_task_usedtime numeric default null,
  p_url text default '',
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
  project_subtask_id uuid,
  task_type1 text,
  task_type2 text,
  task_usedtime numeric,
  content text,
  note text,
  updated_at timestamptz,
  member_name text,
  member_email text,
  project_name text,
  subtask_title text,
  url text,
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
  v_task_type_id uuid;
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

  v_task_type_id := public.resolve_task_type_id(p_task_type1, p_task_type2);

  if v_task_type_id is null then
    raise exception 'task_type not found';
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
      project_subtask_id,
      task_type_id,
      task_usedtime,
      url,
      content,
      note
    )
    values (
      p_member_id,
      public.current_member_id(),
      p_task_date,
      p_cost_group_id,
      p_project_id,
      p_project_subtask_id,
      v_task_type_id,
      p_task_usedtime,
      coalesce(p_url, ''),
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
      project_subtask_id = p_project_subtask_id,
      task_type_id = v_task_type_id,
      task_usedtime = p_task_usedtime,
      url = coalesce(p_url, ''),
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
declare
  v_next_task_type_id uuid;
begin
  if not public.current_user_is_admin() then
    raise exception 'admin only';
  end if;

  v_next_task_type_id := public.resolve_task_type_id(p_next_type1, p_next_type2);

  if v_next_task_type_id is null then
    raise exception 'next task_type not found';
  end if;

  update public.tasks
  set
    task_type_id = v_next_task_type_id,
    updated_at = timezone('utc', now())
  where task_type_id = public.resolve_task_type_id(p_old_type1, p_old_type2);
end;
$$;

drop function if exists public.admin_replace_task_type_usage_by_id(uuid, uuid);

create or replace function public.admin_replace_task_type_usage_by_id(
  p_old_task_type_id uuid,
  p_next_task_type_id uuid,
  p_drop_existing boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_task_type_id uuid;
  v_next_task_type_id uuid;
  v_next_task_type_active boolean;
begin
  if not public.current_user_is_admin() then
    raise exception 'admin only';
  end if;

  if p_old_task_type_id is null or p_next_task_type_id is null then
    raise exception 'task_type ids required';
  end if;

  if p_old_task_type_id = p_next_task_type_id then
    raise exception 'next task_type must be different';
  end if;

  select id
  into v_old_task_type_id
  from public.task_types
  where id = p_old_task_type_id;

  if v_old_task_type_id is null then
    raise exception 'old task_type not found';
  end if;

  select id, is_active
  into v_next_task_type_id, v_next_task_type_active
  from public.task_types
  where id = p_next_task_type_id;

  if v_next_task_type_id is null then
    raise exception 'next task_type not found';
  end if;

  if v_next_task_type_active is not true then
    raise exception 'next task_type must be active';
  end if;

  update public.tasks
  set
    task_type_id = p_next_task_type_id,
    updated_at = timezone('utc', now())
  where task_type_id = p_old_task_type_id;

  if p_drop_existing then
    delete from public.task_types
    where id = p_old_task_type_id;
  else
    update public.task_types
    set
      is_active = false,
      updated_at = timezone('utc', now())
    where id = p_old_task_type_id;
  end if;
end;
$$;

create or replace function public.admin_reorder_task_types(
  p_task_type_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected_count integer := coalesce(array_length(p_task_type_ids, 1), 0);
  v_updated_count integer := 0;
begin
  if not public.current_user_is_admin() then
    raise exception 'admin only';
  end if;

  if v_expected_count = 0 then
    raise exception 'task_type_ids required';
  end if;

  if (
    select count(distinct item_id)
    from unnest(p_task_type_ids) as item_id
  ) <> v_expected_count then
    raise exception 'task_type_ids must be unique';
  end if;

  with ordered as (
    select item_id, ordinality::integer as display_order
    from unnest(p_task_type_ids) with ordinality as items(item_id, ordinality)
  )
  update public.task_types task_type
  set
    display_order = ordered.display_order,
    updated_at = timezone('utc', now())
  from ordered
  where task_type.id = ordered.item_id;

  get diagnostics v_updated_count = row_count;

  if v_updated_count <> v_expected_count then
    raise exception 'task_types not found';
  end if;
end;
$$;

create or replace function public.admin_reorder_platforms(
  p_platform_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected_count integer := coalesce(array_length(p_platform_ids, 1), 0);
  v_updated_count integer := 0;
begin
  if not public.current_user_is_admin() then
    raise exception 'admin only';
  end if;

  if v_expected_count = 0 then
    raise exception 'platform_ids required';
  end if;

  if (
    select count(distinct item_id)
    from unnest(p_platform_ids) as item_id
  ) <> v_expected_count then
    raise exception 'platform_ids must be unique';
  end if;

  with ordered as (
    select item_id, ordinality::integer as display_order
    from unnest(p_platform_ids) with ordinality as items(item_id, ordinality)
  )
  update public.platforms platform
  set
    display_order = ordered.display_order,
    updated_at = timezone('utc', now())
  from ordered
  where platform.id = ordered.item_id;

  get diagnostics v_updated_count = row_count;

  if v_updated_count <> v_expected_count then
    raise exception 'platforms not found';
  end if;
end;
$$;

drop function if exists public.admin_replace_platform_usage(uuid, uuid);

create or replace function public.admin_replace_platform_usage(
  p_old_platform_id uuid,
  p_next_platform_id uuid,
  p_drop_existing boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_platform_name text;
  v_next_platform_name text;
  v_next_platform_visible boolean;
begin
  if not public.current_user_is_admin() then
    raise exception 'admin only';
  end if;

  if p_old_platform_id is null or p_next_platform_id is null then
    raise exception 'platform ids required';
  end if;

  if p_old_platform_id = p_next_platform_id then
    raise exception 'next platform must be different';
  end if;

  select name
  into v_old_platform_name
  from public.platforms
  where id = p_old_platform_id;

  if v_old_platform_name is null then
    raise exception 'old platform not found';
  end if;

  select name, is_visible
  into v_next_platform_name, v_next_platform_visible
  from public.platforms
  where id = p_next_platform_id;

  if v_next_platform_name is null then
    raise exception 'next platform not found';
  end if;

  if v_next_platform_visible is not true then
    raise exception 'next platform must be visible';
  end if;

  update public.projects
  set
    platform_id = p_next_platform_id,
    platform = v_next_platform_name,
    updated_at = timezone('utc', now())
  where platform_id = p_old_platform_id;

  if p_drop_existing then
    delete from public.platforms
    where id = p_old_platform_id;
  else
    update public.platforms
    set
      is_visible = false,
      updated_at = timezone('utc', now())
    where id = p_old_platform_id;
  end if;
end;
$$;

create or replace function public.admin_reorder_cost_groups(
  p_cost_group_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected_count integer := coalesce(array_length(p_cost_group_ids, 1), 0);
  v_updated_count integer := 0;
begin
  if not public.current_user_is_admin() then
    raise exception 'admin only';
  end if;

  if v_expected_count = 0 then
    raise exception 'cost_group_ids required';
  end if;

  if (
    select count(distinct item_id)
    from unnest(p_cost_group_ids) as item_id
  ) <> v_expected_count then
    raise exception 'cost_group_ids must be unique';
  end if;

  with ordered as (
    select item_id, ordinality::integer as display_order
    from unnest(p_cost_group_ids) with ordinality as items(item_id, ordinality)
  )
  update public.cost_groups cost_group
  set
    display_order = ordered.display_order,
    updated_at = timezone('utc', now())
  from ordered
  where cost_group.id = ordered.item_id;

  get diagnostics v_updated_count = row_count;

  if v_updated_count <> v_expected_count then
    raise exception 'cost_groups not found';
  end if;
end;
$$;

drop function if exists public.admin_replace_cost_group_usage(uuid, uuid);

create or replace function public.admin_replace_cost_group_usage(
  p_old_cost_group_id uuid,
  p_next_cost_group_id uuid,
  p_drop_existing boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_cost_group_id uuid;
  v_next_cost_group_id uuid;
  v_next_cost_group_active boolean;
begin
  if not public.current_user_is_admin() then
    raise exception 'admin only';
  end if;

  if p_old_cost_group_id is null or p_next_cost_group_id is null then
    raise exception 'cost_group ids required';
  end if;

  if p_old_cost_group_id = p_next_cost_group_id then
    raise exception 'next cost_group must be different';
  end if;

  select id
  into v_old_cost_group_id
  from public.cost_groups
  where id = p_old_cost_group_id;

  if v_old_cost_group_id is null then
    raise exception 'old cost_group not found';
  end if;

  select id, is_active
  into v_next_cost_group_id, v_next_cost_group_active
  from public.cost_groups
  where id = p_next_cost_group_id;

  if v_next_cost_group_id is null then
    raise exception 'next cost_group not found';
  end if;

  if v_next_cost_group_active is not true then
    raise exception 'next cost_group must be active';
  end if;

  update public.service_groups
  set
    cost_group_id = p_next_cost_group_id,
    updated_at = timezone('utc', now())
  where cost_group_id = p_old_cost_group_id;

  update public.tasks
  set
    cost_group_id = p_next_cost_group_id,
    updated_at = timezone('utc', now())
  where cost_group_id = p_old_cost_group_id;

  if p_drop_existing then
    delete from public.cost_groups
    where id = p_old_cost_group_id;
  else
    update public.cost_groups
    set
      is_active = false,
      updated_at = timezone('utc', now())
    where id = p_old_cost_group_id;
  end if;
end;
$$;

create or replace function public.admin_reorder_service_groups(
  p_service_group_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected_count integer := coalesce(array_length(p_service_group_ids, 1), 0);
  v_updated_count integer := 0;
begin
  if not public.current_user_is_admin() then
    raise exception 'admin only';
  end if;

  if v_expected_count = 0 then
    raise exception 'service_group_ids required';
  end if;

  if (
    select count(distinct item_id)
    from unnest(p_service_group_ids) as item_id
  ) <> v_expected_count then
    raise exception 'service_group_ids must be unique';
  end if;

  with ordered as (
    select item_id, ordinality::integer as display_order
    from unnest(p_service_group_ids) with ordinality as items(item_id, ordinality)
  )
  update public.service_groups service_group
  set
    display_order = ordered.display_order,
    updated_at = timezone('utc', now())
  from ordered
  where service_group.id = ordered.item_id;

  get diagnostics v_updated_count = row_count;

  if v_updated_count <> v_expected_count then
    raise exception 'service_groups not found';
  end if;
end;
$$;

drop function if exists public.admin_replace_service_group_usage(uuid, uuid);

create or replace function public.admin_replace_service_group_usage(
  p_old_service_group_id uuid,
  p_next_service_group_id uuid,
  p_drop_existing boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_service_group_id uuid;
  v_next_service_group_id uuid;
  v_next_service_group_active boolean;
begin
  if not public.current_user_is_admin() then
    raise exception 'admin only';
  end if;

  if p_old_service_group_id is null or p_next_service_group_id is null then
    raise exception 'service_group ids required';
  end if;

  if p_old_service_group_id = p_next_service_group_id then
    raise exception 'next service_group must be different';
  end if;

  select id
  into v_old_service_group_id
  from public.service_groups
  where id = p_old_service_group_id;

  if v_old_service_group_id is null then
    raise exception 'old service_group not found';
  end if;

  select id, is_active
  into v_next_service_group_id, v_next_service_group_active
  from public.service_groups
  where id = p_next_service_group_id;

  if v_next_service_group_id is null then
    raise exception 'next service_group not found';
  end if;

  if v_next_service_group_active is not true then
    raise exception 'next service_group must be active';
  end if;

  update public.projects
  set
    service_group_id = p_next_service_group_id,
    updated_at = timezone('utc', now())
  where service_group_id = p_old_service_group_id;

  if p_drop_existing then
    delete from public.service_groups
    where id = p_old_service_group_id;
  else
    update public.service_groups
    set
      is_active = false,
      updated_at = timezone('utc', now())
    where id = p_old_service_group_id;
  end if;
end;
$$;

drop function if exists public.admin_search_tasks(uuid, date, date, uuid, uuid, text, text, uuid, text);
drop function if exists public.admin_search_tasks(uuid, date, date, uuid, uuid, uuid, uuid, uuid, text, text, uuid, text);

create or replace function public.admin_search_tasks(
  p_member_id uuid default null,
  p_start_date date default null,
  p_end_date date default null,
  p_project_id uuid default null,
  p_project_subtask_id uuid default null,
  p_platform_id uuid default null,
  p_service_group_id uuid default null,
  p_task_type_id uuid default null,
  p_task_type1 text default null,
  p_task_type2 text default null,
  p_cost_group_id uuid default null,
  p_keyword text default null
)
returns table (
  id uuid,
  member_id uuid,
  member_account_id text,
  task_date date,
  cost_group_id uuid,
  cost_group_name text,
  project_id uuid,
  project_subtask_id uuid,
  task_type1 text,
  task_type2 text,
  task_usedtime numeric,
  content text,
  note text,
  updated_at timestamptz,
  member_name text,
  member_email text,
  project_name text,
  subtask_title text,
  url text,
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
    m.account_id as member_account_id,
    t.task_date,
    t.cost_group_id,
    cg.name as cost_group_name,
    t.project_id,
    t.project_subtask_id,
    coalesce(tt.type1, '') as task_type1,
    coalesce(tt.type2, '') as task_type2,
    t.task_usedtime,
    t.content,
    t.note,
    t.updated_at,
    m.name as member_name,
    m.email as member_email,
    p.name as project_name,
    pp.title as subtask_title,
    t.url,
    nullif(pl.name, '') as platform,
    p.service_group_id,
    nullif(public.resolve_service_group_name(sg.service_group_name, sg.name), '') as service_group_name,
    nullif(public.resolve_service_name(sg.service_name, sg.name), '') as service_name
  from public.tasks t
  join public.members m on m.id = t.member_id
  join public.cost_groups cg on cg.id = t.cost_group_id
  left join public.task_types tt on tt.id = t.task_type_id
  left join public.projects p on p.id = t.project_id
  left join public.platforms pl on pl.id = p.platform_id
  left join public.project_subtasks pp on pp.id = t.project_subtask_id
  left join public.service_groups sg on sg.id = p.service_group_id
  where public.current_user_is_admin()
    and (p_member_id is null or t.member_id = p_member_id)
    and (p_start_date is null or t.task_date >= p_start_date)
    and (p_end_date is null or t.task_date <= p_end_date)
    and (p_project_id is null or t.project_id = p_project_id)
    and (p_project_subtask_id is null or t.project_subtask_id = p_project_subtask_id)
    and (p_platform_id is null or p.platform_id = p_platform_id)
    and (p_service_group_id is null or p.service_group_id = p_service_group_id)
    and (p_task_type_id is null or t.task_type_id = p_task_type_id)
    and (p_task_type1 is null or tt.type1 = p_task_type1)
    and (p_task_type2 is null or tt.type2 = p_task_type2)
    and (p_cost_group_id is null or t.cost_group_id = p_cost_group_id)
    and (
      p_keyword is null
      or concat_ws(
        ' ',
        m.name,
        m.email,
        p.name,
        pp.title,
        coalesce(tt.type1, ''),
        coalesce(tt.type2, ''),
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
grant execute on function public.admin_find_auth_user_by_email(text) to authenticated;
grant execute on function public.bind_auth_session_member(uuid, text) to authenticated;
grant execute on function public.touch_member_last_login(uuid, text) to authenticated;
grant execute on function public.save_task(uuid, date, uuid, uuid, uuid, text, text, numeric, text, text, text) to authenticated;
grant execute on function public.delete_task(uuid) to authenticated;
grant execute on function public.get_tasks_by_date(uuid, date) to authenticated;
grant execute on function public.get_task_activities() to authenticated;
grant execute on function public.get_dashboard_task_calendar(uuid, text) to authenticated;
grant execute on function public.get_dashboard_snapshot() to authenticated;
grant execute on function public.get_resource_summary(uuid, text) to authenticated;
grant execute on function public.get_resource_summary_members(uuid) to authenticated;
grant execute on function public.get_resource_type_summary(uuid) to authenticated;
grant execute on function public.get_resource_type_summary_years(uuid) to authenticated;
grant execute on function public.get_resource_type_summary_by_year(uuid, text) to authenticated;
grant execute on function public.get_resource_service_summary(uuid) to authenticated;
grant execute on function public.get_resource_service_summary_years(uuid) to authenticated;
grant execute on function public.get_resource_service_summary_by_year(uuid, text) to authenticated;
grant execute on function public.get_resource_month_report(uuid, text) to authenticated;
grant execute on function public.get_stats() to authenticated;
grant execute on function public.get_project_stats_rows(text, text, text, text, text) to authenticated;
grant execute on function public.get_monitoring_stats_rows(text, text, text, text, text) to authenticated;
grant execute on function public.search_tasks_export(uuid, date, date, uuid, uuid, text, text, numeric, numeric, text) to authenticated;
grant execute on function public.search_tasks_page(uuid, date, date, uuid, uuid, text, text, numeric, numeric, text) to authenticated;
grant execute on function public.admin_get_task(uuid) to authenticated;
grant execute on function public.admin_save_task(uuid, uuid, date, uuid, uuid, uuid, text, text, numeric, text, text, text) to authenticated;
grant execute on function public.admin_delete_task(uuid) to authenticated;
grant execute on function public.admin_get_task_type_usage_summary(uuid, text, text) to authenticated;
grant execute on function public.admin_replace_task_type_usage(text, text, text, text) to authenticated;
grant execute on function public.admin_replace_task_type_usage_by_id(uuid, uuid, boolean) to authenticated;
grant execute on function public.admin_reorder_task_types(uuid[]) to authenticated;
grant execute on function public.admin_reorder_platforms(uuid[]) to authenticated;
grant execute on function public.admin_replace_platform_usage(uuid, uuid, boolean) to authenticated;
grant execute on function public.admin_reorder_cost_groups(uuid[]) to authenticated;
grant execute on function public.admin_replace_cost_group_usage(uuid, uuid, boolean) to authenticated;
grant execute on function public.admin_reorder_service_groups(uuid[]) to authenticated;
grant execute on function public.admin_replace_service_group_usage(uuid, uuid, boolean) to authenticated;
grant execute on function public.admin_get_member_task_count(uuid) to authenticated;
grant execute on function public.search_projects_page(date, date, text) to authenticated;
grant execute on function public.search_report_projects(uuid, text, text, text) to authenticated;
grant execute on function public.upsert_project(uuid, uuid, text, uuid, uuid, text, uuid, uuid, date, date, boolean) to authenticated;
grant execute on function public.upsert_project_subtask(uuid, uuid, text, text, uuid, text, text, text) to authenticated;
grant execute on function public.admin_search_tasks(uuid, date, date, uuid, uuid, uuid, uuid, uuid, text, text, uuid, text) to authenticated;

alter table public.members enable row level security;
alter table public.service_groups enable row level security;
alter table public.cost_groups enable row level security;
alter table public.platforms enable row level security;
alter table public.task_types enable row level security;
alter table public.projects enable row level security;
alter table public.project_subtasks enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "members_active_directory_select" on public.members;
drop policy if exists "members_admin_insert" on public.members;
drop policy if exists "members_admin_update" on public.members;
drop policy if exists "members_admin_delete" on public.members;
drop policy if exists "service_groups_active_select" on public.service_groups;
drop policy if exists "service_groups_admin_insert" on public.service_groups;
drop policy if exists "service_groups_admin_update" on public.service_groups;
drop policy if exists "service_groups_admin_delete" on public.service_groups;
drop policy if exists "cost_groups_active_select" on public.cost_groups;
drop policy if exists "cost_groups_admin_insert" on public.cost_groups;
drop policy if exists "cost_groups_admin_update" on public.cost_groups;
drop policy if exists "cost_groups_admin_delete" on public.cost_groups;
drop policy if exists "platforms_active_select" on public.platforms;
drop policy if exists "platforms_admin_insert" on public.platforms;
drop policy if exists "platforms_admin_update" on public.platforms;
drop policy if exists "platforms_admin_delete" on public.platforms;
drop policy if exists "task_types_active_select" on public.task_types;
drop policy if exists "task_types_admin_insert" on public.task_types;
drop policy if exists "task_types_admin_update" on public.task_types;
drop policy if exists "task_types_admin_delete" on public.task_types;
drop policy if exists "projects_select_authenticated" on public.projects;
drop policy if exists "projects_write_owner_or_admin" on public.projects;
drop policy if exists "project_pages_select_active_member" on public.project_subtasks;
drop policy if exists "project_pages_write_owner_or_admin" on public.project_subtasks;
drop policy if exists "project_subtasks_select_active_member" on public.project_subtasks;
drop policy if exists "project_subtasks_write_owner_or_admin" on public.project_subtasks;
drop policy if exists "tasks_select_own_or_admin" on public.tasks;
drop policy if exists "tasks_write_own_or_admin" on public.tasks;

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

create policy "project_subtasks_select_active_member"
on public.project_subtasks
for select
to authenticated
using (public.current_user_is_active_member());

create policy "project_subtasks_write_owner_or_admin"
on public.project_subtasks
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
grant select on public.project_subtasks_public_view to authenticated;
