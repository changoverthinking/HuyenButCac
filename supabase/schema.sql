create table if not exists public.sync_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  payload jsonb not null,
  client_updated_at bigint not null,
  server_updated_at timestamptz not null default now(),
  primary key (user_id, entity_type, entity_id)
);

alter table public.sync_records enable row level security;
revoke all on table public.sync_records from anon;
grant select, insert, update, delete on table public.sync_records to authenticated;

drop policy if exists "users read own records" on public.sync_records;
drop policy if exists "users insert own records" on public.sync_records;
drop policy if exists "users update own records" on public.sync_records;
drop policy if exists "users delete own records" on public.sync_records;
create policy "users read own records" on public.sync_records
for select to authenticated using ((select auth.uid()) = user_id);
create policy "users insert own records" on public.sync_records
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users update own records" on public.sync_records
for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users delete own records" on public.sync_records
for delete to authenticated using ((select auth.uid()) = user_id);

create index if not exists sync_records_user_updated_idx
on public.sync_records(user_id, server_updated_at desc);

create table if not exists public.vault_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  salt text not null,
  verifier jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.vault_profiles enable row level security;
revoke all on table public.vault_profiles from anon;
grant select, insert, delete on table public.vault_profiles to authenticated;
drop policy if exists "users read own vault profile" on public.vault_profiles;
drop policy if exists "users create own vault profile" on public.vault_profiles;
create policy "users read own vault profile" on public.vault_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "users create own vault profile" on public.vault_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "users delete own vault profile" on public.vault_profiles;
create policy "users delete own vault profile" on public.vault_profiles for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.reset_my_vault()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  delete from public.sync_records where user_id = auth.uid();
  delete from public.vault_profiles where user_id = auth.uid();
end;
$$;
revoke all on function public.reset_my_vault() from public, anon;
grant execute on function public.reset_my_vault() to authenticated;
