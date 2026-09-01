# Huyền Bút Các 0.14.2 — Delete/UI Fix

## Đã sửa
- Bảng trắng: xóa bảng cuối không còn tự tạo lại bảng mới; có trạng thái trống rõ ràng.
- Bảng trắng: nút `Xóa` đổi thành `Xóa đối tượng`, có trạng thái disabled/tooltip rõ nguyên nhân.
- Sơ đồ: xóa sơ đồ cuối không còn tự tạo lại sơ đồ trống; có trạng thái trống.
- Dự án: thêm đổi tên và xóa `Phần`; khi xóa Phần, chương được giữ và chuyển ra cấp dự án.
- Kanban: thêm xóa nhiệm vụ.
- Milestone: thêm xóa milestone.
- Bổ sung regression tests cho xóa bảng cuối, sơ đồ cuối, task và milestone.

## Không thay đổi
- Không đổi schema IndexedDB/Supabase.
- Không cần chạy migration mới.
- Ghi chú, thư mục, lịch hẹn, Thư viện truyện và Tiên Âm Các giữ nguyên cơ chế xóa hiện có.
