import { v4 as uuid } from "uuid";
import { db } from "../../database/db";
import type {
  Project,
  ProjectChapter,
  ProjectMilestone,
  ProjectSection,
  ProjectTask,
  ProjectKind,
} from "../../types/entities";
import { exportStoryBibleMarkdown } from "./storyBibleService";
import { sanitizeRichHtml } from "../security/htmlSanitizer";

function now() {
  return Date.now();
}

function base() {
  const t = now();
  return { createdAt: t, updatedAt: t, schemaVersion: 1, deletedAt: null, syncState: "local" as const };
}

function nextOrder<T extends { order: number }>(items: T[]): number {
  return items.reduce((max, item) => Math.max(max, item.order), -1) + 1;
}

function stableOrder<T extends { order: number; createdAt: number; id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

// ---------- Project ----------

export async function createProject(params: { title: string; kind: ProjectKind }): Promise<Project> {
  const project: Project = {
    id: uuid(),
    title: params.title,
    description: "",
    kind: params.kind,
    status: "planning",
    coverColor: "var(--color-accent)",
    startDate: null,
    deadline: null,
    priority: "medium",
    wordCountGoal: null,
    archived: false,
    ...base(),
  };
  await db.projects.add(project);
  return project;
}

export async function updateProject(
  id: string,
  patch: Partial<Pick<Project, "title" | "description" | "status" | "startDate" | "deadline" | "priority" | "wordCountGoal" | "archived">>
): Promise<void> {
  await db.projects.update(id, { ...patch, updatedAt: now() });
}

export async function softDeleteProject(id: string): Promise<void> {
  const deletedAt = now();
  await db.transaction("rw", [
    db.projects, db.projectSections, db.projectChapters, db.projectTasks, db.projectMilestones,
    db.storyCharacters, db.storyLocations, db.storyLoreEntries, db.storyTimelineEvents,
    db.mindMaps, db.mindMapNodes,
  ], async () => {
    await db.projects.update(id, { deletedAt, updatedAt: deletedAt });
    const sections = await db.projectSections.where("projectId").equals(id).filter((item) => item.deletedAt === null).toArray();
    const chapters = await db.projectChapters.where("projectId").equals(id).filter((item) => item.deletedAt === null).toArray();
    const tasks = await db.projectTasks.where("projectId").equals(id).filter((item) => item.deletedAt === null).toArray();
    const milestones = await db.projectMilestones.where("projectId").equals(id).filter((item) => item.deletedAt === null).toArray();
    const characters = await db.storyCharacters.where("projectId").equals(id).filter((item) => item.deletedAt === null).toArray();
    const locations = await db.storyLocations.where("projectId").equals(id).filter((item) => item.deletedAt === null).toArray();
    const loreEntries = await db.storyLoreEntries.where("projectId").equals(id).filter((item) => item.deletedAt === null).toArray();
    const timelineEvents = await db.storyTimelineEvents.where("projectId").equals(id).filter((item) => item.deletedAt === null).toArray();
    const maps = await db.mindMaps.where("projectId").equals(id).filter((item) => item.deletedAt === null).toArray();

    if (sections.length) await db.projectSections.bulkPut(sections.map((item) => ({ ...item, deletedAt, updatedAt: deletedAt })));
    if (chapters.length) await db.projectChapters.bulkPut(chapters.map((item) => ({ ...item, deletedAt, updatedAt: deletedAt })));
    if (tasks.length) await db.projectTasks.bulkPut(tasks.map((item) => ({ ...item, deletedAt, updatedAt: deletedAt })));
    if (milestones.length) await db.projectMilestones.bulkPut(milestones.map((item) => ({ ...item, deletedAt, updatedAt: deletedAt })));
    if (characters.length) await db.storyCharacters.bulkPut(characters.map((item) => ({ ...item, deletedAt, updatedAt: deletedAt })));
    if (locations.length) await db.storyLocations.bulkPut(locations.map((item) => ({ ...item, deletedAt, updatedAt: deletedAt })));
    if (loreEntries.length) await db.storyLoreEntries.bulkPut(loreEntries.map((item) => ({ ...item, deletedAt, updatedAt: deletedAt })));
    if (timelineEvents.length) await db.storyTimelineEvents.bulkPut(timelineEvents.map((item) => ({ ...item, deletedAt, updatedAt: deletedAt })));

    // Không xóa sơ đồ người dùng đã vẽ. Tách mọi map gắn project và gỡ link chết ở TẤT CẢ map,
    // kể cả một map tự do khác có node trỏ tới project/section/chapter này.
    if (maps.length) {
      await db.mindMaps.bulkPut(maps.map((item) => ({ ...item, projectId: null, updatedAt: deletedAt })));
    }
    const sectionIds = new Set(sections.map((item) => item.id));
    const chapterIds = new Set(chapters.map((item) => item.id));
    const linkedNodes = await db.mindMapNodes.filter((node) =>
      node.deletedAt === null && (
        (node.linkType === "project" && node.linkId === id) ||
        (node.linkType === "section" && Boolean(node.linkId && sectionIds.has(node.linkId))) ||
        (node.linkType === "chapter" && Boolean(node.linkId && chapterIds.has(node.linkId)))
      ),
    ).toArray();
    if (linkedNodes.length) {
      await db.mindMapNodes.bulkPut(linkedNodes.map((node) => ({ ...node, linkType: null, linkId: null, updatedAt: deletedAt })));
    }
  });
}

export async function listProjects(): Promise<Project[]> {
  const projects = await db.projects.filter((p) => p.deletedAt === null && !p.archived).toArray();
  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

// ---------- Section ----------

export async function createSection(projectId: string, title: string): Promise<ProjectSection> {
  const siblings = await db.projectSections.filter((s) => s.projectId === projectId && s.deletedAt === null).toArray();
  const order = nextOrder(siblings);
  const section: ProjectSection = { id: uuid(), projectId, title, order, ...base() };
  await db.projectSections.add(section);
  return section;
}

export async function listSections(projectId: string): Promise<ProjectSection[]> {
  const sections = await db.projectSections.filter((s) => s.projectId === projectId && s.deletedAt === null).toArray();
  return stableOrder(sections);
}

export async function renameSection(id: string, title: string): Promise<void> {
  await db.projectSections.update(id, { title, updatedAt: now() });
}

export async function softDeleteSection(id: string): Promise<void> {
  const deletedAt = now();
  await db.transaction("rw", db.projectSections, db.projectChapters, db.mindMapNodes, async () => {
    const section = await db.projectSections.get(id);
    if (!section) return;
    await db.projectSections.update(id, { deletedAt, updatedAt: deletedAt });

    // Chương không bị mất theo phần: chuyển chúng ra cấp dự án và giữ thứ tự ổn định.
    const chapters = await db.projectChapters.filter((chapter) => chapter.deletedAt === null && chapter.sectionId === id).toArray();
    const rootChapters = await db.projectChapters.filter((chapter) => chapter.deletedAt === null && chapter.projectId === section.projectId && chapter.sectionId === null).toArray();
    let nextOrder = rootChapters.reduce((max, chapter) => Math.max(max, chapter.order), -1) + 1;
    if (chapters.length) {
      const moved = chapters.sort((a, b) => a.order - b.order).map((chapter) => ({
        ...chapter, sectionId: null, order: nextOrder++, updatedAt: deletedAt,
      }));
      await db.projectChapters.bulkPut(moved);
    }

    const linkedNodes = await db.mindMapNodes.filter((node) => node.deletedAt === null && node.linkType === "section" && node.linkId === id).toArray();
    if (linkedNodes.length) await db.mindMapNodes.bulkPut(linkedNodes.map((node) => ({ ...node, linkType: null, linkId: null, updatedAt: deletedAt })));
  });
}

// ---------- Chapter ----------

function htmlToText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent ?? "";
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export async function createChapter(params: {
  projectId: string;
  sectionId: string | null;
  title: string;
}): Promise<ProjectChapter> {
  const siblings = await db.projectChapters
    .filter((c) => c.projectId === params.projectId && c.sectionId === params.sectionId && c.deletedAt === null)
    .toArray();
  const order = nextOrder(siblings);
  const chapter: ProjectChapter = {
    id: uuid(),
    projectId: params.projectId,
    sectionId: params.sectionId,
    title: params.title,
    contentHtml: "",
    contentText: "",
    order,
    wordCount: 0,
    synopsis: "",
    ...base(),
  };
  await db.projectChapters.add(chapter);
  return chapter;
}

export async function updateChapter(
  id: string,
  patch: Partial<Pick<ProjectChapter, "title" | "contentHtml" | "synopsis">>
): Promise<void> {
  const update: Partial<ProjectChapter> = { ...patch, updatedAt: now() };
  if (patch.contentHtml !== undefined) {
    const sanitizedHtml = sanitizeRichHtml(patch.contentHtml);
    update.contentHtml = sanitizedHtml;
    const text = htmlToText(sanitizedHtml);
    update.contentText = text;
    update.wordCount = countWords(text);
  }
  await db.projectChapters.update(id, update);
}

export async function softDeleteChapter(id: string): Promise<void> {
  const deletedAt = now();
  await db.transaction("rw", db.projectChapters, db.storyTimelineEvents, db.mindMapNodes, async () => {
    await db.projectChapters.update(id, { deletedAt, updatedAt: deletedAt });
    const linkedEvents = await db.storyTimelineEvents.where("chapterId").equals(id).filter((item) => item.deletedAt === null).toArray();
    if (linkedEvents.length) {
      await db.storyTimelineEvents.bulkPut(linkedEvents.map((item) => ({ ...item, chapterId: null, updatedAt: deletedAt })));
    }
    const linkedNodes = await db.mindMapNodes.filter((node) => node.deletedAt === null && node.linkType === "chapter" && node.linkId === id).toArray();
    if (linkedNodes.length) {
      await db.mindMapNodes.bulkPut(linkedNodes.map((node) => ({ ...node, linkType: null, linkId: null, updatedAt: deletedAt })));
    }
  });
}

function sameChapterSection(chapter: ProjectChapter, sectionId: string | null): boolean {
  return chapter.sectionId === sectionId;
}

function sortChapterGroup(chapters: ProjectChapter[]): ProjectChapter[] {
  return stableOrder(chapters);
}

export async function listChapters(projectId: string): Promise<ProjectChapter[]> {
  const chapters = await db.projectChapters.filter((c) => c.projectId === projectId && c.deletedAt === null).toArray();
  return sortChapterGroup(chapters);
}

/**
 * Di chuyển chương tới vị trí mới trong cùng nhóm hoặc sang một Phần khác.
 * Toàn bộ order của nhóm nguồn/đích được chuẩn hóa về 0..n-1 để tránh trùng thứ tự.
 */
export async function moveChapter(id: string, targetSectionId: string | null, targetIndex: number): Promise<void> {
  await db.transaction("rw", db.projectChapters, db.projectSections, async () => {
    const chapter = await db.projectChapters.get(id);
    if (!chapter || chapter.deletedAt !== null) throw new Error("Không tìm thấy chương cần sắp xếp.");

    if (targetSectionId !== null) {
      const targetSection = await db.projectSections.get(targetSectionId);
      if (!targetSection || targetSection.deletedAt !== null || targetSection.projectId !== chapter.projectId) {
        throw new Error("Phần đích không hợp lệ hoặc không thuộc dự án này.");
      }
    }

    const allChapters = await db.projectChapters
      .filter((item) => item.projectId === chapter.projectId && item.deletedAt === null)
      .toArray();
    const sourceSectionId = chapter.sectionId;
    const stamp = now();
    const normalizedIndex = Number.isFinite(targetIndex) ? Math.trunc(targetIndex) : Number.MAX_SAFE_INTEGER;

    if (sourceSectionId === targetSectionId) {
      const group = sortChapterGroup(allChapters.filter((item) => sameChapterSection(item, sourceSectionId) && item.id !== id));
      const insertAt = Math.max(0, Math.min(normalizedIndex, group.length));
      group.splice(insertAt, 0, { ...chapter, sectionId: targetSectionId });
      await db.projectChapters.bulkPut(group.map((item, index) => ({ ...item, order: index, updatedAt: stamp })));
      return;
    }

    const sourceGroup = sortChapterGroup(allChapters.filter((item) => sameChapterSection(item, sourceSectionId) && item.id !== id));
    const targetGroup = sortChapterGroup(allChapters.filter((item) => sameChapterSection(item, targetSectionId) && item.id !== id));
    const insertAt = Math.max(0, Math.min(normalizedIndex, targetGroup.length));
    targetGroup.splice(insertAt, 0, { ...chapter, sectionId: targetSectionId });

    await db.projectChapters.bulkPut([
      ...sourceGroup.map((item, index) => ({ ...item, order: index, updatedAt: stamp })),
      ...targetGroup.map((item, index) => ({ ...item, sectionId: targetSectionId, order: index, updatedAt: stamp })),
    ]);
  });
}

/** @deprecated Dùng moveChapter cho UI mới. Hàm này giữ tương thích nhưng vẫn chuẩn hóa order. */
export async function reorderChapter(id: string, newOrder: number): Promise<void> {
  const chapter = await db.projectChapters.get(id);
  if (!chapter || chapter.deletedAt !== null) throw new Error("Không tìm thấy chương cần sắp xếp.");
  await moveChapter(id, chapter.sectionId, newOrder);
}

// ---------- Task (Kanban) ----------

export async function createTask(projectId: string, title: string): Promise<ProjectTask> {
  const siblings = await db.projectTasks.filter((t) => t.projectId === projectId && t.deletedAt === null).toArray();
  const order = nextOrder(siblings);
  const task: ProjectTask = {
    id: uuid(),
    projectId,
    title,
    status: "todo",
    dueDate: null,
    order,
    ...base(),
  };
  await db.projectTasks.add(task);
  return task;
}

export async function updateTaskStatus(id: string, status: ProjectTask["status"]): Promise<void> {
  await db.projectTasks.update(id, { status, updatedAt: now() });
}

export async function softDeleteTask(id: string): Promise<void> {
  await db.projectTasks.update(id, { deletedAt: now(), updatedAt: now() });
}

export async function listTasks(projectId: string): Promise<ProjectTask[]> {
  const tasks = await db.projectTasks.filter((t) => t.projectId === projectId && t.deletedAt === null).toArray();
  return stableOrder(tasks);
}

// ---------- Milestone ----------

export async function createMilestone(projectId: string, title: string, dueDate: number | null): Promise<ProjectMilestone> {
  const milestone: ProjectMilestone = { id: uuid(), projectId, title, dueDate, done: false, ...base() };
  await db.projectMilestones.add(milestone);
  return milestone;
}

export async function toggleMilestone(id: string, done: boolean): Promise<void> {
  await db.projectMilestones.update(id, { done, updatedAt: now() });
}

export async function softDeleteMilestone(id: string): Promise<void> {
  const deletedAt = now();
  await db.projectMilestones.update(id, { deletedAt, updatedAt: deletedAt });
}

export async function listMilestones(projectId: string): Promise<ProjectMilestone[]> {
  const ms = await db.projectMilestones.filter((m) => m.projectId === projectId && m.deletedAt === null).toArray();
  return ms.sort((a, b) => (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity));
}

// ---------- Xuất dự án (Markdown) ----------

export async function exportProjectMarkdown(projectId: string): Promise<string> {
  const project = await db.projects.get(projectId);
  if (!project) throw new Error("Không tìm thấy dự án.");
  const sections = await listSections(projectId);
  const chapters = await listChapters(projectId);

  let md = `# ${project.title}\n\n${project.description}\n\n`;
  const chaptersWithoutSection = chapters.filter((c) => c.sectionId === null);

  const chapterBlock = (ch: ProjectChapter, headingLevel: "##" | "###") => {
    let block = `${headingLevel} ${ch.title}\n\n`;
    if (ch.synopsis) block += `> Tóm tắt: ${ch.synopsis}\n\n`;
    block += `${ch.contentText}\n\n`;
    return block;
  };

  for (const ch of chaptersWithoutSection) {
    md += chapterBlock(ch, "##");
  }
  for (const section of sections) {
    md += `## ${section.title}\n\n`;
    const secChapters = chapters.filter((c) => c.sectionId === section.id);
    for (const ch of secChapters) {
      md += chapterBlock(ch, "###");
    }
  }
  return md;
}

/**
 * Xuất "gói ngữ cảnh" gồm Thư Viện Truyện + tóm tắt mọi chương (không kèm toàn văn).
 * Dùng để dán vào đầu một cuộc trò chuyện AI, giúp AI không quên nhân vật/mốc truyện
 * mà không tốn ngữ cảnh cho toàn bộ nội dung đã viết.
 */
export async function exportContextPackMarkdown(projectId: string): Promise<string> {
  const project = await db.projects.get(projectId);
  if (!project) throw new Error("Không tìm thấy dự án.");
  const storyBibleMd = await exportStoryBibleMarkdown(projectId);
  const chapters = await listChapters(projectId);

  let md = `# Gói ngữ cảnh — ${project.title}\n\n`;
  if (project.description) md += `${project.description}\n\n`;
  md += storyBibleMd;

  const withSynopsis = chapters.filter((c) => c.synopsis.trim().length > 0);
  if (withSynopsis.length) {
    md += `## Tóm tắt các chương đã viết\n\n`;
    for (const ch of withSynopsis) {
      md += `- **${ch.title}**: ${ch.synopsis}\n`;
    }
    md += `\n`;
  }

  return md;
}
