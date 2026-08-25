import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../database/db";
import { addMindMapNode, createMindMap, deleteMindMap, deleteMindMapNode, getMapGraph, listMindMaps, renameMindMap, updateMindMapNode } from "../features/mind-map/mindMapService";

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

  it("xóa node cha sẽ soft-delete toàn bộ nhánh con", async () => {
    const { map, root } = await createMindMap();
    const child = await addMindMapNode(map.id, root.id, "Con", 0, 0);
    await addMindMapNode(map.id, child.id, "Cháu", 0, 0);
    await deleteMindMapNode(child.id);
    const graph = await getMapGraph(map.id);
    expect(graph.nodes.map((node) => node.id)).toEqual([root.id]);
    expect(graph.edges).toHaveLength(0);
  });

  it("không cho xóa chủ đề trung tâm", async () => {
    const { map, root } = await createMindMap();
    await expect(deleteMindMapNode(root.id)).rejects.toThrow("Không thể xóa chủ đề trung tâm");
    const graph = await getMapGraph(map.id);
    expect(graph.nodes.map((node) => node.id)).toEqual([root.id]);
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
});
