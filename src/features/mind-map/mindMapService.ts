import { v4 as uuid } from "uuid";
import { db } from "../../database/db";
import type { MindMap, MindMapEdge, MindMapNode } from "../../types/entities";
const base = () => ({ createdAt: Date.now(), updatedAt: Date.now(), schemaVersion: 1, deletedAt: null, syncState: "local" as const });
export async function createMindMap(title = "Sơ đồ chưa đặt tên") {
  const map: MindMap = { id: uuid(), title, ...base() }; await db.mindMaps.add(map);
  const root = await addMindMapNode(map.id, null, "Chủ đề trung tâm", 380, 220); return { map, root };
}
export const listMindMaps = () => db.mindMaps.filter(x => x.deletedAt === null).toArray();
export const renameMindMap = (id:string,title:string) => db.mindMaps.update(id,{title,updatedAt:Date.now()});
export async function deleteMindMap(id:string){
  const deletedAt=Date.now();
  await db.transaction("rw",db.mindMaps,db.mindMapNodes,db.mindMapEdges,async()=>{
    await db.mindMaps.update(id,{deletedAt,updatedAt:deletedAt});
    const nodes=await db.mindMapNodes.where("mapId").equals(id).filter(x=>x.deletedAt===null).toArray();
    const edges=await db.mindMapEdges.where("mapId").equals(id).filter(x=>x.deletedAt===null).toArray();
    if(nodes.length) await db.mindMapNodes.bulkPut(nodes.map(x=>({...x,deletedAt,updatedAt:deletedAt})));
    if(edges.length) await db.mindMapEdges.bulkPut(edges.map(x=>({...x,deletedAt,updatedAt:deletedAt})));
  });
}
export async function addMindMapNode(mapId:string,parentId:string|null,title:string,x:number,y:number) {
  const node: MindMapNode = { id:uuid(),mapId,parentId,title,x,y,color:"#4fd1c5",collapsed:false,...base() }; await db.mindMapNodes.add(node);
  if(parentId){ const edge: MindMapEdge={id:uuid(),mapId,sourceId:parentId,targetId:node.id,label:"",...base()}; await db.mindMapEdges.add(edge); }
  return node;
}
export const getMapGraph = async(mapId:string) => {
  const map=await db.mindMaps.get(mapId);
  if(!map||map.deletedAt!==null)return {nodes:[],edges:[]};
  let nodes = await db.mindMapNodes.where("mapId").equals(mapId).filter(x=>x.deletedAt===null).toArray();
  if (nodes.length === 0) nodes = [await addMindMapNode(mapId, null, "Chủ đề trung tâm", 380, 220)];
  const edges = await db.mindMapEdges.where("mapId").equals(mapId).filter(x=>x.deletedAt===null).toArray();
  return { nodes, edges };
};
export const updateMindMapNode = (id:string, changes:Partial<Pick<MindMapNode,"title"|"x"|"y"|"color"|"collapsed">>) => db.mindMapNodes.update(id,{...changes,updatedAt:Date.now()});
export async function deleteMindMapNode(id:string){
  const node = await db.mindMapNodes.get(id);
  if (!node || node.deletedAt !== null) return;
  if (node.parentId === null) throw new Error("Không thể xóa chủ đề trung tâm");
  const children=await db.mindMapNodes.where("parentId").equals(id).filter(x=>x.deletedAt===null).toArray();
  await Promise.all(children.map(x=>deleteMindMapNode(x.id)));
  await db.mindMapNodes.update(id,{deletedAt:Date.now(),updatedAt:Date.now()});
  const edges=await db.mindMapEdges.filter(e=>(e.sourceId===id||e.targetId===id)&&e.deletedAt===null).toArray();
  if (edges.length) await db.mindMapEdges.bulkPut(edges.map(e=>({...e,deletedAt:Date.now(),updatedAt:Date.now()})));
}
