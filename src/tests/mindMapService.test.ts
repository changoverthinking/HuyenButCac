import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../database/db";
import { addMindMapNode, createMindMap, deleteMindMapNode, getMapGraph, updateMindMapNode } from "../features/mind-map/mindMapService";

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
});
