alter table public.members
drop column if exists account_num;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'legacy_xref'
      and table_name = 'members'
      and column_name = 'account_num'
  ) then
    alter table legacy_xref.members drop constraint if exists members_pkey;
    alter table legacy_xref.members drop column account_num;
    alter table legacy_xref.members add primary key (account_id);
  end if;
end
$$;
