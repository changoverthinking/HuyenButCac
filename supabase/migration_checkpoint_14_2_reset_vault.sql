-- Huyền Bút Các 0.12.2 — reset Kho bảo mật nguyên tử cho project Supabase đã tồn tại.
alter table public.vault_profiles enable row level security;

grant select, insert, delete on table public.vault_profiles to authenticated;

drop policy if exists "users delete own vault profile" on public.vault_profiles;
create policy "users delete own vault profile" on public.vault_profiles
for delete to authenticated using ((select auth.uid()) = user_id);

-- Xóa signature cũ không tham số nếu project đã chạy migration trước đó.
drop function if exists public.reset_my_vault();
drop function if exists public.reset_my_vault(text, jsonb);

create function public.reset_my_vault(new_salt text, new_verifier jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if coalesce(length(new_salt), 0) < 8 or new_verifier is null then
    raise exception 'Invalid vault profile';
  end if;

  -- Toàn bộ function là một transaction: nếu insert profile mới lỗi, hai DELETE rollback.
  delete from public.sync_records where user_id = auth.uid();
  delete from public.vault_profiles where user_id = auth.uid();
  insert into public.vault_profiles(user_id, salt, verifier)
  values (auth.uid(), new_salt, new_verifier);
end;
$$;

revoke all on function public.reset_my_vault(text, jsonb) from public, anon;
grant execute on function public.reset_my_vault(text, jsonb) to authenticated;
