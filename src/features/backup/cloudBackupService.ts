import type { User } from "@supabase/supabase-js";
import { APP_CONFIG } from "../../app/appConfig";
import { supabase } from "../auth/supabase";
import { decryptBytes, encryptBytes, isVaultUnlocked } from "../crypto/vaultService";
import {
  createWorkspaceBackup,
  parseWorkspaceBackup,
  restoreWorkspaceBackup,
  stringifyWorkspaceBackup,
  type RestoreSummary,
  type WorkspaceBackup,
} from "./workspaceBackupService";
import { localGet, localSet } from "../app/safeStorage";

const BUCKET = "hbc-private";
const CLOUD_BACKUP_AAD_VERSION = 1;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesAsArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function backupPath(userId: string) {
  return `${userId}/workspace/latest.hbc-backup.enc`;
}

function backupAad(userId: string) {
  return `workspace-backup:${userId}:v${CLOUD_BACKUP_AAD_VERSION}`;
}

async function streamToBytes(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    length += value.length;
  }
  const output = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

async function compress(bytes: Uint8Array) {
  if (typeof CompressionStream === "undefined") return { flag: 0, bytes };
  const source = new Blob([bytesAsArrayBuffer(bytes)]).stream().pipeThrough(new CompressionStream("gzip"));
  return { flag: 1, bytes: await streamToBytes(source) };
}

async function decompress(flag: number, bytes: Uint8Array) {
  if (flag === 0) return bytes;
  if (flag !== 1) throw new Error("Bản sao cloud dùng kiểu nén chưa được hỗ trợ.");
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Trình duyệt này chưa hỗ trợ giải nén bản sao cloud. Hãy dùng Chrome/Safari/Edge mới hơn.");
  }
  const source = new Blob([bytesAsArrayBuffer(bytes)]).stream().pipeThrough(new DecompressionStream("gzip"));
  return streamToBytes(source);
}

function packClearPayload(flag: number, bytes: Uint8Array) {
  const output = new Uint8Array(bytes.length + 1);
  output[0] = flag;
  output.set(bytes, 1);
  return output;
}

async function unpackClearPayload(payload: Uint8Array) {
  if (!payload.length) throw new Error("Bản sao cloud đang rỗng.");
  return decompress(payload[0], payload.slice(1));
}

function assertCloudReady(user: User) {
  if (!supabase) throw new Error("Chưa cấu hình Supabase.");
  if (!navigator.onLine) throw new Error("Cần kết nối mạng để sao lưu cloud.");
  if (!isVaultUnlocked(user.id)) throw new Error("Hãy mở Kho bảo mật trước khi sao lưu cloud.");
}

export async function uploadLatestWorkspaceBackup(user: User, appVersion = APP_CONFIG.version) {
  assertCloudReady(user);
  const backup = await createWorkspaceBackup(appVersion);
  const clearJson = textEncoder.encode(stringifyWorkspaceBackup(backup));
  const compressed = await compress(clearJson);
  const encrypted = await encryptBytes(user.id, packClearPayload(compressed.flag, compressed.bytes), backupAad(user.id));
  const { error } = await supabase!.storage.from(BUCKET).upload(
    backupPath(user.id),
    new Blob([bytesAsArrayBuffer(encrypted)], { type: "application/octet-stream" }),
    { upsert: true, contentType: "application/octet-stream", cacheControl: "0" },
  );
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("bucket") || message.includes("not found")) {
      throw new Error("Supabase chưa có bucket hbc-private. Hãy chạy migration 0.19.0 trước khi dùng sao lưu cloud.");
    }
    throw error;
  }
  localSet(`hbc-last-full-backup-${user.id}`, String(Date.now()));
  return {
    createdAt: backup.createdAt,
    databaseCount: backup.databases.length,
    clearBytes: clearJson.byteLength,
    encryptedBytes: encrypted.byteLength,
  };
}

export async function downloadLatestWorkspaceBackup(user: User): Promise<WorkspaceBackup> {
  assertCloudReady(user);
  const { data, error } = await supabase!.storage.from(BUCKET).download(backupPath(user.id));
  if (error) {
    if (error.message.toLowerCase().includes("not found") || error.message.includes("404")) {
      throw new Error("Tài khoản này chưa có bản sao cloud toàn bộ.");
    }
    throw error;
  }
  const encrypted = new Uint8Array(await data.arrayBuffer());
  const clearPacked = await decryptBytes(user.id, encrypted, backupAad(user.id));
  const clearJson = await unpackClearPayload(clearPacked);
  return parseWorkspaceBackup(textDecoder.decode(clearJson));
}

export async function restoreLatestWorkspaceBackup(user: User): Promise<RestoreSummary> {
  const backup = await downloadLatestWorkspaceBackup(user);
  return restoreWorkspaceBackup(backup);
}

export function getLastFullCloudBackup(userId: string) {
  return Number(localGet(`hbc-last-full-backup-${userId}`) ?? 0);
}
