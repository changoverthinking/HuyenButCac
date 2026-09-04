import { APP_CONFIG } from "../../app/appConfig";
import { getActiveWorkspaceUserId } from "../../database/db";
import { localRemove, localSet } from "../app/safeStorage";

const BACKUP_FORMAT = "huyen-but-cac-workspace-backup";
const BACKUP_VERSION = 1;
const TYPE_KEY = "__hbcType";

const DEVICE_LOCAL_STORES = new Set(["calendarNotificationReceipts"]);
const DEVICE_LOCAL_STORAGE_PREFIXES = [
  "hbc-calendar-device-id",
  "hbc-remote-sync-cursor-",
  "hbc-last-sync-",
  "hbc-last-full-backup-",
  "hbc-last-ui-error",
  "hbc-last-safe-update",
  "hbc-remembered-email",
  "hbc-legacy-workspace-migrated-to",
  "hbc-synced-data-owner",
];

const MAIN_DATABASE_STORES = new Set([
  "notes", "folders", "tags", "themePreferences", "projects", "projectSections", "projectChapters",
  "projectTasks", "projectMilestones", "mindMaps", "mindMapNodes", "mindMapEdges", "whiteboards",
  "whiteboardObjects", "musicTracks", "customBackgrounds", "mindMapStrokes", "whiteboardStrokes",
  "storyCharacters", "storyLocations", "storyLoreEntries", "storyTimelineEvents", "calendarEvents",
  "calendarNotificationReceipts",
]);
const LIBRARY_DATABASE_STORES = new Set(["books", "projectMeta"]);
const APPEARANCE_DATABASE_STORES = new Set(["assets"]);
const TIEU_NHI_DATABASE_STORES = new Set(["messages", "memories", "chunks", "indexes", "settings"]);

function isDeviceLocalStorageKey(key: string) {
  return DEVICE_LOCAL_STORAGE_PREFIXES.some((prefix) => key === prefix || key.startsWith(prefix));
}

function allowedStoresForDatabase(name: string) {
  if (name.startsWith("huyen-but-cac-workspace-")) return MAIN_DATABASE_STORES;
  if (name.startsWith("huyen-but-cac-library-v1-")) return LIBRARY_DATABASE_STORES;
  if (name.startsWith("huyen-but-cac-appearance-v1-")) return APPEARANCE_DATABASE_STORES;
  if (name.startsWith("huyen-but-cac-tieu-nhi-v1-")) return TIEU_NHI_DATABASE_STORES;
  return null;
}

function validKeyPath(value: unknown, allowNull: boolean) {
  if (allowNull && value === null) return true;
  if (typeof value === "string") return value.length > 0 && value.length <= 200;
  return Array.isArray(value) && value.length > 0 && value.length <= 12 && value.every((item) => typeof item === "string" && item.length > 0 && item.length <= 200);
}


type EncodedSpecial =
  | { [TYPE_KEY]: "Undefined" }
  | { [TYPE_KEY]: "Blob"; mimeType: string; data: string }
  | { [TYPE_KEY]: "ArrayBuffer"; data: string }
  | { [TYPE_KEY]: "Uint8Array"; data: string }
  | { [TYPE_KEY]: "Date"; value: string };

type EncodedValue =
  | null
  | boolean
  | number
  | string
  | EncodedSpecial
  | EncodedValue[]
  | { [key: string]: EncodedValue };

type BackupIndex = {
  name: string;
  keyPath: string | string[];
  multiEntry: boolean;
  unique: boolean;
};

type BackupStore = {
  name: string;
  keyPath: string | string[] | null;
  autoIncrement: boolean;
  indexes: BackupIndex[];
  records: EncodedValue[];
};

type BackupDatabase = {
  name: string;
  version: number;
  stores: BackupStore[];
};

export type WorkspaceBackup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  createdAt: string;
  appVersion: string;
  workspaceUserId: string | null;
  databases: BackupDatabase[];
  localStorage: Record<string, string>;
};

export type RestoreSummary = {
  restoredDatabases: number;
  restoredStores: number;
  restoredRecords: number;
  skippedStores: string[];
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function bytesAsArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function encodeValue(value: unknown): Promise<EncodedValue> {
  if (value === undefined) return { [TYPE_KEY]: "Undefined" };
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Blob) return { [TYPE_KEY]: "Blob", mimeType: value.type, data: bytesToBase64(new Uint8Array(await value.arrayBuffer())) };
  if (value instanceof ArrayBuffer) return { [TYPE_KEY]: "ArrayBuffer", data: bytesToBase64(new Uint8Array(value)) };
  if (value instanceof Uint8Array) return { [TYPE_KEY]: "Uint8Array", data: bytesToBase64(value) };
  if (value instanceof Date) return { [TYPE_KEY]: "Date", value: value.toISOString() };
  if (Array.isArray(value)) return Promise.all(value.map(encodeValue));
  if (typeof value === "object") {
    const output: Record<string, EncodedValue> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) output[key] = await encodeValue(item);
    return output;
  }
  return String(value);
}

function isSpecial(value: unknown): value is EncodedSpecial {
  if (!value || typeof value !== "object") return false;
  const type = (value as Record<string, unknown>)[TYPE_KEY];
  return type === "Undefined" || type === "Blob" || type === "ArrayBuffer" || type === "Uint8Array" || type === "Date";
}

function decodeValue(value: EncodedValue): unknown {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(decodeValue);
  if (isSpecial(value)) {
    if (value[TYPE_KEY] === "Undefined") return undefined;
    if (value[TYPE_KEY] === "Blob") return new Blob([bytesAsArrayBuffer(base64ToBytes(value.data))], { type: value.mimeType });
    if (value[TYPE_KEY] === "ArrayBuffer") return bytesAsArrayBuffer(base64ToBytes(value.data));
    if (value[TYPE_KEY] === "Uint8Array") return base64ToBytes(value.data);
    return new Date(value.value);
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decodeValue(item)]));
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB operation failed"));
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
  });
}

async function listedDatabaseNames() {
  if (typeof indexedDB.databases !== "function") return null;
  try {
    const databases = await indexedDB.databases();
    return new Set(databases.map((item) => item.name).filter((name): name is string => Boolean(name)));
  } catch {
    return null;
  }
}

function openDatabase(name: string, version?: number, onUpgrade?: (database: IDBDatabase) => void) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = version ? indexedDB.open(name, version) : indexedDB.open(name);
    request.onupgradeneeded = () => onUpgrade?.(request.result);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error(`Không thể mở IndexedDB ${name}`));
    request.onblocked = () => reject(new Error(`IndexedDB ${name} đang được tab khác sử dụng. Hãy đóng tab Huyền Bút Các khác rồi thử lại.`));
  });
}


async function probeDatabaseExists(name: string) {
  return new Promise<boolean>((resolve, reject) => {
    let created = false;
    const request = indexedDB.open(name);
    request.onupgradeneeded = (event) => { created = event.oldVersion === 0; };
    request.onerror = () => reject(request.error ?? new Error(`Không thể kiểm tra IndexedDB ${name}`));
    request.onsuccess = () => {
      request.result.close();
      if (!created) { resolve(true); return; }
      const deletion = indexedDB.deleteDatabase(name);
      deletion.onsuccess = () => resolve(false);
      deletion.onerror = () => reject(deletion.error ?? new Error(`Không thể xóa database thăm dò ${name}`));
    };
  });
}
function expectedDatabaseNames(userId: string | null) {
  const encoded = userId ? encodeURIComponent(userId) : null;
  return [
    `huyen-but-cac-workspace-${userId ?? "guest"}`,
    `huyen-but-cac-library-v1-${encoded ?? "local"}`,
    `huyen-but-cac-appearance-v1-${encoded ?? "local"}`,
    `huyen-but-cac-tieu-nhi-v1-${encoded ?? "guest"}`,
  ];
}

function assertBackupScope(backup: WorkspaceBackup) {
  const expected = new Set(expectedDatabaseNames(backup.workspaceUserId ?? null));
  for (const database of backup.databases) {
    if (!expected.has(database.name)) {
      throw new Error(`Bản sao lưu chứa database ngoài phạm vi workspace: ${database.name}`);
    }
    const allowedStores = allowedStoresForDatabase(database.name);
    if (!allowedStores) throw new Error(`Không nhận diện được database Huyền Bút Các: ${database.name}`);
    for (const store of database.stores) {
      if (!allowedStores.has(store.name)) throw new Error(`Bản sao lưu chứa store ngoài phạm vi ứng dụng: ${database.name}/${store.name}`);
    }
  }
  for (const key of Object.keys(backup.localStorage ?? {})) {
    if (!key.startsWith("hbc-") && !key.startsWith("huyen-but-cac")) {
      throw new Error(`Bản sao lưu chứa khóa localStorage ngoài phạm vi Huyền Bút Các: ${key}`);
    }
  }
}

async function existingWorkspaceDatabases(userId: string | null) {
  const expected = expectedDatabaseNames(userId);
  const available = await listedDatabaseNames();
  if (available) return expected.filter((name) => available.has(name));
  const existing: string[] = [];
  for (const name of expected) {
    try { if (await probeDatabaseExists(name)) existing.push(name); } catch { /* feature DB tùy chọn */ }
  }
  return existing;
}

async function exportDatabase(name: string): Promise<BackupDatabase> {
  const database = await openDatabase(name);
  try {
    const storeNames = Array.from(database.objectStoreNames).filter((storeName) => !DEVICE_LOCAL_STORES.has(storeName));
    if (!storeNames.length) return { name, version: database.version, stores: [] };

    // Một readonly transaction duy nhất tạo snapshot nhất quán giữa các store của cùng database.
    const transaction = database.transaction(storeNames, "readonly");
    const done = transactionDone(transaction);
    const snapshots = storeNames.map((storeName) => {
      const store = transaction.objectStore(storeName);
      const indexes = Array.from(store.indexNames).map((indexName) => {
        const index = store.index(indexName);
        return { name: index.name, keyPath: index.keyPath, multiEntry: index.multiEntry, unique: index.unique };
      });
      return {
        name: storeName,
        keyPath: store.keyPath,
        autoIncrement: store.autoIncrement,
        indexes,
        recordsRequest: requestResult(store.getAll()),
      };
    });
    const rawRecords = await Promise.all(snapshots.map((snapshot) => snapshot.recordsRequest));
    await done;

    const stores: BackupStore[] = [];
    for (let index = 0; index < snapshots.length; index += 1) {
      const snapshot = snapshots[index];
      stores.push({
        name: snapshot.name,
        keyPath: snapshot.keyPath,
        autoIncrement: snapshot.autoIncrement,
        indexes: snapshot.indexes,
        records: await Promise.all(rawRecords[index].map(encodeValue)),
      });
    }
    return { name, version: database.version, stores };
  } finally {
    database.close();
  }
}

function exportLocalStorage() {
  const values: Record<string, string> = {};
  if (typeof window === "undefined") return values;
  try {
    const storage = window.localStorage;
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key) continue;
      if (!key.startsWith("hbc-") && !key.startsWith("huyen-but-cac")) continue;
      if (isDeviceLocalStorageKey(key)) continue;
      const value = storage.getItem(key);
      if (value !== null) values[key] = value;
    }
  } catch {
    // Safari private/storage denied: IndexedDB backup vẫn tiếp tục, chỉ bỏ preference localStorage.
  }
  return values;
}

export async function createWorkspaceBackup(appVersion = "unknown"): Promise<WorkspaceBackup> {
  const workspaceUserId = getActiveWorkspaceUserId() ?? null;
  const names = await existingWorkspaceDatabases(workspaceUserId);
  const databases: BackupDatabase[] = [];
  for (const name of names) databases.push(await exportDatabase(name));
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    appVersion,
    workspaceUserId,
    databases,
    localStorage: exportLocalStorage(),
  };
}

export function stringifyWorkspaceBackup(backup: WorkspaceBackup) {
  return JSON.stringify(backup);
}

function parseNumericVersion(value: string) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(value.trim());
  return match ? match.slice(1, 4).map(Number) : null;
}

function isBackupFromNewerApp(backupVersion: string) {
  const backup = parseNumericVersion(backupVersion);
  const current = parseNumericVersion(APP_CONFIG.version);
  if (!backup || !current) return false;
  for (let index = 0; index < 3; index += 1) {
    if (backup[index] !== current[index]) return backup[index] > current[index];
  }
  return false;
}

export function parseWorkspaceBackup(content: string): WorkspaceBackup {
  let parsed: Partial<WorkspaceBackup>;
  try {
    parsed = JSON.parse(content) as Partial<WorkspaceBackup>;
  } catch {
    throw new Error("Tệp sao lưu không đọc được hoặc JSON đã bị hỏng.");
  }
  const validWorkspaceId = parsed.workspaceUserId === null || typeof parsed.workspaceUserId === "string";
  const validDatabases = Array.isArray(parsed.databases) && parsed.databases.every((database) =>
    Boolean(database && typeof database.name === "string" && database.name.length <= 300 && Number.isInteger(database.version) && database.version > 0 && Array.isArray(database.stores)) &&
    database.stores.every((store) => Boolean(
      store && typeof store.name === "string" && store.name.length > 0 && store.name.length <= 120 &&
      validKeyPath(store.keyPath, true) && typeof store.autoIncrement === "boolean" && Array.isArray(store.records) &&
      Array.isArray(store.indexes) && store.indexes.every((index) => Boolean(
        index && typeof index.name === "string" && index.name.length > 0 && index.name.length <= 120 &&
        validKeyPath(index.keyPath, false) && typeof index.multiEntry === "boolean" && typeof index.unique === "boolean"
      ))
    )),
  );
  if (parsed.format !== BACKUP_FORMAT || parsed.version !== BACKUP_VERSION || !validWorkspaceId || !validDatabases) {
    throw new Error("Tệp không phải bản sao lưu Huyền Bút Các hợp lệ hoặc dùng định dạng chưa được hỗ trợ.");
  }
  if (typeof parsed.appVersion === "string" && isBackupFromNewerApp(parsed.appVersion)) {
    throw new Error(`Bản sao được tạo bởi Huyền Bút Các ${parsed.appVersion}, mới hơn app hiện tại ${APP_CONFIG.version}. Hãy cập nhật app trước khi khôi phục.`);
  }
  const backup = parsed as WorkspaceBackup;
  assertBackupScope(backup);
  return backup;
}

export async function downloadWorkspaceBackup(appVersion = "unknown") {
  const backup = await createWorkspaceBackup(appVersion);
  const blob = new Blob([stringifyWorkspaceBackup(backup)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `HuyenButCac-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.hbc-backup.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Safari/iOS có thể chưa bắt đầu đọc object URL ngay sau click; revoke quá sớm làm file tải rỗng.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return { databaseCount: backup.databases.length, bytes: blob.size };
}

function sameWorkspace(backup: WorkspaceBackup) {
  return (backup.workspaceUserId ?? null) === (getActiveWorkspaceUserId() ?? null);
}

function createSchema(database: IDBDatabase, backup: BackupDatabase) {
  for (const storeBackup of backup.stores) {
    if (DEVICE_LOCAL_STORES.has(storeBackup.name)) continue;
    if (database.objectStoreNames.contains(storeBackup.name)) continue;
    const store = database.createObjectStore(storeBackup.name, {
      keyPath: storeBackup.keyPath,
      autoIncrement: storeBackup.autoIncrement,
    });
    for (const index of storeBackup.indexes) {
      store.createIndex(index.name, index.keyPath, { multiEntry: index.multiEntry, unique: index.unique });
    }
  }
}

async function openForRestore(backup: BackupDatabase) {
  const available = await listedDatabaseNames();
  const exists = available ? available.has(backup.name) : await probeDatabaseExists(backup.name);
  if (exists) return openDatabase(backup.name);
  return openDatabase(backup.name, Math.max(1, backup.version), (database) => createSchema(database, backup));
}

async function restoreDatabase(databaseBackup: BackupDatabase, summary: RestoreSummary) {
  const database = await openForRestore(databaseBackup);
  try {
    const restoreStores = databaseBackup.stores.filter((storeBackup) => {
      if (DEVICE_LOCAL_STORES.has(storeBackup.name)) {
        summary.skippedStores.push(`${databaseBackup.name}/${storeBackup.name}`);
        return false;
      }
      const exists = database.objectStoreNames.contains(storeBackup.name);
      if (!exists) summary.skippedStores.push(`${databaseBackup.name}/${storeBackup.name}`);
      return exists;
    });
    const storeNames = restoreStores.map((storeBackup) => storeBackup.name);
    if (!storeNames.length) throw new Error(`Database ${databaseBackup.name} không có object store tương thích để khôi phục.`);

    // Một transaction nguyên tử chỉ trên các store CÓ TRONG backup. Store mới do phiên bản app
    // sau này bổ sung không bị clear khi người dùng khôi phục một backup cũ.
    const transaction = database.transaction(storeNames, "readwrite");
    const done = transactionDone(transaction);
    const requests: Array<Promise<unknown>> = [];
    for (const storeName of storeNames) requests.push(requestResult(transaction.objectStore(storeName).clear()));

    let restoredStoreCount = 0;
    let restoredRecordCount = 0;
    for (const storeBackup of restoreStores) {
      const store = transaction.objectStore(storeBackup.name);
      for (const encoded of storeBackup.records) requests.push(requestResult(store.put(decodeValue(encoded))));
      restoredStoreCount += 1;
      restoredRecordCount += storeBackup.records.length;
    }

    await Promise.all(requests);
    await done;
    summary.restoredDatabases += 1;
    summary.restoredStores += restoredStoreCount;
    summary.restoredRecords += restoredRecordCount;
  } finally {
    database.close();
  }
}

export async function restoreWorkspaceBackup(backup: WorkspaceBackup): Promise<RestoreSummary> {
  assertBackupScope(backup);
  if (!sameWorkspace(backup)) {
    throw new Error("Bản sao lưu thuộc workspace/tài khoản khác. Hãy chuyển đúng tài khoản trước khi khôi phục để tránh trộn dữ liệu.");
  }
  const summary: RestoreSummary = { restoredDatabases: 0, restoredStores: 0, restoredRecords: 0, skippedStores: [] };
  for (const database of backup.databases) await restoreDatabase(database, summary);
  for (const [key, value] of Object.entries(backup.localStorage ?? {})) {
    if (!isDeviceLocalStorageKey(key)) localSet(key, value);
  }
  const userId = getActiveWorkspaceUserId();
  if (userId) {
    // Buộc lần sync kế tiếp kéo lại cursor server để bản cloud mới hơn có thể thắng bản backup cũ.
    localRemove(`hbc-remote-sync-cursor-${userId}`);
    localRemove(`hbc-last-sync-${userId}`);
  }
  window.dispatchEvent(new CustomEvent("hbc-workspace-restored", { detail: summary }));
  return summary;
}

export async function restoreWorkspaceBackupFile(file: File) {
  if (file.size <= 0) throw new Error("Tệp sao lưu đang rỗng.");
  if (file.size > 1024 * 1024 * 1024) throw new Error("Tệp sao lưu vượt quá 1 GB; hãy dùng bản sao lưu nhỏ hơn hoặc tách dữ liệu media.");
  return restoreWorkspaceBackup(parseWorkspaceBackup(await file.text()));
}
