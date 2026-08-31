# QA REPORT — Huyền Bút Các 0.12.2

Phiên bản ứng dụng: `0.12.2-stable-sync-workspaces`

## Phạm vi sửa lỗi

- Đồng bộ không còn đánh dấu nhầm bản chỉnh sửa phát sinh trong lúc request đang chạy.
- Sync được khóa vào đúng workspace/user lúc bắt đầu và tự dừng nếu đổi tài khoản giữa chừng.
- IndexedDB tách riêng `guest` và từng Supabase `user.id`; không clear workspace cũ khi đổi tài khoản.
- Migration database legacy thực hiện copy một lần, không mở transaction chéo database.
- Xóa vĩnh viễn ghi chú bỏ plaintext/ciphertext và chỉ giữ tombstone tối thiểu.
- Khóa ghi chú dùng PBKDF2 + AES-256-GCM; plaintext của note khóa không lưu trong IndexedDB.
- Autosave NoteEditor/FocusWriter tuần tự hóa và flush khi ẩn trang/pagehide; nút thoát Focus Writer chờ save cuối.
- Xóa Project/Section/Chapter không tạo chapter/node/timeline link mồ côi.
- Nested folders hiển thị được trong Sidebar.
- Media Session không đăng ký handler lại theo từng tick thời gian.
- Reset Kho bảo mật dùng RPC PostgreSQL nguyên tử.
- `.gitignore`, `.env.example`, Node engine và GitHub Pages workflow đã được chuẩn hóa.

## Kiểm tra đã chạy trong môi trường sửa

- Parse TypeScript/TSX: **60 file, 0 parse error**.
- Static TypeScript check toàn bộ `src`: **0 error**, gồm `noUnusedLocals` và `noUnusedParameters`.
- Static TypeScript check `vite.config.ts`/`vitest.config.ts`: **0 error**.
- Relative imports: **144 import, 0 đường dẫn lỗi**.
- YAML: `.github/workflows/deploy.yml` và `deploy.yml` parse hợp lệ.
- `package.json`/`package-lock.json`: parse hợp lệ và cùng version `0.12.2`.
- `git diff --check`: không có whitespace error.
- Secret scan: không tìm thấy `.env`, private key, service-role token hoặc JWT secret trong package.
- Package hygiene: không có `node_modules`, `dist`, `coverage`, `.vite` trong ZIP phát hành.

## Regression tests được bổ sung

- Workspace A/B không đọc/xóa dữ liệu local của nhau.
- Hard-delete không giữ title/content/tag/ciphertext.
- Note lock không giữ plaintext trong IndexedDB; sai mật khẩu bị từ chối, đúng mật khẩu mới hydrate nội dung.
- Xóa Section chuyển chapter về Project root.
- Xóa Project gỡ link Project/Section/Chapter kể cả trên Mind Map tự do.

## Giới hạn kiểm tra local

Môi trường đóng gói hiện có Node `22.16.0` và không phân giải được DNS tới `registry.npmjs.org`, trong khi dependency hiện tại (đặc biệt `jsdom`) yêu cầu Node `>=22.22.2`. Vì vậy `npm ci`, Vitest runtime và Vite production build không thể chạy đầy đủ tại môi trường này.

Để tránh phát hành bằng sai Node, repository đã cố định GitHub Actions ở **Node 22.22.2**. Sau khi upload lên GitHub, workflow sẽ chạy theo thứ tự `npm ci` → `npm run build` → `npm run test` trước khi deploy Pages; nếu build/test lỗi thì job deploy không chạy.
