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
  lockNote,
  unlockNote,
  closeLockedNote,
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
    expect(fromDb?.archived).toBe(true); // tombstone đồng bộ, không hiện cho người dùng
    expect(fromDb?.title).toBe("");
    expect(fromDb?.contentHtml).toBe("");
    expect(fromDb?.contentText).toBe("");
    expect(fromDb?.tags).toEqual([]);
    expect(fromDb?.lockPayload).toBeNull();
    expect(fromDb?.lockSalt).toBeNull();
    expect((await listTrashedNotes()).find((item) => item.id === note.id)).toBeUndefined();
  });
});


describe("notesService — khóa ghi chú", () => {
  it("khóa xóa plaintext khỏi IndexedDB và chỉ mở khi có đúng mật khẩu", async () => {
    const note = await createNote({ title: "Bí mật Trúc Lý" });
    await updateNote(note.id, { contentHtml: "<p>Nội dung tuyệt mật</p>", tags: ["riêng tư"] });
    await lockNote(note.id, "mat-khau-rieng-123");

    const raw = await db.notes.get(note.id);
    expect(raw?.locked).toBe(true);
    expect(raw?.title).toBe("🔒 Ghi chú đã khóa");
    expect(raw?.contentHtml).toBe("");
    expect(raw?.contentText).toBe("");
    expect(raw?.tags).toEqual([]);
    expect(raw?.lockPayload?.ciphertext).toBeTruthy();
    expect(JSON.stringify(raw)).not.toContain("Nội dung tuyệt mật");
    expect(JSON.stringify(raw)).not.toContain("Bí mật Trúc Lý");

    await expect(unlockNote(note.id, "sai-mat-khau")).rejects.toThrow("Mật khẩu ghi chú không đúng");
    await unlockNote(note.id, "mat-khau-rieng-123");
    const [opened] = await listActiveNotes();
    expect(opened.title).toBe("Bí mật Trúc Lý");
    expect(opened.contentText).toContain("Nội dung tuyệt mật");

    closeLockedNote(note.id);
    const [closed] = await listActiveNotes();
    expect(closed.title).toBe("🔒 Ghi chú đã khóa");
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
