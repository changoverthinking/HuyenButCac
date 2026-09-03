# KNOWN ISSUES — 0.18.0

Các mục dưới đây là giới hạn còn tồn tại sau audit 0.18.0; không phải lỗi build hiện tại.

## Dữ liệu / đồng bộ

- **Tàng Thư local-only:** metadata sách/PDF, PDF Blob, ảnh bìa, bookmark trang đọc và cover dự án đang nằm trong IndexedDB Tàng Thư riêng; chưa tự đồng bộ giữa thiết bị.
- **Media local-only:** MP3, ảnh giao diện từng tab và avatar Tiểu Nhị chưa đồng bộ cloud. Xóa dữ liệu website/PWA có thể làm mất các media này.
- **Tiểu Nhị local-only:** history, memory và document index của Tiểu Nhị tách theo workspace nhưng chưa sync E2EE lên Supabase.
- Dữ liệu local thông thường trong IndexedDB chưa mã hóa toàn bộ at-rest. Ghi chú khóa có AES-GCM; dữ liệu đưa lên Supabase được E2EE bằng Kho bảo mật.
- Chưa có export/import một gói backup toàn workspace.

## Tính năng còn thiếu

- Thư mục nhiều cấp có API `moveFolder` chống vòng lặp nhưng chưa có drag/drop UI hoàn chỉnh.
- Editor vẫn dựa vào `document.execCommand` cho toolbar rich-text; API này deprecated. Chưa có table, ảnh inline và template ghi chú.
- Dự án chưa có daily word goal, typewriter mode, timeline/calendar project view và export PDF/DOCX/HTML/JSON/ZIP.
- Story Bible chưa có search toàn cục, kéo-thả reorder và auto-link nhân vật/thuật ngữ từ nội dung chương.
- Mind Map chưa có export PNG/PDF/OPML và history undo/redo đầy đủ.
- Whiteboard đã có pan/pinch, connector và vẽ tay; còn thiếu minimap, group/layer và export.
- Chưa có realtime collaboration Yjs/CRDT.
- Chưa có PIN/biometric/WebAuthn UX hoàn chỉnh.
- i18n chưa hoàn chỉnh ngoài tiếng Việt.

## PWA / thiết bị

- `VITE_WEB_PUSH_VAPID_PUBLIC_KEY` chưa được cấu hình trên GitHub Actions tại thời điểm audit; reminder local vẫn hoạt động nhưng Web Push khi app đóng chưa chạy đầy đủ.
- PDF.js, JSZip và Transformers.js được tải động từ CDN. 0.17.1 cache runtime sau lần dùng đầu, nhưng lần dùng đầu vẫn cần Internet.
- AI Local phụ thuộc WebGPU; thiết bị/trình duyệt không hỗ trợ sẽ phải dùng Online.
- Phát nhạc khi khóa màn hình vẫn phụ thuộc chính sách Safari/iOS dù có Media Session.
- Native live widget iOS/Android không thể làm bằng PWA thuần; cần wrapper/native Swift/Kotlin nếu muốn WidgetKit/App Widget.

## QA / hiệu năng

- Chưa có QA đầy đủ trên iPhone/iPad Safari/PWA thật.
- Chưa có accessibility audit toàn diện cho keyboard/screen reader/20 theme.
- Main bundle vẫn hơi vượt ngưỡng 500 kB minified; cần code-splitting thêm để giảm cold-start trên máy yếu.
