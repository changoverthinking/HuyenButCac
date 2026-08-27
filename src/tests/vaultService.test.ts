import { describe, expect, it } from "vitest";
import { decryptJson, deriveVaultKey, encryptJson, isEncryptedEnvelope } from "../features/crypto/vaultService";

describe("Kho bảo mật AES-GCM", () => {
  it("mã hóa và giải mã đúng dữ liệu Unicode", async () => {
    const key = await deriveVaultKey("mat-khau-thu-nghiem-rat-dai", new Uint8Array(16).fill(7), 1_000);
    const encrypted = await encryptJson(key, { title: "Nhất Niệm Trường Sinh", content: "修仙" }, "user:notes:id");
    expect(isEncryptedEnvelope(encrypted)).toBe(true);
    expect(JSON.stringify(encrypted)).not.toContain("Nhất Niệm");
    await expect(decryptJson(key, encrypted, "user:notes:id")).resolves.toEqual({ title: "Nhất Niệm Trường Sinh", content: "修仙" });
  });

  it("từ chối giải mã khi bản ghi/AAD bị tráo", async () => {
    const key = await deriveVaultKey("mat-khau-thu-nghiem-rat-dai", new Uint8Array(16).fill(9), 1_000);
    const encrypted = await encryptJson(key, { secret: true }, "user:notes:A");
    await expect(decryptJson(key, encrypted, "user:notes:B")).rejects.toThrow();
  });
});
