import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../database/db";
import { addMindMapEdge, addMindMapNode, createMindMap, createOrSyncProjectMap, deleteMindMap, deleteMindMapEdge, deleteMindMapNode, getMapGraph, listMindMaps, renameMindMap, resolveNodeLink, updateMindMapNode } from "../features/mind-map/mindMapService";
import { createChapter, createProject, createSection } from "../features/projects/projectsService";

describe("mindMapService", () => {
  beforeEach(async () => { await db.delete(); await db.open(); });

  it("tạo sơ đồ kèm node trung tâm và lưu lại", async () => {
    const { map, root } = await createMindMap("Kế hoạch");
    const graph = await getMapGraph(map.id);
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].id).toBe(root.id);
  });

  it("thêm nhánh tạo connector và cập nhật vị trí", async () => {
    const { map, root } = await createMindMap();
    const child = await addMindMapNode(map.id, root.id, "Nhánh A", 600, 220);
    await updateMindMapNode(child.id, { x: 720, title: "Nhánh đã sửa" });
    const graph = await getMapGraph(map.id);
    expect(graph.edges[0]).toMatchObject({ sourceId: root.id, targetId: child.id });
    expect(graph.nodes.find((node) => node.id === child.id)).toMatchObject({ x: 720, title: "Nhánh đã sửa" });
  });

  it("xóa một ô không làm mất các ô con còn lại", async () => {
    const { map, root } = await createMindMap();
    const child = await addMindMapNode(map.id, root.id, "Con", 0, 0);
    const grandchild = await addMindMapNode(map.id, child.id, "Cháu", 0, 0);
    await deleteMindMapNode(child.id);
    const graph = await getMapGraph(map.id);
    expect(graph.nodes.map((node) => node.id)).toEqual([root.id, grandchild.id]);
    expect(graph.nodes.find((node) => node.id === grandchild.id)?.parentId).toBe(root.id);
    expect(graph.edges).toEqual([expect.objectContaining({ sourceId: root.id, targetId: grandchild.id, edgeType: "tree" })]);
  });

  it("cho phép xóa chủ đề trung tâm khi sơ đồ còn ô khác", async () => {
    const { map, root } = await createMindMap();
    const child = await addMindMapNode(map.id, root.id, "Ô còn lại", 600, 220);
    await deleteMindMapNode(root.id);
    const graph = await getMapGraph(map.id);
    expect(graph.nodes.map((node) => node.id)).toEqual([child.id]);
    expect(graph.nodes[0].parentId).toBeNull();
  });

  it("chặn xóa ô cuối cùng bằng thông báo rõ ràng", async () => {
    const { root } = await createMindMap();
    await expect(deleteMindMapNode(root.id)).rejects.toThrow("Sơ đồ phải còn ít nhất một ô");
  });

  it("tự phục hồi sơ đồ cũ đã mất nút trung tâm", async () => {
    const { map, root } = await createMindMap();
    await db.mindMapNodes.update(root.id, { deletedAt: Date.now() });
    const graph = await getMapGraph(map.id);
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].parentId).toBeNull();
  });

  it("đổi tên và xóa toàn bộ sơ đồ kèm node", async () => {
    const { map, root } = await createMindMap("Cũ");
    await addMindMapNode(map.id, root.id, "Nhánh", 0, 0);
    await renameMindMap(map.id, "Tên mới");
    expect((await listMindMaps())[0].title).toBe("Tên mới");
    await deleteMindMap(map.id);
    expect(await listMindMaps()).toHaveLength(0);
    expect(await db.mindMapNodes.where("mapId").equals(map.id).filter((node)=>node.deletedAt===null).count()).toBe(0);
    expect((await getMapGraph(map.id)).nodes).toHaveLength(0);
  });

  it("tạo và xóa liên kết tự do mà không thay đổi parentId", async () => {
    const { map, root } = await createMindMap();
    const target = await addMindMapNode(map.id, null, "Mục tiêu", 720, 80);
    const edge = await addMindMapEdge(map.id, root.id, target.id, "liên quan");
    expect(edge.edgeType).toBe("free");
    expect((await getMapGraph(map.id)).edges).toEqual([expect.objectContaining({ id: edge.id, sourceId: root.id, targetId: target.id, edgeType: "free" })]);
    expect((await db.mindMapNodes.get(target.id))?.parentId).toBeNull();
    await deleteMindMapEdge(edge.id);
    expect((await getMapGraph(map.id)).edges).toHaveLength(0);
  });

  it("tạo cây dự án và mở đúng phần/chương bằng ID",async()=>{const project=await createProject({title:"Nhất Niệm Trường Sinh",kind:"generic"});const section=await createSection(project.id,"Phần một");const chapter=await createChapter({projectId:project.id,sectionId:section.id,title:"Chương khai mở"});const map=await createOrSyncProjectMap(project.id);const graph=await getMapGraph(map.id);expect(graph.nodes).toHaveLength(3);const chapterNode=graph.nodes.find(node=>node.linkId===chapter.id)!;expect(chapterNode.parentId).toBe(graph.nodes.find(node=>node.linkId===section.id)?.id);expect(await resolveNodeLink(chapterNode)).toEqual({projectId:project.id,sectionId:section.id,chapterId:chapter.id});await createOrSyncProjectMap(project.id);expect((await getMapGraph(map.id)).nodes).toHaveLength(3);});

  it("đồng bộ dự án không ghi đè vị trí, parent và liên kết tự do", async () => {
    const project = await createProject({ title: "Bản đồ dài kỳ", kind: "novel" });
    const section = await createSection(project.id, "Kỷ nguyên đầu");
    const chapter = await createChapter({ projectId: project.id, sectionId: section.id, title: "Mở đầu" });
    const map = await createOrSyncProjectMap(project.id);
    let graph = await getMapGraph(map.id);
    const sectionNode = graph.nodes.find((node) => node.linkId === section.id)!;
    const chapterNode = graph.nodes.find((node) => node.linkId === chapter.id)!;
    const freeNode = await addMindMapNode(map.id, null, "Móc nối ẩn", 940, 420);
    const freeEdge = await addMindMapEdge(map.id, freeNode.id, chapterNode.id);
    await updateMindMapNode(chapterNode.id, { x: 1111, y: 777, parentId: null });
    await createOrSyncProjectMap(project.id);
    graph = await getMapGraph(map.id);
    const syncedChapter = graph.nodes.find((node) => node.id === chapterNode.id)!;
    expect(syncedChapter).toMatchObject({ x: 1111, y: 777, parentId: null });
    expect(graph.edges).toEqual(expect.arrayContaining([expect.objectContaining({ id: freeEdge.id, edgeType: "free" })]));
    expect(sectionNode.id).not.toBe(syncedChapter.id);
  });
});
