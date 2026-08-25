# ARCHITECTURE — Huyền Bút Các

## Nguyên tắc
- **Local-first tuyệt đối**: mọi dữ liệu người dùng nằm trong IndexedDB (Dexie) trên thiết bị. App chạy đầy đủ offline.
- **GitHub Pages = static host only**: chỉ HTML/CSS/JS/asset/service worker. Không có backend, không có bí mật nào được đóng gói vào frontend.
- **Đồng bộ là opt-in**: mặc định `LocalOnlyProvider`. Nếu người dùng bật đồng bộ, dữ liệu được mã hóa trên thiết bị trước khi rời thiết bị (chưa triển khai ở checkpoint này — xem FEATURE_MATRIX).

## Sơ đồ tầng
```
UI (React components)
   │
Stores (Zustand) ── state phái sinh, không phải nguồn sự thật
   │
Features/*/service.ts ── logic nghiệp vụ, validation
   │
database/db.ts (Dexie) ── nguồn sự thật, IndexedDB
   │
   └─ (tương lai) services/sync/* ── SyncProvider interface, mã hóa trước khi upload
```

## Vì sao Zustand không phải nguồn sự thật
Store chỉ cache dữ liệu đã đọc từ Dexie để UI render nhanh. Mọi ghi (create/update/delete) đi qua service → Dexie trước, sau đó service cập nhật store. Nếu reload trang, store rebuild từ Dexie — đảm bảo "reload không mất dữ liệu" theo đúng tiêu chí STABLE ở mục 18.

## Schema versioning
`src/database/db.ts` định nghĩa `schemaVersion` cho từng entity và dùng Dexie `.version(n).stores(...)`. Khi đổi schema, luôn thêm `.version(n+1)` mới với `.upgrade()`, không sửa version cũ.

## Vị trí mã hóa (khi triển khai ở giai đoạn 7)
`src/features/encryption/` sẽ chứa: dẫn xuất khóa (Argon2id/PBKDF2), AES-GCM encrypt/decrypt, quản lý khóa trong bộ nhớ (không persist), và hook khóa notes trước khi ghi xuống Dexie nếu note được đánh dấu "locked".

## SyncProvider (interface, chưa có implementation thật ở checkpoint này)
```ts
interface SyncProvider {
  push(ops: SyncOperation[]): Promise<void>;
  pull(since: string): Promise<SyncOperation[]>;
  resolveConflict(local: Entity, remote: Entity): Entity;
}
```
`LocalOnlyProvider` là no-op. `EncryptedCloudProvider` (TODO) sẽ mã hóa ciphertext trước khi gọi adapter Supabase/Firebase.

## Không có phần nào trong checkpoint hiện tại tuyên bố "đã mã hóa" hoặc "đã đồng bộ" — cả hai đều chưa triển khai thật, đúng quy tắc mục 20.
