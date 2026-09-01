# THREAT MODEL — Huyền Bút Các 0.12.2

## Tài sản cần bảo vệ

- Nội dung ghi chú, dự án, mind map, whiteboard.
- Workspace local của từng tài khoản.
- Khóa Kho bảo mật và khóa tạm của ghi chú khóa.
- Phiên Supabase Authentication.

## Mối đe dọa chính và biện pháp hiện tại

1. **Người khác đăng nhập tài khoản khác trên cùng trình duyệt**
   IndexedDB được tách theo workspace `guest`/`userId`; chuyển tài khoản không `clear()` và không dùng chung DB.

2. **Server/cloud đọc nội dung đồng bộ**
   Payload sync được mã hóa AES-256-GCM trên client. Khóa được dẫn xuất từ mật khẩu Kho bằng PBKDF2-SHA-256 và chỉ giữ trong RAM.

3. **Người khác có quyền xem IndexedDB trên cùng thiết bị**
   Ghi chú được khóa riêng sẽ mã hóa tiêu đề/nội dung/tag bằng AES-256-GCM. Mật khẩu/key ghi chú không lưu vào IndexedDB/localStorage. Các ghi chú không khóa vẫn là dữ liệu local plaintext trong workspace.

4. **Race condition làm cloud ghi đè nội dung mới**
   Sync chụp snapshot trước upload và chỉ đánh dấu `synced` nếu record hiện tại vẫn đúng fingerprint snapshot đó. Record `local/pending` không bị remote pull ghi đè.

5. **XSS từ HTML rich-text/sync**
   HTML contentEditable được sanitize khi lưu và sanitize lại trước khi gán `innerHTML`; loại script, iframe, SVG, event handler và URL nguy hiểm.

6. **Rò secret qua GitHub**
   `.gitignore` chặn `.env*` (trừ `.env.example`). Frontend chỉ dùng Supabase publishable/anon key; `service_role` không được đưa vào source.

## Giới hạn còn lại

- Ghi chú không bật khóa riêng vẫn nằm plaintext trong IndexedDB local.
- Nếu thiết bị hoặc trình duyệt đã bị malware/XSS kiểm soát khi người dùng đang mở dữ liệu, mã hóa at-rest không thể bảo vệ nội dung đã giải mã trong RAM.
- PBKDF2 được dùng vì WebCrypto hỗ trợ native rộng trên PWA; không tuyên bố sử dụng Argon2id.
- Cần tiếp tục chạy dependency audit và regression test ở CI trước release.
