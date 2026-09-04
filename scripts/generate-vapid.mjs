import { generateKeyPairSync } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const publicJwk = publicKey.export({ format: "jwk" });
const privateJwk = privateKey.export({ format: "jwk" });

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="), "base64");
}

function toBase64Url(buffer) {
  return Buffer.from(buffer).toString("base64url");
}

if (!publicJwk.x || !publicJwk.y || !privateJwk.d) throw new Error("Không thể xuất VAPID P-256 JWK.");
const publicRaw = Buffer.concat([Buffer.from([0x04]), fromBase64Url(publicJwk.x), fromBase64Url(publicJwk.y)]);
const privateRaw = fromBase64Url(privateJwk.d);

console.log("VITE_WEB_PUSH_VAPID_PUBLIC_KEY=" + toBase64Url(publicRaw));
console.log("WEB_PUSH_VAPID_PUBLIC_KEY=" + toBase64Url(publicRaw));
console.log("WEB_PUSH_VAPID_PRIVATE_KEY=" + toBase64Url(privateRaw));
console.log("WEB_PUSH_VAPID_SUBJECT=mailto:YOUR_EMAIL@example.com");
console.log("\nGiữ PRIVATE KEY trong Supabase secrets. Không commit private key vào repository.");
