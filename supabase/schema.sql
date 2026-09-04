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

drop function if exists public.reset_my_vault();
drop function if exists public.reset_my_vault(text, jsonb);
create function public.reset_my_vault(new_salt text, new_verifier jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if coalesce(length(new_salt), 0) < 8 or new_verifier is null then raise exception 'Invalid vault profile'; end if;
  delete from public.sync_records where user_id = auth.uid();
  delete from public.vault_profiles where user_id = auth.uid();
  insert into public.vault_profiles(user_id, salt, verifier) values (auth.uid(), new_salt, new_verifier);
end;
$$;
revoke all on function public.reset_my_vault(text, jsonb) from public, anon;
grant execute on function public.reset_my_vault(text, jsonb) to authenticated;

-- 0.14.0: Web Push subscriptions and due reminder queue.
create table if not exists public.web_push_subscriptions (
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text not null default '',
  device_label text not null default '',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (user_id, endpoint)
);
alter table public.web_push_subscriptions enable row level security;
revoke all on table public.web_push_subscriptions from anon;
grant select, insert, update, delete on table public.web_push_subscriptions to authenticated;
drop policy if exists "users manage own push subscriptions" on public.web_push_subscriptions;
create policy "users manage own push subscriptions" on public.web_push_subscriptions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.calendar_reminder_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null,
  scheduled_at timestamptz not null,
  deep_link text not null default '?mode=calendar',
  status text not null default 'pending' check (status in ('pending','sent')),
  sent_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, event_id)
);
alter table public.calendar_reminder_jobs enable row level security;
revoke all on table public.calendar_reminder_jobs from anon;
grant select, insert, update, delete on table public.calendar_reminder_jobs to authenticated;
drop policy if exists "users manage own calendar reminder jobs" on public.calendar_reminder_jobs;
create policy "users manage own calendar reminder jobs" on public.calendar_reminder_jobs for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index if not exists calendar_reminder_jobs_due_idx on public.calendar_reminder_jobs(status, scheduled_at) where status = 'pending';
create unique index if not exists web_push_subscriptions_endpoint_unique_idx on public.web_push_subscriptions(endpoint);
create or replace function public.register_my_web_push_subscription(p_endpoint text,p_p256dh text,p_auth text,p_user_agent text default '',p_device_label text default '') returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if coalesce(length(p_endpoint),0) < 16 or coalesce(length(p_p256dh),0) < 8 or coalesce(length(p_auth),0) < 4 then raise exception 'Invalid push subscription'; end if;
  delete from public.web_push_subscriptions where endpoint=p_endpoint;
  insert into public.web_push_subscriptions(user_id,endpoint,p256dh,auth,user_agent,device_label,created_at,last_seen_at)
  values(auth.uid(),p_endpoint,p_p256dh,p_auth,left(coalesce(p_user_agent,''),500),left(coalesce(p_device_label,''),160),now(),now());
end; $$;
revoke all on function public.register_my_web_push_subscription(text,text,text,text,text) from public, anon;
grant execute on function public.register_my_web_push_subscription(text,text,text,text,text) to authenticated;
create or replace function public.unregister_my_web_push_subscription(p_endpoint text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  delete from public.web_push_subscriptions where endpoint=p_endpoint and user_id=auth.uid();
end; $$;
revoke all on function public.unregister_my_web_push_subscription(text) from public, anon;
grant execute on function public.unregister_my_web_push_subscription(text) to authenticated;

-- Calendar reminder delivery receipts (server-only): bảo đảm từng thiết bị được retry độc lập.
alter table public.calendar_reminder_jobs drop constraint if exists calendar_reminder_jobs_status_check;
alter table public.calendar_reminder_jobs
  add constraint calendar_reminder_jobs_status_check check (status in ('pending','sent','expired'));

create table if not exists public.calendar_reminder_deliveries (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null,
  scheduled_at timestamptz not null,
  endpoint text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, event_id, scheduled_at, endpoint),
  foreign key (user_id, event_id) references public.calendar_reminder_jobs(user_id, event_id) on delete cascade
);
alter table public.calendar_reminder_deliveries enable row level security;
revoke all on table public.calendar_reminder_deliveries from anon, authenticated;
create index if not exists calendar_reminder_deliveries_lookup_idx
  on public.calendar_reminder_deliveries(user_id, event_id, scheduled_at);

-- 0.19.0: private encrypted full-workspace backups + reliable delta-sync server cursor.
insert into storage.buckets (id, name, public, file_size_limit)
values ('hbc-private', 'hbc-private', false, 536870912)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists "hbc users read own private files" on storage.objects;
drop policy if exists "hbc users insert own private files" on storage.objects;
drop policy if exists "hbc users update own private files" on storage.objects;
drop policy if exists "hbc users delete own private files" on storage.objects;
create policy "hbc users read own private files" on storage.objects for select to authenticated
using (bucket_id='hbc-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "hbc users insert own private files" on storage.objects for insert to authenticated
with check (bucket_id='hbc-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "hbc users update own private files" on storage.objects for update to authenticated
using (bucket_id='hbc-private' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check (bucket_id='hbc-private' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "hbc users delete own private files" on storage.objects for delete to authenticated
using (bucket_id='hbc-private' and (storage.foldername(name))[1]=(select auth.uid())::text);

create or replace function public.hbc_touch_sync_record_server_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin
  new.server_updated_at = now();
  return new;
end;
$$;
drop trigger if exists hbc_sync_records_touch_server_updated_at on public.sync_records;
create trigger hbc_sync_records_touch_server_updated_at before update on public.sync_records
for each row execute function public.hbc_touch_sync_record_server_updated_at();

-- Capability handshake: client chỉ dùng remote cursor khi server xác nhận trigger 0.19.0 đã được cài.
create or replace function public.hbc_sync_cursor_version()
returns integer
language sql
stable
security invoker
set search_path = public
as $$ select 1 $$;
revoke all on function public.hbc_sync_cursor_version() from public, anon;
grant execute on function public.hbc_sync_cursor_version() to authenticated;
