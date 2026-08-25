# KNOWN ISSUES

- Kéo thả thư mục: chưa có UI (chỉ có API `moveFolder` chống vòng lặp).
- Editor dùng `document.execCommand` (deprecated, vẫn hoạt động trên trình duyệt hiện tại) — nên thay TipTap/Lexical khi cần bảng/ảnh/công thức/menu `/`.
- Chưa sanitize HTML khi import nội dung ngoài — chặn tính năng import cho tới khi có sanitize.
- Icon SVG gốc chưa lưu vào repo (`src/assets/`) — hiện chỉ có PNG xuất sẵn trong `public/icons/`.
- Chưa test trên thiết bị iPhone/Safari thật — môi trường phát triển không có thiết bị thật.
- Toggle riêng cho reduce-motion/high-contrast/font-scale chưa có UI (chỉ có state + CSS đã sẵn sàng).
- Dữ liệu hiện lưu cục bộ trong IndexedDB nhưng chưa mã hóa; cờ “khóa” chưa phải bảo mật bằng PIN/AES.
- Chưa có sao lưu/khôi phục toàn bộ dữ liệu, đồng bộ đa thiết bị hoặc cộng tác thời gian thực.
- MP3 và ảnh nền được lưu trong IndexedDB của từng trình duyệt/thiết bị, chưa tự đồng bộ. Xóa dữ liệu website hoặc gỡ PWA kèm dữ liệu có thể làm mất media.
- Phát nhạc khi khóa màn hình phụ thuộc chính sách của Safari/iOS; Media Session được bật khi thiết bị hỗ trợ nhưng không thể bảo đảm iOS luôn cho phép chạy nền.
