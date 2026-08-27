-- Chạy tệp này nếu project Supabase đã dùng Checkpoint 11/11.1.
create table if not exists public.vault_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  salt text not null,
  verifier jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.vault_profiles enable row level security;
revoke all on table public.vault_profiles from anon;
grant select, insert on table public.vault_profiles to authenticated;
drop policy if exists "users read own vault profile" on public.vault_profiles;
drop policy if exists "users create own vault profile" on public.vault_profiles;
create policy "users read own vault profile" on public.vault_profiles
for select to authenticated using ((select auth.uid()) = user_id);
create policy "users create own vault profile" on public.vault_profiles
for insert to authenticated with check ((select auth.uid()) = user_id);

alter table public.sync_records enable row level security;
revoke all on table public.sync_records from anon;
grant select, insert, update, delete on table public.sync_records to authenticated;
