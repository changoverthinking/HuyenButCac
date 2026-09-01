import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../database/db";
import { createCalendarEvent, deleteCalendarEvent, listCalendarEvents, updateCalendarEvent } from "../features/calendar/calendarEventsService";

describe("calendarEventsService", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("tạo lịch hẹn có ghi chú và thời gian nhắc", async () => {
    const startsAt = new Date(2026, 8, 10, 9, 30).getTime();
    const event = await createCalendarEvent({
      title: "Nộp hồ sơ",
      note: "Mang theo giấy tờ",
      startsAt,
      remindAt: startsAt - 15 * 60_000,
      color: "gold",
    });
    expect(event.title).toBe("Nộp hồ sơ");
    expect((await listCalendarEvents())[0]).toMatchObject({ id: event.id, note: "Mang theo giấy tờ", color: "gold" });
  });

  it("sửa lịch giữ một bản ghi và cập nhật reminder", async () => {
    const event = await createCalendarEvent({ title: "A", startsAt: Date.now(), remindAt: null });
    await updateCalendarEvent(event.id, { title: "B", remindAt: event.startsAt - 60_000 });
    const rows = await listCalendarEvents();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ title: "B", remindAt: event.startsAt - 60_000 });
  });

  it("xóa mềm lịch và dọn biên nhận thông báo cục bộ", async () => {
    const event = await createCalendarEvent({ title: "Xóa", startsAt: Date.now(), remindAt: Date.now() - 1000 });
    await db.calendarNotificationReceipts.put({ id: `device:${event.id}:1`, eventId: event.id, remindAt: 1, notifiedAt: Date.now() });
    await deleteCalendarEvent(event.id);
    expect(await listCalendarEvents()).toHaveLength(0);
    expect(await db.calendarNotificationReceipts.where("eventId").equals(event.id).count()).toBe(0);
    const tombstone = await db.calendarEvents.get(event.id);
    expect(tombstone?.deletedAt).not.toBeNull();
    expect(tombstone?.title).toBe("");
    expect(tombstone?.note).toBe("");
    expect(tombstone?.remindAt).toBeNull();
  });

  it("không cho tạo lịch thiếu tiêu đề", async () => {
    await expect(createCalendarEvent({ title: "   ", startsAt: Date.now() })).rejects.toThrow("không được để trống");
  });

  it("không cho đặt nhắc sau thời điểm lịch hẹn", async () => {
    const startsAt = Date.now();
    await expect(createCalendarEvent({ title: "Sai nhắc", startsAt, remindAt: startsAt + 60_000 })).rejects.toThrow("trước hoặc đúng");
  });
});
