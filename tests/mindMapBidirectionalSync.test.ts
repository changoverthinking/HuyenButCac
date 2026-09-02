import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/database/db";
import {
  addMindMapNode,
  createOrSyncProjectMap,
  deleteMindMapNode,
  getMapGraph,
  updateMindMapNode,
} from "../src/features/mind-map/mindMapService";
import { createChapter, createProject, createSection } from "../src/features/projects/projectsService";

describe("đồng bộ hai chiều project ↔ mind map", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("đổi tên node đã liên kết sẽ cập nhật project, section và chapter", async () => {
    const project = await createProject({ title: "Tên dự án cũ", kind: "novel" });
    const section = await createSection(project.id, "Phần cũ");
    const chapter = await createChapter({ projectId: project.id, sectionId: section.id, title: "Chương cũ" });
    const map = await createOrSyncProjectMap(project.id);
    const graph = await getMapGraph(map.id);

    const root = graph.nodes.find((node) => node.linkType === "project")!;
    const sectionNode = graph.nodes.find((node) => node.linkId === section.id)!;
    const chapterNode = graph.nodes.find((node) => node.linkId === chapter.id)!;

    await updateMindMapNode(root.id, { title: "Tên dự án mới" });
    await updateMindMapNode(sectionNode.id, { title: "Phần mới" });
    await updateMindMapNode(chapterNode.id, { title: "Chương mới" });

    expect((await db.projects.get(project.id))?.title).toBe("Tên dự án mới");
    expect((await db.projectSections.get(section.id))?.title).toBe("Phần mới");
    expect((await db.projectChapters.get(chapter.id))?.title).toBe("Chương mới");
    expect((await db.mindMaps.get(map.id))?.title).toBe("Tên dự án mới");
  });

  it("thêm và di chuyển nhánh trên cây sẽ tạo/cập nhật cấu trúc dự án", async () => {
    const project = await createProject({ title: "Cây mới", kind: "generic" });
    const map = await createOrSyncProjectMap(project.id);
    const root = (await getMapGraph(map.id)).nodes.find((node) => node.linkType === "project")!;

    const sectionA = await addMindMapNode(map.id, root.id, "Phần A", 300, 100);
    const sectionB = await addMindMapNode(map.id, root.id, "Phần B", 300, 260);
    const chapter = await addMindMapNode(map.id, sectionA.id, "Chương 1", 560, 100);

    expect(sectionA.linkType).toBe("section");
    expect(sectionB.linkType).toBe("section");
    expect(chapter.linkType).toBe("chapter");
    expect((await db.projectChapters.get(chapter.linkId!))?.sectionId).toBe(sectionA.linkId);

    await updateMindMapNode(chapter.id, { parentId: sectionB.id });
    expect((await db.projectChapters.get(chapter.linkId!))?.sectionId).toBe(sectionB.linkId);
  });

  it("xóa Section trên cây sẽ xóa Section trong dự án nhưng giữ Chapter và chuyển Chapter về gốc", async () => {
    const project = await createProject({ title: "Không mất chương", kind: "novel" });
    const map = await createOrSyncProjectMap(project.id);
    const root = (await getMapGraph(map.id)).nodes.find((node) => node.linkType === "project")!;
    const section = await addMindMapNode(map.id, root.id, "Phần tạm", 300, 100);
    const chapter = await addMindMapNode(map.id, section.id, "Chương cần giữ", 560, 100);

    await deleteMindMapNode(section.id);

    expect((await db.projectSections.get(section.linkId!))?.deletedAt).not.toBeNull();
    const savedChapter = await db.projectChapters.get(chapter.linkId!);
    expect(savedChapter?.deletedAt).toBeNull();
    expect(savedChapter?.sectionId).toBeNull();
    expect((await db.mindMapNodes.get(chapter.id))?.parentId).toBe(root.id);
  });

  it("ô tự do không tạo dữ liệu dự án và nút gốc project không thể bị xóa nhầm", async () => {
    const project = await createProject({ title: "An toàn", kind: "generic" });
    const map = await createOrSyncProjectMap(project.id);
    const root = (await getMapGraph(map.id)).nodes.find((node) => node.linkType === "project")!;

    const freeNode = await addMindMapNode(map.id, null, "Ghi chú tự do", 800, 400);
    expect(freeNode.linkId).toBeNull();
    expect(await db.projectSections.where("projectId").equals(project.id).filter((item) => item.deletedAt === null).count()).toBe(0);
    expect(await db.projectChapters.where("projectId").equals(project.id).filter((item) => item.deletedAt === null).count()).toBe(0);
    await expect(deleteMindMapNode(root.id)).rejects.toThrow("Không thể xóa nút gốc của dự án");
  });
});
