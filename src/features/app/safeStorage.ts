type StorageKind = "local" | "session";

function resolveStorage(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function storageGet(kind: StorageKind, key: string) {
  try { return resolveStorage(kind)?.getItem(key) ?? null; }
  catch { return null; }
}

export function storageSet(kind: StorageKind, key: string, value: string) {
  try { resolveStorage(kind)?.setItem(key, value); }
  catch { /* Safari private mode / storage denied: preference remains session-only. */ }
}

export function storageRemove(kind: StorageKind, key: string) {
  try { resolveStorage(kind)?.removeItem(key); }
  catch { /* Storage marker only; core data remains in IndexedDB. */ }
}

export const localGet = (key: string) => storageGet("local", key);
export const localSet = (key: string, value: string) => storageSet("local", key, value);
export const localRemove = (key: string) => storageRemove("local", key);
export const sessionGet = (key: string) => storageGet("session", key);
export const sessionSet = (key: string, value: string) => storageSet("session", key, value);
export const sessionRemove = (key: string) => storageRemove("session", key);
