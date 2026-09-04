import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { db, switchWorkspace } from "../database/db";
import { createNote } from "../features/notes/notesService";
import { addMusicFiles, listMusicTracks } from "../features/media/mediaService";
import { deleteLibraryBook, getLibraryBook, importPdfBook } from "../features/library/libraryService";
import { clearTieuNhiMessages, loadTieuNhiMessages, saveTieuNhiMessage, tieuNhiDatabaseNameForWorkspace } from "../features/tieu-nhi/tieuNhiDataService";
import {
  createWorkspaceBackup,
  parseWorkspaceBackup,
  restoreWorkspaceBackup,
  stringifyWorkspaceBackup,
} from "../features/backup/workspaceBackupService";

const cleanupNames = new Set<string>();

afterEach(async () => {
  await switchWorkspace(null);
  for (const name of cleanupNames) await Dexie.delete(name);
  cleanupNames.clear();
  localStorage.clear();
});

describe("workspaceBackupService", () => {
  it("backup/restore giữ cả DB chính, PDF/Blob và lịch sử Tiểu Nhị", async () => {
    localStorage.setItem("hbc-legacy-workspace-migrated-to", "test-skip-legacy");
    const userId = `backup-${Date.now()}-${Math.random()}`;
    const encoded = encodeURIComponent(userId);
    cleanupNames.add(`huyen-but-cac-workspace-${userId}`);
    cleanupNames.add(`huyen-but-cac-library-v1-${encoded}`);
    cleanupNames.add(`huyen-but-cac-appearance-v1-${encoded}`);
    cleanupNames.add(tieuNhiDatabaseNameForWorkspace(userId));

    await switchWorkspace(userId);
    const note = await createNote({ title: "Bản thảo cần giữ" });
    const [track] = await addMusicFiles([new File([new Uint8Array([1, 2, 3, 4])], "nhac.mp3", { type: "audio/mpeg" })]);
    const book = await importPdfBook({ file: new File([new Uint8Array([37, 80, 68, 70])], "kinh.pdf", { type: "application/pdf" }) });
    await saveTieuNhiMessage({ role: "user", content: "Hãy nhớ dữ liệu này", mode: "local" });

    const backup = await createWorkspaceBackup("test");
    expect(backup.databases.map((item) => item.name)).toEqual(expect.arrayContaining([
      `huyen-but-cac-workspace-${userId}`,
      `huyen-but-cac-library-v1-${encoded}`,
      tieuNhiDatabaseNameForWorkspace(userId),
    ]));

    await db.notes.delete(note.id);
    await db.musicTracks.delete(track.id);
    await deleteLibraryBook(book.id);
    await clearTieuNhiMessages();

    // Đi qua đúng định dạng file JSON để bắt lỗi encode/decode chứ không restore object trong RAM.
    const restored = await restoreWorkspaceBackup(parseWorkspaceBackup(stringifyWorkspaceBackup(backup)));
    expect(restored.restoredRecords).toBeGreaterThanOrEqual(4);
    expect((await db.notes.get(note.id))?.title).toBe("Bản thảo cần giữ");
    expect((await listMusicTracks())[0]?.audioBlob.size).toBe(4);
    expect((await getLibraryBook(book.id))?.pdfBlob?.size).toBe(4);
    expect((await loadTieuNhiMessages())[0]?.content).toBe("Hãy nhớ dữ liệu này");
  });


  it("từ chối file backup cố ghi database ngoài phạm vi Huyền Bút Các", async () => {
    localStorage.setItem("hbc-legacy-workspace-migrated-to", "test-skip-legacy");
    const userId = `backup-scope-${Date.now()}`;
    cleanupNames.add(`huyen-but-cac-workspace-${userId}`);
    await switchWorkspace(userId);
    const backup = await createWorkspaceBackup("test");
    const malicious = JSON.parse(stringifyWorkspaceBackup(backup));
    malicious.databases.push({ name: "foreign-origin-database", version: 1, stores: [] });
    expect(() => parseWorkspaceBackup(JSON.stringify(malicious))).toThrow("ngoài phạm vi workspace");
  });

  it("từ chối restore backup của workspace khác", async () => {
    localStorage.setItem("hbc-legacy-workspace-migrated-to", "test-skip-legacy");
    const userA = `backup-A-${Date.now()}`;
    const userB = `backup-B-${Date.now()}`;
    cleanupNames.add(`huyen-but-cac-workspace-${userA}`);
    cleanupNames.add(`huyen-but-cac-workspace-${userB}`);
    await switchWorkspace(userA);
    await createNote({ title: "A" });
    const backup = await createWorkspaceBackup("test");
    await switchWorkspace(userB);
    await expect(restoreWorkspaceBackup(backup)).rejects.toThrow("workspace/tài khoản khác");
  });
});
