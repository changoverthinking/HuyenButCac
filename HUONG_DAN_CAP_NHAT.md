# Hướng dẫn cập nhật Huyền Bút Các 0.14.0 lên GitHub

## 1. Upload đúng cấu trúc

1. Giải nén ZIP bản 0.14.0.
2. Mở thư mục `HuyenButCac-main`.
3. Upload **toàn bộ nội dung bên trong** lên root repository `changoverthinking/HuyenButCac`.
4. Không upload `node_modules`, `dist`, `.env.local`, service-role key, VAPID private key hoặc dữ liệu người dùng.
5. Kiểm tra các đường dẫn mới vẫn còn nguyên:
   - `src/components/calendar/CalendarView.tsx`
   - `src/features/calendar/calendarEventsService.ts`
   - `src/features/calendar/notificationService.ts`
   - `public/push-sw.js`
   - `supabase/migration_checkpoint_15_calendar_notifications.sql`
   - `supabase/functions/process-calendar-reminders/index.ts`
   - `supabase/setup_reminder_cron.sql`
   - `supabase/config.toml`
6. Commit gợi ý: `Release 0.14.0 - calendar events and cross-device reminders`.
7. GitHub Actions → workflow `Deploy Huyền Bút Các`: build và deploy phải xanh.

## 2. Supabase bắt buộc cho thông báo khi app đóng

### Project đã chạy bản cũ

Chạy trong SQL Editor:

`supabase/migration_checkpoint_15_calendar_notifications.sql`

Migration tạo:

- `web_push_subscriptions`
- `calendar_reminder_jobs`
- `calendar_reminder_deliveries` (server-only để retry riêng từng thiết bị)
- RLS chỉ cho user quản lý dữ liệu của mình
- index tìm reminder đến hạn

### Project mới

Chạy `supabase/schema.sql`.

## 3. GitHub Actions Variables

Giữ hai biến cũ:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Thêm:

- `VITE_WEB_PUSH_VAPID_PUBLIC_KEY`

Public VAPID key được phép xuất hiện trong browser build. **Private VAPID key tuyệt đối không đưa vào GitHub Actions Variable `VITE_*`.**

## 4. Deploy Web Push backend

Làm đúng hướng dẫn chi tiết trong:

`docs/CALENDAR_NOTIFICATIONS.md`

Tóm tắt:

1. Tạo VAPID key pair.
2. Public key → GitHub Variable `VITE_WEB_PUSH_VAPID_PUBLIC_KEY`.
3. Supabase secrets: public/private VAPID, subject và `REMINDER_CRON_SECRET`.
4. Deploy `process-calendar-reminders`.
5. Tạo Vault secrets và chạy `supabase/setup_reminder_cron.sql`.

Nếu chưa làm bước backend này, lịch hẹn vẫn lưu/đồng bộ và Notification vẫn chạy khi app đang hoạt động, nhưng **không thể bảo đảm đánh thức một app đã đóng**.

## 5. Kiểm tra giao diện 0.14.0

- Phiên bản hiển thị: `0.14.0-calendar-reminders`.
- `Vạn niên` vẫn có Dương lịch + Âm lịch + Can Chi + Tết.
- Mỗi ngày có thể bấm `＋ Thêm` / `＋ Đặt lịch`.
- Form gồm tiêu đề, ghi chú, ngày, giờ, cả ngày, thời gian nhắc, màu dấu.
- Ngày có lịch cá nhân xuất hiện dấu màu và tên lịch ngay trong ô.
- Bên phải/dưới có `LỊCH CỦA TÔI`, sửa/xóa được.
- Có banner `Nhắc lịch trên điện thoại & máy tính` và nút `Bật thông báo`.
- Có thẻ `TIỆN ÍCH NHANH` mô tả PWA shortcuts.

## 6. Test đa thiết bị

1. PC: đăng nhập A, mở Kho, tạo lịch và sync.
2. Điện thoại: đăng nhập A, mở Kho → cùng lịch phải xuất hiện.
3. Bật Notification trên cả hai.
4. Tạo lịch vài phút phía trước.
5. App đang mở: notification local phải xuất hiện khi tới hạn.
6. Sau khi Web Push backend đã cấu hình: đóng app → notification vẫn phải tới cả thiết bị có subscription hợp lệ.
7. Chạm notification → mở đúng module Vạn niên/event.
8. Đăng nhập account B → không được thấy lịch local của A.

## 7. iPhone

Web Push iOS yêu cầu cài website thành Home Screen web app. Trên iPhone/iPad:

- Share → `Add to Home Screen` / `Thêm vào Màn hình chính`.
- Mở app từ icon Home Screen.
- Vào Vạn niên → bấm `Bật thông báo` → Allow.

## 8. Shortcut / widget

Bản này có manifest shortcuts `Lịch hôm nay` và `Đặt lịch mới` cho các hệ điều hành/browser hỗ trợ. PWA thuần không thể tạo widget native WidgetKit/App Widget đa nền tảng; muốn widget live native cần đóng app native/wrapper riêng.
