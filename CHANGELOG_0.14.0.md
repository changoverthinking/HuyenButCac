# Huyền Bút Các 0.14.0 — Lịch hẹn & Nhắc hạn

- Thêm CalendarEvent vào IndexedDB v7 và E2EE sync.
- Ghi chú/đặt lịch trực tiếp lên ngày Dương/Âm.
- Chọn thời gian nhắc và màu event.
- Local system notifications + service-worker notification click deep-link.
- Web Push subscriptions theo từng thiết bị.
- Supabase reminder queue không lưu title/note plaintext.
- Edge Function `process-calendar-reminders` gửi push tới mọi device subscription của user.
- pg_cron/pg_net setup mỗi phút.
- PWA shortcuts: Lịch hôm nay / Đặt lịch mới.
- Badge API khi nền tảng hỗ trợ.
- Test service CRUD/tombstone và sync coverage.

- Retry Web Push riêng từng thiết bị bằng `calendar_reminder_deliveries`; subscription chết 404/410 tự dọn.
- Tự hết hạn reminder server quá 7 ngày để không dồn thông báo cũ.
- Tự đăng ký lại Push nếu VAPID public key được đổi.
- Xóa lịch scrub tiêu đề/ghi chú khỏi tombstone local trước khi đồng bộ xóa.
- Khi app đang hiển thị, Service Worker chuyển tín hiệu về app để tránh push generic ghi đè thông báo local chi tiết.
