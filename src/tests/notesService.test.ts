import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../database/db";
import {
  createNote,
  updateNote,
  softDeleteNote,
  restoreNote,
  hardDeleteNote,
  listActiveNotes,
  listTrashedNotes,
  searchNotes,
  stripDiacritics,
} from "../features/notes/notesService";

beforeEach(async () => {
  await db.notes.clear();
});

describe("notesService — CRUD cơ bản", () => {
  it("tạo ghi chú mới và đọc lại được (giả lập reload)", async () => {
    const note = await createNote({ title: "Ghi chú test" });
    const fromDb = await db.notes.get(note.id);
    expect(fromDb?.title).toBe("Ghi chú test");
    expect(fromDb?.deletedAt).toBeNull();
  });

  it("sửa nội dung cập nhật cả contentText để phục vụ search", async () => {
    const note = await createNote({});
    await updateNote(note.id, { contentHtml: "<p>Xin chào thế giới</p>" });
    const fromDb = await db.notes.get(note.id);
    expect(fromDb?.contentText).toContain("Xin chào thế giới");
  });

  it("soft delete rồi restore: reload không mất dữ liệu", async () => {
    const note = await createNote({ title: "Sẽ bị xóa" });
    await softDeleteNote(note.id);

    let active = await listActiveNotes();
    expect(active.find((n) => n.id === note.id)).toBeUndefined();

    let trashed = await listTrashedNotes();
    expect(trashed.find((n) => n.id === note.id)).toBeDefined();

    await restoreNote(note.id);
    active = await listActiveNotes();
    expect(active.find((n) => n.id === note.id)?.title).toBe("Sẽ bị xóa");
  });

  it("hard delete xóa vĩnh viễn khỏi thùng rác", async () => {
    const note = await createNote({ title: "Xóa hẳn" });
    await softDeleteNote(note.id);
    await hardDeleteNote(note.id);
    const fromDb = await db.notes.get(note.id);
    expect(fromDb).toBeUndefined();
  });
});

describe("notesService — tìm kiếm có/không dấu", () => {
  it("stripDiacritics bỏ dấu tiếng Việt đúng", () => {
    expect(stripDiacritics("Tu Tiên Huyền Bút")).toBe("tu tien huyen but");
    expect(stripDiacritics("Đạo")).toBe("dao");
  });

  it("tìm được ghi chú dù gõ không dấu", async () => {
    await createNote({ title: "Luyện Khí Kỳ" });
    const results = await searchNotes("luyen khi");
    expect(results.length).toBe(1);
    expect(results[0].title).toBe("Luyện Khí Kỳ");
  });

  it("không trả kết quả cho ghi chú đã xóa", async () => {
    const note = await createNote({ title: "Kim Đan Kỳ" });
    await softDeleteNote(note.id);
    const results = await searchNotes("Kim Đan");
    expect(results.length).toBe(0);
  });
});
