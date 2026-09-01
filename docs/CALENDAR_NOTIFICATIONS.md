# Lịch hẹn, nhắc hạn và Web Push — Huyền Bút Các 0.14.0

## Có gì trong bản này

- Ghi chú/lịch hẹn trực tiếp lên từng ngày trong Lịch Vạn Niên.
- Tiêu đề, ghi chú, ngày, giờ, sự kiện cả ngày, màu dấu lịch.
- Nhắc: đúng giờ / trước 5 / 15 / 30 phút / 1 giờ / 1 ngày.
- Lịch cá nhân được lưu local-first trong IndexedDB và nằm trong `SYNC_TABLES`, nên khi mở Kho bảo mật nó đồng bộ mã hóa như ghi chú/dự án.
- Khi app đang mở và JavaScript đang hoạt động: runtime kiểm tra lịch đến hạn mỗi 30 giây và dùng Notifications API/Service Worker để hiện thông báo hệ thống.
- Khi app đã đóng: Web Push nhận từ Supabase Edge Function, miễn là thiết bị đã đăng ký Push.
- Mỗi thiết bị có biên nhận local riêng (`calendarNotificationReceipts`) và server có `calendar_reminder_deliveries` theo endpoint, nên điện thoại/PC retry độc lập mà thiết bị đã nhận không bị gửi lặp.
- PWA manifest có shortcut `Lịch hôm nay` và `Đặt lịch mới`.
- Badge API được dùng khi nền tảng hỗ trợ để hiện số lịch đến hạn trên icon app.

## Quyền riêng tư

Nội dung `CalendarEvent` nằm trong `sync_records` và được mã hóa bởi Kho như các entity đồng bộ khác.

Để máy chủ có thể biết lúc nào cần đánh thức thiết bị, `calendar_reminder_jobs` chỉ lưu:

- `user_id`
- `event_id`
- thời điểm `scheduled_at`
- deep-link mở event
- trạng thái gửi

`calendar_reminder_deliveries` chỉ lưu ID event, thời điểm nhắc, endpoint đã nhận và thời gian gửi; không lưu nội dung lịch. Các job quá hạn hơn 7 ngày mà chưa có thiết bị nhận sẽ được đánh dấu `expired`.

Bảng reminder **không lưu tiêu đề hay nội dung ghi chú lịch**. Vì vậy Web Push khi app đóng dùng thông báo chung “Bạn có một lịch hẹn đến thời gian đã đặt”; sau khi chạm vào thông báo, app mới đọc/giải mã event trên thiết bị.

`web_push_subscriptions` lưu endpoint Push và hai khóa subscription (`p256dh`, `auth`) do trình duyệt cấp. Endpoint Push phải được coi là dữ liệu nhạy cảm vận hành; RLS chỉ cho chính tài khoản quản lý subscription của mình, Edge Function dùng service role.

## Cài Web Push để báo khi app đã đóng

### 1. Chạy migration

Trong Supabase SQL Editor chạy:

`supabase/migration_checkpoint_15_calendar_notifications.sql`

Project Supabase mới có thể chạy toàn bộ `supabase/schema.sql`.

### 2. Tạo VAPID key

Trên máy có Node.js:

```bash
npx web-push generate-vapid-keys
```

Bạn nhận `Public Key` và `Private Key`.

- Public Key: GitHub repository → Settings → Secrets and variables → Actions → Variables → tạo `VITE_WEB_PUSH_VAPID_PUBLIC_KEY`.
- Private Key: **KHÔNG** đưa lên GitHub và không đặt trong biến `VITE_*`.

### 3. Cấu hình Supabase Edge Function secrets

Tạo một chuỗi bí mật dài ngẫu nhiên cho `REMINDER_CRON_SECRET`.

Nếu dùng Supabase CLI:

```bash
supabase secrets set WEB_PUSH_VAPID_PUBLIC_KEY="PUBLIC_KEY"
supabase secrets set WEB_PUSH_VAPID_PRIVATE_KEY="PRIVATE_KEY"
supabase secrets set WEB_PUSH_VAPID_SUBJECT="mailto:YOUR_EMAIL@example.com"
supabase secrets set REMINDER_CRON_SECRET="A_LONG_RANDOM_SECRET"
```

`SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` là secret hệ thống của Edge Function trên hosted Supabase.

### 4. Deploy Edge Function

Source đã có tại:

`supabase/functions/process-calendar-reminders/`

`supabase/config.toml` đặt `verify_jwt=false` riêng cho function này vì function không nhận JWT người dùng; thay vào đó nó bắt buộc header bí mật `x-hbc-cron-secret`.

Deploy:

```bash
supabase functions deploy process-calendar-reminders
```

### 5. Tạo Cron mỗi phút

Mở `supabase/setup_reminder_cron.sql`.

Tạo 3 secret trong Supabase Vault bằng các lệnh đã chú thích trong file:

- `hbc_project_url`
- `hbc_publishable_key`
- `hbc_reminder_cron_secret`

Sau đó chạy phần `cron.schedule`. Job `hbc-calendar-reminders` gọi Edge Function mỗi phút.

Độ trễ thông báo nền thông thường vì thế vào khoảng 0–1 phút cộng thời gian Push của hệ điều hành.

## iPhone / iPad

Web Push trên iOS/iPadOS yêu cầu web app được **Add to Home Screen** và quyền Notification phải được yêu cầu sau một thao tác trực tiếp của người dùng. Trong Huyền Bút Các, người dùng bấm `Bật thông báo` trong Lịch Vạn Niên.

Quy trình:

1. Mở Huyền Bút Các trên iPhone/iPad.
2. Share → Add to Home Screen / Thêm vào Màn hình chính.
3. Mở Huyền Bút Các từ icon vừa cài.
4. Vào `Vạn niên` → `Bật thông báo` → Allow.
5. Đăng nhập cùng tài khoản và mở Kho để lịch cá nhân đồng bộ.

Thông báo Web Push sau đó có thể hiện ở Lock Screen/Notification Center theo cài đặt iOS.

## PC / Android

- Cài PWA từ Chrome/Edge (hoặc trình duyệt hỗ trợ).
- Cho phép Notification.
- Đăng nhập cùng tài khoản.
- Mỗi browser profile/device có một Push subscription riêng; Edge Function gửi tới tất cả subscription còn hợp lệ.

## Shortcut và widget

Manifest khai báo hai shortcut:

- `Lịch hôm nay` → `?mode=calendar&calendar=today`
- `Đặt lịch mới` → `?mode=calendar&calendar=new`

Nền tảng có hỗ trợ manifest shortcuts có thể hiện chúng trong menu khi nhấn giữ/chuột phải icon PWA.

PWA thuần hiện không có API chuẩn đa nền tảng để tạo **native Home Screen widget** kiểu WidgetKit (iOS) hay App Widget (Android) có nội dung lịch sống trực tiếp trên màn hình. Muốn widget native thực sự cần wrapper/native app (ví dụ Capacitor + phần native Swift/Kotlin). Bản web hiện cung cấp icon PWA, shortcuts, badge và notifications — những khả năng phù hợp chuẩn web.

## Test nhanh

1. Tạo lịch 3–5 phút trong tương lai, bật nhắc `Trước 5 phút` hoặc `Đúng giờ`.
2. Bật Notification và giữ app mở → phải thấy system notification.
3. Sửa lịch → chỉ còn lịch mới, reminder job server phải trở về `pending`.
4. Xóa lịch → event biến mất và reminder job server bị xóa khi có mạng.
5. Đăng nhập cùng account trên PC + phone → lịch phải xuất hiện ở cả hai sau sync.
6. Với Web Push đã cấu hình: đóng PWA trên cả hai thiết bị → tới hạn, cả subscription hợp lệ đều nhận push.
7. Chạm notification → mở `Vạn niên` đúng event.
