import Dexie, { type Table } from "dexie";
import { v4 as uuidv4 } from "uuid";
import { getActiveWorkspaceUserId } from "../../database/db";

export type LibraryBookKind = "book" | "novel" | "pdf";

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  description: string;
  kind: LibraryBookKind;
  coverBlob?: Blob | null;
  pdfBlob?: Blob | null;
  pdfFileName?: string | null;
  pdfMimeType?: string | null;
  lastPage: number;
  pinnedPage: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface LibraryProjectMeta {
  id: string;
  projectId: string;
  coverBlob?: Blob | null;
  updatedAt: number;
}

class HuyenButLibraryDB extends Dexie {
  books!: Table<LibraryBook, string>;
  projectMeta!: Table<LibraryProjectMeta, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      books: "id, kind, title, author, updatedAt",
      projectMeta: "id, projectId, updatedAt",
    });
  }
}

const instances = new Map<string, HuyenButLibraryDB>();

export function libraryDatabaseNameForWorkspace(userId: string | null) {
  const suffix = userId ? encodeURIComponent(userId) : "local";
  return `huyen-but-cac-library-v1-${suffix}`;
}

function currentDb() {
  const name = libraryDatabaseNameForWorkspace(
    getActiveWorkspaceUserId() ?? null
  );
  let database = instances.get(name);
  if (!database) {
    database = new HuyenButLibraryDB(name);
    instances.set(name, database);
  }
  return database;
}

function normalizePage(page: number) {
  if (!Number.isFinite(page)) return 1;
  return Math.max(1, Math.floor(page));
}

export function validatePdfFile(file: File) {
  const isPdfMime = file.type === "application/pdf";
  const isPdfName = file.name.toLowerCase().endsWith(".pdf");
  if (!isPdfMime && !isPdfName) throw new Error("Tệp đã chọn không phải PDF.");
  if (file.size <= 0) throw new Error("Tệp PDF đang rỗng hoặc không đọc được.");
  if (file.size > 150 * 1024 * 1024) throw new Error("PDF vượt quá 150 MB. Hãy nén tệp trước khi thêm vào Tàng Thư.");
}

export function validateCoverFile(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Ảnh bìa phải là tệp hình ảnh.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Ảnh bìa vượt quá 12 MB.");
}

function storageError(error: unknown) {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return new Error("Thiết bị không còn đủ dung lượng lưu trữ cho tệp này. Hãy giải phóng bộ nhớ hoặc dùng PDF nhỏ hơn.");
  }
  return error instanceof Error ? error : new Error("Không thể lưu dữ liệu Tàng Thư.");
}

export async function listLibraryBooks() {
  return currentDb().books.orderBy("updatedAt").reverse().toArray();
}

export async function createLibraryBook(input: {
  title: string;
  author?: string;
  description?: string;
  kind: Exclude<LibraryBookKind, "pdf">;
  coverFile?: File | null;
}) {
  const title = input.title.trim();
  if (!title) throw new Error("Tên sách không được để trống.");
  if (input.coverFile) validateCoverFile(input.coverFile);
  const now = Date.now();
  const book: LibraryBook = {
    id: uuidv4(),
    title,
    author: input.author?.trim() ?? "",
    description: input.description?.trim() ?? "",
    kind: input.kind,
    coverBlob: input.coverFile ?? null,
    pdfBlob: null,
    pdfFileName: null,
    pdfMimeType: null,
    lastPage: 1,
    pinnedPage: null,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await currentDb().books.add(book);
    return book;
  } catch (error) {
    throw storageError(error);
  }
}

export async function importPdfBook(input: {
  file: File;
  title?: string;
  author?: string;
  description?: string;
  coverFile?: File | null;
}) {
  validatePdfFile(input.file);
  if (input.coverFile) validateCoverFile(input.coverFile);
  const now = Date.now();
  const fallbackTitle = input.file.name.replace(/\.pdf$/i, "").trim() || "Tài liệu PDF";
  const book: LibraryBook = {
    id: uuidv4(),
    title: input.title?.trim() || fallbackTitle,
    author: input.author?.trim() ?? "",
    description: input.description?.trim() ?? "",
    kind: "pdf",
    coverBlob: input.coverFile ?? null,
    pdfBlob: input.file,
    pdfFileName: input.file.name,
    pdfMimeType: input.file.type || "application/pdf",
    lastPage: 1,
    pinnedPage: null,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await currentDb().books.add(book);
    return book;
  } catch (error) {
    throw storageError(error);
  }
}

export async function updateLibraryBookCover(bookId: string, file: File | null) {
  if (file) validateCoverFile(file);
  try {
    await currentDb().books.update(bookId, { coverBlob: file, updatedAt: Date.now() });
  } catch (error) {
    throw storageError(error);
  }
}

export async function updateLibraryBookInfo(bookId: string, patch: Pick<LibraryBook, "title" | "author" | "description">) {
  const title = patch.title.trim();
  if (!title) throw new Error("Tên sách không được để trống.");
  await currentDb().books.update(bookId, {
    title,
    author: patch.author.trim(),
    description: patch.description.trim(),
    updatedAt: Date.now(),
  });
}

export async function deleteLibraryBook(bookId: string) {
  await currentDb().books.delete(bookId);
}

export async function saveLibraryReadingPosition(bookId: string, page: number) {
  const nextPage = normalizePage(page);
  await currentDb().books.update(bookId, { lastPage: nextPage, updatedAt: Date.now() });
  return nextPage;
}

export async function pinLibraryReadingPage(bookId: string, page: number | null) {
  const pinnedPage = page === null ? null : normalizePage(page);
  await currentDb().books.update(bookId, { pinnedPage, updatedAt: Date.now() });
  return pinnedPage;
}

export async function listLibraryProjectMeta() {
  return currentDb().projectMeta.toArray();
}

export async function setLibraryProjectCover(projectId: string, file: File | null) {
  if (file) validateCoverFile(file);
  const id = `project:${projectId}`;
  const next: LibraryProjectMeta = { id, projectId, coverBlob: file, updatedAt: Date.now() };
  try {
    await currentDb().projectMeta.put(next);
    return next;
  } catch (error) {
    throw storageError(error);
  }
}
