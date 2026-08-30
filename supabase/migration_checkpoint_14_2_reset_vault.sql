-- Cho phép người dùng đã đăng nhập tự đặt lại Kho bảo mật của chính mình.
-- Bản mã cũ phải bị xóa vì không thể giải mã nếu mất mật khẩu Kho.
create or replace function public.reset_my_vault()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.sync_records where user_id = auth.uid();
  delete from public.vault_profiles where user_id = auth.uid();
end;
$$;

revoke all on function public.reset_my_vault() from public, anon;
grant execute on function public.reset_my_vault() to authenticated;

grant delete on table public.vault_profiles to authenticated;
drop policy if exists "users delete own vault profile" on public.vault_profiles;
create policy "users delete own vault profile" on public.vault_profiles
for delete to authenticated using ((select auth.uid()) = user_id);
