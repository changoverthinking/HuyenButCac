import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../database/db";
import {
  createProject,
  createSection,
  createChapter,
  updateChapter,
  softDeleteChapter,
  listChapters,
  reorderChapter,
  createTask,
  updateTaskStatus,
  listTasks,
  exportProjectMarkdown,
} from "../features/projects/projectsService";

beforeEach(async () => {
  await db.projects.clear();
  await db.projectSections.clear();
  await db.projectChapters.clear();
  await db.projectTasks.clear();
  await db.projectMilestones.clear();
});

describe("projectsService — dự án và chương", () => {
  it("tạo dự án, phần, chương và đọc lại đúng thứ tự", async () => {
    const project = await createProject({ title: "Tiểu thuyết tu tiên", kind: "generic" });
    const section = await createSection(project.id, "Quyển 1");
    await createChapter({ projectId: project.id, sectionId: section.id, title: "Chương 1" });
    await createChapter({ projectId: project.id, sectionId: section.id, title: "Chương 2" });

    const chapters = await listChapters(project.id);
    expect(chapters.map((c) => c.title)).toEqual(["Chương 1", "Chương 2"]);
  });

  it("cập nhật nội dung chương tự tính wordCount", async () => {
    const project = await createProject({ title: "Dự án", kind: "software" });
    const chapter = await createChapter({ projectId: project.id, sectionId: null, title: "Mở đầu" });
    await updateChapter(chapter.id, { contentHtml: "<p>Một hai ba bốn năm</p>" });
    const [updated] = await listChapters(project.id);
    expect(updated.wordCount).toBe(5);
  });

  it("kéo sắp xếp (reorder) đổi order đúng", async () => {
    const project = await createProject({ title: "Dự án", kind: "software" });
    const c1 = await createChapter({ projectId: project.id, sectionId: null, title: "A" });
    const c2 = await createChapter({ projectId: project.id, sectionId: null, title: "B" });
    await reorderChapter(c1.id, 5);
    await reorderChapter(c2.id, 1);
    const chapters = await listChapters(project.id);
    expect(chapters[0].title).toBe("B");
    expect(chapters[1].title).toBe("A");
  });

  it("xóa chương (soft delete) không còn xuất hiện trong danh sách", async () => {
    const project = await createProject({ title: "Dự án", kind: "software" });
    const chapter = await createChapter({ projectId: project.id, sectionId: null, title: "Bỏ" });
    await softDeleteChapter(chapter.id);
    const chapters = await listChapters(project.id);
    expect(chapters.length).toBe(0);
  });

  it("xuất Markdown gồm cả chương trong phần và ngoài phần", async () => {
    const project = await createProject({ title: "Dự án Mẫu", kind: "generic" });
    const section = await createSection(project.id, "Phần A");
    await createChapter({ projectId: project.id, sectionId: null, title: "Lời mở đầu" });
    await createChapter({ projectId: project.id, sectionId: section.id, title: "Chương trong phần A" });

    const md = await exportProjectMarkdown(project.id);
    expect(md).toContain("# Dự án Mẫu");
    expect(md).toContain("Lời mở đầu");
    expect(md).toContain("Phần A");
    expect(md).toContain("Chương trong phần A");
  });
});

describe("projectsService — Kanban task", () => {
  it("tạo task và đổi trạng thái", async () => {
    const project = await createProject({ title: "Dự án", kind: "software" });
    const task = await createTask(project.id, "Viết feature matrix");
    await updateTaskStatus(task.id, "doing");
    const tasks = await listTasks(project.id);
    expect(tasks[0].status).toBe("doing");
  });
});
