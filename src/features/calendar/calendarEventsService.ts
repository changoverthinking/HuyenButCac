import { v4 as uuid } from "uuid";
import { db } from "../../database/db";
import type { CalendarEvent, CalendarEventColor } from "../../types/entities";
import { supabase } from "../auth/supabase";

export type CalendarEventInput = {
  title: string;
  note?: string;
  startsAt: number;
  remindAt?: number | null;
  allDay?: boolean;
  color?: CalendarEventColor;
};

function base() {
  const now = Date.now();
  return { createdAt: now, updatedAt: now, schemaVersion: 1, deletedAt: null, syncState: "local" as const };
}

function validate(input: CalendarEventInput) {
  const title = input.title.trim();
  if (!title) throw new Error("Tên lịch hẹn không được để trống.");
  if (title.length > 160) throw new Error("Tên lịch hẹn tối đa 160 ký tự.");
  if ((input.note?.length ?? 0) > 5_000) throw new Error("Ghi chú lịch tối đa 5.000 ký tự.");
  if (!Number.isFinite(input.startsAt)) throw new Error("Ngày giờ lịch hẹn không hợp lệ.");
  if (input.remindAt != null && !Number.isFinite(input.remindAt)) throw new Error("Thời gian nhắc không hợp lệ.");
  if (input.remindAt != null && input.remindAt > input.startsAt) throw new Error("Thời gian nhắc phải ở trước hoặc đúng thời điểm lịch hẹn.");
  return title;
}

async function syncReminderJob(event: CalendarEvent) {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return;

  if (event.deletedAt !== null || event.remindAt === null) {
    await supabase.from("calendar_reminder_jobs").delete().eq("user_id", user.id).eq("event_id", event.id);
    return;
  }

  const { error } = await supabase.from("calendar_reminder_jobs").upsert({
    user_id: user.id,
    event_id: event.id,
    scheduled_at: new Date(event.remindAt).toISOString(),
    deep_link: `?mode=calendar&event=${encodeURIComponent(event.id)}`,
    status: "pending",
    sent_at: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,event_id" });
  if (error) throw error;
}

export async function createCalendarEvent(input: CalendarEventInput): Promise<CalendarEvent> {
  const event: CalendarEvent = {
    id: uuid(),
    title: validate(input),
    note: input.note?.trim() ?? "",
    startsAt: input.startsAt,
    remindAt: input.remindAt ?? null,
    allDay: Boolean(input.allDay),
    color: input.color ?? "jade",
    ...base(),
  };
  await db.calendarEvents.add(event);
  try { await syncReminderJob(event); } catch { /* local-first: cloud reminder retries on next edit/open */ }
  window.dispatchEvent(new CustomEvent("hbc-calendar-events-changed"));
  return event;
}

export async function updateCalendarEvent(id: string, patch: Partial<CalendarEventInput>): Promise<void> {
  const current = await db.calendarEvents.get(id);
  if (!current || current.deletedAt !== null) throw new Error("Không tìm thấy lịch hẹn.");
  const nextInput: CalendarEventInput = {
    title: patch.title ?? current.title,
    note: patch.note ?? current.note,
    startsAt: patch.startsAt ?? current.startsAt,
    remindAt: patch.remindAt !== undefined ? patch.remindAt : current.remindAt,
    allDay: patch.allDay ?? current.allDay,
    color: patch.color ?? current.color,
  };
  const title = validate(nextInput);
  const updatedAt = Date.now();
  await db.calendarEvents.update(id, {
    title,
    note: nextInput.note?.trim() ?? "",
    startsAt: nextInput.startsAt,
    remindAt: nextInput.remindAt ?? null,
    allDay: Boolean(nextInput.allDay),
    color: nextInput.color ?? "jade",
    updatedAt,
  });
  const updated = await db.calendarEvents.get(id);
  if (updated) {
    try { await syncReminderJob(updated); } catch { /* local-first */ }
  }
  window.dispatchEvent(new CustomEvent("hbc-calendar-events-changed"));
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const current = await db.calendarEvents.get(id);
  if (!current) return;
  const deletedAt = Date.now();
  // Không có thùng rác cho CalendarEvent: xóa nội dung rõ và chỉ giữ tombstone tối thiểu để sync xóa đa thiết bị.
  await db.calendarEvents.update(id, { title: "", note: "", remindAt: null, deletedAt, updatedAt: deletedAt });
  const updated = await db.calendarEvents.get(id);
  if (updated) {
    try { await syncReminderJob(updated); } catch { /* local tombstone will still sync */ }
  }
  await db.calendarNotificationReceipts.where("eventId").equals(id).delete();
  window.dispatchEvent(new CustomEvent("hbc-calendar-events-changed"));
}

export async function listCalendarEvents(): Promise<CalendarEvent[]> {
  const rows = await db.calendarEvents.filter((event: CalendarEvent) => event.deletedAt === null).toArray();
  return rows.sort((a: CalendarEvent, b: CalendarEvent) => a.startsAt - b.startsAt || a.createdAt - b.createdAt);
}

export async function listCalendarEventsBetween(startMs: number, endMs: number): Promise<CalendarEvent[]> {
  return db.calendarEvents
    .where("startsAt")
    .between(startMs, endMs, true, false)
    .filter((event: CalendarEvent) => event.deletedAt === null)
    .sortBy("startsAt");
}

export async function getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
  const event = await db.calendarEvents.get(id);
  return event?.deletedAt === null ? event : undefined;
}

/** Cố gắng phục hồi các reminder job cloud nếu lúc tạo lịch thiết bị đang offline. */
export async function reconcileCalendarReminderJobs(): Promise<void> {
  if (!supabase || !navigator.onLine) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  // Bao gồm cả tombstone để xóa reminder job đã được tạo trước khi thiết bị offline/xóa event.
  const events = await db.calendarEvents.toArray();
  for (const event of events) {
    try { await syncReminderJob(event); } catch { return; }
  }
}
