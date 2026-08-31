# KNOWN ISSUES

- Kéo thả thư mục: chưa có UI (chỉ có API `moveFolder` chống vòng lặp).
- Editor dùng `document.execCommand` (deprecated, vẫn hoạt động trên trình duyệt hiện tại) — nên thay TipTap/Lexical khi cần bảng/ảnh/công thức/menu `/`.
- Rich-text hiện có sanitizer allow-list khi lưu/render; tính năng import file ngoài vẫn chưa được triển khai.
- Icon SVG gốc chưa lưu vào repo (`src/assets/`) — hiện chỉ có PNG xuất sẵn trong `public/icons/`.
- Chưa test trên thiết bị iPhone/Safari thật — môi trường phát triển không có thiết bị thật.
- Toggle riêng cho reduce-motion/high-contrast/font-scale chưa có UI (chỉ có state + CSS đã sẵn sàng).
- Dữ liệu cục bộ trong IndexedDB chưa mã hóa toàn bộ; dữ liệu đưa lên Supabase đã được mã hóa bằng Kho bảo mật trước khi đồng bộ.
- Chưa có xuất/nhập một gói sao lưu toàn bộ hoặc cộng tác thời gian thực; đồng bộ tài khoản đa thiết bị đã hoạt động cho dữ liệu văn bản và canvas.
- MP3 và ảnh nền được lưu trong IndexedDB của từng trình duyệt/thiết bị, chưa tự đồng bộ. Xóa dữ liệu website hoặc gỡ PWA kèm dữ liệu có thể làm mất media.
- Phát nhạc khi khóa màn hình phụ thuộc chính sách của Safari/iOS; Media Session được bật khi thiết bị hỗ trợ nhưng không thể bảo đảm iOS luôn cho phép chạy nền.
- Thư Viện Truyện (Checkpoint 11): chưa có tìm kiếm/kéo-thả sắp xếp lại nhân vật, địa danh, thuật ngữ, mốc thời gian; chưa tự liên kết nhân vật/thuật ngữ xuất hiện trong từng chương.
