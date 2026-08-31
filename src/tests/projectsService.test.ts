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
  exportContextPackMarkdown,
  listProjects,
  softDeleteProject,
  softDeleteSection,
} from "../features/projects/projectsService";
import { createCharacter, createLocation, createLoreEntry, createTimelineEvent, updateTimelineEvent } from "../features/projects/storyBibleService";
import { addMindMapNode, createMindMap } from "../features/mind-map/mindMapService";

beforeEach(async () => {
  await db.projects.clear();
  await db.projectSections.clear();
  await db.projectChapters.clear();
  await db.projectTasks.clear();
  await db.projectMilestones.clear();
  await db.storyCharacters.clear();
  await db.storyLocations.clear();
  await db.storyLoreEntries.clear();
  await db.storyTimelineEvents.clear();
  await db.mindMaps.clear();
  await db.mindMapNodes.clear();
  await db.mindMapEdges.clear();
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

  it("xóa dự án đồng thời ẩn toàn bộ phần và chương liên quan", async () => {
    const project = await createProject({ title: "Dự án xóa", kind: "generic" });
    const section = await createSection(project.id, "Quyển 1");
    await createChapter({ projectId: project.id, sectionId: section.id, title: "Chương 1" });
    await softDeleteProject(project.id);
    expect(await listProjects()).toHaveLength(0);
    expect(await listChapters(project.id)).toHaveLength(0);
  });

  it("xóa dự án đồng thời xóa mềm toàn bộ Thư Viện Truyện", async () => {
    const project = await createProject({ title: "Dự án xóa", kind: "novel" });
    await createCharacter(project.id, "Nhân vật");
    await createLocation(project.id, "Tông môn", "faction");
    await createLoreEntry(project.id, "Linh khí");
    await createTimelineEvent(project.id, "Khai truyện");
    await softDeleteProject(project.id);
    expect((await db.storyCharacters.toArray()).every((item) => item.deletedAt !== null)).toBe(true);
    expect((await db.storyLocations.toArray()).every((item) => item.deletedAt !== null)).toBe(true);
    expect((await db.storyLoreEntries.toArray()).every((item) => item.deletedAt !== null)).toBe(true);
    expect((await db.storyTimelineEvents.toArray()).every((item) => item.deletedAt !== null)).toBe(true);
  });

  it("xóa chương sẽ gỡ liên kết khỏi dòng thời gian", async () => {
    const project = await createProject({ title: "Dự án", kind: "novel" });
    const chapter = await createChapter({ projectId: project.id, sectionId: null, title: "Chương 1" });
    const event = await createTimelineEvent(project.id, "Sự kiện");
    await updateTimelineEvent(event.id, { chapterId: chapter.id });
    await softDeleteChapter(chapter.id);
    expect((await db.storyTimelineEvents.get(event.id))?.chapterId).toBeNull();
  });



  it("xóa Section chuyển chương ra cấp Project thay vì làm chương mồ côi", async () => {
    const project = await createProject({ title: "Dự án", kind: "novel" });
    const section = await createSection(project.id, "Quyển 1");
    const chapter = await createChapter({ projectId: project.id, sectionId: section.id, title: "Chương 1" });
    await softDeleteSection(section.id);
    const moved = await db.projectChapters.get(chapter.id);
    expect(moved?.deletedAt).toBeNull();
    expect(moved?.sectionId).toBeNull();
  });

  it("xóa Project gỡ link chết kể cả node nằm trong một sơ đồ tự do khác", async () => {
    const project = await createProject({ title: "Dự án", kind: "novel" });
    const section = await createSection(project.id, "Quyển 1");
    const chapter = await createChapter({ projectId: project.id, sectionId: section.id, title: "Chương 1" });
    const { map, root } = await createMindMap("Sơ đồ tự do", null);
    await addMindMapNode(map.id, root.id, "Link dự án", 100, 100, { linkType: "project", linkId: project.id });
    await addMindMapNode(map.id, root.id, "Link phần", 150, 150, { linkType: "section", linkId: section.id });
    await addMindMapNode(map.id, root.id, "Link chương", 200, 200, { linkType: "chapter", linkId: chapter.id });

    await softDeleteProject(project.id);
    const linked = await db.mindMapNodes.where("mapId").equals(map.id).toArray();
    expect(linked.filter((node) => [project.id, section.id, chapter.id].includes(node.linkId ?? ""))).toHaveLength(0);
    expect((await db.mindMaps.get(map.id))?.deletedAt).toBeNull();
  });

  it("cập nhật tóm tắt chương (synopsis) không ảnh hưởng wordCount", async () => {
    const project = await createProject({ title: "Dự án", kind: "novel" });
    const chapter = await createChapter({ projectId: project.id, sectionId: null, title: "Chương 1" });
    await updateChapter(chapter.id, { synopsis: "Chủ nhân vật rời làng." });
    const [updated] = await listChapters(project.id);
    expect(updated.synopsis).toBe("Chủ nhân vật rời làng.");
    expect(updated.wordCount).toBe(0);
  });

  it("xuất gói ngữ cảnh AI gồm Thư Viện Truyện và tóm tắt chương, không kèm toàn văn", async () => {
    const project = await createProject({ title: "Tiên Lộ", kind: "novel" });
    await createCharacter(project.id, "Vân Thanh");
    const chapter = await createChapter({ projectId: project.id, sectionId: null, title: "Chương 1" });
    await updateChapter(chapter.id, {
      contentHtml: "<p>Nội dung đầy đủ không nên xuất hiện trong gói ngữ cảnh rút gọn.</p>",
      synopsis: "Tóm tắt chương 1.",
    });

    const pack = await exportContextPackMarkdown(project.id);
    expect(pack).toContain("Vân Thanh");
    expect(pack).toContain("Tóm tắt chương 1.");
    expect(pack).not.toContain("Nội dung đầy đủ");
  });

  it("xuất Bối cảnh trước Địa danh, Cảnh giới và Thế lực", async () => {
    const project = await createProject({ title: "Nam Cảnh Cổ Lục", kind: "novel" });
    await createLocation(project.id, "Tông môn Huyền Khuyết", "faction");
    await createLocation(project.id, "Hỗn Mang Sơ Khai", "era");
    await createLocation(project.id, "Nam Cảnh Cổ Lục", "location");
    await createLocation(project.id, "Trúc Cơ kỳ", "realm");

    const pack = await exportContextPackMarkdown(project.id);
    expect(pack.indexOf("### Bối cảnh")).toBeGreaterThanOrEqual(0);
    expect(pack.indexOf("### Bối cảnh")).toBeLessThan(pack.indexOf("### Địa danh"));
    expect(pack.indexOf("### Địa danh")).toBeLessThan(pack.indexOf("### Cảnh giới"));
    expect(pack.indexOf("### Cảnh giới")).toBeLessThan(pack.indexOf("### Thế lực"));
    expect(pack).toContain("Hỗn Mang Sơ Khai");
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
