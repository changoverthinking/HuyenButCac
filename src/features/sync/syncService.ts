import type { User } from "@supabase/supabase-js";
import { asInternalSyncWrite, db, getActiveWorkspaceUserId, type HuyenButDB } from "../../database/db";
import { supabase } from "../auth/supabase";
import { decryptRecord, encryptRecord, isEncryptedEnvelope, isVaultUnlocked } from "../crypto/vaultService";
import { flushPendingWrites } from "../app/appLifecycle";
import { localGet, localSet } from "../app/safeStorage";

export type SyncStatus = "offline" | "idle" | "syncing" | "synced" | "error";

export const SYNC_TABLES = [
  "notes", "folders", "tags", "themePreferences", "projects", "projectSections",
  "projectChapters", "projectTasks", "projectMilestones", "mindMaps", "mindMapNodes",
  "mindMapEdges", "whiteboards", "whiteboardObjects", "mindMapStrokes", "whiteboardStrokes",
  "storyCharacters", "storyLocations", "storyLoreEntries", "storyTimelineEvents", "calendarEvents",
] as const;

type SyncTableName = typeof SYNC_TABLES[number];

type CloudRecord = {
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  client_updated_at: number;
  server_updated_at?: string;
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
const remoteCursorSupportByWorkspace = new Map<string, boolean>();

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

function remoteCursorKey(userId: string) {
  return `hbc-remote-sync-cursor-${userId}`;
}

export function getRemoteSyncCursor(userId: string) {
  return localGet(remoteCursorKey(userId)) ?? "";
}

function setRemoteSyncCursor(userId: string, value: string) {
  if (value) localSet(remoteCursorKey(userId), value);
}

function laterIso(current: string, candidate?: string | null) {
  if (!candidate) return current;
  if (!current) return candidate;
  return Date.parse(candidate) > Date.parse(current) ? candidate : current;
}

export function syncNow(user: User): Promise<void> {
  const workspaceDb = db;
  assertWorkspaceActive(user.id, workspaceDb);
  const key = `${user.id}:${workspaceDb.name}`;
  const existing = runningByWorkspace.get(key);
  if (existing) return existing;

  const task = flushPendingWrites()
    .then(() => performSync(user, workspaceDb))
    .finally(() => {
      if (runningByWorkspace.get(key) === task) runningByWorkspace.delete(key);
    });
  runningByWorkspace.set(key, task);
  return task;
}

async function supportsRemoteCursor(userId: string, workspaceDb: HuyenButDB) {
  const cacheKey = `${userId}:${workspaceDb.name}`;
  const cached = remoteCursorSupportByWorkspace.get(cacheKey);
  if (cached !== undefined) return cached;
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.rpc("hbc_sync_cursor_version");
    const supported = !error && Number(data) >= 1;
    remoteCursorSupportByWorkspace.set(cacheKey, supported);
    return supported;
  } catch {
    remoteCursorSupportByWorkspace.set(cacheKey, false);
    return false;
  }
}

async function pullRemoteChanges(user: User, workspaceDb: HuyenButDB) {
  if (!supabase) return { remote: [] as CloudRecord[], maxCursor: "", cursorEnabled: false };
  // Server 0.18.x không có trigger cập nhật server_updated_at. Khi RPC capability chưa tồn tại,
  // giữ nguyên full-pull cũ để tuyệt đối không bỏ sót bản ghi cloud.
  const cursorEnabled = await supportsRemoteCursor(user.id, workspaceDb);
  const cursor = cursorEnabled ? getRemoteSyncCursor(user.id) : "";
  const remote: CloudRecord[] = [];
  let maxCursor = cursor;
  for (let from = 0; ; from += 1000) {
    let query = supabase
      .from("sync_records")
      .select("entity_type,entity_id,payload,client_updated_at,server_updated_at")
      .eq("user_id", user.id)
      .order("server_updated_at", { ascending: true });
    if (cursor) query = query.gt("server_updated_at", cursor);
    const { data, error } = await query.range(from, from + 999);
    if (error) throw error;
    const rows = (data ?? []) as CloudRecord[];
    remote.push(...rows);
    if (cursorEnabled) for (const row of rows) maxCursor = laterIso(maxCursor, row.server_updated_at);
    if (rows.length < 1000) break;
  }
  return { remote, maxCursor, cursorEnabled };
}

async function performSync(user: User, workspaceDb: HuyenButDB) {
  if (!supabase || !navigator.onLine) throw new Error("Không có kết nối mạng");
  if (!isVaultUnlocked(user.id)) throw new Error("Hãy mở Kho bảo mật trước khi đồng bộ");
  assertWorkspaceActive(user.id, workspaceDb);

  // Chỉ kéo thay đổi mới kể từ cursor server. Migration 0.19.0 duy trì server_updated_at khi UPDATE.
  const { remote, maxCursor: pulledCursor, cursorEnabled } = await pullRemoteChanges(user, workspaceDb);
  let maxCursor = pulledCursor;

  // Giải mã ngoài transaction IndexedDB để transaction không bị đóng trong lúc WebCrypto chạy.
  const decodedRemote: Array<CloudRecord & { clearPayload: Record<string, unknown>; wasLegacyPlaintext: boolean }> = [];
  for (const item of remote) {
    if (!SYNC_TABLES.includes(item.entity_type as SyncTableName)) continue;
    const encryptedPayload = isEncryptedEnvelope(item.payload) ? item.payload : null;
    const clearPayload = encryptedPayload
      ? await decryptRecord<Record<string, unknown>>(user.id, item.entity_type, item.entity_id, encryptedPayload)
      : item.payload;
    decodedRemote.push({ ...item, clearPayload, wasLegacyPlaintext: !encryptedPayload });
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
        // Dữ liệu cloud legacy plaintext được đánh pending để lần push này mã hóa lại ngay.
        const nextRecord = { ...item.clearPayload, id: item.entity_id, syncState: item.wasLegacyPlaintext ? "pending" : "synced" };
        // Full-pull/fallback có thể trả lại cùng dữ liệu. Không ghi/remount UI nếu payload thực tế không đổi.
        if (!local || fingerprint(local) !== fingerprint(nextRecord)) {
          await table.put(nextRecord);
          changedTables.add(item.entity_type);
        } else if (item.wasLegacyPlaintext && local.syncState === "synced") {
          // Legacy plaintext vẫn cần được đánh pending để mã hóa lại, nhưng không phải remote UI change.
          await table.update(item.entity_id, { syncState: "pending" });
        }
      }
    }
  }));

  // Chỉ snapshot record chưa đồng bộ. Đây là delta upload; dataset lớn không còn bị mã hóa/upload lại toàn bộ.
  assertWorkspaceActive(user.id, workspaceDb);
  const snapshots: UploadSnapshot[] = [];
  for (const name of SYNC_TABLES) {
    const entities = await workspaceDb.table(name).toArray() as LocalRecord[];
    for (const entity of entities) {
      if (entity.syncState === "synced") continue;
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

  assertWorkspaceActive(user.id, workspaceDb);
  // Chỉ tiến cursor tới mốc đã THỰC SỰ pull. Không dùng timestamp của chính batch upload:
  // nếu thiết bị khác ghi sau pull nhưng trước upload, nhảy cursor theo upload sẽ bỏ sót thay đổi đó.
  if (cursorEnabled && maxCursor) setRemoteSyncCursor(user.id, maxCursor);
  localSet(`hbc-last-sync-${user.id}`, String(Date.now()));
  window.dispatchEvent(new CustomEvent("hbc-sync-complete", {
    detail: { tables: [...changedTables], uploaded: snapshots.length, pulled: decodedRemote.length, cursorEnabled },
  }));
}

export function getLastSync(userId: string) {
  return Number(localGet(`hbc-last-sync-${userId}`) ?? 0);
}
