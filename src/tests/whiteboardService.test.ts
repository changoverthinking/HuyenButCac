import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../database/db";
import { addBoardObject, connectBoardObjects, createWhiteboard, deleteBoardObject, deleteWhiteboard, getBoardObjects, listWhiteboards, removeBoardObjectConnections, renameWhiteboard, updateBoardObject } from "../features/whiteboard/whiteboardService";

describe("whiteboardService", () => {
  beforeEach(async () => { await db.delete(); await db.open(); });

  it("tạo bảng và các loại đối tượng", async () => {
    const board = await createWhiteboard("Ý tưởng");
    await addBoardObject(board.id, "note");
    await addBoardObject(board.id, "ellipse");
    expect(await getBoardObjects(board.id)).toHaveLength(2);
  });

  it("lưu nội dung và vị trí đối tượng", async () => {
    const board = await createWhiteboard();
    const object = await addBoardObject(board.id, "text");
    await updateBoardObject(object.id, { text: "Nội dung mới", x: 420, y: 260 });
    expect((await getBoardObjects(board.id))[0]).toMatchObject({ text: "Nội dung mới", x: 420, y: 260 });
  });

  it("xóa mềm không còn xuất hiện trên bảng", async () => {
    const board = await createWhiteboard();
    const object = await addBoardObject(board.id, "rectangle");
    await deleteBoardObject(object.id);
    expect(await getBoardObjects(board.id)).toHaveLength(0);
  });

  it("nối, bỏ nối và lưu quan hệ giữa các đối tượng",async()=>{
    const board=await createWhiteboard();const source=await addBoardObject(board.id,"note");const target=await addBoardObject(board.id,"ellipse");
    await connectBoardObjects(source.id,target.id);
    expect((await getBoardObjects(board.id)).find(item=>item.id===source.id)?.connectedToIds).toContain(target.id);
    await removeBoardObjectConnections(target.id);
    expect((await getBoardObjects(board.id)).find(item=>item.id===source.id)?.connectedToIds).not.toContain(target.id);
  });

  it("xóa hình tự dọn các đường nối liên quan",async()=>{
    const board=await createWhiteboard();const source=await addBoardObject(board.id,"note");const target=await addBoardObject(board.id,"rectangle");
    await connectBoardObjects(source.id,target.id);await deleteBoardObject(target.id);
    expect((await getBoardObjects(board.id)).find(item=>item.id===source.id)?.connectedToIds).toEqual([]);
  });

  it("đổi tên và xóa bảng kèm toàn bộ đối tượng", async () => {
    const board = await createWhiteboard("Cũ");
    await addBoardObject(board.id, "note");
    await renameWhiteboard(board.id, "Tên mới");
    expect((await listWhiteboards())[0].title).toBe("Tên mới");
    await deleteWhiteboard(board.id);
    expect(await listWhiteboards()).toHaveLength(0);
    expect(await getBoardObjects(board.id)).toHaveLength(0);
  });
});
