import type { User } from "@supabase/supabase-js";
import { asInternalSyncWrite, db, getActiveWorkspaceUserId, type HuyenButDB } from "../../database/db";
import { supabase } from "../auth/supabase";
import { decryptRecord, encryptRecord, isEncryptedEnvelope, isVaultUnlocked } from "../crypto/vaultService";

export type SyncStatus = "offline" | "idle" | "syncing" | "synced" | "error";

export const SYNC_TABLES = [
  "notes", "folders", "tags", "themePreferences", "projects", "projectSections",
  "projectChapters", "projectTasks", "projectMilestones", "mindMaps", "mindMapNodes",
  "mindMapEdges", "whiteboards", "whiteboardObjects", "mindMapStrokes", "whiteboardStrokes",
  "storyCharacters", "storyLocations", "storyLoreEntries", "storyTimelineEvents",
] as const;

type SyncTableName = typeof SYNC_TABLES[number];

type CloudRecord = {
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  client_updated_at: number;
};

type LocalRecord = Record<string, unknown> & {
  id: string;
  syncState?: string;
  updatedAt?: number;
  createdAt?: number;
};

type UploadSnapshot = {
  table: SyncTableName;
  id: string;
  fingerprint: string;
  cloud: CloudRecord & { user_id: string };
};

const runningByWorkspace = new Map<string, Promise<void>>();

export function shouldPullRemote(localSyncState: string | undefined) {
  return localSyncState === undefined || localSyncState === "synced";
}

function fingerprint(record: Record<string, unknown>) {
  const { syncState: _syncState, ...rest } = record;
  return JSON.stringify(rest);
}

function assertWorkspaceActive(userId: string, workspaceDb: HuyenButDB) {
  if (getActiveWorkspaceUserId() !== userId || db !== workspaceDb || !workspaceDb.isOpen()) {
    throw new Error("Tài khoản đã thay đổi trong lúc đồng bộ. Lần đồng bộ cũ đã được dừng an toàn.");
  }
}

export function syncNow(user: User): Promise<void> {
  const workspaceDb = db;
  assertWorkspaceActive(user.id, workspaceDb);
  const key = `${user.id}:${workspaceDb.name}`;
  const existing = runningByWorkspace.get(key);
  if (existing) return existing;

  const task = performSync(user, workspaceDb).finally(() => {
    if (runningByWorkspace.get(key) === task) runningByWorkspace.delete(key);
  });
  runningByWorkspace.set(key, task);
  return task;
}

async function performSync(user: User, workspaceDb: HuyenButDB) {
  if (!supabase || !navigator.onLine) throw new Error("Không có kết nối mạng");
  if (!isVaultUnlocked(user.id)) throw new Error("Hãy mở Kho bảo mật trước khi đồng bộ");
  assertWorkspaceActive(user.id, workspaceDb);

  // Kéo toàn bộ bản ghi của chính tài khoản. .eq bổ sung lớp giới hạn client bên cạnh RLS máy chủ.
  const remote: CloudRecord[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("sync_records")
      .select("entity_type,entity_id,payload,client_updated_at")
      .eq("user_id", user.id)
      .range(from, from + 999);
    if (error) throw error;
    remote.push(...((data ?? []) as CloudRecord[]));
    if (!data || data.length < 1000) break;
  }

  // Giải mã ngoài transaction IndexedDB để transaction không bị đóng trong lúc WebCrypto chạy.
  const decodedRemote: Array<CloudRecord & { clearPayload: Record<string, unknown> }> = [];
  for (const item of remote) {
    if (!SYNC_TABLES.includes(item.entity_type as SyncTableName)) continue;
    const clearPayload = isEncryptedEnvelope(item.payload)
      ? await decryptRecord<Record<string, unknown>>(user.id, item.entity_type, item.entity_id, item.payload)
      : item.payload; // Dữ liệu cloud cũ dạng plaintext được đọc rồi mã hóa lại ở bước push.
    decodedRemote.push({ ...item, clearPayload });
  }

  assertWorkspaceActive(user.id, workspaceDb);
  const changedTables = new Set<string>();
  const syncTables = SYNC_TABLES.map((name) => workspaceDb.table(name));
  await workspaceDb.transaction("rw", syncTables, async () => asInternalSyncWrite(async () => {
    for (const item of decodedRemote) {
      const table = workspaceDb.table(item.entity_type);
      const local = await table.get(item.entity_id) as LocalRecord | undefined;
      const localUpdatedAt = Number(local?.updatedAt ?? local?.createdAt ?? 0);
      const remoteUpdatedAt = Number(item.client_updated_at ?? 0);

      // Pending/local luôn thắng remote. Remote chỉ thay bản đã sync nếu remote không cũ hơn.
      if (shouldPullRemote(local?.syncState) && (!local || remoteUpdatedAt >= localUpdatedAt)) {
        await table.put({ ...item.clearPayload, id: item.entity_id, syncState: "synced" });
        changedTables.add(item.entity_type);
      }
    }
  }));

  // Chụp snapshot trước khi gọi mạng. Chỉ snapshot này mới được phép đánh dấu synced sau upload.
  assertWorkspaceActive(user.id, workspaceDb);
  const snapshots: UploadSnapshot[] = [];
  for (const name of SYNC_TABLES) {
    const entities = await workspaceDb.table(name).toArray() as LocalRecord[];
    for (const entity of entities) {
      const id = String(entity.id);
      const updatedAt = Number(entity.updatedAt ?? entity.createdAt ?? Date.now());
      const clearForCloud = { ...entity, syncState: "synced" };
      const encryptedPayload = await encryptRecord(user.id, name, id, clearForCloud);
      snapshots.push({
        table: name,
        id,
        fingerprint: fingerprint(entity),
        cloud: {
          user_id: user.id,
          entity_type: name,
          entity_id: id,
          payload: encryptedPayload as unknown as Record<string, unknown>,
          client_updated_at: updatedAt,
        },
      });
    }
  }

  for (let i = 0; i < snapshots.length; i += 300) {
    assertWorkspaceActive(user.id, workspaceDb);
    const { error } = await supabase.from("sync_records")
      .upsert(snapshots.slice(i, i + 300).map((item) => item.cloud), { onConflict: "user_id,entity_type,entity_id" });
    if (error) throw error;
  }

  // Chỉ đánh dấu synced nếu record vẫn giống hệt snapshot đã upload.
  // Nếu người dùng sửa trong lúc upload, fingerprint khác -> record vẫn pending cho lần sync sau.
  assertWorkspaceActive(user.id, workspaceDb);
  await workspaceDb.transaction("rw", syncTables, async () => asInternalSyncWrite(async () => {
    for (const item of snapshots) {
      const table = workspaceDb.table(item.table);
      const current = await table.get(item.id) as LocalRecord | undefined;
      if (!current || fingerprint(current) !== item.fingerprint) continue;
      await table.update(item.id, { syncState: "synced" });
    }
  }));

  // Không cập nhật marker owner của database legacy: marker này chỉ được đọc để migration <=0.12.1.
  // Nếu thay đổi nó theo tài khoản đang đăng nhập, một database legacy chưa migrate có thể bị gán nhầm owner.
  assertWorkspaceActive(user.id, workspaceDb);
  localStorage.setItem(`hbc-last-sync-${user.id}`, String(Date.now()));
  window.dispatchEvent(new CustomEvent("hbc-sync-complete", { detail: { tables: [...changedTables] } }));
}

export function getLastSync(userId: string) {
  return Number(localStorage.getItem(`hbc-last-sync-${userId}`) ?? 0);
}
