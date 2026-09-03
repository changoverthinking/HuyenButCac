# Hướng dẫn cập nhật Huyền Bút Các 0.16.2

## 1. Upload lên GitHub

1. Giải nén gói cập nhật 0.16.2.
2. Upload toàn bộ nội dung trong thư mục `UPLOAD_TO_GITHUB` vào **root** repository `changoverthinking/HuyenButCac` và chọn Replace/Overwrite khi GitHub hỏi.
3. Không upload `node_modules`, `dist`, `.env*`, service-role key, VAPID private key hoặc dữ liệu người dùng.
4. Xóa các file vá cũ được liệt kê trong `DELETE_THESE_FROM_GITHUB.txt` của gói cập nhật; chúng không còn được dùng và có thể ghi đè source mới nếu chạy lại.
5. Commit gợi ý: `release: Huyen But Cac 0.16.2 stability update`.
6. GitHub Actions → `Deploy Huyền Bút Các`: các bước **Oxlint**, **Typecheck + build**, **Vitest** và **deploy** phải xanh.

## 2. Supabase bắt buộc cho chức năng đặt lại Kho

GitHub chỉ lưu file SQL; upload file migration không tự chạy trên Supabase.

Trong Supabase Dashboard → SQL Editor, chạy lại bản mới nhất:

`supabase/migration_checkpoint_14_2_reset_vault.sql`

Migration này cài RPC `reset_my_vault(new_salt, new_verifier)` dùng bởi `Tàng Thư Mật Cảnh → Bảo mật → Quên mật khẩu Kho?`.

Nếu project Supabase chưa từng cài E2EE, chạy trước:

`supabase/migration_checkpoint_12_e2ee.sql`

## 3. Web Push lịch khi app đóng

Nếu chưa cấu hình, GitHub Actions sẽ cảnh báo thiếu `VITE_WEB_PUSH_VAPID_PUBLIC_KEY` nhưng vẫn deploy. Lịch và thông báo local vẫn hoạt động; Web Push khi app đóng thì chưa.

Làm theo `docs/CALENDAR_NOTIFICATIONS.md`:

1. chạy `supabase/migration_checkpoint_15_calendar_notifications.sql`;
2. tạo VAPID key pair;
3. Public key → GitHub Variable `VITE_WEB_PUSH_VAPID_PUBLIC_KEY`;
4. Private/public VAPID + `REMINDER_CRON_SECRET` → Supabase secrets;
5. deploy Edge Function `process-calendar-reminders`;
6. cấu hình cron theo `supabase/setup_reminder_cron.sql`.

**Không đưa VAPID private key hoặc Supabase service-role key lên GitHub.**

## 4. Kiểm tra sau deploy

- Topbar hiển thị `0.16.2`.
- Thanh trạng thái chỉ ghi `Có mạng`/`Ngoại tuyến`; trạng thái đồng bộ thật xem trong `Tàng Thư Mật Cảnh → Đồng bộ`.
- Dự án: tạo nhiều chương, xóa một chương giữa danh sách, tạo chương mới; thứ tự không được trùng.
- Dự án: dùng `Sửa tên`, `Lên`, `Xuống`, `Chuyển` để tổ chức chương/phần.
- Kho: đặt lại mật khẩu phải hiện banner thành công/lỗi ngay trong tab Bảo mật.
- PDF: đổi trang bằng trình đọc tích hợp, đóng/mở lại phải trở về trang gần nhất; ghim trang phải mở lại đúng trang ghim.
- Tiểu Nhị: nút nằm trực tiếp cạnh Tàng Thư Mật Cảnh trên desktop và cạnh tài khoản trên mobile; mở/đóng không tạo nút trùng.
- iPhone/PWA: đóng hẳn app rồi mở lại sau deploy để service worker nhận bản mới; nếu có banner cập nhật thì chọn cập nhật.

## 5. Ghi chú dữ liệu

Bản 0.16.2 không đổi schema IndexedDB chính. Các thay đổi sắp xếp chỉ chuẩn hóa `order` khi thao tác; không xóa nội dung chương. PDF, ảnh bìa, MP3 và ảnh nền vẫn là dữ liệu cục bộ theo thiết bị/workspace như trước.
