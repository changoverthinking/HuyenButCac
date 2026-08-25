import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../database/db";
import { createNote, softDeleteNote, updateNote } from "../features/notes/notesService";
import { useNotesStore } from "../stores/notesStore";

describe("notesStore — giữ đúng trạng thái giao diện", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    useNotesStore.setState({
      notes: [], trashedNotes: [], selectedNoteId: null, searchQuery: "",
      searchResults: [], loading: false, activeFolderId: undefined, view: "active",
    });
  });

  it("sửa ghi chú không làm mất bộ lọc thư mục", async () => {
    const inFolder = await createNote({ title: "Trong thư mục", folderId: "folder-a" });
    await createNote({ title: "Ngoài thư mục", folderId: "folder-b" });
    await useNotesStore.getState().loadNotes("folder-a");
    await useNotesStore.getState().updateNote(inFolder.id, { favorite: true });
    expect(useNotesStore.getState().notes.map((note) => note.title)).toEqual(["Trong thư mục"]);
  });

  it("cập nhật nội dung đồng thời làm mới kết quả tìm kiếm", async () => {
    const note = await createNote({ title: "Ban đầu" });
    await useNotesStore.getState().setSearchQuery("huyền bút");
    expect(useNotesStore.getState().searchResults).toHaveLength(0);
    await useNotesStore.getState().updateNote(note.id, { contentHtml: "<p>Huyền Bút</p>" });
    expect(useNotesStore.getState().searchResults.map((item) => item.id)).toEqual([note.id]);
  });

  it("chế độ thùng rác tải đúng ghi chú đã xóa", async () => {
    const note = await createNote({ title: "Đã xóa" });
    await updateNote(note.id, { contentHtml: "<p>Nội dung còn giữ</p>" });
    await softDeleteNote(note.id);
    await useNotesStore.getState().showTrash();
    expect(useNotesStore.getState().view).toBe("trash");
    expect(useNotesStore.getState().trashedNotes[0]).toMatchObject({ id: note.id, title: "Đã xóa" });
  });
});
