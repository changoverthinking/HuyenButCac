-- Huyền Bút Các 0.19.0 — private encrypted workspace backups.
-- File được AES-256-GCM mã hóa ở client trước khi upload; bucket tuyệt đối không public.
insert into storage.buckets (id, name, public, file_size_limit)
values ('hbc-private', 'hbc-private', false, 536870912)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists "hbc users read own private files" on storage.objects;
drop policy if exists "hbc users insert own private files" on storage.objects;
drop policy if exists "hbc users update own private files" on storage.objects;
drop policy if exists "hbc users delete own private files" on storage.objects;

create policy "hbc users read own private files"
on storage.objects for select to authenticated
using (bucket_id = 'hbc-private' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "hbc users insert own private files"
on storage.objects for insert to authenticated
with check (bucket_id = 'hbc-private' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "hbc users update own private files"
on storage.objects for update to authenticated
using (bucket_id = 'hbc-private' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'hbc-private' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "hbc users delete own private files"
on storage.objects for delete to authenticated
using (bucket_id = 'hbc-private' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Cursor sync 0.19.0 dựa vào timestamp server, nên mọi UPDATE phải chạm server_updated_at.
create or replace function public.hbc_touch_sync_record_server_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.server_updated_at = now();
  return new;
end;
$$;

drop trigger if exists hbc_sync_records_touch_server_updated_at on public.sync_records;
create trigger hbc_sync_records_touch_server_updated_at
before update on public.sync_records
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
