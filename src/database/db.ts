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
  MindMap, MindMapNode, MindMapEdge, Whiteboard, WhiteboardObject, MusicTrack, CustomBackground,
} from "../types/entities";

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
  }
}

export const db = new HuyenButDB();
