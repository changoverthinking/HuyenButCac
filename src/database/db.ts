import Dexie, { type Table, type Transaction } from "dexie";
import type {
  Folder,
  Note,
  Tag,
  ThemePreference,
  Project,
  ProjectSection,
  ProjectChapter,
  ProjectTask,
  ProjectMilestone,
  MindMap, MindMapNode, MindMapEdge, Whiteboard, WhiteboardObject, MusicTrack, CustomBackground, CanvasStroke,
  StoryCharacter, StoryLocation, StoryLoreEntry, StoryTimelineEvent,
} from "../types/entities";

const LEGACY_DB_NAME = "huyen-but-cac";
const WORKSPACE_PREFIX = "huyen-but-cac-workspace-";
const BOOTSTRAP_DB_NAME = `${WORKSPACE_PREFIX}bootstrap`;
const INTERNAL_SYNC_TX = Symbol("hbc-internal-sync-transaction");

type InternalTransaction = Transaction & { [INTERNAL_SYNC_TX]?: boolean };

function isInternalSyncWrite() {
  return Boolean((Dexie.currentTransaction as InternalTransaction | null)?.[INTERNAL_SYNC_TX]);
}

async function runInternalTransaction<T>(database: HuyenButDB, tables: Table[], operation: () => Promise<T>): Promise<T> {
  return database.transaction("rw", tables, async () => {
    const tx = Dexie.currentTransaction as InternalTransaction | null;
    if (tx) tx[INTERNAL_SYNC_TX] = true;
    return operation();
  });
}

/**
 * Chạy ghi dữ liệu nội bộ (pull cloud / migration) mà không biến bản ghi thành pending.
 * Cờ nằm trên transaction Dexie hiện tại nên thao tác người dùng chạy song song không bị nhầm
 * thành ghi nội bộ như cách dùng một boolean toàn cục.
 */
export async function asInternalSyncWrite<T>(operation: () => Promise<T>): Promise<T> {
  const tx = Dexie.currentTransaction as InternalTransaction | null;
  if (!tx) return operation();
  const previous = Boolean(tx[INTERNAL_SYNC_TX]);
  tx[INTERNAL_SYNC_TX] = true;
  try {
    return await operation();
  } finally {
    tx[INTERNAL_SYNC_TX] = previous;
  }
}

export class HuyenButDB extends Dexie {
  notes!: Table<Note, string>;
  folders!: Table<Folder, string>;
  tags!: Table<Tag, string>;
  themePreferences!: Table<ThemePreference, string>;
  projects!: Table<Project, string>;
  projectSections!: Table<ProjectSection, string>;
  projectChapters!: Table<ProjectChapter, string>;
  projectTasks!: Table<ProjectTask, string>;
  projectMilestones!: Table<ProjectMilestone, string>;
  mindMaps!: Table<MindMap, string>;
  mindMapNodes!: Table<MindMapNode, string>;
  mindMapEdges!: Table<MindMapEdge, string>;
  whiteboards!: Table<Whiteboard, string>;
  whiteboardObjects!: Table<WhiteboardObject, string>;
  musicTracks!: Table<MusicTrack, string>;
  customBackgrounds!: Table<CustomBackground, string>;
  mindMapStrokes!: Table<CanvasStroke, string>;
  whiteboardStrokes!: Table<CanvasStroke, string>;
  storyCharacters!: Table<StoryCharacter, string>;
  storyLocations!: Table<StoryLocation, string>;
  storyLoreEntries!: Table<StoryLoreEntry, string>;
  storyTimelineEvents!: Table<StoryTimelineEvent, string>;

  constructor(databaseName = LEGACY_DB_NAME) {
    super(databaseName);

    // v1: schema nền tảng cho Ghi chú cơ bản.
    this.version(1).stores({
      notes:
        "id, folderId, pinned, favorite, archived, locked, deletedAt, updatedAt, *tags",
      folders: "id, parentId, deletedAt, order",
      tags: "id, name, deletedAt",
      themePreferences: "id",
    });

    // v2: Giai đoạn 4 — Viết dự án. KHÔNG sửa version 1 ở trên, chỉ thêm bảng mới.
    this.version(2).stores({
      notes:
        "id, folderId, pinned, favorite, archived, locked, deletedAt, updatedAt, *tags",
      folders: "id, parentId, deletedAt, order",
      tags: "id, name, deletedAt",
      themePreferences: "id",
      projects: "id, status, kind, archived, deletedAt, updatedAt",
      projectSections: "id, projectId, order, deletedAt",
      projectChapters: "id, projectId, sectionId, order, deletedAt",
      projectTasks: "id, projectId, status, order, deletedAt",
      projectMilestones: "id, projectId, done, deletedAt",
    });
    this.version(3).stores({
      notes: "id, folderId, pinned, favorite, archived, locked, deletedAt, updatedAt, *tags",
      folders: "id, parentId, deletedAt, order", tags: "id, name, deletedAt", themePreferences: "id",
      projects: "id, status, kind, archived, deletedAt, updatedAt",
      projectSections: "id, projectId, order, deletedAt", projectChapters: "id, projectId, sectionId, order, deletedAt",
      projectTasks: "id, projectId, status, order, deletedAt", projectMilestones: "id, projectId, done, deletedAt",
      mindMaps: "id, deletedAt, updatedAt", mindMapNodes: "id, mapId, parentId, deletedAt", mindMapEdges: "id, mapId, sourceId, targetId, deletedAt",
      whiteboards: "id, deletedAt, updatedAt", whiteboardObjects: "id, boardId, kind, deletedAt",
    });
    this.version(4).stores({
      notes: "id, folderId, pinned, favorite, archived, locked, deletedAt, updatedAt, *tags",
      folders: "id, parentId, deletedAt, order", tags: "id, name, deletedAt", themePreferences: "id",
      projects: "id, status, kind, archived, deletedAt, updatedAt",
      projectSections: "id, projectId, order, deletedAt", projectChapters: "id, projectId, sectionId, order, deletedAt",
      projectTasks: "id, projectId, status, order, deletedAt", projectMilestones: "id, projectId, done, deletedAt",
      mindMaps: "id, deletedAt, updatedAt", mindMapNodes: "id, mapId, parentId, deletedAt", mindMapEdges: "id, mapId, sourceId, targetId, deletedAt",
      whiteboards: "id, deletedAt, updatedAt", whiteboardObjects: "id, boardId, kind, deletedAt",
      musicTracks: "id, deletedAt, createdAt", customBackgrounds: "id, deletedAt, updatedAt",
    });
    this.version(5).stores({
      notes: "id, folderId, pinned, favorite, archived, locked, deletedAt, updatedAt, *tags",
      folders: "id, parentId, deletedAt, order", tags: "id, name, deletedAt", themePreferences: "id",
      projects: "id, status, kind, archived, deletedAt, updatedAt",
      projectSections: "id, projectId, order, deletedAt", projectChapters: "id, projectId, sectionId, order, deletedAt",
      projectTasks: "id, projectId, status, order, deletedAt", projectMilestones: "id, projectId, done, deletedAt",
      mindMaps: "id, projectId, deletedAt, updatedAt", mindMapNodes: "id, mapId, parentId, linkId, deletedAt", mindMapEdges: "id, mapId, sourceId, targetId, deletedAt",
      whiteboards: "id, deletedAt, updatedAt", whiteboardObjects: "id, boardId, kind, deletedAt",
      musicTracks: "id, deletedAt, createdAt", customBackgrounds: "id, deletedAt, updatedAt",
      mindMapStrokes: "id, ownerId, deletedAt, updatedAt", whiteboardStrokes: "id, ownerId, deletedAt, updatedAt",
    });

    // v6: Thư Viện Truyện (Story Codex) — nhân vật, địa danh/cảnh giới, từ điển, dòng thời gian.
    this.version(6).stores({
      notes: "id, folderId, pinned, favorite, archived, locked, deletedAt, updatedAt, *tags",
      folders: "id, parentId, deletedAt, order", tags: "id, name, deletedAt", themePreferences: "id",
      projects: "id, status, kind, archived, deletedAt, updatedAt",
      projectSections: "id, projectId, order, deletedAt", projectChapters: "id, projectId, sectionId, order, deletedAt",
      projectTasks: "id, projectId, status, order, deletedAt", projectMilestones: "id, projectId, done, deletedAt",
      mindMaps: "id, projectId, deletedAt, updatedAt", mindMapNodes: "id, mapId, parentId, linkId, deletedAt", mindMapEdges: "id, mapId, sourceId, targetId, deletedAt",
      whiteboards: "id, deletedAt, updatedAt", whiteboardObjects: "id, boardId, kind, deletedAt",
      musicTracks: "id, deletedAt, createdAt", customBackgrounds: "id, deletedAt, updatedAt",
      mindMapStrokes: "id, ownerId, deletedAt, updatedAt", whiteboardStrokes: "id, ownerId, deletedAt, updatedAt",
      storyCharacters: "id, projectId, order, deletedAt",
      storyLocations: "id, projectId, kind, order, deletedAt",
      storyLoreEntries: "id, projectId, order, deletedAt",
      storyTimelineEvents: "id, projectId, chapterId, order, deletedAt",
    }).upgrade(async (tx) => {
      await tx.table("projectChapters").toCollection().modify((chapter) => {
        if (typeof chapter.synopsis !== "string") chapter.synopsis = "";
      });
    });

    // Mọi thay đổi do người dùng đều thành pending. Ghi cloud/migration đánh dấu transaction nội bộ.
    this.on("ready", () => {
      for (const table of this.tables) {
        if (table.name === "musicTracks" || table.name === "customBackgrounds") continue;
        table.hook("creating", (_key, value) => {
          if (!isInternalSyncWrite()) value.syncState = "pending";
        });
        table.hook("updating", () => isInternalSyncWrite() ? undefined : { syncState: "pending" });
      }
    });
  }
}

let activeWorkspaceUserId: string | null | undefined = undefined;
export let db = new HuyenButDB(BOOTSTRAP_DB_NAME);

function workspaceName(userId: string | null) {
  return `${WORKSPACE_PREFIX}${userId ?? "guest"}`;
}

function storageGet(key: string) {
  try { return typeof localStorage === "undefined" ? null : localStorage.getItem(key); }
  catch { return null; }
}

function storageSet(key: string, value: string) {
  try { if (typeof localStorage !== "undefined") localStorage.setItem(key, value); }
  catch { /* Safari private mode / storage denied: workspace still works in this session. */ }
}

async function migrateLegacyDataIfNeeded(target: HuyenButDB, userId: string | null) {
  const migrationDestination = storageGet("hbc-legacy-workspace-migrated-to");
  if (migrationDestination) return;
  if (!(await Dexie.exists(LEGACY_DB_NAME))) return;

  const previousOwner = storageGet("hbc-synced-data-owner");
  const eligible = userId === null ? previousOwner === null : previousOwner === null || previousOwner === userId;
  if (!eligible) return;

  const targetHasData = (await Promise.all(target.tables.map((table) => table.count()))).some((count) => count > 0);
  if (targetHasData) {
    // Workspace mới đã có dữ liệu thì tuyệt đối không copy database legacy vào sau này,
    // kể cả khi người dùng xóa hết dữ liệu trong workspace ở một phiên sau.
    storageSet("hbc-legacy-workspace-migrated-to", userId ?? "guest");
    return;
  }

  const legacy = new HuyenButDB(LEGACY_DB_NAME);
  await legacy.open();
  try {
    const targetTables = target.tables;
    // Đọc database legacy TRƯỚC transaction của target. Không await transaction của database khác
    // bên trong Dexie transaction, nếu không Safari/Chromium có thể đóng transaction target giữa chừng.
    const rowsByTable = new Map<string, unknown[]>();
    for (const targetTable of targetTables) {
      rowsByTable.set(targetTable.name, await legacy.table(targetTable.name).toArray());
    }

    await runInternalTransaction(target, targetTables, async () => {
      for (const targetTable of targetTables) {
        const rows = rowsByTable.get(targetTable.name) ?? [];
        if (rows.length) await targetTable.bulkPut(rows);
      }
    });
    storageSet("hbc-legacy-workspace-migrated-to", userId ?? "guest");
  } finally {
    legacy.close();
  }
}

/**
 * Chuyển IndexedDB sang workspace riêng của tài khoản. Không xóa workspace cũ.
 * userId=null dùng workspace khách. Dữ liệu phiên bản cũ được copy một lần vào workspace phù hợp.
 */
let workspaceSwitchQueue: Promise<void> = Promise.resolve();

async function performWorkspaceSwitch(userId: string | null) {
  if (activeWorkspaceUserId === userId && db.name === workspaceName(userId)) {
    if (!db.isOpen()) await db.open();
    return;
  }

  const previous = db;
  const next = new HuyenButDB(workspaceName(userId));
  try {
    await next.open();
    await migrateLegacyDataIfNeeded(next, userId);
  } catch (error) {
    next.close();
    throw error;
  }

  db = next;
  activeWorkspaceUserId = userId;
  previous.close();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hbc-workspace-changed", { detail: { userId } }));
  }
}

export function switchWorkspace(userId: string | null): Promise<void> {
  const task = workspaceSwitchQueue.catch(() => undefined).then(() => performWorkspaceSwitch(userId));
  workspaceSwitchQueue = task.then(() => undefined, () => undefined);
  return task;
}

export function getActiveWorkspaceUserId() {
  return activeWorkspaceUserId;
}
