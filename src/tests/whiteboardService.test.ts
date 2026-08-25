import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../database/db";
import { addBoardObject, createWhiteboard, deleteBoardObject, getBoardObjects, updateBoardObject } from "../features/whiteboard/whiteboardService";

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
});
