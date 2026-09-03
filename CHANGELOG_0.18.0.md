# Huyền Bút Các 0.18.0 — Hoàn thiện Cài đặt & ổn định tương tác

## Cài đặt / cuộn / cảm ứng
- Sửa vùng Tài khoản → Cài đặt để wheel chuột, trackpad và vuốt dọc hoạt động ổn định.
- Thêm `overscroll-behavior`, `touch-action: pan-y`, momentum scrolling iOS và scrollbar ổn định.
- Cài đặt mở rộng tối đa 3xl trên desktop, toàn màn hình trên mobile.
- Tab tài khoản tự co giãn 2/4 tab, không còn hàng `Cài đặt` bị rơi xuống lệch bố cục.
- Khi đổi tab tài khoản, vùng cuộn tự trở về đầu.
- Escape đóng đúng lớp modal; khi đang căn ảnh, Escape chỉ đóng hộp căn ảnh, không đóng cả Tài khoản.
- Tăng khả năng cuộn/vuốt cho Tàng Thư modal, PDF reader và các danh sách Tiểu Nhị.

## Tiên Âm Các
- Chuyển toàn bộ UI Tiên Âm Các vào `Tài khoản → Cài đặt → Tiên Âm Các`.
- Bỏ dock/player ngang ở đáy ứng dụng và bỏ nút Tiên Âm Các cũ trong sidebar.
- Audio engine được giữ ở cấp ứng dụng nên nhạc vẫn tiếp tục phát khi đóng Cài đặt.
- Giữ phát/tạm dừng, trước/sau, tua, shuffle, repeat, volume, thêm nhiều file, đổi tên, xóa bài và Media Session.
- Thư viện nhạc có vùng cuộn riêng, tối ưu touch/mobile.

## Cài đặt giao diện
- Chia Cài đặt thành 3 nhóm rõ ràng: `Giao diện`, `Tiên Âm Các`, `Ảnh & icon`.
- Giữ toàn bộ 20 theme, giảm chuyển động, tương phản cao, cỡ chữ.
- Giữ ảnh nền toàn app/từng tab/công cụ/tài khoản/Tiểu Nhị và avatar Tiểu Nhị, với cover/contain/manual, zoom, kéo, blur, opacity.

## Ổn định từ audit 0.17.1 được gộp vào 0.18.0
- Hủy Tiểu Nhị Online/index đúng cách, chống response muộn sau khi bấm Dừng.
- Chống lẫn state Tiểu Nhị giữa workspace/tài khoản.
- RAG Notes không còn giới hạn 20 ghi chú gần nhất; giảm RAM khi tìm index tài liệu.
- Dọn index PDF đã xóa; giải phóng PDF document sau index.
- Tách attachment chat khỏi nguồn Tàng Thư.
- Dùng chung PDF runtime, cache runtime CDN cho PDF.js/JSZip/Transformers.
- Cho phép PWA xoay ngang/dọc.
- Tạo tiểu thuyết từ Tàng Thư tạo Project novel thật.
- Sửa kéo ảnh manual đúng chiều và validate ảnh trước preview.

## Version
- Đồng bộ `package.json`, `package-lock.json`, `APP_CONFIG` và artifact CI lên 0.18.0.
