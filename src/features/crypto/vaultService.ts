import type { User } from "@supabase/supabase-js";
import { supabase } from "../auth/supabase";

export type EncryptedEnvelope = { v: 1; alg: "AES-256-GCM"; iv: string; ciphertext: string };
const keys = new Map<string, CryptoKey>();
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64 = (bytes: Uint8Array) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};
const fromBase64 = (value: string) => Uint8Array.from(atob(value), char => char.charCodeAt(0));

export async function deriveVaultKey(passphrase: string, salt: Uint8Array, iterations = 600_000) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(passphrase.normalize("NFKC")), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJson(key: CryptoKey, value: unknown, aad: string): Promise<EncryptedEnvelope> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode(aad), tagLength: 128 },
    key,
    encoder.encode(JSON.stringify(value)),
  );
  return { v: 1, alg: "AES-256-GCM", iv: toBase64(iv), ciphertext: toBase64(new Uint8Array(encrypted)) };
}

export async function decryptJson<T>(key: CryptoKey, envelope: EncryptedEnvelope, aad: string): Promise<T> {
  try {
    const clear = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(envelope.iv), additionalData: encoder.encode(aad), tagLength: 128 },
      key,
      fromBase64(envelope.ciphertext),
    );
    return JSON.parse(decoder.decode(clear)) as T;
  } catch { throw new Error("Mật khẩu Kho không đúng hoặc dữ liệu đã bị thay đổi"); }
}

export function isEncryptedEnvelope(value: unknown): value is EncryptedEnvelope {
  const item = value as Partial<EncryptedEnvelope> | null;
  return Boolean(item && item.v === 1 && item.alg === "AES-256-GCM" && item.iv && item.ciphertext);
}

export function isVaultUnlocked(userId: string) { return keys.has(userId); }
export function lockVault(userId?: string) {
  if (userId) keys.delete(userId);
  else keys.clear();
}

export async function getVaultState(userId: string): Promise<"setup" | "locked" | "unlocked"> {
  if (keys.has(userId)) return "unlocked";
  if (!supabase) throw new Error("Chưa cấu hình máy chủ");
  const { data, error } = await supabase.from("vault_profiles").select("user_id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data ? "locked" : "setup";
}

export async function setupVault(user: User, passphrase: string) {
  if (!supabase) throw new Error("Chưa cấu hình máy chủ");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveVaultKey(passphrase, salt);
  const verifier = await encryptJson(key, { marker: "huyen-but-cac-vault", userId: user.id }, `vault:${user.id}`);
  const { error } = await supabase.from("vault_profiles").insert({ user_id: user.id, salt: toBase64(salt), verifier });
  if (error) throw error;
  keys.set(user.id, key);
}

export async function unlockVault(user: User, passphrase: string) {
  if (!supabase) throw new Error("Chưa cấu hình máy chủ");
  const { data, error } = await supabase.from("vault_profiles").select("salt,verifier").eq("user_id", user.id).single();
  if (error) throw error;
  const key = await deriveVaultKey(passphrase, fromBase64(data.salt));
  const marker = await decryptJson<{ marker: string; userId: string }>(key, data.verifier, `vault:${user.id}`);
  if (marker.marker !== "huyen-but-cac-vault" || marker.userId !== user.id) throw new Error("Không thể xác minh Kho bảo mật");
  keys.set(user.id, key);
}

export async function resetVault(user: User, newPassphrase: string) {
  if (!supabase) throw new Error("Chưa cấu hình máy chủ");
  if (!navigator.onLine) throw new Error("Cần kết nối mạng để đặt lại Kho bảo mật");
  if (newPassphrase.length < 12) throw new Error("Mật khẩu Kho mới cần ít nhất 12 ký tự.");

  // Chuẩn bị khóa/verifier trước khi đụng dữ liệu cloud. RPC phía server thực hiện xóa
  // sync cũ + thay vault profile trong MỘT transaction PostgreSQL; nếu insert profile
  // mới thất bại thì phần delete cũng rollback, tránh trạng thái Kho bị xóa nửa chừng.
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveVaultKey(newPassphrase, salt);
  const verifier = await encryptJson(key, { marker: "huyen-but-cac-vault", userId: user.id }, `vault:${user.id}`);
  const { error } = await supabase.rpc("reset_my_vault", {
    new_salt: toBase64(salt),
    new_verifier: verifier,
  });
  if (error) {
    if (error.message.toLowerCase().includes("function") || error.message.toLowerCase().includes("schema cache")) {
      throw new Error("Máy chủ chưa cài bản mới của chức năng đặt lại Kho. Hãy chạy migration_checkpoint_14_2_reset_vault.sql trong Supabase.");
    }
    throw error;
  }
  keys.set(user.id, key);
}

function requireKey(userId: string) {
  const key = keys.get(userId);
  if (!key) throw new Error("Kho bảo mật đang khóa");
  return key;
}

export const encryptRecord = (userId: string, entityType: string, entityId: string, payload: unknown) =>
  encryptJson(requireKey(userId), payload, `${userId}:${entityType}:${entityId}`);
export const decryptRecord = <T>(userId: string, entityType: string, entityId: string, payload: EncryptedEnvelope) =>
  decryptJson<T>(requireKey(userId), payload, `${userId}:${entityType}:${entityId}`);
