import { v4 as uuid } from "uuid";
import { db } from "../../database/db";
import type { Note } from "../../types/entities";

/** Bỏ dấu tiếng Việt để hỗ trợ tìm kiếm có/không dấu (mục 8 master prompt). */
export function stripDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function htmlToPlainText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent ?? "";
}

export async function createNote(params: {
  title?: string;
  folderId?: string | null;
}): Promise<Note> {
  const now = Date.now();
  const note: Note = {
    id: uuid(),
    title: params.title ?? "Ghi chú mới",
    contentHtml: "",
    contentText: "",
    folderId: params.folderId ?? null,
    tags: [],
    pinned: false,
    favorite: false,
    locked: false,
    archived: false,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    deletedAt: null,
    syncState: "local",
  };
  await db.notes.add(note);
  return note;
}

export async function updateNote(
  id: string,
  patch: Partial<Pick<Note, "title" | "contentHtml" | "folderId" | "tags" | "pinned" | "favorite" | "locked" | "archived">>
): Promise<void> {
  const update: Partial<Note> = { ...patch, updatedAt: Date.now() };
  if (patch.contentHtml !== undefined) {
    update.contentText = htmlToPlainText(patch.contentHtml);
  }
  await db.notes.update(id, update);
}

export async function softDeleteNote(id: string): Promise<void> {
  await db.notes.update(id, { deletedAt: Date.now(), updatedAt: Date.now() });
}

export async function restoreNote(id: string): Promise<void> {
  await db.notes.update(id, { deletedAt: null, updatedAt: Date.now() });
}

export async function hardDeleteNote(id: string): Promise<void> {
  // Giữ tombstone để thao tác xóa truyền sang mọi thiết bị, tránh mục sống lại.
  const now = Date.now();
  await db.notes.update(id, { deletedAt: now, updatedAt: now, archived: true });
}

export async function listActiveNotes(folderId?: string | null): Promise<Note[]> {
  let notes = await db.notes.filter((n) => n.deletedAt === null && !n.archived).toArray();
  if (folderId !== undefined) {
    notes = notes.filter((n) => n.folderId === folderId);
  }
  return notes.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
}

export async function listTrashedNotes(): Promise<Note[]> {
  const notes = await db.notes.filter((n) => n.deletedAt !== null && !n.archived).toArray();
  return notes.sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
}

export async function searchNotes(query: string): Promise<Note[]> {
  const q = stripDiacritics(query.trim());
  if (!q) return [];
  const all = await db.notes.filter((n) => n.deletedAt === null).toArray();
  return all.filter((n) => {
    const haystack = stripDiacritics(`${n.title} ${n.contentText} ${n.tags.join(" ")}`);
    return haystack.includes(q);
  });
}
