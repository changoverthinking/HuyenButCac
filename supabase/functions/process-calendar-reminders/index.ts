import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import webpush from "npm:web-push@3.6.7";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

export default {
  async fetch(request: Request) {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const cronSecret = Deno.env.get("REMINDER_CRON_SECRET") ?? "";
    if (!cronSecret || request.headers.get("x-hbc-cron-secret") !== cronSecret) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const vapidPublic = Deno.env.get("WEB_PUSH_VAPID_PUBLIC_KEY") ?? "";
    const vapidPrivate = Deno.env.get("WEB_PUSH_VAPID_PRIVATE_KEY") ?? "";
    const vapidSubject = Deno.env.get("WEB_PUSH_VAPID_SUBJECT") ?? "mailto:admin@example.com";
    if (!supabaseUrl || !serviceRole || !vapidPublic || !vapidPrivate) return json({ error: "Missing server push configuration" }, 500);

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const oldestIso = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Không gửi hàng loạt lịch cũ nếu người dùng chỉ vừa bật Push sau nhiều tuần/tháng.
    await admin.from("calendar_reminder_jobs")
      .update({ status: "expired", updated_at: nowIso })
      .eq("status", "pending")
      .lt("scheduled_at", oldestIso);

    const { data: jobs, error: jobsError } = await admin
      .from("calendar_reminder_jobs")
      .select("user_id,event_id,scheduled_at,deep_link")
      .eq("status", "pending")
      .gte("scheduled_at", oldestIso)
      .lte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(100);
    if (jobsError) return json({ error: jobsError.message }, 500);

    let jobsSent = 0;
    let pushesSent = 0;
    let pushesRetried = 0;
    for (const job of jobs ?? []) {
      // Chặn race: nếu người dùng vừa sửa/xóa/reschedule sau lúc query danh sách due, bỏ bản snapshot cũ.
      const { data: liveJob } = await admin.from("calendar_reminder_jobs")
        .select("status,scheduled_at")
        .eq("user_id", job.user_id)
        .eq("event_id", job.event_id)
        .maybeSingle();
      if (!liveJob || liveJob.status !== "pending" || liveJob.scheduled_at !== job.scheduled_at) continue;

      const { data: subscriptions, error: subscriptionsError } = await admin
        .from("web_push_subscriptions")
        .select("endpoint,p256dh,auth")
        .eq("user_id", job.user_id);
      if (subscriptionsError || !subscriptions?.length) continue;

      const { data: receipts, error: receiptsError } = await admin
        .from("calendar_reminder_deliveries")
        .select("endpoint")
        .eq("user_id", job.user_id)
        .eq("event_id", job.event_id)
        .eq("scheduled_at", job.scheduled_at);
      if (receiptsError) continue;
      const deliveredEndpoints = new Set((receipts ?? []).map((row: { endpoint: string }) => row.endpoint));

      let allCurrentDevicesHandled = true;
      for (const sub of subscriptions) {
        if (deliveredEndpoints.has(sub.endpoint)) continue;
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify({
            title: "⏰ Huyền Bút Các · Lịch đến hạn",
            body: "Bạn có một lịch hẹn đến thời gian đã đặt. Chạm để mở chi tiết.",
            tag: `hbc-calendar-${job.event_id}`,
            eventId: job.event_id,
            data: { url: job.deep_link, eventId: job.event_id },
          }), { TTL: 60 * 60 * 24 });
          pushesSent += 1;
          const { error: receiptError } = await admin.from("calendar_reminder_deliveries").upsert({
            user_id: job.user_id,
            event_id: job.event_id,
            scheduled_at: job.scheduled_at,
            endpoint: sub.endpoint,
            sent_at: nowIso,
          }, { onConflict: "user_id,event_id,scheduled_at,endpoint" });
          if (receiptError) allCurrentDevicesHandled = false;
        } catch (error) {
          const statusCode = Number((error as { statusCode?: number }).statusCode ?? 0);
          if (statusCode === 404 || statusCode === 410) {
            // Subscription đã chết: xóa để nó không chặn job của các thiết bị còn sống.
            await admin.from("web_push_subscriptions").delete().eq("user_id", job.user_id).eq("endpoint", sub.endpoint);
          } else {
            allCurrentDevicesHandled = false;
            pushesRetried += 1;
          }
        }
      }

      if (allCurrentDevicesHandled) {
        const { data: updated } = await admin.from("calendar_reminder_jobs")
          .update({ status: "sent", sent_at: nowIso, updated_at: nowIso })
          .eq("user_id", job.user_id)
          .eq("event_id", job.event_id)
          .eq("status", "pending")
          .eq("scheduled_at", job.scheduled_at)
          .select("event_id")
          .maybeSingle();
        if (updated) jobsSent += 1;
      }
    }
    return json({ ok: true, jobsChecked: jobs?.length ?? 0, jobsSent, pushesSent, pushesRetried });
  },
};
