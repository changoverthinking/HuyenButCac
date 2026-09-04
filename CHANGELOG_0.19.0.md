# Huyền Bút Các 0.19.0 — Data Safety & Stability

## Mục tiêu
0.19.0 ưu tiên bảo toàn công cụ đang có. Không viết lại Tàng Thư, Dự án, Tiểu Nhị, Vạn Niên hay engine Huyền Học. Các thay đổi mới được đặt thành lớp độc lập và có regression audit để tránh sửa một phần làm hỏng phần khác.

## Đã hoàn thiện

### Bảo vệ dữ liệu
- Thêm backup/restore toàn workspace ở tầng IndexedDB, bao gồm DB chính, Tàng Thư/PDF/ảnh bìa, ảnh giao diện và DB Tiểu Nhị.
- Giữ Blob/ArrayBuffer/Uint8Array/undefined khi backup, không chuyển PDF/media thành metadata rỗng; parser khóa database/localStorage ngoài phạm vi workspace.
- Backup từ tài khoản A không thể restore nhầm vào workspace tài khoản B. Restore chỉ clear các store có trong backup, không xóa store mới/không liên quan của phiên bản khác.
- Thêm backup cloud toàn workspace: nén (khi trình duyệt hỗ trợ), AES-256-GCM trên client, sau đó upload vào Supabase Storage bucket private.
- Safe Update chờ autosave đang mở; tài khoản đăng nhập sẽ delta-sync + full cloud backup trước update, khách sẽ xuất file backup trước update.
- Update prompt ngoài màn hình cũng chờ autosave và xuất backup trước reload.

### Đồng bộ
- Upload chỉ mã hóa/gửi record chưa ở trạng thái `synced`, không re-upload toàn dataset mỗi lần.
- Remote pull dùng server cursor khi Supabase đã cài migration 0.19.0; cursor chỉ tiến theo record đã thực sự pull, không nhảy theo timestamp của chính batch upload nên không bỏ qua thay đổi đồng thời từ thiết bị khác.
- Có capability handshake `hbc_sync_cursor_version()`; server cũ tự động fallback full-pull 0.18.x để không bỏ sót dữ liệu.
- Trigger server cập nhật `server_updated_at` khi upsert/update.

### Ổn định giao diện
- Thêm Error Boundary toàn app; lỗi Huyền Học được cô lập riêng, không làm sập các công cụ khác.
- Huyền Học được lazy-load trực tiếp trong Vạn Niên. `HuyenHocBridge` chỉ còn compatibility stub trả `null`; không còn MutationObserver/query/poll DOM và không được import.
- Gộp rule của `hotfix-tangthu-mobile.css` vào stylesheet chủ sở hữu; file cũ chỉ còn compatibility stub không có selector để upload đè an toàn qua GitHub Web.
- Giữ nguyên engine Tử Vi, Kinh Dịch, Tướng Số và các regression test hiện có.

### PWA / CI
- Prewarm PDF.js và JSZip vào đúng cache Workbox, có timeout để không treo bước install nếu CDN chậm/offline.
- Thêm `npm run vapid:generate` để tạo VAPID P-256 đúng định dạng mà không lưu private key vào repo.
- Thêm `npm run audit:static` với 12 nhóm kiểm tra: import/version, Huyền Học lazy isolation, CSS, autosave/update, migration, concurrent-sync cursor, restore scope, PWA cache, GitHub Actions và SHA-256 khóa 98 file source ngoài phạm vi patch.
- CI đóng gói artifact 0.19.0 và chạy static audit trước lint/build/test.
- Sửa cảnh báo lint cũ trong test Huyền Học.

## Migration bắt buộc cho tính năng cloud mới
Chạy `supabase/migration_0_19_0_private_backups.sql` trong Supabase SQL Editor. Nếu chưa chạy, core sync vẫn hoạt động an toàn ở chế độ full-pull tương thích 0.18.x; full-workspace cloud backup sẽ báo rõ bucket chưa được cài.

## Không tự động thay thế trong 0.19.0
- Rich-text toolbar vẫn giữ `document.execCommand` vì thay editor engine trong cùng bản Data Safety có rủi ro làm hỏng format/undo/redo hiện có. Đây là migration riêng cần test tương thích nội dung.
- Realtime collaboration, native iOS/Android widget và QA trên thiết bị vật lý không thể xác nhận chỉ bằng source patch.
