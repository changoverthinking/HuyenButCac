# Huyền Bút Các 0.16.2 — ổn định dữ liệu, Kho bảo mật, PDF và Tiểu Nhị

## Sửa lỗi
- Áp dụng thật tính năng đổi tên, Lên/Xuống và chuyển Chương giữa các Phần.
- Chuẩn hóa `order` khi di chuyển Chương; tạo mới dùng `max(order)+1` để không trùng thứ tự sau khi xóa.
- Gia cố cùng lỗi thứ tự cho Phần, Kanban task, thư mục, nhân vật, địa danh, thuật ngữ và dòng thời gian.
- Đặt lại Kho bảo mật hiển thị trạng thái thành công/lỗi ngay trong tab Bảo mật; không còn che lỗi đồng bộ bằng thông báo thành công giả.
- Đổi nhãn mạng từ “Đang kết nối” thành “Có mạng” để không nhầm với trạng thái đồng bộ Supabase.
- Trình đọc PDF dùng PDF.js để ứng dụng quản lý chính xác số trang, ghi nhớ trang và ghim trang; nếu runtime PDF.js không tải được vẫn có nút mở bằng trình đọc của trình duyệt.
- Ghi vị trí PDF cả khi đóng trình đọc ngay sau khi đổi trang.
- Tiểu Nhị không còn tự chèn nút bằng `MutationObserver`; App render nút AI trực tiếp trên desktop/mobile.
- Lazy-load các khu vực nặng để giảm bundle tải ban đầu.

## CI / phiên bản
- Đồng bộ phiên bản ứng dụng và package về `0.16.2`.
- GitHub Actions chạy thêm `npm run lint` trước build/test.
- Artifact nguồn đổi thành `HuyenButCac-0.16.2-source`.

## Cấu hình ngoài GitHub vẫn cần làm
- Chạy `supabase/migration_checkpoint_14_2_reset_vault.sql` trong Supabase SQL Editor nếu project chưa có RPC `reset_my_vault(new_salt, new_verifier)`.
- Muốn Web Push khi app đóng: cấu hình `VITE_WEB_PUSH_VAPID_PUBLIC_KEY` và các Supabase secrets theo `docs/CALENDAR_NOTIFICATIONS.md`.
