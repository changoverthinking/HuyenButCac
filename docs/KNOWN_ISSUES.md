# KNOWN ISSUES — 0.19.0

Các mục dưới đây là giới hạn còn lại sau lớp Data Safety & Stability 0.19.0; không phải lỗi build đã biết.

## Dữ liệu / đồng bộ

- **Đã có full backup/restore** cho DB chính, Tàng Thư/PDF, media/ảnh giao diện và Tiểu Nhị; tài khoản đã mở Kho có thể lưu bản backup E2EE lên bucket private Supabase.
- Tàng Thư/PDF/media/Tiểu Nhị **chưa realtime/auto-merge giữa nhiều thiết bị**. 0.19.0 dùng snapshot E2EE toàn workspace cho nhóm dữ liệu này; core notes/projects/calendar/mindmap/whiteboard vẫn dùng record sync.
- Dữ liệu local thông thường trong IndexedDB chưa mã hóa toàn bộ at-rest. Ghi chú khóa có AES-GCM; payload cloud và full cloud backup được E2EE bằng Kho bảo mật.
- Full backup JSON cục bộ ưu tiên khả năng phục hồi Blob nên có thể dùng nhiều RAM với workspace media rất lớn. Với dữ liệu lớn nên dùng cloud backup nén/E2EE và kiểm soát quota.

## Editor / tính năng nâng cao

- Toolbar rich-text vẫn dùng `document.execCommand` để giữ tương thích format + undo/redo của nội dung hiện có. Migration sang editor engine mới phải là một release riêng có conversion/regression test, không ghép vào bản Data Safety.
- Thư mục nhiều cấp có API `moveFolder` chống vòng lặp nhưng chưa có drag/drop UI hoàn chỉnh.
- Dự án chưa có daily word goal, typewriter mode, timeline/calendar project view và export PDF/DOCX/HTML/JSON/ZIP.
- Story Bible chưa có search toàn cục, kéo-thả reorder và auto-link nhân vật/thuật ngữ từ nội dung chương.
- Mind Map chưa có export PNG/PDF/OPML và history undo/redo đầy đủ.
- Whiteboard đã có pan/pinch, connector và vẽ tay; còn thiếu minimap, group/layer và export.
- Chưa có realtime collaboration Yjs/CRDT.
- Chưa có PIN/biometric/WebAuthn UX hoàn chỉnh.
- i18n chưa hoàn chỉnh ngoài tiếng Việt.

## PWA / thiết bị

- Web Push khi app đóng vẫn cần người quản trị cấu hình VAPID Variables/Secrets. 0.19.0 có `npm run vapid:generate`, nhưng private key không thể và không nên được đóng sẵn trong source.
- PDF.js và JSZip được service worker cố prewarm; nếu CDN không truy cập được ngay lúc cài/cache thì runtime vẫn cần mạng ở lần lấy đầu tiên. Transformers.js/model AI Local vẫn tải theo nhu cầu.
- AI Local phụ thuộc WebGPU; thiết bị/trình duyệt không hỗ trợ sẽ phải dùng Online.
- Phát nhạc khi khóa màn hình vẫn phụ thuộc chính sách Safari/iOS dù có Media Session.
- Native live widget iOS/Android không thể làm bằng PWA thuần; cần wrapper/native Swift/Kotlin nếu muốn WidgetKit/App Widget.

## QA / hiệu năng

- CI có static audit + lint + typecheck/build + Vitest, nhưng QA iPhone/iPad Safari/PWA thật vẫn cần thiết bị vật lý.
- Chưa có accessibility audit toàn diện bằng screen reader trên toàn bộ 20 theme, dù focus/reduced-motion cơ bản đã có.
- Huyền Học đã được lazy-load khỏi entry path; kích thước bundle 0.19.0 phải lấy từ log Vite CI sau khi upload để xác nhận mức giảm thực tế.
