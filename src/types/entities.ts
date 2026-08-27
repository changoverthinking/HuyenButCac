// Base fields bắt buộc theo docs/DATA_MODEL.md / mục 14 master prompt
export interface BaseEntity {
  id: string; // UUID
  createdAt: number; // epoch ms
  updatedAt: number;
  schemaVersion: number;
  deletedAt: number | null; // soft-delete; null = còn sống
  syncState: "local" | "pending" | "synced";
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
  | "thuy-mac-son-ha"
  | "bach-nguyet-han-cung"
  | "dao-hoa-mong-canh"
  | "cuu-u-huyen-da"
  | "thien-thanh-luu-ly"
  | "hoang-hon-co-thanh"
  | "ngoc-son-van-hai"
  | "huyet-nguyet-ma-canh"
  | "tinh-ha-van-tuong";

// ---- Giai đoạn 4: Viết dự án (mục 9 master prompt) ----

export type ProjectKind = "software" | "game" | "construction" | "novel" | "generic";
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
  synopsis: string; // "Nhật ký chương" — tóm tắt ngắn để AI/người viết không quên mạch truyện
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

// ---- Thư Viện Truyện (Story Codex): dữ liệu chống quên mạch khi viết truyện dài ----

export interface StoryCharacter extends BaseEntity {
  projectId: string;
  name: string;
  aliasNames: string; // biệt hiệu, đạo hiệu, tên khác — phân cách bởi dấu phẩy
  role: string; // vai trò: chính diện / phản diện / phụ...
  realm: string; // cảnh giới tu vi hiện tại
  appearance: string; // ngoại hình
  personality: string; // tính cách
  relationships: string; // mối quan hệ với các nhân vật khác
  notes: string; // ghi chú tự do
  order: number;
}

export type StoryLocationKind = "location" | "realm" | "faction";

export interface StoryLocation extends BaseEntity {
  projectId: string;
  name: string;
  kind: StoryLocationKind; // địa danh / cảnh giới tu luyện / môn phái-thế lực
  description: string;
  order: number;
}

export interface StoryLoreEntry extends BaseEntity {
  projectId: string;
  term: string; // thuật ngữ (ví dụ: "Kim Đan", "Tinh Bàn")
  definition: string;
  order: number;
}

export interface StoryTimelineEvent extends BaseEntity {
  projectId: string;
  title: string;
  summary: string;
  chapterId: string | null; // liên kết chương nếu có
  order: number; // thứ tự trong dòng thời gian truyện (không nhất thiết theo thời gian thực)
}

export interface ThemePreference extends BaseEntity {
  themeId: ThemeId;
  followSystem: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  fontScale: number; // 1 = mặc định
  customBackgroundId?: string | null;
}

export interface MusicTrack extends BaseEntity {
  name: string;
  fileName: string;
  mimeType: string;
  size: number;
  audioBlob: Blob;
}

export interface CustomBackground extends BaseEntity {
  name: string;
  mimeType: string;
  imageBlob: Blob;
}

export interface MindMap extends BaseEntity { title: string; projectId?: string | null; }
export interface MindMapNode extends BaseEntity {
  mapId: string; parentId: string | null; title: string; x: number; y: number;
  color: string; collapsed: boolean;
  linkType?: "project" | "section" | "chapter" | null;
  linkId?: string | null;
}
export interface MindMapEdge extends BaseEntity {
  mapId: string; sourceId: string; targetId: string; label: string;
}
export type WhiteboardObjectKind = "note" | "rectangle" | "ellipse" | "text";
export interface Whiteboard extends BaseEntity { title: string; }
export interface WhiteboardObject extends BaseEntity {
  boardId: string; kind: WhiteboardObjectKind; x: number; y: number;
  width: number; height: number; text: string; color: string;
  connectedToIds?: string[];
  locked?: boolean;
}

export interface CanvasStroke extends BaseEntity {
  ownerId: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  dash: "solid" | "dashed" | "dotted";
  arrow: "none" | "end" | "both";
  smoothed: boolean;
  locked: boolean;
}
