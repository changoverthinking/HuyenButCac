import { v4 as uuid } from "uuid";
import { db } from "../../database/db";
import type { MindMap, MindMapEdge, MindMapNode } from "../../types/entities";
const base = () => ({ createdAt: Date.now(), updatedAt: Date.now(), schemaVersion: 1, deletedAt: null, syncState: "local" as const });
export async function createMindMap(title = "Sơ đồ chưa đặt tên", projectId: string | null = null) {
  const map: MindMap = { id: uuid(), title, projectId, ...base() }; await db.mindMaps.add(map);
  const root = await addMindMapNode(map.id, null, "Chủ đề trung tâm", 380, 220); return { map, root };
}
export const listMindMaps = () => db.mindMaps.filter(x => x.deletedAt === null).toArray();
export const renameMindMap = (id:string,title:string) => db.mindMaps.update(id,{title,updatedAt:Date.now()});
export async function deleteMindMap(id:string){
  const deletedAt=Date.now();
  await db.transaction("rw",db.mindMaps,db.mindMapNodes,db.mindMapEdges,db.mindMapStrokes,async()=>{
    await db.mindMaps.update(id,{deletedAt,updatedAt:deletedAt});
    const nodes=await db.mindMapNodes.where("mapId").equals(id).filter(x=>x.deletedAt===null).toArray();
    const edges=await db.mindMapEdges.where("mapId").equals(id).filter(x=>x.deletedAt===null).toArray();
    if(nodes.length) await db.mindMapNodes.bulkPut(nodes.map(x=>({...x,deletedAt,updatedAt:deletedAt})));
    if(edges.length) await db.mindMapEdges.bulkPut(edges.map(x=>({...x,deletedAt,updatedAt:deletedAt})));
    const strokes=await db.mindMapStrokes.where("ownerId").equals(id).filter(x=>x.deletedAt===null).toArray();
    if(strokes.length)await db.mindMapStrokes.bulkPut(strokes.map(x=>({...x,deletedAt,updatedAt:deletedAt})));
  });
}
export async function addMindMapNode(mapId:string,parentId:string|null,title:string,x:number,y:number, link?: Pick<MindMapNode,"linkType"|"linkId">) {
  const node: MindMapNode = { id:uuid(),mapId,parentId,title,x,y,color:"#4fd1c5",collapsed:false,linkType:link?.linkType??null,linkId:link?.linkId??null,...base() }; await db.mindMapNodes.add(node);
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
export const updateMindMapNode = (id:string, changes:Partial<Pick<MindMapNode,"title"|"x"|"y"|"color"|"collapsed"|"parentId"|"linkType"|"linkId">>) => db.mindMapNodes.update(id,{...changes,updatedAt:Date.now()});

export async function createOrSyncProjectMap(projectId:string) {
  const project=await db.projects.get(projectId);
  if(!project||project.deletedAt!==null)throw new Error("Dự án không còn tồn tại.");
  let map=await db.mindMaps.where("projectId").equals(projectId).filter(item=>item.deletedAt===null).first();
  if(!map){map=(await createMindMap(project.title,projectId)).map;}
  else await db.mindMaps.update(map.id,{title:project.title,updatedAt:Date.now()});
  const sections=await db.projectSections.where("projectId").equals(projectId).filter(item=>item.deletedAt===null).sortBy("order");
  const chapters=await db.projectChapters.where("projectId").equals(projectId).filter(item=>item.deletedAt===null).sortBy("order");
  let nodes=await db.mindMapNodes.where("mapId").equals(map.id).filter(item=>item.deletedAt===null).toArray();
  let root=nodes.find(item=>item.linkType==="project"&&item.linkId===projectId)??nodes.find(item=>item.parentId===null);
  if(!root)root=await addMindMapNode(map.id,null,project.title,100,180,{linkType:"project",linkId:projectId});
  else await updateMindMapNode(root.id,{title:project.title,linkType:"project",linkId:projectId});
  nodes=await db.mindMapNodes.where("mapId").equals(map.id).filter(item=>item.deletedAt===null).toArray();
  const byLink=new Map(nodes.filter(item=>item.linkId).map(item=>[item.linkId!,item]));
  const sectionNodes=new Map<string,MindMapNode>();
  for(let index=0;index<sections.length;index+=1){const section=sections[index];let node=byLink.get(section.id);if(!node)node=await addMindMapNode(map.id,root.id,section.title,340,70+index*150,{linkType:"section",linkId:section.id});else await updateMindMapNode(node.id,{title:section.title,parentId:root.id,linkType:"section",linkId:section.id});sectionNodes.set(section.id,node);}
  const unsectioned=chapters.filter(item=>item.sectionId===null);
  for(let index=0;index<chapters.length;index+=1){const chapter=chapters[index];const parent=chapter.sectionId?sectionNodes.get(chapter.sectionId):root;if(!parent)continue;let node=byLink.get(chapter.id);const siblingIndex=chapter.sectionId?chapters.filter(item=>item.sectionId===chapter.sectionId).findIndex(item=>item.id===chapter.id):unsectioned.findIndex(item=>item.id===chapter.id);const x=chapter.sectionId?610:340;const y=parent.y+siblingIndex*62;if(!node)node=await addMindMapNode(map.id,parent.id,chapter.title,x,y,{linkType:"chapter",linkId:chapter.id});else await updateMindMapNode(node.id,{title:chapter.title,parentId:parent.id,linkType:"chapter",linkId:chapter.id});}
  const linkedNodes=await db.mindMapNodes.where("mapId").equals(map.id).filter(item=>item.deletedAt===null&&Boolean(item.linkId)).toArray();
  const validLinks=new Set([projectId,...sections.map(item=>item.id),...chapters.map(item=>item.id)]);
  const stale=linkedNodes.filter(node=>node.linkId&&!validLinks.has(node.linkId));
  if(stale.length){const deletedAt=Date.now();await db.mindMapNodes.bulkPut(stale.map(node=>({...node,deletedAt,updatedAt:deletedAt})));const staleIds=new Set(stale.map(node=>node.id));const staleEdges=await db.mindMapEdges.where("mapId").equals(map.id).filter(edge=>edge.deletedAt===null&&(staleIds.has(edge.sourceId)||staleIds.has(edge.targetId))).toArray();if(staleEdges.length)await db.mindMapEdges.bulkPut(staleEdges.map(edge=>({...edge,deletedAt,updatedAt:deletedAt})));}
  const activeEdges=await db.mindMapEdges.where("mapId").equals(map.id).filter(item=>item.deletedAt===null).toArray();
  for(const node of linkedNodes.filter(item=>!stale.some(staleNode=>staleNode.id===item.id))){if(!node.parentId)continue;const incoming=activeEdges.filter(edge=>edge.targetId===node.id);const correct=incoming.find(edge=>edge.sourceId===node.parentId);const wrong=incoming.filter(edge=>edge.sourceId!==node.parentId);if(wrong.length)await db.mindMapEdges.bulkPut(wrong.map(edge=>({...edge,deletedAt:Date.now(),updatedAt:Date.now()})));if(!correct)await db.mindMapEdges.add({id:uuid(),mapId:map.id,sourceId:node.parentId,targetId:node.id,label:"",...base()});}
  return map;
}

export async function resolveNodeLink(node:MindMapNode) {
  if(!node.linkType||!node.linkId)return null;
  if(node.linkType==="project"){const item=await db.projects.get(node.linkId);return item&&item.deletedAt===null?{projectId:item.id,sectionId:null,chapterId:null}:null;}
  if(node.linkType==="section"){const item=await db.projectSections.get(node.linkId);return item&&item.deletedAt===null?{projectId:item.projectId,sectionId:item.id,chapterId:null}:null;}
  const item=await db.projectChapters.get(node.linkId);return item&&item.deletedAt===null?{projectId:item.projectId,sectionId:item.sectionId,chapterId:item.id}:null;
}
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
