import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../database/db";
import { addMusicFiles, clearCustomBackground, deleteMusicTrack, getCustomBackground, listMusicTracks, renameMusicTrack, saveCustomBackground } from "../features/media/mediaService";

describe("mediaService — nhạc nền và ảnh nền",()=>{
  beforeEach(async()=>{await db.delete();await db.open();});

  it("lưu, đổi tên và xóa MP3 trong IndexedDB",async()=>{
    const file=new File([new Uint8Array([1,2,3])],"thien-am.mp3",{type:"audio/mpeg"});
    const [track]=await addMusicFiles([file]);
    expect((await listMusicTracks())[0]).toMatchObject({name:"thien-am",fileName:"thien-am.mp3",size:3});
    await renameMusicTrack(track.id,"Thiên Âm");
    expect((await listMusicTracks())[0].name).toBe("Thiên Âm");
    await deleteMusicTrack(track.id);
    expect(await listMusicTracks()).toHaveLength(0);
  });

  it("từ chối tệp không phải MP3",async()=>{
    const file=new File(["x"],"ghi-chu.txt",{type:"text/plain"});
    await expect(addMusicFiles([file])).rejects.toThrow("Chỉ hỗ trợ tệp MP3");
  });

  it("lưu, đọc và xóa ảnh nền",async()=>{
    const file=new File([new Uint8Array([4,5,6])],"son-ha.png",{type:"image/png"});
    await saveCustomBackground(file);
    expect(await getCustomBackground()).toMatchObject({name:"son-ha.png",mimeType:"image/png"});
    await clearCustomBackground();
    expect(await getCustomBackground()).toBeUndefined();
  });
});
