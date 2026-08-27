import type { User } from "@supabase/supabase-js";
import { db } from "../../database/db";
import { supabase } from "../auth/supabase";

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

export function shouldPullRemote(localUpdatedAt: number | undefined, remoteUpdatedAt: number) {
  return localUpdatedAt === undefined || Number(remoteUpdatedAt) > Number(localUpdatedAt);
}

export function syncNow(user: User): Promise<void> {
  if (running) return running;
  running = performSync(user).finally(() => { running = null; });
  return running;
}

async function performSync(user: User) {
  if (!supabase || !navigator.onLine) throw new Error("Không có kết nối mạng");

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
  await db.transaction("rw", SYNC_TABLES.map((name) => db.table(name)), async () => {
    for (const item of remote) {
      if (!SYNC_TABLES.includes(item.entity_type as typeof SYNC_TABLES[number])) continue;
      const table = db.table(item.entity_type);
      const local = await table.get(item.entity_id) as { updatedAt?: number } | undefined;
      if (shouldPullRemote(local?.updatedAt, item.client_updated_at)) {
        await table.put({ ...item.payload, id: item.entity_id, syncState: "synced" });
      }
    }
  });

  const rows: Array<CloudRecord & { user_id: string }> = [];
  for (const name of SYNC_TABLES) {
    const entities = await db.table(name).toArray() as Array<Record<string, unknown>>;
    for (const entity of entities) {
      const id = String(entity.id);
      const updatedAt = Number(entity.updatedAt ?? entity.createdAt ?? Date.now());
      rows.push({
        user_id: user.id,
        entity_type: name,
        entity_id: id,
        payload: { ...entity, syncState: "synced" },
        client_updated_at: updatedAt,
      });
    }
  }

  for (let i = 0; i < rows.length; i += 300) {
    const { error } = await supabase.from("sync_records")
      .upsert(rows.slice(i, i + 300), { onConflict: "user_id,entity_type,entity_id" });
    if (error) throw error;
  }

  localStorage.setItem(`hbc-last-sync-${user.id}`, String(Date.now()));
}

export function getLastSync(userId: string) {
  return Number(localStorage.getItem(`hbc-last-sync-${userId}`) ?? 0);
}
