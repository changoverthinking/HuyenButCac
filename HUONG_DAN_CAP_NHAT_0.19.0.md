# Cập nhật Huyền Bút Các 0.19.0

## 1. Trước khi thay source
Không xóa PWA khỏi màn hình chính và không xóa Site Data/IndexedDB. Nếu bản 0.18.0 đang có dữ liệu quan trọng, giữ nguyên trình duyệt/profile hiện tại cho tới khi CI 0.19.0 xanh.

## 2. Upload source
Upload toàn bộ nội dung gói `HuyenButCac-0.19.0-source.zip` vào repository, thay file cùng tên và giữ nguyên cấu trúc thư mục.

## 3. Chạy migration Supabase
Trong Supabase Dashboard → SQL Editor, chạy toàn bộ file:

`supabase/migration_0_19_0_private_backups.sql`

Migration tạo bucket private `hbc-private`, policy theo user và capability/trigger cho delta pull. Không chạy migration không làm hỏng core sync: client sẽ fallback full-pull, nhưng full cloud backup chưa dùng được.

## 4. Cấu hình Web Push
Chạy local:

`npm run vapid:generate`

Sau đó cấu hình:
- GitHub Actions Variable: `VITE_WEB_PUSH_VAPID_PUBLIC_KEY`
- Supabase secrets: `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_VAPID_SUBJECT`

Không commit private key vào GitHub.

## 5. Đợi CI
Workflow phải PASS đủ:
- Static regression audit
- Oxlint
- Typecheck + Vite build
- Vitest
- Deploy Pages

Nếu một bước đỏ, không gỡ bản PWA đang dùng để thử chữa bằng cách xóa dữ liệu.

## 6. Sau deploy
Mở app → Tàng Thư Mật Cảnh → Cập nhật an toàn & sao lưu → `Xuất backup toàn bộ`. Nếu đã đăng nhập và mở Kho bảo mật, thử thêm `Backup cloud toàn bộ`.
