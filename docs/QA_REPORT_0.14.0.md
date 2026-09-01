# QA REPORT — Huyền Bút Các 0.14.0

Ngày kiểm tra: 2026-09-01

## Phạm vi bản 0.14.0

Bản này giữ nguyên cấu trúc dự án 0.13.0 và bổ sung lịch cá nhân/nhắc hạn vào module Lịch Vạn Niên:

- `CalendarEvent` trong IndexedDB v7.
- Ghi chú, lịch hẹn, giờ, sự kiện cả ngày, màu và thời gian nhắc.
- E2EE sync `calendarEvents` theo workspace/tài khoản.
- Notification local khi app đang chạy.
- Web Push khi app đóng bằng Service Worker + Supabase Edge Function.
- Subscription theo từng browser/device.
- Server delivery receipt theo từng endpoint để PC/điện thoại retry độc lập.
- PWA shortcuts `Lịch hôm nay`, `Đặt lịch mới`, Badge API và install prompt khi trình duyệt hỗ trợ.

## Lỗi tìm thấy và đã sửa trong lượt QA

1. VAPID key bị đổi nhưng browser giữ subscription tạo bằng key cũ → tự hủy và đăng ký subscription mới.
2. Một thiết bị Push lỗi tạm thời có thể bị bỏ qua nếu thiết bị khác đã nhận → thêm `calendar_reminder_deliveries`, retry riêng từng endpoint.
3. Edge Function strict TypeScript có callback suy luận `any` → thêm type rõ cho delivery row.
4. App đang mở có thể nhận cả notification local và generic Web Push → Service Worker chuyển tín hiệu về client đang visible thay vì hiển thị generic lần hai.
5. Chạm Web Push mở app có thể khiến runtime local báo lại → deep-link acknowledgement + local receipt chống lặp.
6. Badge có thể giữ số lịch đã xử lý → badge chỉ đếm reminder local chưa có receipt; deep-link xử lý sẽ cập nhật/clear badge.
7. Reminder cũ có thể dồn lại khi người dùng bật Push sau thời gian dài → server đánh dấu `expired` sau 7 ngày.
8. Xóa CalendarEvent trước đây còn giữ title/note trong tombstone → scrub title/note/reminder trước khi sync tombstone.
9. Service Worker chưa active ở môi trường dev có thể làm chờ `ready` quá lâu → giới hạn chờ 8 giây.
10. `renotify` có khác biệt type lib giữa TypeScript/DOM versions → bỏ thuộc tính không cần thiết ở frontend, vẫn dùng `tag` để coalesce notification.

## Kết quả kiểm tra tĩnh

- 69 file `.ts/.tsx` (bao gồm frontend, config và Edge Function): **0 syntax error**.
- 161 import tương đối: **0 đường dẫn hỏng**.
- `package.json`, `package-lock.json`: hợp lệ.
- `tsconfig*.json`: TypeScript parser đọc hợp lệ.
- `.github/workflows/deploy.yml` và `deploy.yml`: YAML hợp lệ.
- `supabase/config.toml`: TOML hợp lệ.
- `src/index.css`: số ngoặc `{}` cân bằng.
- Calendar services isolated strict TypeScript check: **PASS**.
- Edge Function isolated strict TypeScript check: **PASS**.
- CalendarView semantic check với DOM/React stubs: **PASS**.
- Âm lịch regression: **8/8 PASS**, gồm 01/09/2026, Mùng 1 Tết 2026/2025/2024, Giao thừa 2026 và Can Chi/Tết marker.
- Không có `.env` thật, `node_modules`, `dist`, `coverage`, `.vite` trong gói phát hành.
- Quét mẫu secret phổ biến: không phát hiện token/service-role/private key thật.

## Test source đã bổ sung

`src/tests/calendarEventsService.test.ts` kiểm tra:

- tạo lịch có note/reminder;
- cập nhật event;
- xóa event + dọn receipt + scrub tombstone;
- từ chối tiêu đề rỗng;
- từ chối reminder đặt sau thời điểm event.

`src/tests/syncService.test.ts` kiểm tra `calendarEvents` nằm trong `SYNC_TABLES`.

## Hạn chế của môi trường QA hiện tại

Không thể hoàn tất `npm ci -> npm run build -> npm run test` ngay trong container QA vì:

- Node hiện tại: `22.16.0`;
- project/jsdom yêu cầu Node `>=22.22.2` (jsdom còn yêu cầu `^22.22.2 || ^24.15.0 || >=26`);
- npm cache không có đủ package và registry trong môi trường QA không tải dependency ổn định.

GitHub Actions đã cố định Node `22.22.2` và workflow sẽ chạy theo thứ tự:

1. `npm ci`
2. `npm run build` (`tsc -b && vite build`)
3. `npm run test`
4. deploy GitHub Pages chỉ khi các bước trên đạt.

Đây là kiểm tra cuối cần quan sát sau khi upload repository.

## Web Push — điều kiện để hoạt động khi app đã đóng

Source đã đầy đủ nhưng không thể đóng gói private secret vào ZIP. Chủ dự án cần:

1. chạy `supabase/migration_checkpoint_15_calendar_notifications.sql`;
2. tạo VAPID key pair;
3. đặt public key thành GitHub Variable `VITE_WEB_PUSH_VAPID_PUBLIC_KEY`;
4. đặt VAPID private/public + `REMINDER_CRON_SECRET` trong Supabase secrets;
5. deploy `process-calendar-reminders`;
6. tạo Vault secrets và chạy `supabase/setup_reminder_cron.sql`.

Nếu chưa cấu hình backend, lịch vẫn lưu/sync và local notification vẫn hoạt động khi app đang chạy, nhưng app đã đóng sẽ không được server đánh thức.

## Widget/shortcut

- PWA shortcuts + install prompt + badge: đã implement.
- Native live widget kiểu iOS WidgetKit / Android App Widget: không thể tạo bằng PWA thuần theo chuẩn web hiện tại. Muốn widget sống trực tiếp trên Home Screen cần thêm native wrapper/phần Swift/Kotlin riêng.

## Kết luận QA

Source 0.14.0 ở trạng thái **READY FOR GITHUB/CI**. Phần duy nhất cần xác nhận ngoài môi trường này là full dependency build/test trên GitHub Actions và test Web Push thật sau khi chủ dự án cấu hình VAPID/Supabase trên tài khoản của mình.
