import { v4 as uuid } from "uuid";
import { db } from "../../database/db";
import type { CustomBackground, MusicTrack } from "../../types/entities";

const MB = 1024 * 1024;
const MAX_AUDIO_BYTES = 200 * MB;
const MAX_BACKGROUND_BYTES = 20 * MB;

const base = () => ({
  createdAt: Date.now(),
  updatedAt: Date.now(),
  schemaVersion: 1,
  deletedAt: null,
  syncState: "local" as const,
});

const AUDIO_BY_EXTENSION: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
};

function extensionOf(name: string) {
  const match = /\.([^.]+)$/.exec(name.toLowerCase());
  return match?.[1] ?? "";
}

function normalizedAudioMime(file: File) {
  const extension = extensionOf(file.name);
  if (AUDIO_BY_EXTENSION[extension]) return AUDIO_BY_EXTENSION[extension];
  const mime = file.type.toLowerCase();
  if (mime === "audio/mpeg" || mime === "audio/mp3") return "audio/mpeg";
  if (mime === "audio/mp4" || mime === "audio/x-m4a") return "audio/mp4";
  if (mime === "audio/aac" || mime === "audio/x-aac") return "audio/aac";
  if (mime === "audio/wav" || mime === "audio/x-wav" || mime === "audio/wave") return "audio/wav";
  return null;
}

function isQuotaError(error: unknown) {
  return error instanceof DOMException && (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED"
  );
}

async function requestPersistentStorage() {
  if (typeof navigator === "undefined") return false;
  try {
    return await navigator.storage?.persist?.() ?? false;
  } catch {
    return false;
  }
}

async function assertEnoughStorage(bytesToAdd: number) {
  if (typeof navigator === "undefined") return;
  try {
    const estimate = await navigator.storage?.estimate?.();
    if (!estimate?.quota || estimate.usage === undefined) return;
    const available = Math.max(0, estimate.quota - estimate.usage);
    if (bytesToAdd > available * 0.92) {
      throw new Error(
        "Thiết bị không còn đủ dung lượng lưu cục bộ. Hãy xóa bớt nhạc/ảnh hoặc giải phóng bộ nhớ rồi thử lại.",
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("không còn đủ dung lượng")) throw error;
  }
}

function browserSafeBlob(file: File, mimeType: string): Blob {
  // Safari/iOS ổn định hơn khi IndexedDB lưu Blob thuần thay vì giữ File handle
  // do trình chọn tệp cung cấp.
  return file.slice(0, file.size, mimeType);
}

export async function addMusicFiles(files: File[]): Promise<MusicTrack[]> {
  if (!files.length) return [];

  const normalized = files.map((file) => ({
    file,
    mimeType: normalizedAudioMime(file),
  }));

  if (normalized.some((item) => !item.mimeType)) {
    throw new Error("Tiên Âm Các hỗ trợ MP3, M4A/AAC và WAV.");
  }
  if (files.some((file) => file.size <= 0)) {
    throw new Error("Có tệp âm thanh rỗng hoặc không đọc được.");
  }
  if (files.some((file) => file.size > MAX_AUDIO_BYTES)) {
    throw new Error("Mỗi tệp âm thanh phải nhỏ hơn 200 MB.");
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  await requestPersistentStorage();
  await assertEnoughStorage(totalBytes);

  const tracks = normalized.map(({ file, mimeType }): MusicTrack => {
    const safeMime = mimeType!;
    const extension = extensionOf(file.name);
    const displayName = extension
      ? file.name.slice(0, -(extension.length + 1))
      : file.name;

    return {
      id: uuid(),
      name: displayName || "Không tên",
      fileName: file.name,
      mimeType: safeMime,
      size: file.size,
      audioBlob: browserSafeBlob(file, safeMime),
      ...base(),
    };
  });

  try {
    await db.musicTracks.bulkAdd(tracks);
  } catch (error) {
    if (isQuotaError(error)) {
      throw new Error("Không đủ dung lượng để lưu nhạc trên thiết bị này.");
    }
    throw error;
  }

  return tracks;
}

export async function listMusicTracks(): Promise<MusicTrack[]> {
  return (await db.musicTracks
    .filter((track) => track.deletedAt === null)
    .toArray())
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function deleteMusicTrack(id: string): Promise<void> {
  await db.musicTracks.delete(id);
}

export async function renameMusicTrack(id: string, name: string): Promise<void> {
  const cleanName = name.trim();
  if (!cleanName) throw new Error("Tên bài hát không được để trống.");
  await db.musicTracks.update(id, { name: cleanName, updatedAt: Date.now() });
}

export async function saveCustomBackground(file: File): Promise<CustomBackground> {
  const mimeType = file.type.toLowerCase();
  const extension = extensionOf(file.name);
  const looksLikeImage = mimeType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(extension);

  if (!looksLikeImage) throw new Error("Vui lòng chọn một tệp hình ảnh.");
  if (file.size <= 0) throw new Error("Ảnh đã chọn rỗng hoặc không đọc được.");
  if (file.size > MAX_BACKGROUND_BYTES) throw new Error("Ảnh nền phải nhỏ hơn 20 MB.");

  await requestPersistentStorage();
  await assertEnoughStorage(file.size);

  const safeMime = mimeType.startsWith("image/")
    ? mimeType
    : extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : extension === "gif"
          ? "image/gif"
          : extension === "heic" || extension === "heif"
            ? "image/heic"
            : "image/jpeg";

  const item: CustomBackground = {
    id: "active-background",
    name: file.name,
    mimeType: safeMime,
    imageBlob: browserSafeBlob(file, safeMime),
    ...base(),
  };

  try {
    await db.customBackgrounds.put(item);
  } catch (error) {
    if (isQuotaError(error)) {
      throw new Error("Không đủ dung lượng để lưu ảnh nền trên thiết bị này.");
    }
    throw error;
  }
  return item;
}

export const getCustomBackground = () => db.customBackgrounds.get("active-background");
export const clearCustomBackground = () => db.customBackgrounds.delete("active-background");
