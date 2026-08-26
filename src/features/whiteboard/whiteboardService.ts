import {v4 as uuid} from "uuid"; import {db} from "../../database/db"; import type {Whiteboard,WhiteboardObject,WhiteboardObjectKind} from "../../types/entities";
const base=()=>({createdAt:Date.now(),updatedAt:Date.now(),schemaVersion:1,deletedAt:null,syncState:"local" as const});
export async function createWhiteboard(title="Bảng trắng chưa đặt tên"){const b:Whiteboard={id:uuid(),title,...base()};await db.whiteboards.add(b);return b}
export const listWhiteboards=()=>db.whiteboards.filter(x=>x.deletedAt===null).toArray(); export const getBoardObjects=(boardId:string)=>db.whiteboardObjects.where("boardId").equals(boardId).filter(x=>x.deletedAt===null).toArray();
export const renameWhiteboard=(id:string,title:string)=>db.whiteboards.update(id,{title,updatedAt:Date.now()});
export async function deleteWhiteboard(id:string){const deletedAt=Date.now();await db.transaction("rw",db.whiteboards,db.whiteboardObjects,async()=>{await db.whiteboards.update(id,{deletedAt,updatedAt:deletedAt});const objects=await db.whiteboardObjects.where("boardId").equals(id).filter(x=>x.deletedAt===null).toArray();if(objects.length)await db.whiteboardObjects.bulkPut(objects.map(x=>({...x,deletedAt,updatedAt:deletedAt})));});}
export async function addBoardObject(boardId:string,kind:WhiteboardObjectKind,x=160,y=120){const o:WhiteboardObject={id:uuid(),boardId,kind,x,y,width:kind==="text"?220:180,height:kind==="text"?72:120,text:kind==="note"?"Ý tưởng mới":"Văn bản",color:kind==="note"?"#d4a63c":"#4fd1c5",connectedToIds:[],...base()};await db.whiteboardObjects.add(o);return o}
export const updateBoardObject=(id:string,c:Partial<WhiteboardObject>)=>db.whiteboardObjects.update(id,{...c,updatedAt:Date.now()});
export async function connectBoardObjects(sourceId:string,targetId:string){
  if(sourceId===targetId)throw new Error("Không thể nối một hình với chính nó.");
  const source=await db.whiteboardObjects.get(sourceId); const target=await db.whiteboardObjects.get(targetId);
  if(!source||!target||source.boardId!==target.boardId)throw new Error("Hai hình không thuộc cùng một bảng.");
  const connectedToIds=[...new Set([...(source.connectedToIds??[]),targetId])];
  await updateBoardObject(sourceId,{connectedToIds});
}
export async function removeBoardObjectConnections(id:string){
  const item=await db.whiteboardObjects.get(id); if(!item)return;
  const peers=await db.whiteboardObjects.where("boardId").equals(item.boardId).filter(x=>x.deletedAt===null).toArray();
  await db.transaction("rw",db.whiteboardObjects,async()=>{
    await updateBoardObject(id,{connectedToIds:[]});
    for(const peer of peers){if((peer.connectedToIds??[]).includes(id))await updateBoardObject(peer.id,{connectedToIds:(peer.connectedToIds??[]).filter(target=>target!==id)});}
  });
}
export async function deleteBoardObject(id:string){await removeBoardObjectConnections(id);await db.whiteboardObjects.update(id,{deletedAt:Date.now(),updatedAt:Date.now()});}
