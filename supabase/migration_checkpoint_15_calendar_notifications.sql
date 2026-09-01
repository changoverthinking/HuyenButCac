-- Huyền Bút Các 0.14.0 — lịch hẹn + Web Push đa thiết bị.
-- Chạy file này một lần trong Supabase SQL Editor.

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
create policy "users manage own push subscriptions" on public.web_push_subscriptions
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

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
create policy "users manage own calendar reminder jobs" on public.calendar_reminder_jobs
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists calendar_reminder_jobs_due_idx
on public.calendar_reminder_jobs(status, scheduled_at)
where status = 'pending';

-- Một endpoint Push chỉ được thuộc về một tài khoản tại một thời điểm trên thiết bị/browser đó.
create unique index if not exists web_push_subscriptions_endpoint_unique_idx
on public.web_push_subscriptions(endpoint);

create or replace function public.register_my_web_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_user_agent text default '',
  p_device_label text default ''
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if coalesce(length(p_endpoint),0) < 16 or coalesce(length(p_p256dh),0) < 8 or coalesce(length(p_auth),0) < 4 then
    raise exception 'Invalid push subscription';
  end if;

  -- Reassign endpoint atomically. Điều này ngăn account A tiếp tục nhận push trên browser sau khi browser chuyển sang B.
  delete from public.web_push_subscriptions where endpoint = p_endpoint;
  insert into public.web_push_subscriptions(user_id, endpoint, p256dh, auth, user_agent, device_label, created_at, last_seen_at)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, left(coalesce(p_user_agent,''),500), left(coalesce(p_device_label,''),160), now(), now());
end;
$$;
revoke all on function public.register_my_web_push_subscription(text,text,text,text,text) from public, anon;
grant execute on function public.register_my_web_push_subscription(text,text,text,text,text) to authenticated;

create or replace function public.unregister_my_web_push_subscription(p_endpoint text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  delete from public.web_push_subscriptions where endpoint = p_endpoint and user_id = auth.uid();
end;
$$;
revoke all on function public.unregister_my_web_push_subscription(text) from public, anon;
grant execute on function public.unregister_my_web_push_subscription(text) to authenticated;

-- 0.14.0 QA hardening: theo dõi lần gửi riêng từng thiết bị để PC/điện thoại retry độc lập.
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
