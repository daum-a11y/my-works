select 'user_tbl.stage_count' as check_name, count(*)::text as result from legacy_stage.user_tbl
union all
select 'members.public_count', count(*)::text from public.members where account_id is not null
union all
select 'members.xref_count', count(*)::text from legacy_xref.members
union all
select 'type_tbl.stage_count', count(*)::text from legacy_stage.type_tbl
union all
select 'task_types.public_count', count(*)::text from public.task_types where legacy_type_num is not null
union all
select 'task_types.xref_count', count(*)::text from legacy_xref.task_types
union all
select 'svc_group_tbl.stage_count', count(*)::text from legacy_stage.svc_group_tbl
union all
select 'service_groups.public_count', count(*)::text from public.service_groups where legacy_svc_num is not null
union all
select 'service_groups.xref_count', count(*)::text from legacy_xref.service_groups
union all
select 'pj_tbl.stage_count', count(*)::text from legacy_stage.pj_tbl
union all
select 'projects.public_count', count(*)::text from public.projects where legacy_project_id is not null
union all
select 'projects.xref_count', count(*)::text from legacy_xref.projects
union all
select 'pj_page_tbl.stage_count', count(*)::text from legacy_stage.pj_page_tbl
union all
select 'project_pages.public_count', count(*)::text from public.project_pages where legacy_page_id is not null
union all
select 'project_pages.xref_count', count(*)::text from legacy_xref.project_pages
union all
select 'task_tbl.stage_count', count(*)::text from legacy_stage.task_tbl
union all
select 'tasks.public_count', count(*)::text from public.tasks where legacy_task_id is not null
union all
select 'tasks.xref_count', count(*)::text from legacy_xref.tasks;

select 'user_tbl.unmapped_members' as check_name, count(*) as result
from legacy_stage.user_tbl s
left join legacy_xref.members x on x.account_id = s.user_id
where x.member_id is null;

select 'type_tbl.unmapped_task_types' as check_name, count(*) as result
from legacy_stage.type_tbl s
left join legacy_xref.task_types x on x.legacy_type_num = s.type_num
where x.task_type_id is null;

select 'svc_group_tbl.unmapped_service_groups' as check_name, count(*) as result
from legacy_stage.svc_group_tbl s
left join legacy_xref.service_groups x on x.legacy_svc_num = s.svc_num
where x.service_group_id is null;

select 'pj_tbl.unmapped_projects' as check_name, count(*) as result
from legacy_stage.pj_tbl s
left join legacy_xref.projects x on x.legacy_project_num = s.pj_num
where x.project_id is null;

select 'pj_page_tbl.unmapped_project_pages' as check_name, count(*) as result
from legacy_stage.pj_page_tbl s
left join legacy_xref.project_pages x on x.legacy_page_num = s.pj_page_num
where x.project_page_id is null;

select 'task_tbl.unmapped_tasks' as check_name, count(*) as result
from legacy_stage.task_tbl s
left join legacy_xref.tasks x on x.legacy_task_num = s.task_num
where x.task_id is null;

select 'tasks.member_missing' as check_name, count(*) as result
from public.tasks t
left join public.members m on m.id = t.member_id
where m.id is null;

select 'tasks.project_missing' as check_name, count(*) as result
from public.tasks t
left join public.projects p on p.id = t.project_id
where t.project_id is not null
  and p.id is null;

select 'tasks.page_missing' as check_name, count(*) as result
from public.tasks t
left join public.project_pages p on p.id = t.project_page_id
where t.project_page_id is not null
  and p.id is null;

select 'tasks.task_type_missing' as check_name, count(*) as result
from public.tasks t
left join public.task_types tt on tt.id = t.task_type_id
where t.task_type_id is not null
  and tt.id is null;

select 'project_pages.project_missing' as check_name, count(*) as result
from public.project_pages p
left join public.projects pr on pr.id = p.project_id
where pr.id is null;

select
  t.member_id,
  m.name,
  count(*) as task_count
from public.tasks t
join public.members m on m.id = t.member_id
where t.legacy_task_id is not null
group by t.member_id, m.name
order by count(*) desc, m.name asc;

select
  s.task_num,
  s.task_user,
  s.task_type1,
  s.task_type2,
  s.task_pj_name,
  s.task_pj_page
from legacy_stage.task_tbl s
left join legacy_xref.tasks x on x.legacy_task_num = s.task_num
where x.task_id is null
order by s.task_num
limit 100;
