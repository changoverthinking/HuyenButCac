import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../database/db";
import { addStroke, deleteStroke, listStrokes, smoothPoints, updateStroke } from "../features/canvas/strokesService";

describe("strokesService",()=>{
  beforeEach(async()=>{await db.delete();await db.open();});
  it("lưu, cập nhật, khóa và xóa nét theo đúng không gian",async()=>{const stroke=await addStroke("mindmap",{ownerId:"map-1",points:[{x:0,y:0},{x:10,y:10}],color:"#fff",width:4,dash:"dashed",arrow:"end",smoothed:true,locked:false});expect(await listStrokes("whiteboard","map-1")).toHaveLength(0);await updateStroke("mindmap",stroke.id,{locked:true,width:7});expect((await listStrokes("mindmap","map-1"))[0]).toMatchObject({locked:true,width:7});await deleteStroke("mindmap",stroke.id);expect(await listStrokes("mindmap","map-1")).toHaveLength(0);});
  it("làm mượt giữ hai đầu và giảm dao động điểm giữa",()=>{const input=[{x:0,y:0},{x:10,y:20},{x:20,y:0}];const output=smoothPoints(input);expect(output[0]).toEqual(input[0]);expect(output[2]).toEqual(input[2]);expect(output[1].y).toBe(10);});
});
