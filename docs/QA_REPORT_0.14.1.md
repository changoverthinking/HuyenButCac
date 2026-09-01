# QA REPORT — Huyền Bút Các 0.14.1

## Phạm vi bản vá

- Gỡ nút nhạc nổi (`music-bubble`) khỏi giao diện mobile. Tiên Âm Các vẫn mở từ menu bên.
- Sửa luồng Supabase Quên mật khẩu / Đặt lại mật khẩu cho GitHub Pages + PWA + PKCE.
- Thêm marker `?auth=recovery` riêng cho redirect khôi phục.
- Tự mở AccountPanel khi app được mở từ email recovery.
- Chặn đổi mật khẩu nếu recovery session chưa hợp lệ hoặc đã hết hạn.
- Thêm nút gửi lại email recovery khi liên kết không còn hợp lệ.
- Dọn tham số recovery khỏi URL sau khi cập nhật mật khẩu thành công.

## Kiểm tra tĩnh

- 66 file TS/TSX: 0 lỗi parse.
- 162 import tương đối: 162/162 hợp lệ.
- `package.json` và `package-lock.json` đồng bộ version 0.14.1.
- Không thêm dependency frontend mới.
- Không đưa `.env`, `node_modules`, `dist` hoặc secret vào package.

## Hạn chế môi trường QA

Môi trường đóng gói hiện dùng Node 22.16.0 trong khi project yêu cầu Node >=22.22.2; `npm ci` không hoàn tất do registry/network timeout. Full `npm run build` và `npm run test` tiếp tục được GitHub Actions thực hiện bằng Node 22.22.2 trước deploy.
