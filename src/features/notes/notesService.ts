import { v4 as uuid } from "uuid";
import { db } from "../../database/db";
import type { Note, NoteLockEnvelope } from "../../types/entities";
import { decryptJson, deriveVaultKey, encryptJson } from "../crypto/vaultService";
import { sanitizeRichHtml } from "../security/htmlSanitizer";

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

const noteKeys = new Map<string, CryptoKey>();
const LOCKED_TITLE = "🔒 Ghi chú đã khóa";

type PrivateNoteContent = Pick<Note, "title" | "contentHtml" | "contentText" | "tags">;

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function noteAad(id: string) {
  return `huyen-but-cac:note-lock:${id}`;
}

async function decryptLockedContent(note: Note): Promise<PrivateNoteContent> {
  const key = noteKeys.get(note.id);
  if (!key || !note.lockPayload) throw new Error("Ghi chú đang khóa. Hãy nhập mật khẩu ghi chú trước.");
  try {
    return await decryptJson<PrivateNoteContent>(key, note.lockPayload, noteAad(note.id));
  } catch {
    noteKeys.delete(note.id);
    throw new Error("Không thể giải mã ghi chú. Mật khẩu không đúng hoặc dữ liệu khóa đã bị thay đổi.");
  }
}

async function hydrateNote(note: Note): Promise<Note> {
  if (!note.locked || !note.lockPayload || !noteKeys.has(note.id)) return note;
  const clear = await decryptLockedContent(note);
  return { ...note, ...clear };
}

export function isNoteUnlocked(id: string) {
  return noteKeys.has(id);
}

export function clearAllNoteUnlockSessions() {
  noteKeys.clear();
}

export async function unlockNote(id: string, password: string): Promise<void> {
  const note = await db.notes.get(id);
  if (!note?.locked || !note.lockPayload || !note.lockSalt) throw new Error("Ghi chú này chưa được khóa bằng mật khẩu.");
  if (!password) throw new Error("Hãy nhập mật khẩu ghi chú.");
  const key = await deriveVaultKey(password, fromBase64(note.lockSalt));
  try {
    await decryptJson<PrivateNoteContent>(key, note.lockPayload, noteAad(id));
  } catch {
    throw new Error("Mật khẩu ghi chú không đúng.");
  }
  noteKeys.set(id, key);
}

export function closeLockedNote(id: string) {
  noteKeys.delete(id);
}

export async function lockNote(id: string, password: string): Promise<void> {
  if (password.length < 8) throw new Error("Mật khẩu ghi chú cần ít nhất 8 ký tự.");
  const note = await db.notes.get(id);
  if (!note) throw new Error("Không tìm thấy ghi chú.");
  if (note.locked) throw new Error("Ghi chú này đã được khóa.");

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveVaultKey(password, salt);
  const payload: PrivateNoteContent = {
    title: note.title,
    contentHtml: note.contentHtml,
    contentText: note.contentText,
    tags: note.tags,
  };
  const envelope = await encryptJson(key, payload, noteAad(id));
  const updatedAt = Date.now();
  await db.notes.update(id, {
    title: LOCKED_TITLE,
    contentHtml: "",
    contentText: "",
    tags: [],
    locked: true,
    lockSalt: toBase64(salt),
    lockPayload: envelope as NoteLockEnvelope,
    updatedAt,
  });
  // Khóa xong là đóng ngay. Mật khẩu/key không được lưu vào IndexedDB/localStorage.
  noteKeys.delete(id);
}

export async function removeNoteLock(id: string): Promise<void> {
  const note = await db.notes.get(id);
  if (!note?.locked) return;
  const clear = await decryptLockedContent(note);
  await db.notes.update(id, {
    ...clear,
    locked: false,
    lockSalt: null,
    lockPayload: null,
    updatedAt: Date.now(),
  });
  noteKeys.delete(id);
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
    lockSalt: null,
    lockPayload: null,
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
  patch: Partial<Pick<Note, "title" | "contentHtml" | "folderId" | "tags" | "pinned" | "favorite" | "archived">>
): Promise<void> {
  const existing = await db.notes.get(id);
  if (!existing) throw new Error("Không tìm thấy ghi chú.");
  const updatedAt = Date.now();

  if (existing.locked && existing.lockPayload) {
    const privateFields = patch.title !== undefined || patch.contentHtml !== undefined || patch.tags !== undefined;
    const metadataPatch: Partial<Note> = { updatedAt };
    if (patch.folderId !== undefined) metadataPatch.folderId = patch.folderId;
    if (patch.pinned !== undefined) metadataPatch.pinned = patch.pinned;
    if (patch.favorite !== undefined) metadataPatch.favorite = patch.favorite;
    if (patch.archived !== undefined) metadataPatch.archived = patch.archived;

    if (privateFields) {
      const key = noteKeys.get(id);
      if (!key) throw new Error("Ghi chú đang khóa. Hãy mở khóa trước khi sửa nội dung.");
      const clear = await decryptLockedContent(existing);
      const next: PrivateNoteContent = {
        title: patch.title ?? clear.title,
        contentHtml: patch.contentHtml !== undefined ? sanitizeRichHtml(patch.contentHtml) : clear.contentHtml,
        contentText: patch.contentHtml !== undefined ? htmlToPlainText(sanitizeRichHtml(patch.contentHtml)) : clear.contentText,
        tags: patch.tags ?? clear.tags,
      };
      metadataPatch.lockPayload = await encryptJson(key, next, noteAad(id)) as NoteLockEnvelope;
    }
    await db.notes.update(id, metadataPatch);
    return;
  }

  const update: Partial<Note> = { ...patch, updatedAt };
  if (patch.contentHtml !== undefined) {
    const sanitizedHtml = sanitizeRichHtml(patch.contentHtml);
    update.contentHtml = sanitizedHtml;
    update.contentText = htmlToPlainText(sanitizedHtml);
  }
  await db.notes.update(id, update);
}

export async function softDeleteNote(id: string): Promise<void> {
  closeLockedNote(id);
  await db.notes.update(id, { deletedAt: Date.now(), updatedAt: Date.now() });
}

export async function restoreNote(id: string): Promise<void> {
  await db.notes.update(id, { deletedAt: null, updatedAt: Date.now() });
}

export async function hardDeleteNote(id: string): Promise<void> {
  // Giữ tombstone tối thiểu để thao tác xóa truyền sang mọi thiết bị, nhưng xóa sạch nội dung và ciphertext.
  const existing = await db.notes.get(id);
  if (!existing) return;
  closeLockedNote(id);
  const now = Date.now();
  await db.notes.put({
    ...existing,
    title: "",
    contentHtml: "",
    contentText: "",
    folderId: null,
    tags: [],
    pinned: false,
    favorite: false,
    locked: false,
    lockSalt: null,
    lockPayload: null,
    archived: true,
    deletedAt: now,
    updatedAt: now,
  });
}

export async function listActiveNotes(folderId?: string | null): Promise<Note[]> {
  let notes = await db.notes.filter((n) => n.deletedAt === null && !n.archived).toArray();
  if (folderId !== undefined) notes = notes.filter((n) => n.folderId === folderId);
  const hydrated = await Promise.all(notes.map(hydrateNote));
  return hydrated.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt);
}

export async function listTrashedNotes(): Promise<Note[]> {
  const notes = await db.notes.filter((n) => n.deletedAt !== null && !n.archived).toArray();
  const hydrated = await Promise.all(notes.map(hydrateNote));
  return hydrated.sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
}

export async function searchNotes(query: string): Promise<Note[]> {
  const q = stripDiacritics(query.trim());
  if (!q) return [];
  const all = await db.notes.filter((n) => n.deletedAt === null && !n.archived).toArray();
  const hydrated = await Promise.all(all.map(hydrateNote));
  return hydrated.filter((n) => {
    const haystack = stripDiacritics(`${n.title} ${n.contentText} ${n.tags.join(" ")}`);
    return haystack.includes(q);
  });
}
