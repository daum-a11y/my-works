create or replace function public.health_check()
returns table (
  ok boolean,
  checked_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with member_probe as (
    select count(*) as member_count
    from public.members
  )
  select true as ok, timezone('utc', now()) as checked_at
  from member_probe
$$;

grant execute on function public.health_check() to anon;
grant execute on function public.health_check() to authenticated;
