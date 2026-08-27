import Dexie, { type Table } from "dexie";
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

let internalSyncWrite = false;
export async function asInternalSyncWrite<T>(operation: () => Promise<T>): Promise<T> {
  internalSyncWrite = true;
  try { return await operation(); } finally { internalSyncWrite = false; }
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

  constructor() {
    super("huyen-but-cac");

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
    // Thêm trường `synopsis` (tóm tắt) trên projectChapters — không đổi version 1-5 ở trên.
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

    // Mọi thay đổi do người dùng đều thành pending. Ghi từ máy chủ dùng asInternalSyncWrite().
    this.on("ready", () => {
      for (const table of this.tables) {
        if (table.name === "musicTracks" || table.name === "customBackgrounds") continue;
        table.hook("creating", (_key, value) => { if (!internalSyncWrite) value.syncState = "pending"; });
        table.hook("updating", () => internalSyncWrite ? undefined : { syncState: "pending" });
      }
    });
  }
}

export const db = new HuyenButDB();
