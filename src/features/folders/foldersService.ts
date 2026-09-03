import { v4 as uuid } from "uuid";
import { db } from "../../database/db";
import type { Folder } from "../../types/entities";

export async function createFolder(name: string, parentId: string | null): Promise<Folder> {
  const cleanName=name.trim();
  if(!cleanName)throw new Error("Tên thư mục không được để trống.");
  const now = Date.now();
  const siblings = await db.folders
    .filter((f) => f.parentId === parentId && f.deletedAt === null)
    .toArray();
  const nextOrder = siblings.reduce((max, folder) => Math.max(max, folder.order), -1) + 1;
  const folder: Folder = {
    id: uuid(),
    name:cleanName,
    parentId,
    order: nextOrder,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    deletedAt: null,
    syncState: "local",
  };
  await db.folders.add(folder);
  return folder;
}

export async function renameFolder(id: string, name: string): Promise<void> {
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Tên thư mục không được để trống.");
  await db.folders.update(id, { name: cleanName, updatedAt: Date.now() });
}

/** Ngăn vòng lặp và chuẩn hóa thứ tự khi chuyển thư mục sang parent mới. */
export async function moveFolder(id: string, newParentId: string | null): Promise<void> {
  if (newParentId === id) throw new Error("Không thể chuyển thư mục vào chính nó.");
  await db.transaction("rw", db.folders, async () => {
    const folder = await db.folders.get(id);
    if (!folder || folder.deletedAt !== null) throw new Error("Không tìm thấy thư mục cần chuyển.");
    const all = await db.folders.filter((item) => item.deletedAt === null).toArray();
    if (newParentId) {
      const target = all.find((item) => item.id === newParentId);
      if (!target) throw new Error("Thư mục đích không tồn tại.");
      let current = target;
      while (current.parentId) {
        if (current.parentId === id) throw new Error("Không thể chuyển thư mục vào thư mục con của chính nó.");
        const next = all.find((item) => item.id === current.parentId);
        if (!next) break;
        current = next;
      }
    }
    if (folder.parentId === newParentId) return;
    const stamp = Date.now();
    const sortGroup = (parentId: string | null) => all
      .filter((item) => item.id !== id && item.parentId === parentId)
      .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
    const source = sortGroup(folder.parentId);
    const target = sortGroup(newParentId);
    await db.folders.bulkPut([
      ...source.map((item, index) => ({ ...item, order: index, updatedAt: stamp })),
      ...target.map((item, index) => ({ ...item, order: index, updatedAt: stamp })),
      { ...folder, parentId: newParentId, order: target.length, updatedAt: stamp },
    ]);
  });
}

export async function softDeleteFolder(id: string): Promise<void> {
  const deletedAt=Date.now();
  await db.transaction("rw",db.folders,db.notes,async()=>{
    const active=await db.folders.filter((folder)=>folder.deletedAt===null).toArray();
    const ids=new Set<string>([id]);
    let changed=true;
    while(changed){changed=false;for(const folder of active){if(folder.parentId&&ids.has(folder.parentId)&&!ids.has(folder.id)){ids.add(folder.id);changed=true;}}}
    const folders=active.filter((folder)=>ids.has(folder.id));
    if(folders.length)await db.folders.bulkPut(folders.map((folder)=>({...folder,deletedAt,updatedAt:deletedAt})));
    const notes=await db.notes.filter((note)=>note.deletedAt===null&&note.folderId!==null&&ids.has(note.folderId)).toArray();
    if(notes.length)await db.notes.bulkPut(notes.map((note)=>({...note,folderId:null,updatedAt:deletedAt})));
  });
}

export async function listFolders(): Promise<Folder[]> {
  const folders = await db.folders.filter((f) => f.deletedAt === null).toArray();
  return folders.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}
