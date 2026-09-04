# Upload Huyền Bút Các 0.19.0 lên GitHub

## File này dùng thế nào

1. Giải nén `HuyenButCac-0.19.0-GITHUB-READY.zip` trên máy.
2. Upload **toàn bộ nội dung bên trong thư mục đã giải nén** vào root repository `HuyenButCac` (không upload nguyên ZIP như một file trong repo).
3. Giữ nguyên cấu trúc `.github/`, `src/`, `public/`, `supabase/`, `docs/`, `scripts/`.
4. Commit lên `main` để workflow `Deploy Huyền Bút Các` chạy.
5. Chỉ dùng bản deploy mới khi các gate đều xanh: Static regression audit → Oxlint → Typecheck/Vite build → Vitest → Deploy.

## Supabase 0.19.0

Sau khi source đã lên GitHub, mở Supabase Dashboard → SQL Editor và chạy:

`supabase/migration_0_19_0_private_backups.sql`

Nếu chưa chạy migration, core sync vẫn fallback full-pull tương thích 0.18.x; full cloud backup sẽ chưa hoạt động.

## Web Push

Chạy `npm run vapid:generate`, sau đó đặt public key vào GitHub Variable `VITE_WEB_PUSH_VAPID_PUBLIC_KEY`; private key chỉ lưu trong Supabase secrets. Không commit private key.

## Bảo toàn dữ liệu

Không xóa PWA/Site Data/IndexedDB trước khi CI 0.19.0 xanh. Bản 0.19 có chức năng `Xuất backup toàn bộ` trong Tàng Thư Mật Cảnh → Cập nhật an toàn & sao lưu.
