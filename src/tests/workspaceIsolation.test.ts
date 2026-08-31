import Dexie from "dexie";
import { afterEach, describe, expect, it } from "vitest";
import { db, switchWorkspace } from "../database/db";
import { createNote } from "../features/notes/notesService";

const createdWorkspaceNames: string[] = [];

afterEach(async () => {
  await switchWorkspace(null);
  for (const name of createdWorkspaceNames.splice(0)) {
    await Dexie.delete(name);
  }
  localStorage.removeItem("hbc-legacy-workspace-migrated-to");
});

describe("IndexedDB workspace isolation", () => {
  it("tài khoản A và B không đọc hoặc xóa dữ liệu local của nhau", async () => {
    // Bỏ qua migration legacy trong test này để chỉ kiểm tra cơ chế workspace mới.
    localStorage.setItem("hbc-legacy-workspace-migrated-to", "test-skip-legacy");
    const suffix = `${Date.now()}-${Math.random()}`;
    const userA = `test-A-${suffix}`;
    const userB = `test-B-${suffix}`;
    createdWorkspaceNames.push(`huyen-but-cac-workspace-${userA}`, `huyen-but-cac-workspace-${userB}`);

    await switchWorkspace(userA);
    const noteA = await createNote({ title: "Chỉ A thấy" });
    expect((await db.notes.get(noteA.id))?.title).toBe("Chỉ A thấy");

    await switchWorkspace(userB);
    expect(await db.notes.get(noteA.id)).toBeUndefined();
    const noteB = await createNote({ title: "Chỉ B thấy" });

    await switchWorkspace(userA);
    expect((await db.notes.get(noteA.id))?.title).toBe("Chỉ A thấy");
    expect(await db.notes.get(noteB.id)).toBeUndefined();

    await switchWorkspace(userB);
    expect((await db.notes.get(noteB.id))?.title).toBe("Chỉ B thấy");
    expect(await db.notes.get(noteA.id)).toBeUndefined();
  });
});
