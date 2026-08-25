import { v4 as uuid } from "uuid";
import { db } from "../../database/db";
import type { MindMap, MindMapEdge, MindMapNode } from "../../types/entities";
const base = () => ({ createdAt: Date.now(), updatedAt: Date.now(), schemaVersion: 1, deletedAt: null, syncState: "local" as const });
export async function createMindMap(title = "Sơ đồ chưa đặt tên") {
  const map: MindMap = { id: uuid(), title, ...base() }; await db.mindMaps.add(map);
  const root = await addMindMapNode(map.id, null, "Chủ đề trung tâm", 380, 220); return { map, root };
}
export const listMindMaps = () => db.mindMaps.filter(x => x.deletedAt === null).toArray();
export async function addMindMapNode(mapId:string,parentId:string|null,title:string,x:number,y:number) {
  const node: MindMapNode = { id:uuid(),mapId,parentId,title,x,y,color:"#4fd1c5",collapsed:false,...base() }; await db.mindMapNodes.add(node);
  if(parentId){ const edge: MindMapEdge={id:uuid(),mapId,sourceId:parentId,targetId:node.id,label:"",...base()}; await db.mindMapEdges.add(edge); }
  return node;
}
export const getMapGraph = async(mapId:string) => ({ nodes: await db.mindMapNodes.where("mapId").equals(mapId).filter(x=>x.deletedAt===null).toArray(), edges: await db.mindMapEdges.where("mapId").equals(mapId).filter(x=>x.deletedAt===null).toArray() });
export const updateMindMapNode = (id:string, changes:Partial<Pick<MindMapNode,"title"|"x"|"y"|"color"|"collapsed">>) => db.mindMapNodes.update(id,{...changes,updatedAt:Date.now()});
export async function deleteMindMapNode(id:string){ const children=await db.mindMapNodes.where("parentId").equals(id).toArray(); await Promise.all(children.map(x=>deleteMindMapNode(x.id))); await db.mindMapNodes.update(id,{deletedAt:Date.now()}); const edges=await db.mindMapEdges.filter(e=>e.sourceId===id||e.targetId===id).toArray(); await db.mindMapEdges.bulkPut(edges.map(e=>({...e,deletedAt:Date.now()}))); }
