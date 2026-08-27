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

create policy "users read own records" on public.sync_records
for select using (auth.uid() = user_id);
create policy "users insert own records" on public.sync_records
for insert with check (auth.uid() = user_id);
create policy "users update own records" on public.sync_records
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own records" on public.sync_records
for delete using (auth.uid() = user_id);

create index if not exists sync_records_user_updated_idx
on public.sync_records(user_id, server_updated_at desc);
