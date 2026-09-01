# Huyền Bút Các 0.15.0 — Tàng Thư

## Tính năng mới

- Thêm khu vực **Tàng Thư** để tập hợp PDF, sách và các dự án tiểu thuyết đang viết.
- Cho phép nhập PDF trực tiếp, lưu cục bộ theo workspace/tài khoản, mở lại bằng trình đọc tích hợp.
- Ghi nhớ trang đọc gần nhất và hỗ trợ **ghim trang** để mở lại đúng vị trí quan trọng.
- Cho phép tải ảnh bìa cho sách/PDF và bìa riêng cho dự án tiểu thuyết.
- Tàng Thư tự tổng hợp các dự án có loại `novel` từ khu vực Dự án.

## Giao diện

- Chuẩn hóa các biểu tượng điều hướng sang SVG nội bộ để tránh lỗi font/glyph trên Windows và trình duyệt khác nhau.
- Thanh công cụ ghi chú và sidebar có thể thu gọn; trạng thái được ghi nhớ trên thiết bị.
- Tối ưu bố cục Tàng Thư cho màn hình desktop, tablet và điện thoại.
- Thêm 6 giao diện sự kiện: **Tết Nguyên Đán, Tết Trung Thu, Quốc Khánh 2/9, Mùng 8/3, Ngày Nhà giáo 20/11, 30/4–1/5**.

## Kỹ thuật

- Dữ liệu PDF/bìa dùng IndexedDB qua Dexie và tách theo workspace hiện tại.
- Kiểm tra loại/kích thước file, thông báo lỗi dung lượng lưu trữ rõ ràng.
- Không thêm dependency runtime mới cho trình đọc PDF; ưu tiên PDF viewer gốc của trình duyệt và có nút mở toàn màn hình làm phương án dự phòng.
