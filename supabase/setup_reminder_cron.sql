-- CHỈ chạy sau khi đã deploy Edge Function process-calendar-reminders và tạo secret.
-- 1) Thay ba giá trị YOUR_* rồi chạy hai lệnh vault.create_secret.
-- 2) Cron gọi function mỗi phút. Không commit giá trị thật vào GitHub.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

-- Chạy MỘT LẦN, sau khi thay placeholder:
-- select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'hbc_project_url');
-- select vault.create_secret('YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY', 'hbc_publishable_key');
-- select vault.create_secret('YOUR_REMINDER_CRON_SECRET', 'hbc_reminder_cron_secret');

select cron.unschedule('hbc-calendar-reminders') where exists (select 1 from cron.job where jobname = 'hbc-calendar-reminders');
select cron.schedule(
  'hbc-calendar-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'hbc_project_url') || '/functions/v1/process-calendar-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'hbc_publishable_key'),
      'x-hbc-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'hbc_reminder_cron_secret')
    ),
    body := jsonb_build_object('source', 'pg_cron', 'at', now())
  );
  $$
);
