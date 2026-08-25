// Base fields bắt buộc theo docs/DATA_MODEL.md / mục 14 master prompt
export interface BaseEntity {
  id: string; // UUID
  createdAt: number; // epoch ms
  updatedAt: number;
  schemaVersion: number;
  deletedAt: number | null; // soft-delete; null = còn sống
  syncState: "local" | "pending" | "synced"; // hiện tại luôn "local" (chưa có sync thật)
}

export interface Folder extends BaseEntity {
  name: string;
  parentId: string | null;
  order: number;
}

export interface Note extends BaseEntity {
  title: string;
  contentHtml: string; // rich-text HTML (sanitize khi render)
  contentText: string; // plaintext để search
  folderId: string | null;
  tags: string[];
  pinned: boolean;
  favorite: boolean;
  locked: boolean; // đánh dấu ý định khóa; mã hóa thật TODO giai đoạn 7
  archived: boolean;
}

export interface Tag extends BaseEntity {
  name: string;
  color: string;
}

export type ThemeId =
  | "mac-van-tien-canh"
  | "xich-viem-ma-ton"
  | "thanh-truc-co-phong"
  | "tu-van-thien-cung"
  | "kim-cac-thien-thu"
  | "thuy-mac-son-ha";

// ---- Giai đoạn 4: Viết dự án (mục 9 master prompt) ----

export type ProjectKind = "software" | "game" | "construction" | "generic";
export type ProjectStatus = "planning" | "active" | "paused" | "done" | "archived";

export interface Project extends BaseEntity {
  title: string;
  description: string;
  kind: ProjectKind;
  status: ProjectStatus;
  coverColor: string; // dùng làm "bìa" đơn giản (icon/bìa thật là TODO asset)
  startDate: number | null;
  deadline: number | null;
  priority: "low" | "medium" | "high";
  wordCountGoal: number | null;
  archived: boolean;
}

export interface ProjectSection extends BaseEntity {
  projectId: string;
  title: string;
  order: number;
}

export interface ProjectChapter extends BaseEntity {
  projectId: string;
  sectionId: string | null; // null = chương thuộc thẳng dự án, chưa phân phần
  title: string;
  contentHtml: string;
  contentText: string;
  order: number;
  wordCount: number;
}

export type ProjectTaskStatus = "todo" | "doing" | "review" | "done" | "blocked";

export interface ProjectTask extends BaseEntity {
  projectId: string;
  title: string;
  status: ProjectTaskStatus;
  dueDate: number | null;
  order: number;
}

export interface ProjectMilestone extends BaseEntity {
  projectId: string;
  title: string;
  dueDate: number | null;
  done: boolean;
}

export interface ThemePreference extends BaseEntity {
  themeId: ThemeId;
  followSystem: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  fontScale: number; // 1 = mặc định
}

export interface MindMap extends BaseEntity { title: string; }
export interface MindMapNode extends BaseEntity {
  mapId: string; parentId: string | null; title: string; x: number; y: number;
  color: string; collapsed: boolean;
}
export interface MindMapEdge extends BaseEntity {
  mapId: string; sourceId: string; targetId: string; label: string;
}
export type WhiteboardObjectKind = "note" | "rectangle" | "ellipse" | "text";
export interface Whiteboard extends BaseEntity { title: string; }
export interface WhiteboardObject extends BaseEntity {
  boardId: string; kind: WhiteboardObjectKind; x: number; y: number;
  width: number; height: number; text: string; color: string;
}
