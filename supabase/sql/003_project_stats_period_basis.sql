drop function if exists public.get_project_stats_rows();
drop function if exists public.get_project_stats_rows(text, text, text, text, text);
drop function if exists public.get_project_stats_rows(text, text, text, text, text, text);

create or replace function public.get_project_stats_rows(
  p_start_month text,
  p_end_month text,
  p_task_type1 text default null,
  p_period_basis text default 'project',
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
  report_url text,
  reporter_display text,
  reviewer_display text,
  start_date date,
  end_date date,
  subtask_count bigint,
  untouched_subtask_count bigint,
  partial_subtask_count bigint,
  completed_subtask_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select
      coalesce(nullif(trim(p_period_basis), ''), 'project') as period_basis,
      to_date(p_start_month || '-01', 'YYYY-MM-DD') as start_date,
      (to_date(p_end_month || '-01', 'YYYY-MM-DD') + interval '1 month' - interval '1 day')::date
        as end_date
  ),
  subtask_base as (
    select
      pp.*,
      case
        when regexp_replace(coalesce(pp.task_month, ''), '\D', '', 'g') ~ '^\d{4}$'
          then to_date('20' || regexp_replace(pp.task_month, '\D', '', 'g') || '01', 'YYYYMMDD')
        when regexp_replace(coalesce(pp.task_month, ''), '\D', '', 'g') ~ '^\d{6}$'
          then to_date(regexp_replace(pp.task_month, '\D', '', 'g') || '01', 'YYYYMMDD')
        when regexp_replace(coalesce(pp.task_month, ''), '\D', '', 'g') ~ '^\d{8}$'
          then to_date(regexp_replace(pp.task_month, '\D', '', 'g'), 'YYYYMMDD')
        else null
      end as task_month_date
    from public.project_subtasks pp
  ),
  selected_subtasks as (
    select sb.*
    from subtask_base sb
    cross join params
    where params.period_basis <> 'subtask'
      or (
        sb.task_month_date is not null
        and sb.task_month_date >= params.start_date
        and sb.task_month_date <= params.end_date
      )
  )
  select
    p.id as project_id,
    tt.type1,
    p.name as project_name,
    nullif(pl.name, '') as platform,
    nullif(cg.name, '') as cost_group_name,
    nullif(public.resolve_service_group_name(sg.service_group_name, sg.name), '') as service_group_name,
    nullif(p.report_url, '') as report_url,
    nullif(concat_ws(' ', nullif(reporter.account_id, ''), nullif(reporter.name, '')), '') as reporter_display,
    nullif(concat_ws(' ', nullif(reviewer.account_id, ''), nullif(reviewer.name, '')), '') as reviewer_display,
    p.start_date,
    p.end_date,
    count(pp.id)::bigint as subtask_count,
    coalesce(sum(case when pp.task_status = '미수정' then 1 else 0 end), 0)::bigint
      as untouched_subtask_count,
    coalesce(sum(case when pp.task_status = '일부 수정' then 1 else 0 end), 0)::bigint
      as partial_subtask_count,
    coalesce(sum(case when pp.task_status = '전체 수정' then 1 else 0 end), 0)::bigint
      as completed_subtask_count
  from public.projects p
  cross join params
  left join public.task_types tt on tt.id = p.task_type_id
  left join public.platforms pl on pl.id = p.platform_id
  left join public.service_groups sg on sg.id = p.service_group_id
  left join public.cost_groups cg on cg.id = sg.cost_group_id
  left join public.members reporter on reporter.id = p.reporter_member_id
  left join public.members reviewer on reviewer.id = p.reviewer_member_id
  left join selected_subtasks pp on pp.project_id = p.id
  where public.current_member_id() is not null
    and (
      (
        params.period_basis <> 'subtask'
        and p.end_date >= params.start_date
        and p.end_date <= params.end_date
      )
      or (
        params.period_basis = 'subtask'
        and exists (
          select 1
          from selected_subtasks ps
          where ps.project_id = p.id
        )
      )
    )
    and (nullif(trim(coalesce(p_task_type1, '')), '') is null or tt.type1 = p_task_type1)
  group by
    p.id,
    tt.type1,
    p.name,
    pl.name,
    cg.name,
    sg.service_group_name,
    sg.name,
    p.report_url,
    reporter.account_id,
    reporter.name,
    reviewer.account_id,
    reviewer.name,
    params.period_basis,
    p.start_date,
    p.end_date
  order by
    case
      when p_sort_key = 'month' and lower(p_sort_direction) = 'asc'
        then case
          when params.period_basis = 'subtask' then min(pp.task_month_date)
          else p.end_date
        end
    end asc,
    case
      when p_sort_key = 'month' and lower(p_sort_direction) <> 'asc'
        then case
          when params.period_basis = 'subtask' then max(pp.task_month_date)
          else p.end_date
        end
    end desc,
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
    case when p_sort_key = 'subtaskCount' and lower(p_sort_direction) = 'asc' then count(pp.id) end asc,
    case when p_sort_key = 'subtaskCount' and lower(p_sort_direction) <> 'asc' then count(pp.id) end desc,
    case when p_sort_key = 'untouchedSubtaskCount' and lower(p_sort_direction) = 'asc'
      then coalesce(sum(case when pp.task_status = '미수정' then 1 else 0 end), 0) end asc,
    case when p_sort_key = 'untouchedSubtaskCount' and lower(p_sort_direction) <> 'asc'
      then coalesce(sum(case when pp.task_status = '미수정' then 1 else 0 end), 0) end desc,
    case when p_sort_key = 'partialSubtaskCount' and lower(p_sort_direction) = 'asc'
      then coalesce(sum(case when pp.task_status = '일부 수정' then 1 else 0 end), 0) end asc,
    case when p_sort_key = 'partialSubtaskCount' and lower(p_sort_direction) <> 'asc'
      then coalesce(sum(case when pp.task_status = '일부 수정' then 1 else 0 end), 0) end desc,
    case when p_sort_key = 'completedSubtaskCount' and lower(p_sort_direction) = 'asc'
      then coalesce(sum(case when pp.task_status = '전체 수정' then 1 else 0 end), 0) end asc,
    case when p_sort_key = 'completedSubtaskCount' and lower(p_sort_direction) <> 'asc'
      then coalesce(sum(case when pp.task_status = '전체 수정' then 1 else 0 end), 0) end desc,
    case when params.period_basis = 'subtask' then max(pp.task_month_date) else p.end_date end desc,
    p.name asc,
    p.id desc
$$;

grant execute on function public.get_project_stats_rows(text, text, text, text, text, text) to authenticated;

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
  task_month text,
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
      pp.task_month,
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
        when regexp_replace(coalesce(pp.task_month, ''), '\D', '', 'g') ~ '^\d{4}$'
          then to_date('20' || regexp_replace(pp.task_month, '\D', '', 'g') || '01', 'YYYYMMDD')
        when regexp_replace(coalesce(pp.task_month, ''), '\D', '', 'g') ~ '^\d{6}$'
          then to_date(regexp_replace(pp.task_month, '\D', '', 'g') || '01', 'YYYYMMDD')
        when regexp_replace(coalesce(pp.task_month, ''), '\D', '', 'g') ~ '^\d{8}$'
          then to_date(regexp_replace(pp.task_month, '\D', '', 'g'), 'YYYYMMDD')
        else null
      end as task_month_date,
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
    task_month,
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
  where task_month_date is not null
    and task_month_date >= to_date(p_start_month || '-01', 'YYYY-MM-DD')
    and task_month_date <= (to_date(p_end_month || '-01', 'YYYY-MM-DD') + interval '1 month' - interval '1 day')::date
    and (p_task_type1 is null or type1 = p_task_type1)
  order by
    case when p_sort_key = 'month' and lower(p_sort_direction) = 'asc' then task_month_date end asc,
    case when p_sort_key = 'month' and lower(p_sort_direction) <> 'asc' then task_month_date end desc,
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

grant execute on function public.get_monitoring_stats_rows(text, text, text, text, text) to authenticated;
