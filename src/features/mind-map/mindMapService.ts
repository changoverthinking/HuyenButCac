import { v4 as uuid } from "uuid";
import { db } from "../../database/db";
import type { MindMap, MindMapEdge, MindMapEdgeType, MindMapNode } from "../../types/entities";

const base = () => ({
  createdAt: Date.now(),
  updatedAt: Date.now(),
  schemaVersion: 1,
  deletedAt: null,
  syncState: "local" as const,
});

/** Dữ liệu cũ chưa có edgeType nên mặc định vẫn là cạnh cây. */
export function getMindMapEdgeType(edge: MindMapEdge): MindMapEdgeType {
  return edge.edgeType ?? "tree";
}

export async function createMindMap(title = "Sơ đồ chưa đặt tên", projectId: string | null = null) {
  const map: MindMap = { id: uuid(), title, projectId, ...base() };
  await db.mindMaps.add(map);
  const root = await addMindMapNode(map.id, null, "Chủ đề trung tâm", 380, 220);
  return { map, root };
}

export async function listMindMaps(): Promise<MindMap[]> {
  const maps = await db.mindMaps.filter((map) => map.deletedAt === null).toArray();
  return maps.sort((a, b) => a.createdAt - b.createdAt);
}

export const renameMindMap = (id: string, title: string) =>
  db.mindMaps.update(id, { title, updatedAt: Date.now() });

export async function deleteMindMap(id: string) {
  const deletedAt = Date.now();
  await db.transaction("rw", db.mindMaps, db.mindMapNodes, db.mindMapEdges, db.mindMapStrokes, async () => {
    await db.mindMaps.update(id, { deletedAt, updatedAt: deletedAt });
    const nodes = await db.mindMapNodes.where("mapId").equals(id).filter((node) => node.deletedAt === null).toArray();
    const edges = await db.mindMapEdges.where("mapId").equals(id).filter((edge) => edge.deletedAt === null).toArray();
    if (nodes.length) await db.mindMapNodes.bulkPut(nodes.map((node) => ({ ...node, deletedAt, updatedAt: deletedAt })));
    if (edges.length) await db.mindMapEdges.bulkPut(edges.map((edge) => ({ ...edge, deletedAt, updatedAt: deletedAt })));
    const strokes = await db.mindMapStrokes.where("ownerId").equals(id).filter((stroke) => stroke.deletedAt === null).toArray();
    if (strokes.length) await db.mindMapStrokes.bulkPut(strokes.map((stroke) => ({ ...stroke, deletedAt, updatedAt: deletedAt })));
  });
}

export async function addMindMapNode(
  mapId: string,
  parentId: string | null,
  title: string,
  x: number,
  y: number,
  link?: Pick<MindMapNode, "linkType" | "linkId">
) {
  const node: MindMapNode = {
    id: uuid(),
    mapId,
    parentId,
    title,
    x,
    y,
    color: "#4fd1c5",
    collapsed: false,
    linkType: link?.linkType ?? null,
    linkId: link?.linkId ?? null,
    ...base(),
  };
  await db.mindMapNodes.add(node);
  if (parentId) {
    const edge: MindMapEdge = {
      id: uuid(),
      mapId,
      sourceId: parentId,
      targetId: node.id,
      label: "",
      edgeType: "tree",
      ...base(),
    };
    await db.mindMapEdges.add(edge);
  }
  return node;
}

export const getMapGraph = async (mapId: string) => {
  const map = await db.mindMaps.get(mapId);
  if (!map || map.deletedAt !== null) return { nodes: [], edges: [] };
  let nodes = await db.mindMapNodes.where("mapId").equals(mapId).filter((node) => node.deletedAt === null).toArray();
  if (nodes.length === 0) nodes = [await addMindMapNode(mapId, null, "Chủ đề trung tâm", 380, 220)];
  nodes.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = await db.mindMapEdges
    .where("mapId")
    .equals(mapId)
    .filter((edge) => edge.deletedAt === null && nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId))
    .toArray();
  return { nodes, edges };
};

export const updateMindMapNode = (
  id: string,
  changes: Partial<Pick<MindMapNode, "title" | "x" | "y" | "color" | "collapsed" | "parentId" | "linkType" | "linkId">>
) => db.mindMapNodes.update(id, { ...changes, updatedAt: Date.now() });

/**
 * Tạo liên kết tự do giữa hai ô. Liên kết này không thay đổi parentId,
 * vì vậy người viết có thể vừa giữ cấu trúc cây vừa vẽ quan hệ chéo.
 */
export async function addMindMapEdge(
  mapId: string,
  sourceId: string,
  targetId: string,
  label = "",
  edgeType: MindMapEdgeType = "free"
): Promise<MindMapEdge> {
  if (sourceId === targetId) throw new Error("Không thể nối một ô với chính nó.");
  const map = await db.mindMaps.get(mapId);
  if (!map || map.deletedAt !== null) throw new Error("Sơ đồ không còn tồn tại.");
  const [source, target] = await Promise.all([db.mindMapNodes.get(sourceId), db.mindMapNodes.get(targetId)]);
  if (!source || source.deletedAt !== null || source.mapId !== mapId || !target || target.deletedAt !== null || target.mapId !== mapId) {
    throw new Error("Hai ô phải thuộc cùng một sơ đồ đang mở.");
  }

  const existing = await db.mindMapEdges
    .where("mapId")
    .equals(mapId)
    .filter((edge) => edge.deletedAt === null
      && edge.sourceId === sourceId
      && edge.targetId === targetId
      && getMindMapEdgeType(edge) === edgeType)
    .first();
  if (existing) return existing;

  const edge: MindMapEdge = { id: uuid(), mapId, sourceId, targetId, label, edgeType, ...base() };
  await db.mindMapEdges.add(edge);
  return edge;
}

export async function updateMindMapEdge(id: string, patch: Pick<Partial<MindMapEdge>, "label">) {
  await db.mindMapEdges.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteMindMapEdge(id: string) {
  const edge = await db.mindMapEdges.get(id);
  if (!edge || edge.deletedAt !== null) return;
  const deletedAt = Date.now();
  await db.transaction("rw", db.mindMapEdges, db.mindMapNodes, async () => {
    // Xóa cạnh cây cũng gỡ quan hệ cha-con; xóa cạnh tự do chỉ xóa dây nối.
    if (getMindMapEdgeType(edge) === "tree") {
      const target = await db.mindMapNodes.get(edge.targetId);
      if (target && target.deletedAt === null && target.parentId === edge.sourceId) {
        await db.mindMapNodes.update(target.id, { parentId: null, updatedAt: deletedAt });
      }
    }
    await db.mindMapEdges.update(id, { deletedAt, updatedAt: deletedAt });
  });
}

/**
 * Đồng bộ cấu trúc dự án vào sơ đồ mà không phá bố cục/quan hệ người dùng đã chỉnh.
 * Chỉ node mới nhận parent mặc định; node đã tồn tại giữ nguyên parentId, x, y và cạnh tự do.
 */
export async function createOrSyncProjectMap(projectId: string) {
  const project = await db.projects.get(projectId);
  if (!project || project.deletedAt !== null) throw new Error("Dự án không còn tồn tại.");

  let map = await db.mindMaps.where("projectId").equals(projectId).filter((item) => item.deletedAt === null).first();
  if (!map) {
    map = (await createMindMap(project.title, projectId)).map;
  } else {
    await db.mindMaps.update(map.id, { title: project.title, updatedAt: Date.now() });
  }

  const sections = await db.projectSections.where("projectId").equals(projectId).filter((item) => item.deletedAt === null).sortBy("order");
  const chapters = await db.projectChapters.where("projectId").equals(projectId).filter((item) => item.deletedAt === null).sortBy("order");
  let nodes = await db.mindMapNodes.where("mapId").equals(map.id).filter((item) => item.deletedAt === null).toArray();

  let root = nodes.find((item) => item.linkType === "project" && item.linkId === projectId) ?? nodes.find((item) => item.parentId === null);
  if (!root) {
    root = await addMindMapNode(map.id, null, project.title, 100, 180, { linkType: "project", linkId: projectId });
  } else {
    await updateMindMapNode(root.id, { title: project.title, linkType: "project", linkId: projectId });
  }

  nodes = await db.mindMapNodes.where("mapId").equals(map.id).filter((item) => item.deletedAt === null).toArray();
  const byLink = new Map(nodes.filter((item) => item.linkId).map((item) => [item.linkId!, item]));
  const sectionNodes = new Map<string, MindMapNode>();

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    let node = byLink.get(section.id);
    if (!node) {
      node = await addMindMapNode(map.id, root.id, section.title, 340, 70 + index * 150, { linkType: "section", linkId: section.id });
      byLink.set(section.id, node);
    } else {
      await updateMindMapNode(node.id, { title: section.title, linkType: "section", linkId: section.id });
    }
    sectionNodes.set(section.id, node);
  }

  const unsectioned = chapters.filter((item) => item.sectionId === null);
  for (let index = 0; index < chapters.length; index += 1) {
    const chapter = chapters[index];
    const parent = chapter.sectionId ? sectionNodes.get(chapter.sectionId) : root;
    if (!parent) continue;
    let node = byLink.get(chapter.id);
    const siblingIndex = chapter.sectionId
      ? chapters.filter((item) => item.sectionId === chapter.sectionId).findIndex((item) => item.id === chapter.id)
      : unsectioned.findIndex((item) => item.id === chapter.id);
    if (!node) {
      node = await addMindMapNode(map.id, parent.id, chapter.title, chapter.sectionId ? 610 : 340, parent.y + siblingIndex * 62, { linkType: "chapter", linkId: chapter.id });
      byLink.set(chapter.id, node);
    } else {
      // Không đụng vào node.parentId/x/y: đây là quyền tự do bố trí của người viết.
      await updateMindMapNode(node.id, { title: chapter.title, linkType: "chapter", linkId: chapter.id });
    }
  }

  const validLinks = new Set([projectId, ...sections.map((item) => item.id), ...chapters.map((item) => item.id)]);
  const linkedNodes = await db.mindMapNodes.where("mapId").equals(map.id).filter((item) => item.deletedAt === null && Boolean(item.linkId)).toArray();
  const stale = linkedNodes.filter((node) => node.linkId && !validLinks.has(node.linkId));
  if (stale.length) {
    const deletedAt = Date.now();
    await db.mindMapNodes.bulkPut(stale.map((node) => ({ ...node, deletedAt, updatedAt: deletedAt })));
    const staleIds = new Set(stale.map((node) => node.id));
    const staleEdges = await db.mindMapEdges.where("mapId").equals(map.id).filter((edge) => edge.deletedAt === null && (staleIds.has(edge.sourceId) || staleIds.has(edge.targetId))).toArray();
    if (staleEdges.length) await db.mindMapEdges.bulkPut(staleEdges.map((edge) => ({ ...edge, deletedAt, updatedAt: deletedAt })));
  }

  // Nếu node cha bị xóa ở một lần đồng bộ khác, đưa node con về gốc thay vì làm mất node.
  const activeNodes = await db.mindMapNodes.where("mapId").equals(map.id).filter((item) => item.deletedAt === null).toArray();
  const activeIds = new Set(activeNodes.map((node) => node.id));
  const orphaned = activeNodes.filter((node) => node.parentId !== null && !activeIds.has(node.parentId));
  if (orphaned.length) {
    const detachedAt = Date.now();
    await db.mindMapNodes.bulkPut(orphaned.map((node) => ({ ...node, parentId: null, updatedAt: detachedAt })));
    const orphanEdges = await db.mindMapEdges.where("mapId").equals(map.id).filter((edge) => edge.deletedAt === null && getMindMapEdgeType(edge) === "tree" && orphaned.some((node) => node.id === edge.targetId)).toArray();
    if (orphanEdges.length) await db.mindMapEdges.bulkPut(orphanEdges.map((edge) => ({ ...edge, deletedAt: detachedAt, updatedAt: detachedAt })));
  }

  return map;
}

export async function resolveNodeLink(node: MindMapNode) {
  if (!node.linkType || !node.linkId) return null;
  if (node.linkType === "project") {
    const item = await db.projects.get(node.linkId);
    return item && item.deletedAt === null ? { projectId: item.id, sectionId: null, chapterId: null } : null;
  }
  if (node.linkType === "section") {
    const item = await db.projectSections.get(node.linkId);
    return item && item.deletedAt === null ? { projectId: item.projectId, sectionId: item.id, chapterId: null } : null;
  }
  const item = await db.projectChapters.get(node.linkId);
  return item && item.deletedAt === null ? { projectId: item.projectId, sectionId: item.sectionId, chapterId: item.id } : null;
}

export async function deleteMindMapNode(id: string) {
  const node = await db.mindMapNodes.get(id);
  if (!node || node.deletedAt !== null) return;
  const activeNodes = await db.mindMapNodes.where("mapId").equals(node.mapId).filter((item) => item.deletedAt === null).toArray();
  if (activeNodes.length <= 1) throw new Error("Không thể xóa ô cuối cùng. Sơ đồ phải còn ít nhất một ô.");

  const deletedAt = Date.now();
  const parent = node.parentId ? activeNodes.find((item) => item.id === node.parentId) : null;
  const children = activeNodes.filter((item) => item.parentId === id);
  const edges = await db.mindMapEdges.where("mapId").equals(node.mapId).filter((edge) => edge.deletedAt === null).toArray();

  await db.transaction("rw", db.mindMapNodes, db.mindMapEdges, async () => {
    for (const child of children) {
      await db.mindMapNodes.update(child.id, { parentId: parent?.id ?? null, updatedAt: deletedAt });
    }

    const childTreeEdges = edges.filter((edge) => getMindMapEdgeType(edge) === "tree" && edge.sourceId === id && children.some((child) => child.id === edge.targetId));
    if (childTreeEdges.length) await db.mindMapEdges.bulkPut(childTreeEdges.map((edge) => ({ ...edge, deletedAt, updatedAt: deletedAt })));

    if (parent) {
      for (const child of children) {
        const alreadyConnected = edges.some((edge) => edge.deletedAt === null
          && getMindMapEdgeType(edge) === "tree"
          && edge.sourceId === parent.id
          && edge.targetId === child.id);
        if (!alreadyConnected) {
          await db.mindMapEdges.add({
            id: uuid(),
            mapId: node.mapId,
            sourceId: parent.id,
            targetId: child.id,
            label: "",
            edgeType: "tree",
            ...base(),
          });
        }
      }
    }

    await db.mindMapNodes.update(id, { deletedAt, updatedAt: deletedAt });
    const incidentEdges = edges.filter((edge) => edge.sourceId === id || edge.targetId === id);
    if (incidentEdges.length) await db.mindMapEdges.bulkPut(incidentEdges.map((edge) => ({ ...edge, deletedAt, updatedAt: deletedAt })));
  });
}
