import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../database/db";
import {
  addMusicFiles,
  clearCustomBackground,
  deleteMusicTrack,
  getCustomBackground,
  listMusicTracks,
  renameMusicTrack,
  saveCustomBackground,
} from "../features/media/mediaService";

describe("mediaService — Tiên Âm Các và ảnh nền", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it("lưu, đổi tên và xóa MP3 trong IndexedDB", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "thien-am.mp3", { type: "audio/mpeg" });
    const [track] = await addMusicFiles([file]);
    expect((await listMusicTracks())[0]).toMatchObject({
      name: "thien-am",
      fileName: "thien-am.mp3",
      size: 3,
      mimeType: "audio/mpeg",
    });
    expect(track.audioBlob).toBeInstanceOf(Blob);
    await renameMusicTrack(track.id, "Thiên Âm");
    expect((await listMusicTracks())[0].name).toBe("Thiên Âm");
    await deleteMusicTrack(track.id);
    expect(await listMusicTracks()).toHaveLength(0);
  });

  it("chấp nhận M4A thường gặp trên iPhone", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "tien-am.m4a", { type: "audio/mp4" });
    const [track] = await addMusicFiles([file]);
    expect(track).toMatchObject({
      name: "tien-am",
      mimeType: "audio/mp4",
      size: 3,
    });
  });

  it("từ chối tệp không phải âm thanh hỗ trợ", async () => {
    const file = new File(["x"], "ghi-chu.txt", { type: "text/plain" });
    await expect(addMusicFiles([file])).rejects.toThrow("hỗ trợ MP3");
  });

  it("lưu, đọc và xóa ảnh nền", async () => {
    const file = new File([new Uint8Array([4, 5, 6])], "son-ha.png", { type: "image/png" });
    const saved = await saveCustomBackground(file);
    expect(saved.imageBlob).toBeInstanceOf(Blob);
    expect(await getCustomBackground()).toMatchObject({
      name: "son-ha.png",
      mimeType: "image/png",
    });
    await clearCustomBackground();
    expect(await getCustomBackground()).toBeUndefined();
  });
});
