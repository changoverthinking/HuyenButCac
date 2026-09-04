# QA / Regression Gate — 0.19.0

Baseline production: commit `3e1ca672c23661c58af6c09171b3abc1e485ff9e` (0.18.0).
Baseline GitHub Actions: lint/build/test/deploy PASS, 30 test files / 160 tests.

## Gate mới 0.19.0

1. `npm run audit:static`
2. `npm run lint`
3. `npm run build`
4. `npm run test`

CI không deploy nếu một gate thất bại.

## Regression bắt buộc sau upload

- Ghi chú: tạo/sửa/autosave/khóa/mở khóa/thùng rác.
- Dự án: Quyển → Chương, editor dài, autosave, Story Bible.
- Tàng Thư: thêm PDF, mở PDF, bookmark, ảnh bìa, mở dự án.
- Tiên Âm Các: thêm nhạc, đổi bài, phát tiếp khi đóng modal.
- Tiểu Nhị: local/online mode, history, memory, index Tàng Thư.
- Vạn Niên: chuyển tháng/năm, tạo/sửa/xóa lịch, notification permission.
- Huyền Học: Can Chi, Bát Trạch, Tướng Số, Tử Vi, 64 Quẻ, Phi Tinh.
- Mind Map / Whiteboard: tạo, sửa, xóa, mở lại.
- Tài khoản: login/logout/switch workspace, Kho bảo mật, sync.
- PWA update: nội dung editor đang gõ phải được flush trước khi reload.
- Backup: file local phải khôi phục được Blob PDF/media và không cho trộn workspace.

## Kiểm tra tĩnh đã thực hiện khi đóng gói local

- TypeScript parser syntax audit: **108 source/test/config files PASS**.
- Static regression audit: **12/12 nhóm PASS** (bao gồm relative import).
- CSS block balance: PASS.
- `git diff --check`: PASS.
- `public/push-sw.js`: `node --check` PASS.
- `scripts/generate-vapid.mjs` + `scripts/static-audit.mjs`: `node --check` PASS.
- Workflow YAML parse: PASS.
- SHA-256 baseline lock: **98 file `src/` ngoài phạm vi patch không đổi byte nào so với 0.18.0**.
- Concurrent sync cursor guard + backup restore scope guard: PASS trong static gate.
- Core modified data services semantic type-audit (external imports stubbed): PASS; audit này đã bắt và sửa 2 lỗi TypeScript trước khi đóng gói.

## Giới hạn môi trường đóng gói
Container không truy cập ổn định `registry.npmjs.org` (`EAI_AGAIN`), nên không tuyên bố đã chạy lại Vitest/build production local cho 0.19.0. Source package giữ workflow CI để GitHub chạy chính xác `npm ci → static audit → lint → build → test → deploy` sau khi upload. Nếu CI đỏ, không được deploy và phải dùng log đó để sửa trước.
