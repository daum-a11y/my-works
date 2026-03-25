drop schema if exists legacy_xref cascade;
drop schema if exists legacy_stage cascade;

create schema legacy_stage;
create schema legacy_xref;

create table legacy_stage.user_tbl (
  user_num integer primary key,
  user_id text not null,
  user_pwd text not null,
  user_name text not null,
  user_level text not null,
  user_lastlogin text,
  user_create text not null,
  user_active text not null,
  report_required text not null
);

create unique index legacy_stage_user_tbl_user_id_idx
  on legacy_stage.user_tbl (user_id);

create table legacy_stage.type_tbl (
  type_num integer primary key,
  type_one text not null,
  type_two text not null,
  type_etc text not null,
  type_include_svc text,
  type_active text
);

create table legacy_stage.svc_group_tbl (
  svc_num integer primary key,
  svc_group text not null,
  svc_name text not null,
  svc_type text,
  svc_active text
);

create index legacy_stage_svc_group_tbl_group_name_idx
  on legacy_stage.svc_group_tbl (svc_group, svc_name);

create table legacy_stage.pj_tbl (
  pj_num integer primary key,
  pj_group_type1 text not null,
  pj_platform text not null,
  pj_sev_group text not null,
  pj_sev_name text not null,
  pj_name text not null,
  pj_page_report_url text,
  pj_reporter text not null,
  pj_reviewer text,
  pj_date text not null,
  pj_start_date text,
  pj_end_date text,
  pj_group_type2 text not null,
  pj_month text,
  pj_agit_url text,
  pj_err_highest text,
  pj_err_high text,
  pj_err_normal text,
  pj_err_low text,
  pj_err_ut text,
  pj_agit_date text,
  pj_track_etc text
);

create index legacy_stage_pj_tbl_name_idx
  on legacy_stage.pj_tbl (pj_name);

create index legacy_stage_pj_tbl_service_idx
  on legacy_stage.pj_tbl (pj_sev_group, pj_sev_name);

create table legacy_stage.pj_page_tbl (
  pj_page_num integer primary key,
  pj_unique_num integer not null,
  pj_page_name text not null,
  pj_page_url text not null,
  pj_page_etc text,
  pj_page_id text not null,
  pj_page_agit text,
  pj_page_agit_url text,
  pj_page_track1 text,
  pj_page_track2 text,
  pj_page_track3 text,
  pj_page_track4 text,
  pj_page_track_end text,
  pj_page_highest text,
  pj_page_high text,
  pj_page_normal text,
  pj_page_track_etc text,
  pj_page_report text,
  pj_page_creat text,
  pj_page_date text
);

create index legacy_stage_pj_page_tbl_project_idx
  on legacy_stage.pj_page_tbl (pj_unique_num);

create index legacy_stage_pj_page_tbl_name_idx
  on legacy_stage.pj_page_tbl (pj_page_name);

create table legacy_stage.task_tbl (
  task_num integer primary key,
  task_date text not null,
  task_user text not null,
  task_type1 text not null,
  task_type2 text not null,
  task_platform text,
  task_svc_group text,
  task_svc_name text,
  task_pj_name text,
  task_pj_page text,
  task_pj_page_url text,
  task_manager text,
  task_count_element text,
  task_count_error text,
  task_count_errortask text,
  task_estimated text,
  task_test_report text,
  task_communication text,
  task_review text,
  task_usedtime text not null,
  task_etc text,
  task_allcount text,
  task_pj_report_num text,
  task_page_report_num text
);

create index legacy_stage_task_tbl_user_idx
  on legacy_stage.task_tbl (task_user);

create index legacy_stage_task_tbl_project_idx
  on legacy_stage.task_tbl (task_pj_report_num, task_page_report_num);

create index legacy_stage_task_tbl_name_idx
  on legacy_stage.task_tbl (task_pj_name, task_pj_page);

create table legacy_xref.members (
  legacy_user_num integer primary key,
  legacy_user_id text not null unique,
  member_id uuid not null references public.members(id) on delete cascade,
  synced_at timestamptz not null default timezone('utc', now())
);

create table legacy_xref.task_types (
  legacy_type_num integer primary key,
  task_type_id uuid not null references public.task_types(id) on delete cascade,
  synced_at timestamptz not null default timezone('utc', now())
);

create table legacy_xref.service_groups (
  legacy_svc_num integer primary key,
  service_group_id uuid not null references public.service_groups(id) on delete cascade,
  synced_at timestamptz not null default timezone('utc', now())
);

create table legacy_xref.projects (
  legacy_project_num integer primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  synced_at timestamptz not null default timezone('utc', now())
);

create table legacy_xref.project_pages (
  legacy_page_num integer primary key,
  project_page_id uuid not null references public.project_pages(id) on delete cascade,
  synced_at timestamptz not null default timezone('utc', now())
);

create table legacy_xref.tasks (
  legacy_task_num integer primary key,
  task_id uuid not null references public.tasks(id) on delete cascade,
  synced_at timestamptz not null default timezone('utc', now())
);
