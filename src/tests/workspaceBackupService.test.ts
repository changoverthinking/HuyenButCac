// HBC-FIX-132: jsdom/fake-indexeddb Blob structuredClone compatibility.
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
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

// fake-indexeddb dùng global structuredClone. Trong môi trường Vitest + jsdom,
// Blob/File thuộc realm jsdom có thể bị structuredClone native của Node biến thành
// object không còn prototype Blob. Khi đó test backup binary báo sai dù browser thật
// vẫn lưu Blob qua IndexedDB bình thường. Polyfill cục bộ này chỉ áp dụng trong suite
// backup, giữ nguyên Blob/File và để structuredClone native xử lý các kiểu còn lại.
const originalStructuredClone = globalThis.structuredClone;

function cloneForIndexedDb<T>(value: T): T {
  if (typeof File !== "undefined" && value instanceof File) {
    return new File([value], value.name, {
      type: value.type,
      lastModified: value.lastModified,
    }) as T;
  }

  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return value.slice(0, value.size, value.type) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => cloneForIndexedDb(item)) as T;
  }

  if (value && typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null) {
      const clone: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
        clone[key] = cloneForIndexedDb(item);
      }
      return clone as T;
    }
  }

  return originalStructuredClone(value);
}

beforeAll(() => {
  Object.defineProperty(globalThis, "structuredClone", {
    configurable: true,
    writable: true,
    value: cloneForIndexedDb,
  });
});

afterAll(() => {
  Object.defineProperty(globalThis, "structuredClone", {
    configurable: true,
    writable: true,
    value: originalStructuredClone,
  });
});

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
