import type { User } from "@supabase/supabase-js";
import { asInternalSyncWrite, db } from "../../database/db";
import { supabase } from "../auth/supabase";
import { decryptRecord, encryptRecord, isEncryptedEnvelope, isVaultUnlocked } from "../crypto/vaultService";

export type SyncStatus = "offline" | "idle" | "syncing" | "synced" | "error";

const SYNC_TABLES = [
  "notes", "folders", "tags", "themePreferences", "projects", "projectSections",
  "projectChapters", "projectTasks", "projectMilestones", "mindMaps", "mindMapNodes",
  "mindMapEdges", "whiteboards", "whiteboardObjects", "mindMapStrokes", "whiteboardStrokes",
] as const;

type CloudRecord = {
  entity_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  client_updated_at: number;
};

let running: Promise<void> | null = null;

export function shouldPullRemote(localSyncState: string | undefined) {
  return localSyncState === undefined || localSyncState === "synced";
}

export function shouldResetForAccount(previousOwner: string | null, nextOwner: string) {
  return previousOwner !== null && previousOwner !== nextOwner;
}

export function syncNow(user: User): Promise<void> {
  if (running) return running;
  running = performSync(user).finally(() => { running = null; });
  return running;
}

async function performSync(user: User) {
  if (!supabase || !navigator.onLine) throw new Error("Không có kết nối mạng");
  if (!isVaultUnlocked(user.id)) throw new Error("Hãy mở Kho bảo mật trước khi đồng bộ");

  const ownerKey = "hbc-synced-data-owner";
  const previousOwner = localStorage.getItem(ownerKey);
  if (shouldResetForAccount(previousOwner, user.id)) {
    // Tách tuyệt đối cache tài khoản cũ trước khi tải tài khoản mới.
    await asInternalSyncWrite(() => db.transaction("rw", SYNC_TABLES.map(name => db.table(name)), async () => {
      for (const name of SYNC_TABLES) await db.table(name).clear();
    }));
  }

  // Kéo toàn bộ bản ghi của chính tài khoản. RLS phía máy chủ là lớp bảo vệ bắt buộc.
  const remote: CloudRecord[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("sync_records")
      .select("entity_type,entity_id,payload,client_updated_at")
      .range(from, from + 999);
    if (error) throw error;
    remote.push(...((data ?? []) as CloudRecord[]));
    if (!data || data.length < 1000) break;
  }

  // Merge last-write-wins theo updatedAt, nhưng không bao giờ xóa DB cục bộ hàng loạt.
  const changedTables = new Set<string>();
  await asInternalSyncWrite(() => db.transaction("rw", SYNC_TABLES.map((name) => db.table(name)), async () => {
    for (const item of remote) {
      if (!SYNC_TABLES.includes(item.entity_type as typeof SYNC_TABLES[number])) continue;
      const table = db.table(item.entity_type);
      const local = await table.get(item.entity_id) as { syncState?: string; updatedAt?: number } | undefined;
      // Không dùng giờ của thiết bị để phân xử: thay đổi local chưa sync luôn được bảo toàn.
      const clearPayload = isEncryptedEnvelope(item.payload)
        ? await decryptRecord<Record<string, unknown>>(user.id, item.entity_type, item.entity_id, item.payload)
        : item.payload; // Dữ liệu Checkpoint 11 cũ được đọc một lần rồi mã hóa khi đẩy lại.
      if (shouldPullRemote(local?.syncState) && (!local || Number(local.updatedAt ?? 0) !== Number(item.client_updated_at))) {
        await table.put({ ...clearPayload, id: item.entity_id, syncState: "synced" });
        changedTables.add(item.entity_type);
      }
    }
  }));

  const rows: Array<CloudRecord & { user_id: string }> = [];
  for (const name of SYNC_TABLES) {
    const entities = await db.table(name).toArray() as Array<Record<string, unknown>>;
    for (const entity of entities) {
      const id = String(entity.id);
      const updatedAt = Number(entity.updatedAt ?? entity.createdAt ?? Date.now());
      const encryptedPayload = await encryptRecord(user.id, name, id, { ...entity, syncState: "synced" });
      rows.push({
        user_id: user.id,
        entity_type: name,
        entity_id: id,
        payload: encryptedPayload as unknown as Record<string, unknown>,
        client_updated_at: updatedAt,
      });
    }
  }

  for (let i = 0; i < rows.length; i += 300) {
    const { error } = await supabase.from("sync_records")
      .upsert(rows.slice(i, i + 300), { onConflict: "user_id,entity_type,entity_id" });
    if (error) throw error;
  }

  await asInternalSyncWrite(() => db.transaction("rw", SYNC_TABLES.map(name => db.table(name)), async () => {
    for (const name of SYNC_TABLES) {
      const records = await db.table(name).toArray() as Array<Record<string, unknown>>;
      if (records.length) await db.table(name).bulkPut(records.map(record => ({ ...record, syncState: "synced" })));
    }
  }));

  localStorage.setItem(ownerKey, user.id);
  localStorage.setItem(`hbc-last-sync-${user.id}`, String(Date.now()));
  if (changedTables.size || shouldResetForAccount(previousOwner, user.id)) {
    window.dispatchEvent(new CustomEvent("hbc-sync-complete", { detail: { tables: [...changedTables] } }));
  }
}

export function getLastSync(userId: string) {
  return Number(localStorage.getItem(`hbc-last-sync-${userId}`) ?? 0);
}
