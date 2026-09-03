# Audit 0.18.0

Bản này tập trung vào lỗi tương tác thực tế được thấy trong UI Cài đặt và gộp các sửa ổn định 0.17.1.

## Đã xử lý
1. Wheel/trackpad/touch scroll trong Account/Settings.
2. Layout 4 tab Account bị wrap sai do CSS 3 cột cố định.
3. Modal nested Escape đóng sai lớp.
4. Tiên Âm Các nằm ngoài Cài đặt và chiếm dock đáy.
5. Tiên Âm Các mất khả năng tiếp tục phát nếu chỉ nhúng component vào modal: giải quyết bằng MusicProvider audio engine persistent.
6. Scroll danh sách Tiên Âm/Tàng Thư/Tiểu Nhị trên touch.
7. Các lỗi AI/RAG/PDF/appearance/workspace đã phát hiện ở audit 0.17.1.
8. Version/CI artifact không còn đứng ở 0.16.2.

## Không thể gọi là “100% trên mọi thiết bị” chỉ bằng source
Các mục sau cần môi trường/credential hoặc QA phần cứng bên ngoài repository:
- Web Push khi app đóng cần cấu hình `VITE_WEB_PUSH_VAPID_PUBLIC_KEY` và Supabase secrets/cron.
- QA iPhone/iPad Safari/PWA thật cần thiết bị thật.
- Native widget cần wrapper Swift/Kotlin; PWA thuần không có WidgetKit/App Widget.
- Đồng bộ blob media lớn (PDF/MP3/ảnh) cần chính sách Supabase Storage, quota và E2EE file strategy trước khi bật production.
- Realtime collaboration cần kiến trúc CRDT/Yjs và backend presence/session, không nên ghép vội vào bản sửa lỗi UI.

CI phải chạy `lint → tsc/vite build → Vitest` trước deploy. Bản 0.18.0 bổ sung test Tiên Âm Các theo UI mới.
