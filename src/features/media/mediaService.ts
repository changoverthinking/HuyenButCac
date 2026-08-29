import { v4 as uuid } from "uuid";
import { db } from "../../database/db";
import type { CustomBackground, MusicTrack } from "../../types/entities";

const base = () => ({ createdAt: Date.now(), updatedAt: Date.now(), schemaVersion: 1, deletedAt: null, syncState: "local" as const });
const requestPersistentStorage = () => {
  const request = navigator.storage?.persist?.();
  return request?.catch(() => false);
};

export async function addMusicFiles(files: File[]): Promise<MusicTrack[]> {
  const valid = files.filter((file) => file.type === "audio/mpeg" || file.name.toLowerCase().endsWith(".mp3"));
  if (valid.length !== files.length) throw new Error("Chỉ hỗ trợ tệp MP3.");
  if (valid.some((file)=>file.size>200*1024*1024)) throw new Error("Mỗi bài hát phải nhỏ hơn 200 MB.");
  await requestPersistentStorage();
  const tracks = valid.map((file): MusicTrack => ({ id: uuid(), name: file.name.replace(/\.mp3$/i, ""), fileName: file.name, mimeType: file.type || "audio/mpeg", size: file.size, audioBlob: file, ...base() }));
  await db.musicTracks.bulkAdd(tracks);
  return tracks;
}

export async function listMusicTracks(): Promise<MusicTrack[]> {
  return (await db.musicTracks.filter((track) => track.deletedAt === null).toArray()).sort((a,b)=>a.createdAt-b.createdAt);
}

export async function deleteMusicTrack(id: string): Promise<void> { await db.musicTracks.delete(id); }
export async function renameMusicTrack(id: string, name: string): Promise<void> { await db.musicTracks.update(id,{name,updatedAt:Date.now()}); }

export async function saveCustomBackground(file: File): Promise<CustomBackground> {
  if (!file.type.startsWith("image/")) throw new Error("Vui lòng chọn một tệp hình ảnh.");
  if (file.size>20*1024*1024) throw new Error("Ảnh nền phải nhỏ hơn 20 MB.");
  await requestPersistentStorage();
  const item: CustomBackground = { id: "active-background", name: file.name, mimeType: file.type, imageBlob: file, ...base() };
  await db.customBackgrounds.put(item);
  return item;
}
export const getCustomBackground = () => db.customBackgrounds.get("active-background");
export const clearCustomBackground = () => db.customBackgrounds.delete("active-background");
