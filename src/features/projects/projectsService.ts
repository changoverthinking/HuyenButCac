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

function now() {
  return Date.now();
}

function base() {
  const t = now();
  return { createdAt: t, updatedAt: t, schemaVersion: 1, deletedAt: null, syncState: "local" as const };
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
  await db.projects.update(id, { deletedAt: now(), updatedAt: now() });
}

export async function listProjects(): Promise<Project[]> {
  const projects = await db.projects.filter((p) => p.deletedAt === null && !p.archived).toArray();
  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

// ---------- Section ----------

export async function createSection(projectId: string, title: string): Promise<ProjectSection> {
  const order = await db.projectSections.filter((s) => s.projectId === projectId && s.deletedAt === null).count();
  const section: ProjectSection = { id: uuid(), projectId, title, order, ...base() };
  await db.projectSections.add(section);
  return section;
}

export async function listSections(projectId: string): Promise<ProjectSection[]> {
  const sections = await db.projectSections.filter((s) => s.projectId === projectId && s.deletedAt === null).toArray();
  return sections.sort((a, b) => a.order - b.order);
}

export async function renameSection(id: string, title: string): Promise<void> {
  await db.projectSections.update(id, { title, updatedAt: now() });
}

export async function softDeleteSection(id: string): Promise<void> {
  await db.projectSections.update(id, { deletedAt: now(), updatedAt: now() });
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
  const order = await db.projectChapters
    .filter((c) => c.projectId === params.projectId && c.sectionId === params.sectionId && c.deletedAt === null)
    .count();
  const chapter: ProjectChapter = {
    id: uuid(),
    projectId: params.projectId,
    sectionId: params.sectionId,
    title: params.title,
    contentHtml: "",
    contentText: "",
    order,
    wordCount: 0,
    ...base(),
  };
  await db.projectChapters.add(chapter);
  return chapter;
}

export async function updateChapter(
  id: string,
  patch: Partial<Pick<ProjectChapter, "title" | "contentHtml">>
): Promise<void> {
  const update: Partial<ProjectChapter> = { ...patch, updatedAt: now() };
  if (patch.contentHtml !== undefined) {
    const text = htmlToText(patch.contentHtml);
    update.contentText = text;
    update.wordCount = countWords(text);
  }
  await db.projectChapters.update(id, update);
}

export async function softDeleteChapter(id: string): Promise<void> {
  await db.projectChapters.update(id, { deletedAt: now(), updatedAt: now() });
}

export async function listChapters(projectId: string): Promise<ProjectChapter[]> {
  const chapters = await db.projectChapters.filter((c) => c.projectId === projectId && c.deletedAt === null).toArray();
  return chapters.sort((a, b) => a.order - b.order);
}

export async function reorderChapter(id: string, newOrder: number): Promise<void> {
  await db.projectChapters.update(id, { order: newOrder, updatedAt: now() });
}

// ---------- Task (Kanban) ----------

export async function createTask(projectId: string, title: string): Promise<ProjectTask> {
  const order = await db.projectTasks.filter((t) => t.projectId === projectId && t.deletedAt === null).count();
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
  return tasks.sort((a, b) => a.order - b.order);
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

  for (const ch of chaptersWithoutSection) {
    md += `## ${ch.title}\n\n${ch.contentText}\n\n`;
  }
  for (const section of sections) {
    md += `## ${section.title}\n\n`;
    const secChapters = chapters.filter((c) => c.sectionId === section.id);
    for (const ch of secChapters) {
      md += `### ${ch.title}\n\n${ch.contentText}\n\n`;
    }
  }
  return md;
}
