# KNOWN ISSUES

- Kéo thả thư mục: chưa có UI (chỉ có API `moveFolder` chống vòng lặp).
- Editor dùng `document.execCommand` (deprecated, vẫn hoạt động trên trình duyệt hiện tại) — nên thay TipTap/Lexical khi cần bảng/ảnh/công thức/menu `/`.
- Chưa sanitize HTML khi import nội dung ngoài — chặn tính năng import cho tới khi có sanitize.
- Icon SVG gốc chưa lưu vào repo (`src/assets/`) — hiện chỉ có PNG xuất sẵn trong `public/icons/`.
- Chưa test trên thiết bị iPhone/Safari thật — môi trường phát triển không có thiết bị thật.
- Toggle riêng cho reduce-motion/high-contrast/font-scale chưa có UI (chỉ có state + CSS đã sẵn sàng).
