import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { db, switchWorkspace } from "../database/db";
import { listActiveNotes } from "../features/notes/notesService";
import {
  executeTieuNhiWriteAction,
  listTieuNhiMemories,
  makeWriteAction,
  rememberTieuNhi,
  searchWorkspaceContext,
  tieuNhiDatabaseNameForWorkspace,
} from "../features/tieu-nhi/tieuNhiDataService";

const databasesToDelete: string[] = [];

afterEach(async () => {
  await switchWorkspace(null);
  for (const name of databasesToDelete.splice(0)) await Dexie.delete(name);
  localStorage.removeItem("hbc-legacy-workspace-migrated-to");
});

function registerWorkspace(userId: string) {
  databasesToDelete.push(
    `huyen-but-cac-workspace-${userId}`,
    tieuNhiDatabaseNameForWorkspace(userId),
  );
}

describe("Tiểu Nhị data layer", () => {
  it("tách memory lâu dài theo workspace", async () => {
    localStorage.setItem("hbc-legacy-workspace-migrated-to", "test-skip-legacy");
    const suffix = `${Date.now()}-${Math.random()}`;
    const userA = `tn-A-${suffix}`;
    const userB = `tn-B-${suffix}`;
    registerWorkspace(userA);
    registerWorkspace(userB);

    await switchWorkspace(userA);
    await rememberTieuNhi("Xưng hô", "Gọi tôi là Các Chủ");
    expect((await listTieuNhiMemories()).map((item) => item.value)).toContain("Gọi tôi là Các Chủ");

    await switchWorkspace(userB);
    expect(await listTieuNhiMemories()).toHaveLength(0);
    await rememberTieuNhi("Thể loại", "Tiên hiệp");

    await switchWorkspace(userA);
    const memoryA = await listTieuNhiMemories();
    expect(memoryA).toHaveLength(1);
    expect(memoryA[0].value).toBe("Gọi tôi là Các Chủ");
  });

  it("chỉ ghi ghi chú sau khi action được execute", async () => {
    localStorage.setItem("hbc-legacy-workspace-migrated-to", "test-skip-legacy");
    const userId = `tn-write-${Date.now()}-${Math.random()}`;
    registerWorkspace(userId);
    await switchWorkspace(userId);

    const action = makeWriteAction({ type: "create_note", title: "Ghi chú AI", content: "Nội dung do Tiểu Nhị đề xuất" });
    expect(await listActiveNotes()).toHaveLength(0);

    await executeTieuNhiWriteAction(action);
    const notes = await listActiveNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe("Ghi chú AI");
    expect(notes[0].contentText).toContain("Nội dung do Tiểu Nhị đề xuất");
  });

  it("RAG tìm được ghi chú theo từ khóa rời thay vì bắt buộc khớp cả câu", async () => {
    localStorage.setItem("hbc-legacy-workspace-migrated-to", "test-skip-legacy");
    const userId = `tn-rag-${Date.now()}-${Math.random()}`;
    registerWorkspace(userId);
    await switchWorkspace(userId);

    const now = Date.now();
    await db.notes.add({
      id: crypto.randomUUID(),
      title: "Kế hoạch trận chiến",
      contentHtml: "<p>Nhân vật Lạc Trần mai phục tại Hắc Phong Cốc.</p>",
      contentText: "Nhân vật Lạc Trần mai phục tại Hắc Phong Cốc.",
      folderId: null,
      tags: ["truyện"],
      pinned: false,
      favorite: false,
      locked: false,
      lockSalt: null,
      lockPayload: null,
      archived: false,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
      deletedAt: null,
      syncState: "local",
    });

    const hits = await searchWorkspaceContext("Lạc Trần đang ở địa điểm nào?", ["notes"], 5);
    expect(hits.some((hit) => hit.title === "Kế hoạch trận chiến")).toBe(true);
  });
});
