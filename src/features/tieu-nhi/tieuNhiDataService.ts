import Dexie, { type Table } from "dexie";
import { v4 as uuid } from "uuid";
import { db, getActiveWorkspaceUserId } from "../../database/db";
import type { ProjectKind } from "../../types/entities";
import { createNote, listActiveNotes, softDeleteNote, stripDiacritics, updateNote } from "../notes/notesService";
import {
  createChapter,
  createProject,
  listChapters,
  listProjects,
  listSections,
  softDeleteChapter,
  updateChapter,
  updateProject,
} from "../projects/projectsService";
import {
  getLibraryBook,
  listLibraryBooks,
  type LibraryBook,
} from "../library/libraryService";
import { loadPdfRuntime } from "../library/pdfRuntime";

export type TieuNhiScope = "notes" | "projects" | "library" | "memory";
export type TieuNhiModeName = "local" | "online";

export interface TieuNhiStoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode: TieuNhiModeName;
  createdAt: number;
}

export interface TieuNhiMemory {
  id: string;
  label: string;
  value: string;
  createdAt: number;
  updatedAt: number;
}

export interface TieuNhiDocumentChunk {
  id: string;
  sourceType: "library-pdf" | "attachment";
  sourceId: string;
  title: string;
  text: string;
  chunkIndex: number;
  updatedAt: number;
}

export interface TieuNhiIndexMeta {
  id: string;
  sourceType: TieuNhiDocumentChunk["sourceType"];
  sourceId: string;
  title: string;
  fileName: string;
  mimeType: string;
  size: number;
  chunkCount: number;
  indexedAt: number;
}

export interface TieuNhiSetting {
  id: string;
  value: unknown;
  updatedAt: number;
}

class TieuNhiWorkspaceDB extends Dexie {
  messages!: Table<TieuNhiStoredMessage, string>;
  memories!: Table<TieuNhiMemory, string>;
  chunks!: Table<TieuNhiDocumentChunk, string>;
  indexes!: Table<TieuNhiIndexMeta, string>;
  settings!: Table<TieuNhiSetting, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      messages: "id, role, mode, createdAt",
      memories: "id, label, updatedAt",
      chunks: "id, sourceType, sourceId, [sourceType+sourceId], chunkIndex, updatedAt",
      indexes: "id, sourceType, sourceId, [sourceType+sourceId], indexedAt",
      settings: "id, updatedAt",
    });
  }
}

const aiDbInstances = new Map<string, TieuNhiWorkspaceDB>();

export function tieuNhiDatabaseNameForWorkspace(userId: string | null) {
  return `huyen-but-cac-tieu-nhi-v1-${userId ? encodeURIComponent(userId) : "guest"}`;
}

function aiDatabaseName() {
  return tieuNhiDatabaseNameForWorkspace(getActiveWorkspaceUserId() ?? null);
}

function aiDb() {
  const name = aiDatabaseName();
  let instance = aiDbInstances.get(name);
  if (!instance) {
    instance = new TieuNhiWorkspaceDB(name);
    aiDbInstances.set(name, instance);
  }
  return instance;
}

function compactText(input: string) {
  return input.replace(/\r/g, "").replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function safeText(input: unknown, max = 60_000) {
  return compactText(String(input ?? "")).slice(0, max);
}

function scoreText(query: string, title: string, text: string) {
  const q = stripDiacritics(query).trim();
  if (!q) return 0;
  const stopwords = new Set(["va","la","cua","cho","voi","trong","tren","duoi","mot","nhung","cac","toi","ban","nay","kia","hay","giup","ve","tu","den","dang","duoc","co","khong","the","them","tim","doc","noi","dung","what","the","and","for","with","from","this","that","please"]);
  const terms = [...new Set(q.split(/\s+/).filter((term) => term.length >= 2 && !stopwords.has(term)))];
  if (!terms.length) return 0;
  const normalizedTitle = stripDiacritics(title);
  const normalizedText = stripDiacritics(text);
  let score = normalizedText.includes(q) ? 18 : 0;
  if (normalizedTitle.includes(q)) score += 28;
  for (const term of terms) {
    if (normalizedTitle.includes(term)) score += 7;
    const matches = normalizedText.split(term).length - 1;
    score += Math.min(matches, 6) * 1.4;
  }
  return score;
}

function excerptAroundQuery(query: string, text: string, max = 1_800) {
  const cleaned = compactText(text);
  if (cleaned.length <= max) return cleaned;
  const q = stripDiacritics(query).trim();
  const normalized = stripDiacritics(cleaned);
  const terms = q.split(/\s+/).filter((term) => term.length >= 2);
  let index = q ? normalized.indexOf(q) : -1;
  if (index < 0) {
    for (const term of terms) {
      index = normalized.indexOf(term);
      if (index >= 0) break;
    }
  }
  if (index < 0) return `${cleaned.slice(0, max)}…`;
  const start = Math.max(0, index - Math.floor(max * 0.35));
  const end = Math.min(cleaned.length, start + max);
  return `${start > 0 ? "…" : ""}${cleaned.slice(start, end)}${end < cleaned.length ? "…" : ""}`;
}

export interface WorkspaceContextHit {
  source: TieuNhiScope | "attachment";
  sourceId: string;
  title: string;
  text: string;
  score: number;
  metadata?: Record<string, string | number | boolean | null>;
}

export async function saveTieuNhiMessage(message: Omit<TieuNhiStoredMessage, "id" | "createdAt"> & { id?: string; createdAt?: number }) {
  const row: TieuNhiStoredMessage = {
    id: message.id ?? uuid(),
    role: message.role,
    content: safeText(message.content, 40_000),
    mode: message.mode,
    createdAt: message.createdAt ?? Date.now(),
  };
  await aiDb().messages.put(row);
  return row;
}

export async function loadTieuNhiMessages(limit = 40) {
  const rows = await aiDb().messages.orderBy("createdAt").reverse().limit(limit).toArray();
  return rows.reverse();
}

export async function clearTieuNhiMessages() {
  await aiDb().messages.clear();
}

export async function listTieuNhiMemories() {
  return aiDb().memories.orderBy("updatedAt").reverse().toArray();
}

export async function rememberTieuNhi(label: string, value: string) {
  const normalizedLabel = safeText(label, 120) || "Ghi nhớ";
  const normalizedValue = safeText(value, 2_000);
  if (!normalizedValue) throw new Error("Nội dung ghi nhớ đang trống.");
  const existing = await aiDb().memories.filter((item) => stripDiacritics(item.label) === stripDiacritics(normalizedLabel)).first();
  const now = Date.now();
  const row: TieuNhiMemory = existing
    ? { ...existing, label: normalizedLabel, value: normalizedValue, updatedAt: now }
    : { id: uuid(), label: normalizedLabel, value: normalizedValue, createdAt: now, updatedAt: now };
  await aiDb().memories.put(row);
  return row;
}

export async function forgetTieuNhiMemory(id: string) {
  await aiDb().memories.delete(id);
}

export async function getTieuNhiSetting<T>(id: string, fallback: T): Promise<T> {
  const row = await aiDb().settings.get(id);
  return row ? row.value as T : fallback;
}

export async function setTieuNhiSetting(id: string, value: unknown) {
  await aiDb().settings.put({ id, value, updatedAt: Date.now() });
}

function chunkText(text: string, target = 1_500, overlap = 220) {
  const cleaned = compactText(text);
  if (!cleaned) return [];
  const chunks: string[] = [];
  let cursor = 0;
  while (cursor < cleaned.length) {
    let end = Math.min(cleaned.length, cursor + target);
    if (end < cleaned.length) {
      const paragraph = cleaned.lastIndexOf("\n", end);
      const sentence = Math.max(cleaned.lastIndexOf(". ", end), cleaned.lastIndexOf("? ", end), cleaned.lastIndexOf("! ", end));
      const preferred = Math.max(paragraph, sentence);
      if (preferred > cursor + Math.floor(target * 0.55)) end = preferred + 1;
    }
    const chunk = cleaned.slice(cursor, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= cleaned.length) break;
    cursor = Math.max(cursor + 1, end - overlap);
  }
  return chunks;
}

async function replaceIndexedSource(input: {
  sourceType: TieuNhiDocumentChunk["sourceType"];
  sourceId: string;
  title: string;
  fileName: string;
  mimeType: string;
  size: number;
  text: string;
}) {
  const database = aiDb();
  const chunks = chunkText(input.text);
  const now = Date.now();
  await database.transaction("rw", database.chunks, database.indexes, async () => {
    await database.chunks.where("[sourceType+sourceId]").equals([input.sourceType, input.sourceId]).delete();
    if (chunks.length) {
      await database.chunks.bulkPut(chunks.map((text, chunkIndex) => ({
        id: `${input.sourceType}:${input.sourceId}:${chunkIndex}`,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        title: input.title,
        text,
        chunkIndex,
        updatedAt: now,
      })));
    }
    await database.indexes.put({
      id: `${input.sourceType}:${input.sourceId}`,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      title: input.title,
      fileName: input.fileName,
      mimeType: input.mimeType,
      size: input.size,
      chunkCount: chunks.length,
      indexedAt: now,
    });
  });
  return chunks.length;
}

const JSZIP_URL = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";

async function extractPdfText(blob: Blob, onProgress?: (done: number, total: number) => void) {
  const pdfjs = await loadPdfRuntime();
  const data = await blob.arrayBuffer();
  const document = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items.map((item: { str?: string }) => item.str ?? "").join(" ");
      pages.push(`[Trang ${pageNumber}]\n${text}`);
      onProgress?.(pageNumber, document.numPages);
    }
    return pages.join("\n\n");
  } finally {
    await document.destroy?.();
  }
}

function xmlText(xml: string) {
  const parsed = new DOMParser().parseFromString(xml, "application/xml");
  if (parsed.querySelector("parsererror")) return "";
  return compactText(parsed.documentElement.textContent ?? "");
}

async function loadZip(file: Blob) {
  const module = await import(/* @vite-ignore */ JSZIP_URL) as any;
  const JSZip = module.default ?? module;
  return JSZip.loadAsync(await file.arrayBuffer());
}

async function extractDocxText(file: Blob) {
  const zip = await loadZip(file);
  const documentXml = await zip.file("word/document.xml")?.async("string");
  if (!documentXml) throw new Error("DOCX không có word/document.xml hoặc tệp đã hỏng.");
  return xmlText(documentXml.replace(/<w:tab[^>]*\/>/g, "\t").replace(/<w:br[^>]*\/>/g, "\n").replace(/<\/w:p>/g, "\n"));
}

function resolveZipPath(baseFile: string, relative: string) {
  const base = baseFile.split("/");
  base.pop();
  for (const part of relative.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") base.pop();
    else base.push(part);
  }
  return base.join("/");
}

async function extractEpubText(file: Blob, onProgress?: (done: number, total: number) => void) {
  const zip = await loadZip(file);
  const containerXml = await zip.file("META-INF/container.xml")?.async("string");
  if (!containerXml) throw new Error("EPUB thiếu META-INF/container.xml.");
  const container = new DOMParser().parseFromString(containerXml, "application/xml");
  const opfPath = container.querySelector("rootfile")?.getAttribute("full-path");
  if (!opfPath) throw new Error("Không tìm thấy manifest EPUB.");
  const opfXml = await zip.file(opfPath)?.async("string");
  if (!opfXml) throw new Error("Không đọc được manifest EPUB.");
  const opf = new DOMParser().parseFromString(opfXml, "application/xml");
  const manifest = new Map<string, string>();
  opf.querySelectorAll("manifest > item").forEach((item) => {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    if (id && href) manifest.set(id, resolveZipPath(opfPath, href));
  });
  const paths = [...opf.querySelectorAll("spine > itemref")]
    .map((item) => manifest.get(item.getAttribute("idref") ?? ""))
    .filter((path): path is string => Boolean(path));
  const parts: string[] = [];
  for (let index = 0; index < paths.length; index += 1) {
    const markup = await zip.file(paths[index])?.async("string");
    if (markup) parts.push(xmlText(markup.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n")));
    onProgress?.(index + 1, paths.length);
  }
  return parts.filter(Boolean).join("\n\n");
}

export async function extractSupportedFileText(file: File, onProgress?: (done: number, total: number) => void) {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return extractPdfText(file, onProgress);
  if (name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return extractDocxText(file);
  if (name.endsWith(".epub") || file.type === "application/epub+zip") return extractEpubText(file, onProgress);
  if (file.type.startsWith("text/") || /\.(txt|md|markdown|csv|json|xml|html|htm)$/i.test(name)) return compactText(await file.text());
  throw new Error("Tiểu Nhị hiện hỗ trợ PDF, DOCX, EPUB, TXT, Markdown, CSV, JSON, XML và HTML cho chế độ đọc tài liệu.");
}

export async function indexLibraryPdf(bookId: string, onProgress?: (done: number, total: number) => void) {
  const book = await getLibraryBook(bookId);
  if (!book || !book.pdfBlob) throw new Error("Không tìm thấy PDF trong Tàng Thư.");
  const text = await extractPdfText(book.pdfBlob, onProgress);
  if (!text.trim()) throw new Error("PDF không có lớp văn bản để đọc. Với PDF scan, hãy dùng chế độ Online và gửi ảnh/trang cần phân tích.");
  return replaceIndexedSource({
    sourceType: "library-pdf",
    sourceId: book.id,
    title: book.title,
    fileName: book.pdfFileName ?? `${book.title}.pdf`,
    mimeType: book.pdfMimeType ?? "application/pdf",
    size: book.pdfBlob.size,
    text,
  });
}

export async function indexAttachment(file: File, onProgress?: (done: number, total: number) => void) {
  if (file.size > 150 * 1024 * 1024) throw new Error("Tệp vượt quá 150 MB.");
  const text = await extractSupportedFileText(file, onProgress);
  if (!text.trim()) throw new Error("Không trích xuất được nội dung chữ từ tệp.");
  const sourceId = `${file.name}:${file.size}:${file.lastModified}`;
  const chunkCount = await replaceIndexedSource({
    sourceType: "attachment",
    sourceId,
    title: file.name,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    text,
  });
  return { sourceId, chunkCount };
}

async function cleanupOrphanLibraryIndexes() {
  const database = aiDb();
  const books = await listLibraryBooks();
  const validIds = new Set(books.filter((book) => Boolean(book.pdfBlob)).map((book) => book.id));
  const indexes = await database.indexes.where("sourceType").equals("library-pdf").toArray();
  const stale = indexes.filter((index) => !validIds.has(index.sourceId));
  if (!stale.length) return;
  await database.transaction("rw", database.chunks, database.indexes, async () => {
    for (const index of stale) {
      await database.chunks.where("[sourceType+sourceId]").equals(["library-pdf", index.sourceId]).delete();
      await database.indexes.delete(index.id);
    }
  });
}

export async function listTieuNhiIndexes() {
  await cleanupOrphanLibraryIndexes();
  return aiDb().indexes.orderBy("indexedAt").reverse().toArray();
}

export async function removeTieuNhiIndex(sourceType: TieuNhiDocumentChunk["sourceType"], sourceId: string) {
  const database = aiDb();
  await database.transaction("rw", database.chunks, database.indexes, async () => {
    await database.chunks.where("[sourceType+sourceId]").equals([sourceType, sourceId]).delete();
    await database.indexes.delete(`${sourceType}:${sourceId}`);
  });
}

async function searchIndexedChunks(query: string, limit: number) {
  await cleanupOrphanLibraryIndexes();
  const candidates: WorkspaceContextHit[] = [];
  // Chỉ tìm PDF thuộc Tàng Thư. Tệp đính kèm cũ không được tự động trở thành
  // nguồn RAG lâu dài; chúng chỉ được dùng khi người dùng đính kèm trong lượt chat.
  await aiDb().chunks.where("sourceType").equals("library-pdf").each((chunk) => {
    const score = scoreText(query, chunk.title, chunk.text);
    if (score <= 0) return;
    candidates.push({
      source: "library",
      sourceId: chunk.sourceId,
      title: chunk.title,
      text: excerptAroundQuery(query, chunk.text),
      score,
      metadata: { chunk: chunk.chunkIndex + 1 },
    });
    // Giữ bộ nhớ ổn định với thư viện rất lớn thay vì toArray() toàn bộ nội dung.
    if (candidates.length > Math.max(40, limit * 8)) {
      candidates.sort((a, b) => b.score - a.score);
      candidates.length = Math.max(20, limit * 4);
    }
  });
  return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function searchAttachmentContext(query: string, sourceIds: string[], limit = 8): Promise<WorkspaceContextHit[]> {
  if (!sourceIds.length) return [];
  const uniqueIds = [...new Set(sourceIds)];
  const groups = await Promise.all(uniqueIds.map((sourceId) =>
    aiDb().chunks.where("[sourceType+sourceId]").equals(["attachment", sourceId]).toArray(),
  ));
  return groups.flat()
    .map((chunk) => ({
      source: "attachment" as const,
      sourceId: chunk.sourceId,
      title: chunk.title,
      text: excerptAroundQuery(query, chunk.text),
      score: scoreText(query, chunk.title, chunk.text),
      metadata: { chunk: chunk.chunkIndex + 1 },
    }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

async function noteContext(query: string) {
  const notes = await listActiveNotes();
  return notes.map<WorkspaceContextHit>((note) => ({
    source: "notes",
    sourceId: note.id,
    title: note.title,
    text: excerptAroundQuery(query, note.contentText),
    score: scoreText(query, note.title, note.contentText) + (note.pinned ? 3 : 0),
    metadata: { locked: note.locked, pinned: note.pinned },
  }));
}

async function projectContext(query: string) {
  const projects = await listProjects();
  const hits: WorkspaceContextHit[] = [];
  for (const project of projects) {
    const chapters = await listChapters(project.id);
    const sections = await listSections(project.id);
    const sectionNames = new Map(sections.map((section) => [section.id, section.title]));
    hits.push({
      source: "projects",
      sourceId: project.id,
      title: project.title,
      text: excerptAroundQuery(query, project.description),
      score: scoreText(query, project.title, project.description),
      metadata: { kind: project.kind, status: project.status },
    });
    for (const chapter of chapters) {
      hits.push({
        source: "projects",
        sourceId: chapter.id,
        title: `${project.title} · ${sectionNames.get(chapter.sectionId ?? "") ? `${sectionNames.get(chapter.sectionId ?? "")} · ` : ""}${chapter.title}`,
        text: excerptAroundQuery(query, `${chapter.synopsis}\n${chapter.contentText}`),
        score: scoreText(query, `${project.title} ${chapter.title}`, `${chapter.synopsis}\n${chapter.contentText}`),
        metadata: { projectId: project.id, wordCount: chapter.wordCount },
      });
    }
  }
  const [characters, locations, lore, timeline] = await Promise.all([
    db.storyCharacters.filter((item) => item.deletedAt === null).toArray(),
    db.storyLocations.filter((item) => item.deletedAt === null).toArray(),
    db.storyLoreEntries.filter((item) => item.deletedAt === null).toArray(),
    db.storyTimelineEvents.filter((item) => item.deletedAt === null).toArray(),
  ]);
  const projectNames = new Map(projects.map((project) => [project.id, project.title]));
  for (const item of characters) {
    const text = `${item.aliasNames}\n${item.role}\n${item.realm}\n${item.appearance}\n${item.personality}\n${item.relationships}\n${item.notes}`;
    hits.push({ source: "projects", sourceId: item.id, title: `${projectNames.get(item.projectId) ?? "Dự án"} · Nhân vật ${item.name}`, text: excerptAroundQuery(query, text), score: scoreText(query, item.name, text) + 2 });
  }
  for (const item of locations) {
    hits.push({ source: "projects", sourceId: item.id, title: `${projectNames.get(item.projectId) ?? "Dự án"} · ${item.name}`, text: excerptAroundQuery(query, item.description), score: scoreText(query, item.name, item.description) + 2 });
  }
  for (const item of lore) {
    hits.push({ source: "projects", sourceId: item.id, title: `${projectNames.get(item.projectId) ?? "Dự án"} · Thuật ngữ ${item.term}`, text: excerptAroundQuery(query, item.definition), score: scoreText(query, item.term, item.definition) + 2 });
  }
  for (const item of timeline) {
    hits.push({ source: "projects", sourceId: item.id, title: `${projectNames.get(item.projectId) ?? "Dự án"} · Mốc ${item.title}`, text: excerptAroundQuery(query, item.summary), score: scoreText(query, item.title, item.summary) + 2 });
  }
  return hits;
}

async function memoryContext(query: string) {
  const memories = await listTieuNhiMemories();
  return memories.map<WorkspaceContextHit>((memory) => ({
    source: "memory",
    sourceId: memory.id,
    title: memory.label,
    text: memory.value,
    score: scoreText(query, memory.label, memory.value) + 1,
  }));
}

export async function searchWorkspaceContext(query: string, scopes: TieuNhiScope[], limit = 10) {
  const groups = await Promise.all([
    scopes.includes("notes") ? noteContext(query) : Promise.resolve([]),
    scopes.includes("projects") ? projectContext(query) : Promise.resolve([]),
    scopes.includes("library") ? searchIndexedChunks(query, limit) : Promise.resolve([]),
    scopes.includes("memory") ? memoryContext(query) : Promise.resolve([]),
  ]);
  const hits = groups.flat().filter((hit) => hit.text || hit.title);
  const hasQuery = Boolean(query.trim());
  return hits
    .filter((hit) => !hasQuery || hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function listWorkspaceOverview(scopes: TieuNhiScope[]) {
  const result: Record<string, unknown> = {};
  if (scopes.includes("notes")) {
    const notes = await listActiveNotes();
    result.notes = notes.slice(0, 80).map((note) => ({ id: note.id, title: note.title, locked: note.locked, pinned: note.pinned, updatedAt: note.updatedAt }));
  }
  if (scopes.includes("projects")) {
    const projects = await listProjects();
    result.projects = projects.map((project) => ({ id: project.id, title: project.title, kind: project.kind, status: project.status, updatedAt: project.updatedAt }));
  }
  if (scopes.includes("library")) {
    const [books, indexes] = await Promise.all([listLibraryBooks(), listTieuNhiIndexes()]);
    const indexedIds = new Set(indexes.filter((item) => item.sourceType === "library-pdf").map((item) => item.sourceId));
    result.library = books.map((book) => ({ id: book.id, title: book.title, author: book.author, kind: book.kind, indexedForAi: indexedIds.has(book.id), lastPage: book.lastPage, pinnedPage: book.pinnedPage }));
  }
  if (scopes.includes("memory")) result.memory = await listTieuNhiMemories();
  return result;
}

export async function readNoteByTitle(title: string) {
  const normalized = stripDiacritics(title.trim());
  const notes = await listActiveNotes();
  const note = notes.find((item) => stripDiacritics(item.title) === normalized)
    ?? notes.find((item) => stripDiacritics(item.title).includes(normalized));
  if (!note) throw new Error(`Không tìm thấy ghi chú “${title}”.`);
  if (note.locked && !note.contentText) throw new Error("Ghi chú đang khóa. Hãy mở khóa ghi chú trong ứng dụng trước.");
  return { id: note.id, title: note.title, content: safeText(note.contentText, 30_000), tags: note.tags, pinned: note.pinned, updatedAt: note.updatedAt };
}

export async function readProjectByTitle(title: string) {
  const normalized = stripDiacritics(title.trim());
  const projects = await listProjects();
  const project = projects.find((item) => stripDiacritics(item.title) === normalized)
    ?? projects.find((item) => stripDiacritics(item.title).includes(normalized));
  if (!project) throw new Error(`Không tìm thấy dự án “${title}”.`);
  const [sections, chapters] = await Promise.all([listSections(project.id), listChapters(project.id)]);
  return {
    project: { id: project.id, title: project.title, description: project.description, kind: project.kind, status: project.status },
    sections: sections.map((section) => ({ id: section.id, title: section.title, order: section.order })),
    chapters: chapters.map((chapter) => ({ id: chapter.id, title: chapter.title, sectionId: chapter.sectionId, synopsis: chapter.synopsis, content: safeText(chapter.contentText, 12_000), wordCount: chapter.wordCount, order: chapter.order })),
  };
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));
}

function textToHtml(text: string) {
  return compactText(text).split(/\n{2,}/).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("");
}

export type TieuNhiWriteAction =
  | { id: string; type: "create_note"; title: string; content: string }
  | { id: string; type: "update_note"; noteTitle: string; content: string; mode: "append" | "replace" }
  | { id: string; type: "delete_note"; noteTitle: string }
  | { id: string; type: "create_project"; title: string; kind: ProjectKind; description?: string }
  | { id: string; type: "create_chapter"; projectTitle: string; title: string; content: string; synopsis?: string }
  | { id: string; type: "update_chapter"; projectTitle: string; chapterTitle: string; content: string; mode: "append" | "replace"; synopsis?: string }
  | { id: string; type: "delete_chapter"; projectTitle: string; chapterTitle: string }
  | { id: string; type: "remember"; label: string; value: string }
  | { id: string; type: "forget_memory"; memoryId: string };

type TieuNhiWriteActionInput = TieuNhiWriteAction extends infer T ? T extends { id: string } ? Omit<T, "id"> : never : never;

export function makeWriteAction(action: TieuNhiWriteActionInput): TieuNhiWriteAction {
  return { ...action, id: uuid() } as TieuNhiWriteAction;
}

function findProjectByTitle(projects: Awaited<ReturnType<typeof listProjects>>, title: string) {
  const normalized = stripDiacritics(title.trim());
  return projects.find((item) => stripDiacritics(item.title) === normalized)
    ?? projects.find((item) => stripDiacritics(item.title).includes(normalized));
}

export async function executeTieuNhiWriteAction(action: TieuNhiWriteAction) {
  if (action.type === "create_note") {
    const note = await createNote({ title: action.title });
    if (action.content.trim()) await updateNote(note.id, { contentHtml: textToHtml(action.content) });
    return `Đã tạo ghi chú “${note.title}”.`;
  }
  if (action.type === "update_note") {
    const note = await readNoteByTitle(action.noteTitle);
    const nextText = action.mode === "append" && note.content ? `${note.content}\n\n${action.content}` : action.content;
    await updateNote(note.id, { contentHtml: textToHtml(nextText) });
    return `Đã ${action.mode === "append" ? "thêm nội dung vào" : "cập nhật"} ghi chú “${note.title}”.`;
  }
  if (action.type === "delete_note") {
    const note = await readNoteByTitle(action.noteTitle);
    await softDeleteNote(note.id);
    return `Đã chuyển ghi chú “${note.title}” vào thùng rác.`;
  }
  if (action.type === "create_project") {
    const project = await createProject({ title: action.title.trim() || "Dự án mới", kind: action.kind });
    if (action.description?.trim()) await updateProject(project.id, { description: action.description.trim() });
    return `Đã tạo dự án “${project.title}”.`;
  }
  if (action.type === "create_chapter") {
    const projects = await listProjects();
    const project = findProjectByTitle(projects, action.projectTitle);
    if (!project) throw new Error(`Không tìm thấy dự án “${action.projectTitle}”.`);
    const chapter = await createChapter({ projectId: project.id, sectionId: null, title: action.title.trim() || "Chương mới" });
    const patch: { contentHtml?: string; synopsis?: string } = {};
    if (action.content.trim()) patch.contentHtml = textToHtml(action.content);
    if (action.synopsis?.trim()) patch.synopsis = action.synopsis.trim();
    if (Object.keys(patch).length) await updateChapter(chapter.id, patch);
    return `Đã tạo chương “${chapter.title}” trong “${project.title}”.`;
  }
  if (action.type === "update_chapter" || action.type === "delete_chapter") {
    const projects = await listProjects();
    const project = findProjectByTitle(projects, action.projectTitle);
    if (!project) throw new Error(`Không tìm thấy dự án “${action.projectTitle}”.`);
    const chapters = await listChapters(project.id);
    const normalized = stripDiacritics(action.chapterTitle.trim());
    const chapter = chapters.find((item) => stripDiacritics(item.title) === normalized)
      ?? chapters.find((item) => stripDiacritics(item.title).includes(normalized));
    if (!chapter) throw new Error(`Không tìm thấy chương “${action.chapterTitle}”.`);
    if (action.type === "delete_chapter") {
      await softDeleteChapter(chapter.id);
      return `Đã chuyển chương “${chapter.title}” ra khỏi bản thảo đang hoạt động.`;
    }
    const nextText = action.mode === "append" && chapter.contentText ? `${chapter.contentText}\n\n${action.content}` : action.content;
    await updateChapter(chapter.id, { contentHtml: textToHtml(nextText), synopsis: action.synopsis ?? chapter.synopsis });
    return `Đã ${action.mode === "append" ? "viết thêm vào" : "cập nhật"} chương “${chapter.title}”.`;
  }
  if (action.type === "remember") {
    const memory = await rememberTieuNhi(action.label, action.value);
    return `Đã ghi nhớ “${memory.label}”.`;
  }
  if (action.type === "forget_memory") {
    await forgetTieuNhiMemory(action.memoryId);
    return "Đã xóa mục ghi nhớ.";
  }
  const exhaustive: never = action;
  return exhaustive;
}

export function describeTieuNhiAction(action: TieuNhiWriteAction) {
  switch (action.type) {
    case "create_note": return `Tạo ghi chú “${action.title}”${action.content ? " kèm nội dung" : ""}`;
    case "update_note": return `${action.mode === "append" ? "Thêm vào" : "Ghi đè"} ghi chú “${action.noteTitle}”`;
    case "delete_note": return `Chuyển ghi chú “${action.noteTitle}” vào thùng rác`;
    case "create_project": return `Tạo dự án “${action.title}” (${action.kind})`;
    case "create_chapter": return `Tạo chương “${action.title}” trong “${action.projectTitle}”`;
    case "update_chapter": return `${action.mode === "append" ? "Viết thêm vào" : "Ghi đè"} chương “${action.chapterTitle}” của “${action.projectTitle}”`;
    case "delete_chapter": return `Xóa mềm chương “${action.chapterTitle}” khỏi “${action.projectTitle}”`;
    case "remember": return `Ghi nhớ “${action.label}”: ${action.value}`;
    case "forget_memory": return "Xóa một mục ghi nhớ";
  }
}

export function libraryBookSummary(book: LibraryBook) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    kind: book.kind,
    description: safeText(book.description, 1_500),
    lastPage: book.lastPage,
    pinnedPage: book.pinnedPage,
    hasPdf: Boolean(book.pdfBlob),
  };
}
