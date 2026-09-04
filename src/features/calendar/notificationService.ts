import { db } from "../../database/db";
import type { CalendarEvent } from "../../types/entities";
import { supabase } from "../auth/supabase";
import { localGet, localSet, sessionGet, sessionRemove, sessionSet } from "../app/safeStorage";
import { trackPendingWrite } from "../app/appLifecycle";

export type NotificationCapability = {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  pushSupported: boolean;
  pushConfigured: boolean;
  installedLikeApp: boolean;
};

const VAPID_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_VAPID_PUBLIC_KEY?.trim() ?? "";
const DEVICE_ID_KEY = "hbc-calendar-device-id";
const DEEP_LINK_ACK_PREFIX = "hbc-calendar-push-ack:";

function getDeviceId() {
  let id = localGet(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localSet(DEVICE_ID_KEY, id);
  }
  return id;
}

function receiptId(event: CalendarEvent) {
  return `${getDeviceId()}:${event.id}:${event.remindAt ?? 0}`;
}

function consumeRecentDeepLinkAck(event: CalendarEvent, now: number) {
  if (event.remindAt === null) return false;
  const key = `${DEEP_LINK_ACK_PREFIX}${event.id}`;
  const acknowledgedAt = Number(sessionGet(key) ?? 0);
  if (!acknowledgedAt) return false;
  const recent = now - acknowledgedAt <= 7 * 24 * 60 * 60 * 1000;
  const atOrNearDue = acknowledgedAt >= event.remindAt - 2 * 60 * 1000;
  if (!recent || !atOrNearDue) return false;
  sessionRemove(key);
  return true;
}

function base64UrlToUint8Array(base64Url: string) {
  const padding = "=".repeat((4 - base64Url.length % 4) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
}

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function getNotificationCapability(): NotificationCapability {
  const supported = typeof Notification !== "undefined" && "serviceWorker" in navigator;
  return {
    supported,
    permission: supported ? Notification.permission : "unsupported",
    pushSupported: supported && "PushManager" in window,
    pushConfigured: Boolean(VAPID_PUBLIC_KEY),
    installedLikeApp: isStandalone(),
  };
}

async function getRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing?.active) return existing;
  // Không treo vô hạn ở localhost/dev nếu service worker chưa được đăng ký.
  return Promise.race<ServiceWorkerRegistration | null>([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 8_000)),
  ]);
}

function sameApplicationServerKey(subscription: PushSubscription, expected: Uint8Array) {
  const current = subscription.options.applicationServerKey;
  if (!current) return false;
  const bytes = new Uint8Array(current);
  if (bytes.byteLength !== expected.byteLength) return false;
  return bytes.every((value, index) => value === expected[index]);
}

export async function requestCalendarNotificationPermission() {
  if (typeof Notification === "undefined") throw new Error("Thiết bị/trình duyệt này chưa hỗ trợ thông báo web.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error(permission === "denied" ? "Quyền thông báo đang bị chặn trong cài đặt trình duyệt/hệ điều hành." : "Bạn chưa cho phép thông báo.");
  return registerPushSubscription();
}

export async function registerPushSubscription() {
  const capability = getNotificationCapability();
  if (!capability.supported || Notification.permission !== "granted") return { mode: "local" as const };
  if (!capability.pushSupported || !VAPID_PUBLIC_KEY || !supabase) return { mode: "local" as const };

  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return { mode: "local" as const };
  const registration = await getRegistration();
  if (!registration) return { mode: "local" as const };

  const applicationServerKey = base64UrlToUint8Array(VAPID_PUBLIC_KEY);
  let subscription = await registration.pushManager.getSubscription();
  // Nếu chủ dự án đổi cặp VAPID, subscription cũ không thể dùng với private key mới.
  if (subscription && !sameApplicationServerKey(subscription, applicationServerKey)) {
    try { await subscription.unsubscribe(); } catch { /* Browser sẽ tự dọn subscription cũ. */ }
    subscription = null;
  }
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  }
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error("Push subscription không đầy đủ.");

  const { error } = await supabase.rpc("register_my_web_push_subscription", {
    p_endpoint: json.endpoint,
    p_p256dh: json.keys.p256dh,
    p_auth: json.keys.auth,
    p_user_agent: navigator.userAgent.slice(0, 500),
    p_device_label: `${navigator.platform || "Thiết bị"} · ${isStandalone() ? "PWA" : "Browser"}`,
  });
  if (error) return { mode: "local" as const, reason: error.message };
  return { mode: "push" as const };
}

export async function unregisterPushSubscription() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session) await supabase.rpc("unregister_my_web_push_subscription", { p_endpoint: subscription.endpoint });
  }
  await subscription.unsubscribe();
}

async function showNotification(event: CalendarEvent) {
  if (Notification.permission !== "granted") return false;
  const registration = await getRegistration();
  const starts = new Date(event.startsAt);
  const body = event.allDay
    ? `${starts.toLocaleDateString("vi-VN")} · ${event.note || "Lịch hẹn trong Huyền Bút Các"}`
    : `${starts.toLocaleString("vi-VN")} · ${event.note || "Đến thời gian đã đặt"}`;
  const url = `?mode=calendar&event=${encodeURIComponent(event.id)}`;
  if (registration) {
    await registration.showNotification(`⏰ ${event.title}`, {
      body,
      tag: `hbc-calendar-${event.id}`,
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
      data: { url, eventId: event.id },
    });
  } else {
    new Notification(`⏰ ${event.title}`, { body, tag: `hbc-calendar-${event.id}` });
  }
  return true;
}

export async function checkDueCalendarReminders(now = Date.now()) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return 0;
  const oldest = now - 7 * 24 * 60 * 60 * 1000;
  const due = await db.calendarEvents.filter((event: CalendarEvent) =>
    event.deletedAt === null && event.remindAt !== null && event.remindAt <= now && event.remindAt >= oldest,
  ).toArray();
  let shown = 0;
  for (const event of due) {
    const id = receiptId(event);
    if (await db.calendarNotificationReceipts.get(id)) continue;
    if (consumeRecentDeepLinkAck(event, now)) {
      await trackPendingWrite(db.calendarNotificationReceipts.put({ id, eventId: event.id, remindAt: event.remindAt!, notifiedAt: now }));
      continue;
    }
    if (await showNotification(event)) {
      await trackPendingWrite(db.calendarNotificationReceipts.put({ id, eventId: event.id, remindAt: event.remindAt!, notifiedAt: now }));
      shown += 1;
    }
  }
  await updateCalendarBadge();
  return shown;
}

export async function updateCalendarBadge() {
  const nav = navigator as Navigator & { setAppBadge?: (count?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
  if (!nav.setAppBadge) return;
  const now = Date.now();
  const oldest = now - 24 * 60 * 60 * 1000;
  const due = await db.calendarEvents.filter((event: CalendarEvent) =>
    event.deletedAt === null && event.remindAt !== null && event.remindAt <= now && event.startsAt >= oldest,
  ).toArray();
  let unhandled = 0;
  for (const event of due) {
    if (!(await db.calendarNotificationReceipts.get(receiptId(event)))) unhandled += 1;
  }
  try {
    if (unhandled > 0) await nav.setAppBadge(unhandled);
    else await nav.clearAppBadge?.();
  } catch { /* Badge API tùy nền tảng. */ }
}

export async function acknowledgeDeepLinkedCalendarReminder(now = Date.now()) {
  const eventId = new URLSearchParams(window.location.search).get("event");
  if (!eventId) return false;
  sessionSet(`${DEEP_LINK_ACK_PREFIX}${eventId}`, String(now));
  const event = await db.calendarEvents.get(eventId) as CalendarEvent | undefined;
  if (!event || event.deletedAt !== null || event.remindAt === null || event.remindAt > now) return false;
  await trackPendingWrite(db.calendarNotificationReceipts.put({
    id: receiptId(event), eventId: event.id, remindAt: event.remindAt, notifiedAt: now,
  }));
  sessionRemove(`${DEEP_LINK_ACK_PREFIX}${event.id}`);
  await updateCalendarBadge();
  return true;
}

export function startCalendarReminderRuntime() {
  let disposed = false;
  const run = () => { if (!disposed) void checkDueCalendarReminders().catch(() => undefined); };
  void acknowledgeDeepLinkedCalendarReminder().catch(() => false).finally(run);
  const timer = window.setInterval(run, 30_000);
  const visible = () => { if (document.visibilityState === "visible") run(); };
  const changed = () => run();
  const swMessage = (event: MessageEvent) => {
    const data = event.data as { type?: string } | null;
    if (data?.type === "hbc-calendar-push-due") run();
  };
  document.addEventListener("visibilitychange", visible);
  window.addEventListener("hbc-calendar-events-changed", changed);
  window.addEventListener("online", changed);
  navigator.serviceWorker?.addEventListener("message", swMessage);
  return () => {
    disposed = true;
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", visible);
    window.removeEventListener("hbc-calendar-events-changed", changed);
    window.removeEventListener("online", changed);
    navigator.serviceWorker?.removeEventListener("message", swMessage);
  };
}
