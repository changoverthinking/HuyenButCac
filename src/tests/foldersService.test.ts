import "fake-indexeddb/auto";
import { beforeEach,describe,expect,it } from "vitest";
import { db } from "../database/db";
import { createFolder,listFolders,moveFolder,renameFolder,softDeleteFolder } from "../features/folders/foldersService";
import { createNote } from "../features/notes/notesService";

describe("foldersService",()=>{
  beforeEach(async()=>{await db.delete();await db.open();});
  it("tạo, đổi tên và di chuyển thư mục",async()=>{const a=await createFolder("A",null);const b=await createFolder("B",null);await renameFolder(a.id,"A mới");await moveFolder(b.id,a.id);expect(await listFolders()).toEqual(expect.arrayContaining([expect.objectContaining({id:a.id,name:"A mới"}),expect.objectContaining({id:b.id,parentId:a.id})]));});
  it("chuẩn hóa tên và chặn thư mục rỗng",async()=>{const folder=await createFolder("  Tư liệu  ",null);expect(folder.name).toBe("Tư liệu");await expect(createFolder("   ",null)).rejects.toThrow("không được để trống");});
  it("chặn vòng lặp thư mục",async()=>{const a=await createFolder("A",null);const b=await createFolder("B",a.id);await expect(moveFolder(a.id,b.id)).rejects.toThrow("thư mục con");});
  it("đổi tên không cho phép tên rỗng",async()=>{const a=await createFolder("A",null);await expect(renameFolder(a.id,"   ")).rejects.toThrow("không được để trống");});
  it("chuyển thư mục sẽ chuẩn hóa order ở nhóm nguồn và đích",async()=>{const a=await createFolder("A",null);const b=await createFolder("B",null);const c=await createFolder("C",a.id);await moveFolder(b.id,a.id);const rows=await listFolders();const root=rows.filter((item)=>item.parentId===null);const children=rows.filter((item)=>item.parentId===a.id);expect(root.map((item)=>item.order)).toEqual([0]);expect(children.map((item)=>item.order)).toEqual([0,1]);expect(children.map((item)=>item.id)).toEqual([c.id,b.id]);});
  it("xóa cây thư mục và đưa ghi chú về Tất cả ghi chú",async()=>{const a=await createFolder("A",null);const b=await createFolder("B",a.id);const note=await createNote({folderId:b.id});await softDeleteFolder(a.id);expect(await listFolders()).toHaveLength(0);expect((await db.notes.get(note.id))?.folderId).toBeNull();});
});
