import Dexie, { type Table } from "dexie";
import { getActiveWorkspaceUserId } from "../../database/db";
import { DEFAULT_IMAGE_TRANSFORM, normalizeImageTransform, type ImageTransform } from "./imageTypes";

export type AppearanceTarget =
  | "app-background"
  | "notes"
  | "library"
  | "projects"
  | "mindmap"
  | "whiteboard"
  | "calendar"
  | "tools"
  | "account"
  | "tieu-nhi"
  | "tieu-nhi-avatar";

export interface AppearanceAsset {
  target: AppearanceTarget;
  fileName: string;
  mimeType: string;
  imageBlob: Blob;
  transform: ImageTransform;
  updatedAt: number;
}

class HuyenButAppearanceDB extends Dexie {
  assets!: Table<AppearanceAsset, AppearanceTarget>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({ assets: "&target, updatedAt" });
  }
}

const instances = new Map<string, HuyenButAppearanceDB>();

function databaseName() {
  const userId = getActiveWorkspaceUserId() ?? null;
  const suffix = userId ? encodeURIComponent(userId) : "local";
  return `huyen-but-cac-appearance-v1-${suffix}`;
}

function currentDb() {
  const name = databaseName();
  let instance = instances.get(name);
  if (!instance) {
    instance = new HuyenButAppearanceDB(name);
    instances.set(name, instance);
  }
  return instance;
}

export function validateAppearanceImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Tệp đã chọn không phải hình ảnh.");
  if (file.size <= 0) throw new Error("Tệp hình ảnh đang rỗng hoặc không đọc được.");
  if (file.size > 20 * 1024 * 1024) throw new Error("Ảnh vượt quá 20 MB. Hãy giảm kích thước ảnh trước khi lưu.");
}

function storageError(error: unknown) {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return new Error("Thiết bị không còn đủ dung lượng lưu ảnh giao diện.");
  }
  return error instanceof Error ? error : new Error("Không thể lưu ảnh giao diện.");
}

export async function listAppearanceAssets(): Promise<AppearanceAsset[]> {
  const assets = await currentDb().assets.toArray();
  return assets.map((asset) => ({ ...asset, transform: normalizeImageTransform(asset.transform) }));
}

export async function getAppearanceAsset(target: AppearanceTarget) {
  const asset = await currentDb().assets.get(target);
  return asset ? { ...asset, transform: normalizeImageTransform(asset.transform) } : undefined;
}

export async function saveAppearanceAsset(target: AppearanceTarget, file: File, transform: ImageTransform = DEFAULT_IMAGE_TRANSFORM) {
  validateAppearanceImage(file);
  const asset: AppearanceAsset = {
    target,
    fileName: file.name,
    mimeType: file.type || "image/*",
    imageBlob: file,
    transform: normalizeImageTransform(transform),
    updatedAt: Date.now(),
  };
  try {
    await currentDb().assets.put(asset);
    return asset;
  } catch (error) {
    throw storageError(error);
  }
}

export async function updateAppearanceTransform(target: AppearanceTarget, transform: ImageTransform) {
  const asset = await currentDb().assets.get(target);
  if (!asset) throw new Error("Chưa có ảnh để căn chỉnh.");
  const next = { ...asset, transform: normalizeImageTransform(transform), updatedAt: Date.now() };
  try {
    await currentDb().assets.put(next);
    return next;
  } catch (error) {
    throw storageError(error);
  }
}

export async function removeAppearanceAsset(target: AppearanceTarget) {
  await currentDb().assets.delete(target);
}
