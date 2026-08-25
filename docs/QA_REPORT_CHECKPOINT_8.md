# Báo cáo kiểm duyệt — Checkpoint 8 Mobile

Ngày kiểm tra: 2026-08-25  
Phiên bản: `0.6.2-checkpoint8-mobile`

## Phạm vi sửa và kiểm tra

- Trình nhạc dạng bong bóng nổi trên điện thoại, mở/thu nhỏ, phát/dừng, trước/sau, tua, ngẫu nhiên, lặp và thư viện MP3.
- Sơ đồ: thanh chọn responsive, tạo/đổi tên/xóa sơ đồ, thêm/xóa/kéo/sửa nhánh.
- Bảng trắng: thanh công cụ hai hàng, tạo/đổi tên/xóa bảng, thêm/kéo/sửa/xóa đối tượng.
- Giao diện iPhone safe-area, viewport động, màn hình dọc và ngang.
- Thanh soạn thảo cuộn ngang trên điện thoại và các font thư pháp/cổ phong mới.

## Kết quả tự động

- TypeScript strict: đạt.
- Vitest: 8/8 tệp, 38/38 phép thử đạt.
- Oxlint: không có lỗi; còn cảnh báo hook đã có từ mã cũ, không chặn build.
- Vite production + PWA: build thành công; service worker và manifest được tạo.

## Kiểm tra sau khi đưa lên GitHub Pages

1. Mở trang bằng Safari/Chrome trên điện thoại, thử cả dọc và ngang.
2. Chạm bong bóng nhạc, kiểm tra bảng nhạc mở phía trên thanh điều hướng; chạm `⌄` để thu nhỏ.
3. Mở Sơ đồ, xác nhận canvas dùng toàn chiều ngang và không còn sidebar chiếm nửa màn hình.
4. Mở Bảng trắng, vuốt ngang hàng công cụ và xác nhận không có nút bị cắt.
5. Mở Ghi chú, vuốt thanh định dạng và thử các font có nhãn “thư pháp/cổ phong”.

Lưu ý: bộ font thực tế phụ thuộc font hệ điều hành. Nếu thiết bị không có KaiTi/Yu Mincho/Segoe Script, trình duyệt tự dùng font cổ điển dự phòng và nội dung vẫn đọc được.
