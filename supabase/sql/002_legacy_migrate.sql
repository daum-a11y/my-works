begin;
set local statement_timeout = 0;

create or replace function legacy_stage.blank_to_null(value text)
returns text
language sql
immutable
as $$
  select case
    when value is null then null
    when btrim(value) = '' then null
    when lower(btrim(value)) = 'null' then null
    else btrim(value)
  end
$$;

create or replace function legacy_stage.to_int(value text)
returns integer
language sql
immutable
as $$
  select case
    when legacy_stage.blank_to_null(value) ~ '^-?[0-9]+$' then legacy_stage.blank_to_null(value)::integer
    else null
  end
$$;

create or replace function legacy_stage.to_bool_flag(value text)
returns boolean
language sql
immutable
as $$
  select case lower(coalesce(legacy_stage.blank_to_null(value), ''))
    when '1' then true
    when 'y' then true
    when 'yes' then true
    when 'true' then true
    when '0' then false
    when 'n' then false
    when 'no' then false
    when 'false' then false
    else null
  end
$$;

create or replace function legacy_stage.to_date_ymd(value text)
returns date
language sql
immutable
as $$
  select case
    when legacy_stage.blank_to_null(value) is null then null
    when legacy_stage.blank_to_null(value) in ('0000-00-00', '0000-00-00 00:00:00') then null
    when substring(legacy_stage.blank_to_null(value) from 1 for 10) ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      then substring(legacy_stage.blank_to_null(value) from 1 for 10)::date
    else null
  end
$$;

create or replace function legacy_stage.to_timestamp_seoul(value text)
returns timestamptz
language sql
immutable
as $$
  select case
    when legacy_stage.blank_to_null(value) is null then null
    when legacy_stage.blank_to_null(value) like '0000-00-00%' then null
    else (legacy_stage.blank_to_null(value)::timestamp at time zone 'Asia/Seoul')
  end
$$;

create or replace function legacy_stage.normalize_service_name(service_group text, service_name text)
returns text
language sql
immutable
as $$
  select case
    when legacy_stage.blank_to_null(service_group) is null and legacy_stage.blank_to_null(service_name) is null then '미분류'
    when legacy_stage.blank_to_null(service_group) is null then legacy_stage.blank_to_null(service_name)
    when legacy_stage.blank_to_null(service_name) is null then legacy_stage.blank_to_null(service_group)
    else legacy_stage.blank_to_null(service_group) || ' / ' || legacy_stage.blank_to_null(service_name)
  end
$$;

with source_members as (
  select
    user_num as account_num,
    legacy_stage.blank_to_null(user_id) as account_id,
    coalesce(legacy_stage.blank_to_null(user_name), legacy_stage.blank_to_null(user_id), '이름없음') as name,
    coalesce(legacy_stage.to_int(user_level), 0)::smallint as user_level,
    coalesce(legacy_stage.to_bool_flag(user_active), true) as user_active,
    coalesce(legacy_stage.to_bool_flag(report_required), true) as report_required,
    coalesce(legacy_stage.to_timestamp_seoul(user_create), timezone('utc', now())) as joined_at,
    lower(coalesce(legacy_stage.blank_to_null(user_id), 'member-' || user_num::text)) || '+' || user_num::text || '@account.local' as placeholder_email
  from legacy_stage.user_tbl
)
insert into public.members as members_target (
  account_num,
  account_id,
  name,
  email,
  user_level,
  user_active,
  joined_at,
  report_required
)
select
  s.account_num,
  s.account_id,
  s.name,
  s.placeholder_email,
  s.user_level,
  s.user_active,
  s.joined_at,
  s.report_required
from source_members s
on conflict (account_id) do update
set account_num = excluded.account_num,
    name = excluded.name,
    user_level = excluded.user_level,
    user_active = excluded.user_active,
    joined_at = excluded.joined_at,
    report_required = excluded.report_required,
    email = members_target.email,
    updated_at = timezone('utc', now());

with task_only_members as (
  select distinct
    legacy_stage.blank_to_null(task_user) as account_id
  from legacy_stage.task_tbl
  where legacy_stage.blank_to_null(task_user) is not null
),
missing_task_members as (
  select
    t.account_id
  from task_only_members t
  where not exists (
    select 1
    from public.members m
    where lower(m.account_id) = lower(t.account_id)
  )
)
insert into public.members (
  account_num,
  account_id,
  name,
  email,
  user_level,
  user_active,
  joined_at,
  report_required
)
select
  null,
  m.account_id,
  m.account_id,
  lower(m.account_id) || '@account-task.local',
  0,
  false,
  timezone('utc', now()),
  false
from missing_task_members m;

delete from legacy_stage.task_tbl
where legacy_stage.blank_to_null(task_user) is null;

truncate table legacy_xref.members;
insert into legacy_xref.members (account_num, account_id, member_id)
select
  m.account_num,
  m.account_id,
  m.id
from public.members m
where m.account_num is not null
  and m.account_id is not null;

with source_types as (
  select
    type_num as legacy_type_num,
    coalesce(legacy_stage.blank_to_null(type_one), '미분류') as type1,
    coalesce(legacy_stage.blank_to_null(type_two), '') as type2,
    coalesce(legacy_stage.blank_to_null(type_etc), '') as display_label,
    coalesce(legacy_stage.to_bool_flag(type_include_svc), false) as requires_service_group,
    type_num as display_order,
    coalesce(legacy_stage.to_bool_flag(type_active), true) as is_active
  from legacy_stage.type_tbl
)
update public.task_types t
set type1 = s.type1,
    type2 = s.type2,
    display_label = s.display_label,
    requires_service_group = s.requires_service_group,
    display_order = s.display_order,
    is_active = s.is_active,
    updated_at = timezone('utc', now())
from source_types s
where t.legacy_type_num = s.legacy_type_num;

with source_types as (
  select
    type_num as legacy_type_num,
    coalesce(legacy_stage.blank_to_null(type_one), '미분류') as type1,
    coalesce(legacy_stage.blank_to_null(type_two), '') as type2,
    coalesce(legacy_stage.blank_to_null(type_etc), '') as display_label,
    coalesce(legacy_stage.to_bool_flag(type_include_svc), false) as requires_service_group,
    type_num as display_order,
    coalesce(legacy_stage.to_bool_flag(type_active), true) as is_active
  from legacy_stage.type_tbl
)
insert into public.task_types (
  legacy_type_num,
  type1,
  type2,
  display_label,
  requires_service_group,
  display_order,
  is_active
)
select
  s.legacy_type_num,
  s.type1,
  s.type2,
  s.display_label,
  s.requires_service_group,
  s.display_order,
  s.is_active
from source_types s
where not exists (
  select 1
  from public.task_types t
  where t.legacy_type_num = s.legacy_type_num
);

truncate table legacy_xref.task_types;
insert into legacy_xref.task_types (legacy_type_num, task_type_id)
select
  t.legacy_type_num,
  t.id
from public.task_types t
where t.legacy_type_num is not null;

with source_service_groups as (
  select
    svc_num as legacy_svc_num,
    legacy_stage.normalize_service_name(svc_group, svc_name) as name,
    svc_num as display_order,
    coalesce(legacy_stage.to_bool_flag(svc_active), true) as is_active
  from legacy_stage.svc_group_tbl
)
update public.service_groups g
set name = s.name,
    display_order = s.display_order,
    is_active = s.is_active,
    updated_at = timezone('utc', now())
from source_service_groups s
where g.legacy_svc_num = s.legacy_svc_num;

with source_service_groups as (
  select
    svc_num as legacy_svc_num,
    legacy_stage.normalize_service_name(svc_group, svc_name) as name,
    svc_num as display_order,
    coalesce(legacy_stage.to_bool_flag(svc_active), true) as is_active
  from legacy_stage.svc_group_tbl
)
insert into public.service_groups (
  legacy_svc_num,
  name,
  display_order,
  is_active
)
select
  s.legacy_svc_num,
  s.name,
  s.display_order,
  s.is_active
from source_service_groups s
where not exists (
  select 1
  from public.service_groups g
  where g.legacy_svc_num = s.legacy_svc_num
);

truncate table legacy_xref.service_groups;
insert into legacy_xref.service_groups (legacy_svc_num, service_group_id)
select
  g.legacy_svc_num,
  g.id
from public.service_groups g
where g.legacy_svc_num is not null;

with raw_service_lookup as (
  select
    min(svc_num) as svc_num,
    legacy_stage.normalize_service_name(svc_group, svc_name) as normalized_name
  from legacy_stage.svc_group_tbl
  group by legacy_stage.normalize_service_name(svc_group, svc_name)
),
source_projects as (
  select
    p.pj_num as legacy_project_num,
    p.pj_num::text as legacy_project_id,
    coalesce(legacy_stage.blank_to_null(p.pj_group_type1), '') as project_type1,
    coalesce(legacy_stage.blank_to_null(p.pj_name), '[프로젝트 ' || p.pj_num::text || ']') as name,
    coalesce(legacy_stage.blank_to_null(p.pj_platform), '미분류') as platform,
    coalesce(legacy_stage.blank_to_null(p.pj_page_report_url), '') as report_url,
    legacy_stage.blank_to_null(p.pj_reporter) as reporter_account_id,
    legacy_stage.blank_to_null(p.pj_reviewer) as reviewer_account_id,
    coalesce(
      legacy_stage.to_date_ymd(p.pj_start_date),
      legacy_stage.to_date_ymd(p.pj_month),
      legacy_stage.to_timestamp_seoul(p.pj_date)::date,
      date '1970-01-01'
    ) as start_date,
    coalesce(
      legacy_stage.to_date_ymd(p.pj_end_date),
      legacy_stage.to_date_ymd(p.pj_start_date),
      legacy_stage.to_date_ymd(p.pj_month),
      legacy_stage.to_timestamp_seoul(p.pj_date)::date,
      date '1970-01-01'
    ) as end_date,
    rs.svc_num as legacy_svc_num
  from legacy_stage.pj_tbl p
  left join raw_service_lookup rs
    on rs.normalized_name = legacy_stage.normalize_service_name(p.pj_sev_group, p.pj_sev_name)
)
update public.projects pr
set created_by_member_id = reporter_x.member_id,
    project_type1 = s.project_type1,
    name = s.name,
    platform = s.platform,
    service_group_id = svc_x.service_group_id,
    report_url = s.report_url,
    reporter_member_id = reporter_x.member_id,
    reviewer_member_id = reviewer_x.member_id,
    start_date = s.start_date,
    end_date = s.end_date,
    is_active = true,
    updated_at = timezone('utc', now())
from source_projects s
left join legacy_xref.members reporter_x on reporter_x.account_id = s.reporter_account_id
left join legacy_xref.members reviewer_x on reviewer_x.account_id = s.reviewer_account_id
left join legacy_xref.service_groups svc_x on svc_x.legacy_svc_num = s.legacy_svc_num
where pr.legacy_project_id = s.legacy_project_id;

with raw_service_lookup as (
  select
    min(svc_num) as svc_num,
    legacy_stage.normalize_service_name(svc_group, svc_name) as normalized_name
  from legacy_stage.svc_group_tbl
  group by legacy_stage.normalize_service_name(svc_group, svc_name)
),
source_projects as (
  select
    p.pj_num as legacy_project_num,
    p.pj_num::text as legacy_project_id,
    coalesce(legacy_stage.blank_to_null(p.pj_group_type1), '') as project_type1,
    coalesce(legacy_stage.blank_to_null(p.pj_name), '[프로젝트 ' || p.pj_num::text || ']') as name,
    coalesce(legacy_stage.blank_to_null(p.pj_platform), '미분류') as platform,
    coalesce(legacy_stage.blank_to_null(p.pj_page_report_url), '') as report_url,
    legacy_stage.blank_to_null(p.pj_reporter) as reporter_account_id,
    legacy_stage.blank_to_null(p.pj_reviewer) as reviewer_account_id,
    coalesce(
      legacy_stage.to_date_ymd(p.pj_start_date),
      legacy_stage.to_date_ymd(p.pj_month),
      legacy_stage.to_timestamp_seoul(p.pj_date)::date,
      date '1970-01-01'
    ) as start_date,
    coalesce(
      legacy_stage.to_date_ymd(p.pj_end_date),
      legacy_stage.to_date_ymd(p.pj_start_date),
      legacy_stage.to_date_ymd(p.pj_month),
      legacy_stage.to_timestamp_seoul(p.pj_date)::date,
      date '1970-01-01'
    ) as end_date,
    rs.svc_num as legacy_svc_num
  from legacy_stage.pj_tbl p
  left join raw_service_lookup rs
    on rs.normalized_name = legacy_stage.normalize_service_name(p.pj_sev_group, p.pj_sev_name)
)
insert into public.projects (
  legacy_project_id,
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
select
  s.legacy_project_id,
  reporter_x.member_id,
  s.project_type1,
  s.name,
  s.platform,
  svc_x.service_group_id,
  s.report_url,
  reporter_x.member_id,
  reviewer_x.member_id,
  s.start_date,
  s.end_date,
  true
from source_projects s
left join legacy_xref.members reporter_x on reporter_x.account_id = s.reporter_account_id
left join legacy_xref.members reviewer_x on reviewer_x.account_id = s.reviewer_account_id
left join legacy_xref.service_groups svc_x on svc_x.legacy_svc_num = s.legacy_svc_num
where not exists (
  select 1
  from public.projects pr
  where pr.legacy_project_id = s.legacy_project_id
);

update public.projects pr
set project_type1 = legacy_stage.blank_to_null(s.pj_group_type1),
    updated_at = timezone('utc', now())
from legacy_stage.pj_tbl s
where pr.legacy_project_id = s.pj_num::text
  and coalesce(pr.project_type1, '') <> coalesce(legacy_stage.blank_to_null(s.pj_group_type1), '');

truncate table legacy_xref.projects;
insert into legacy_xref.projects (legacy_project_num, project_id)
select
  pr.legacy_project_id::integer,
  pr.id
from public.projects pr
where pr.legacy_project_id ~ '^[0-9]+$';

with source_project_pages as (
  select
    p.pj_page_num as legacy_page_num,
    p.pj_page_num::text as legacy_page_id,
    p.pj_unique_num as legacy_project_num,
    legacy_stage.blank_to_null(p.pj_page_id) as owner_account_id,
    coalesce(legacy_stage.blank_to_null(p.pj_page_name), '[페이지 ' || p.pj_page_num::text || ']') as title,
    coalesce(legacy_stage.blank_to_null(p.pj_page_url), '') as url,
    legacy_stage.blank_to_null(p.pj_page_date) as monitoring_month,
    case coalesce(legacy_stage.to_int(p.pj_page_track_end), 0)
      when 1 then '전체 수정'
      when 2 then '일부 수정'
      else '미수정'
    end as track_status,
    concat_ws(E'\n',
      case when legacy_stage.blank_to_null(p.pj_page_etc) is not null then 'page_etc: ' || legacy_stage.blank_to_null(p.pj_page_etc) end,
      case when legacy_stage.to_date_ymd(p.pj_page_agit) is not null then 'agit_date: ' || legacy_stage.to_date_ymd(p.pj_page_agit)::text end,
      case when legacy_stage.blank_to_null(p.pj_page_agit_url) is not null then 'agit_url: ' || legacy_stage.blank_to_null(p.pj_page_agit_url) end,
      case when legacy_stage.to_date_ymd(p.pj_page_track1) is not null then 'track1: ' || legacy_stage.to_date_ymd(p.pj_page_track1)::text end,
      case when legacy_stage.to_date_ymd(p.pj_page_track2) is not null then 'track2: ' || legacy_stage.to_date_ymd(p.pj_page_track2)::text end,
      case when legacy_stage.to_date_ymd(p.pj_page_track3) is not null then 'track3: ' || legacy_stage.to_date_ymd(p.pj_page_track3)::text end,
      case when legacy_stage.to_date_ymd(p.pj_page_track4) is not null then 'track4: ' || legacy_stage.to_date_ymd(p.pj_page_track4)::text end,
      case when legacy_stage.blank_to_null(p.pj_page_track_etc) is not null then 'track_etc: ' || legacy_stage.blank_to_null(p.pj_page_track_etc) end,
      case when legacy_stage.to_date_ymd(p.pj_page_report) is not null then 'report_date: ' || legacy_stage.to_date_ymd(p.pj_page_report)::text end,
      case when legacy_stage.to_date_ymd(p.pj_page_creat) is not null then 'created_date: ' || legacy_stage.to_date_ymd(p.pj_page_creat)::text end
    ) as note
  from legacy_stage.pj_page_tbl p
)
update public.project_pages pg
set project_id = project_x.project_id,
    owner_member_id = owner_x.member_id,
    title = s.title,
    url = s.url,
    monitoring_month = s.monitoring_month,
    track_status = s.track_status,
    monitoring_in_progress = false,
    qa_in_progress = false,
    note = coalesce(s.note, ''),
    updated_at = timezone('utc', now())
from source_project_pages s
join legacy_xref.projects project_x on project_x.legacy_project_num = s.legacy_project_num
left join legacy_xref.members owner_x on owner_x.account_id = s.owner_account_id
where pg.legacy_page_id = s.legacy_page_id;

with source_project_pages as (
  select
    p.pj_page_num as legacy_page_num,
    p.pj_page_num::text as legacy_page_id,
    p.pj_unique_num as legacy_project_num,
    legacy_stage.blank_to_null(p.pj_page_id) as owner_account_id,
    coalesce(legacy_stage.blank_to_null(p.pj_page_name), '[페이지 ' || p.pj_page_num::text || ']') as title,
    coalesce(legacy_stage.blank_to_null(p.pj_page_url), '') as url,
    legacy_stage.blank_to_null(p.pj_page_date) as monitoring_month,
    case coalesce(legacy_stage.to_int(p.pj_page_track_end), 0)
      when 1 then '전체 수정'
      when 2 then '일부 수정'
      else '미수정'
    end as track_status,
    concat_ws(E'\n',
      case when legacy_stage.blank_to_null(p.pj_page_etc) is not null then 'page_etc: ' || legacy_stage.blank_to_null(p.pj_page_etc) end,
      case when legacy_stage.to_date_ymd(p.pj_page_agit) is not null then 'agit_date: ' || legacy_stage.to_date_ymd(p.pj_page_agit)::text end,
      case when legacy_stage.blank_to_null(p.pj_page_agit_url) is not null then 'agit_url: ' || legacy_stage.blank_to_null(p.pj_page_agit_url) end,
      case when legacy_stage.to_date_ymd(p.pj_page_track1) is not null then 'track1: ' || legacy_stage.to_date_ymd(p.pj_page_track1)::text end,
      case when legacy_stage.to_date_ymd(p.pj_page_track2) is not null then 'track2: ' || legacy_stage.to_date_ymd(p.pj_page_track2)::text end,
      case when legacy_stage.to_date_ymd(p.pj_page_track3) is not null then 'track3: ' || legacy_stage.to_date_ymd(p.pj_page_track3)::text end,
      case when legacy_stage.to_date_ymd(p.pj_page_track4) is not null then 'track4: ' || legacy_stage.to_date_ymd(p.pj_page_track4)::text end,
      case when legacy_stage.blank_to_null(p.pj_page_track_etc) is not null then 'track_etc: ' || legacy_stage.blank_to_null(p.pj_page_track_etc) end,
      case when legacy_stage.to_date_ymd(p.pj_page_report) is not null then 'report_date: ' || legacy_stage.to_date_ymd(p.pj_page_report)::text end,
      case when legacy_stage.to_date_ymd(p.pj_page_creat) is not null then 'created_date: ' || legacy_stage.to_date_ymd(p.pj_page_creat)::text end
    ) as note
  from legacy_stage.pj_page_tbl p
)
insert into public.project_pages (
  legacy_page_id,
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
select
  s.legacy_page_id,
  project_x.project_id,
  owner_x.member_id,
  s.title,
  s.url,
  s.monitoring_month,
  s.track_status,
  false,
  false,
  coalesce(s.note, '')
from source_project_pages s
join legacy_xref.projects project_x on project_x.legacy_project_num = s.legacy_project_num
left join legacy_xref.members owner_x on owner_x.account_id = s.owner_account_id
where not exists (
  select 1
  from public.project_pages pg
  where pg.legacy_page_id = s.legacy_page_id
);

truncate table legacy_xref.project_pages;
insert into legacy_xref.project_pages (legacy_page_num, project_page_id)
select
  pg.legacy_page_id::integer,
  pg.id
from public.project_pages pg
where pg.legacy_page_id ~ '^[0-9]+$';

with task_source as (
  select
    t.task_num as legacy_task_num,
    t.task_num::text as legacy_task_id,
    legacy_stage.blank_to_null(t.task_user) as member_account_id,
    coalesce(legacy_stage.to_date_ymd(t.task_date), date '1970-01-01') as task_date,
    coalesce(legacy_stage.blank_to_null(t.task_type1), '미분류') as task_type1,
    coalesce(legacy_stage.blank_to_null(t.task_type2), '') as task_type2,
    legacy_stage.blank_to_null(t.task_platform) as task_platform,
    legacy_stage.blank_to_null(t.task_svc_group) as task_svc_group,
    legacy_stage.blank_to_null(t.task_svc_name) as task_svc_name,
    legacy_stage.blank_to_null(t.task_pj_name) as task_pj_name,
    legacy_stage.blank_to_null(t.task_pj_page) as task_pj_page,
    legacy_stage.blank_to_null(t.task_pj_page_url) as task_pj_page_url,
    legacy_stage.blank_to_null(t.task_manager) as task_manager,
    legacy_stage.to_int(t.task_count_element) as task_count_element,
    legacy_stage.to_int(t.task_count_error) as task_count_error,
    legacy_stage.to_int(t.task_count_errortask) as task_count_errortask,
    legacy_stage.to_int(t.task_estimated) as task_estimated,
    legacy_stage.to_int(t.task_test_report) as task_test_report,
    legacy_stage.to_int(t.task_communication) as task_communication,
    legacy_stage.to_int(t.task_review) as task_review,
    coalesce(legacy_stage.to_int(t.task_usedtime), 0) as task_usedtime_minutes,
    legacy_stage.blank_to_null(t.task_etc) as task_etc,
    legacy_stage.to_int(t.task_allcount) as task_allcount,
    legacy_stage.to_int(t.task_pj_report_num) as task_pj_report_num,
    legacy_stage.to_int(t.task_page_report_num) as task_page_report_num
  from legacy_stage.task_tbl t
),
task_resolved as (
  select
    s.legacy_task_num,
    s.legacy_task_id,
    member_x.id as member_id,
    member_x.id as created_by_member_id,
    s.task_date,
    coalesce(project_num.project_id, page_num.project_id, page_match.project_id, project_match.project_id) as project_id,
    coalesce(page_num.project_page_id, page_match.project_page_id) as project_page_id,
    task_type_x.task_type_id,
    s.task_type1,
    s.task_type2,
    round((s.task_usedtime_minutes::numeric / 60.0), 1) as hours,
    coalesce(
      s.task_pj_page,
      s.task_pj_name,
      s.task_etc,
      nullif(concat_ws(' / ', s.task_platform, s.task_svc_group, s.task_svc_name), ''),
      s.task_type1 || case when s.task_type2 <> '' then ' / ' || s.task_type2 else '' end
    ) as content,
    concat_ws(E'\n',
      case when s.task_platform is not null then 'platform: ' || s.task_platform end,
      case when s.task_svc_group is not null then 'service_group: ' || s.task_svc_group end,
      case when s.task_svc_name is not null then 'service_name: ' || s.task_svc_name end,
      case when s.task_pj_name is not null then 'project_name: ' || s.task_pj_name end,
      case when s.task_pj_page is not null then 'page_name: ' || s.task_pj_page end,
      case when s.task_pj_page_url is not null then 'page_url: ' || s.task_pj_page_url end,
      case when s.task_manager is not null then 'manager: ' || s.task_manager end,
      case when s.task_count_element is not null then 'count_element: ' || s.task_count_element::text end,
      case when s.task_count_error is not null then 'count_error: ' || s.task_count_error::text end,
      case when s.task_count_errortask is not null then 'count_errortask: ' || s.task_count_errortask::text end,
      case when s.task_estimated is not null then 'estimated: ' || s.task_estimated::text end,
      case when s.task_test_report is not null then 'test_report: ' || s.task_test_report::text end,
      case when s.task_communication is not null then 'communication: ' || s.task_communication::text end,
      case when s.task_review is not null then 'review: ' || s.task_review::text end,
      case when s.task_allcount is not null then 'allcount: ' || s.task_allcount::text end,
      case when s.task_etc is not null then 'raw_note: ' || s.task_etc end
    ) as note
  from task_source s
  join public.members member_x
    on lower(member_x.account_id) = lower(s.member_account_id)
  left join lateral (
    select tt.type_num
    from legacy_stage.type_tbl tt
    where coalesce(legacy_stage.blank_to_null(tt.type_one), '미분류') = s.task_type1
      and coalesce(legacy_stage.blank_to_null(tt.type_two), '') = s.task_type2
    order by tt.type_num
    limit 1
  ) raw_type on true
  left join legacy_xref.task_types task_type_x
    on task_type_x.legacy_type_num = raw_type.type_num
  left join lateral (
    select xp.project_id
    from legacy_xref.projects xp
    where xp.legacy_project_num = s.task_pj_report_num
    limit 1
  ) project_num on true
  left join lateral (
    select xpp.project_page_id, pp.project_id
    from legacy_xref.project_pages xpp
    join public.project_pages pp on pp.id = xpp.project_page_id
    where xpp.legacy_page_num = s.task_page_report_num
    limit 1
  ) page_num on true
  left join lateral (
    select pp.id as project_page_id, pp.project_id
    from public.project_pages pp
    join public.projects pr on pr.id = pp.project_id
    where (s.task_pj_page is null or pp.title = s.task_pj_page)
      and (s.task_pj_page_url is null or pp.url = s.task_pj_page_url)
      and (s.task_pj_name is null or pr.name = s.task_pj_name)
    order by pp.created_at, pp.id
    limit 1
  ) page_match on true
  left join lateral (
    select pr.id as project_id
    from public.projects pr
    where s.task_pj_name is not null
      and pr.name = s.task_pj_name
    order by pr.created_at, pr.id
    limit 1
  ) project_match on true
)
update public.tasks t
set member_id = s.member_id,
    created_by_member_id = s.created_by_member_id,
    task_date = s.task_date,
    project_id = s.project_id,
    project_page_id = s.project_page_id,
    task_type_id = s.task_type_id,
    task_type1 = s.task_type1,
    task_type2 = s.task_type2,
    hours = s.hours,
    content = s.content,
    note = coalesce(s.note, ''),
    updated_at = timezone('utc', now())
from task_resolved s
where t.legacy_task_id = s.legacy_task_id;

with task_source as (
  select
    t.task_num as legacy_task_num,
    t.task_num::text as legacy_task_id,
    legacy_stage.blank_to_null(t.task_user) as member_account_id,
    coalesce(legacy_stage.to_date_ymd(t.task_date), date '1970-01-01') as task_date,
    coalesce(legacy_stage.blank_to_null(t.task_type1), '미분류') as task_type1,
    coalesce(legacy_stage.blank_to_null(t.task_type2), '') as task_type2,
    legacy_stage.blank_to_null(t.task_platform) as task_platform,
    legacy_stage.blank_to_null(t.task_svc_group) as task_svc_group,
    legacy_stage.blank_to_null(t.task_svc_name) as task_svc_name,
    legacy_stage.blank_to_null(t.task_pj_name) as task_pj_name,
    legacy_stage.blank_to_null(t.task_pj_page) as task_pj_page,
    legacy_stage.blank_to_null(t.task_pj_page_url) as task_pj_page_url,
    legacy_stage.blank_to_null(t.task_manager) as task_manager,
    legacy_stage.to_int(t.task_count_element) as task_count_element,
    legacy_stage.to_int(t.task_count_error) as task_count_error,
    legacy_stage.to_int(t.task_count_errortask) as task_count_errortask,
    legacy_stage.to_int(t.task_estimated) as task_estimated,
    legacy_stage.to_int(t.task_test_report) as task_test_report,
    legacy_stage.to_int(t.task_communication) as task_communication,
    legacy_stage.to_int(t.task_review) as task_review,
    coalesce(legacy_stage.to_int(t.task_usedtime), 0) as task_usedtime_minutes,
    legacy_stage.blank_to_null(t.task_etc) as task_etc,
    legacy_stage.to_int(t.task_allcount) as task_allcount,
    legacy_stage.to_int(t.task_pj_report_num) as task_pj_report_num,
    legacy_stage.to_int(t.task_page_report_num) as task_page_report_num
  from legacy_stage.task_tbl t
),
task_resolved as (
  select
    s.legacy_task_num,
    s.legacy_task_id,
    member_x.id as member_id,
    member_x.id as created_by_member_id,
    s.task_date,
    coalesce(project_num.project_id, page_num.project_id, page_match.project_id, project_match.project_id) as project_id,
    coalesce(page_num.project_page_id, page_match.project_page_id) as project_page_id,
    task_type_x.task_type_id,
    s.task_type1,
    s.task_type2,
    round((s.task_usedtime_minutes::numeric / 60.0), 1) as hours,
    coalesce(
      s.task_pj_page,
      s.task_pj_name,
      s.task_etc,
      nullif(concat_ws(' / ', s.task_platform, s.task_svc_group, s.task_svc_name), ''),
      s.task_type1 || case when s.task_type2 <> '' then ' / ' || s.task_type2 else '' end
    ) as content,
    concat_ws(E'\n',
      case when s.task_platform is not null then 'platform: ' || s.task_platform end,
      case when s.task_svc_group is not null then 'service_group: ' || s.task_svc_group end,
      case when s.task_svc_name is not null then 'service_name: ' || s.task_svc_name end,
      case when s.task_pj_name is not null then 'project_name: ' || s.task_pj_name end,
      case when s.task_pj_page is not null then 'page_name: ' || s.task_pj_page end,
      case when s.task_pj_page_url is not null then 'page_url: ' || s.task_pj_page_url end,
      case when s.task_manager is not null then 'manager: ' || s.task_manager end,
      case when s.task_count_element is not null then 'count_element: ' || s.task_count_element::text end,
      case when s.task_count_error is not null then 'count_error: ' || s.task_count_error::text end,
      case when s.task_count_errortask is not null then 'count_errortask: ' || s.task_count_errortask::text end,
      case when s.task_estimated is not null then 'estimated: ' || s.task_estimated::text end,
      case when s.task_test_report is not null then 'test_report: ' || s.task_test_report::text end,
      case when s.task_communication is not null then 'communication: ' || s.task_communication::text end,
      case when s.task_review is not null then 'review: ' || s.task_review::text end,
      case when s.task_allcount is not null then 'allcount: ' || s.task_allcount::text end,
      case when s.task_etc is not null then 'raw_note: ' || s.task_etc end
    ) as note
  from task_source s
  join public.members member_x
    on lower(member_x.account_id) = lower(s.member_account_id)
  left join lateral (
    select tt.type_num
    from legacy_stage.type_tbl tt
    where coalesce(legacy_stage.blank_to_null(tt.type_one), '미분류') = s.task_type1
      and coalesce(legacy_stage.blank_to_null(tt.type_two), '') = s.task_type2
    order by tt.type_num
    limit 1
  ) raw_type on true
  left join legacy_xref.task_types task_type_x
    on task_type_x.legacy_type_num = raw_type.type_num
  left join lateral (
    select xp.project_id
    from legacy_xref.projects xp
    where xp.legacy_project_num = s.task_pj_report_num
    limit 1
  ) project_num on true
  left join lateral (
    select xpp.project_page_id, pp.project_id
    from legacy_xref.project_pages xpp
    join public.project_pages pp on pp.id = xpp.project_page_id
    where xpp.legacy_page_num = s.task_page_report_num
    limit 1
  ) page_num on true
  left join lateral (
    select pp.id as project_page_id, pp.project_id
    from public.project_pages pp
    join public.projects pr on pr.id = pp.project_id
    where (s.task_pj_page is null or pp.title = s.task_pj_page)
      and (s.task_pj_page_url is null or pp.url = s.task_pj_page_url)
      and (s.task_pj_name is null or pr.name = s.task_pj_name)
    order by pp.created_at, pp.id
    limit 1
  ) page_match on true
  left join lateral (
    select pr.id as project_id
    from public.projects pr
    where s.task_pj_name is not null
      and pr.name = s.task_pj_name
    order by pr.created_at, pr.id
    limit 1
  ) project_match on true
)
insert into public.tasks (
  legacy_task_id,
  member_id,
  created_by_member_id,
  task_date,
  project_id,
  project_page_id,
  task_type_id,
  task_type1,
  task_type2,
  hours,
  content,
  note
)
select
  s.legacy_task_id,
  s.member_id,
  s.created_by_member_id,
  s.task_date,
  s.project_id,
  s.project_page_id,
  s.task_type_id,
  s.task_type1,
  s.task_type2,
  s.hours,
  s.content,
  coalesce(s.note, '')
from task_resolved s
where not exists (
  select 1
  from public.tasks t
  where t.legacy_task_id = s.legacy_task_id
);

truncate table legacy_xref.tasks;
insert into legacy_xref.tasks (legacy_task_num, task_id)
select
  t.legacy_task_id::integer,
  t.id
from public.tasks t
where t.legacy_task_id ~ '^[0-9]+$';

commit;
