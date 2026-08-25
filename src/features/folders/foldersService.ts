import { v4 as uuid } from "uuid";
import { db } from "../../database/db";
import type { Folder } from "../../types/entities";

export async function createFolder(name: string, parentId: string | null): Promise<Folder> {
  const now = Date.now();
  const siblingCount = await db.folders
    .filter((f) => f.parentId === parentId && f.deletedAt === null)
    .count();
  const folder: Folder = {
    id: uuid(),
    name,
    parentId,
    order: siblingCount,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    deletedAt: null,
    syncState: "local",
  };
  await db.folders.add(folder);
  return folder;
}

export async function renameFolder(id: string, name: string): Promise<void> {
  await db.folders.update(id, { name, updatedAt: Date.now() });
}

/** Ngăn vòng lặp: không cho phép chọn chính nó hoặc con cháu làm parent mới. */
export async function moveFolder(id: string, newParentId: string | null): Promise<void> {
  if (newParentId === id) throw new Error("Không thể chuyển thư mục vào chính nó.");
  if (newParentId) {
    const all = await db.folders.filter((f) => f.deletedAt === null).toArray();
    const isDescendant = (candidateId: string, ancestorId: string): boolean => {
      let current = all.find((f) => f.id === candidateId);
      while (current?.parentId) {
        if (current.parentId === ancestorId) return true;
        current = all.find((f) => f.id === current!.parentId);
      }
      return false;
    };
    if (isDescendant(newParentId, id)) {
      throw new Error("Không thể chuyển thư mục vào thư mục con của chính nó.");
    }
  }
  await db.folders.update(id, { parentId: newParentId, updatedAt: Date.now() });
}

export async function softDeleteFolder(id: string): Promise<void> {
  await db.folders.update(id, { deletedAt: Date.now(), updatedAt: Date.now() });
}

export async function listFolders(): Promise<Folder[]> {
  const folders = await db.folders.filter((f) => f.deletedAt === null).toArray();
  return folders.sort((a, b) => a.order - b.order);
}
