# QA REPORT — Huyền Bút Các 0.14.2

## Phạm vi
Rà soát thao tác xóa ở:
- Ghi chú / Thùng rác
- Thư mục
- Dự án
- Phần / Chương
- Kanban
- Milestone
- Sơ đồ
- Bảng trắng
- Lịch Vạn Niên
- Thư Viện Truyện
- Tiên Âm Các

## Lỗi đã sửa
1. Bảng trắng cuối bị xóa xong tự tạo lại, khiến người dùng tưởng nút Xóa không hoạt động.
2. Nút `Xóa` đối tượng Bảng trắng không nói rõ cần chọn đối tượng trước.
3. Sơ đồ cuối bị xóa xong tự tạo lại một sơ đồ trống.
4. UI Dự án thiếu xóa Phần dù service đã có.
5. Kanban thiếu nút xóa Task dù service đã có.
6. Milestone thiếu cả service/store/UI xóa.
7. Bổ sung regression tests cho các luồng xóa mới.

## Hành vi sau sửa
- Xóa bảng/sơ đồ cuối => trạng thái trống, không tự sinh dữ liệu.
- Xóa Phần => Phần bị xóa; các Chương bên trong được giữ và chuyển ra cấp Dự án.
- Xóa Task/Milestone => soft-delete để đồng bộ thao tác xóa đa thiết bị.
- Ghi chú/Lịch vẫn giữ cơ chế tombstone hiện có.

## Kiểm tra tĩnh
- 66 file TS/TSX (không tính `.d.ts`) parse: PASS.
- Relative imports: 164/164 hợp lệ.
- JSON package/package-lock: PASS.
- Không có `.env`, `node_modules`, `dist` trong gói phát hành.
- Không thay schema database.

## Full build/test local
Môi trường đóng gói hiện dùng Node 22.16.0, trong khi project yêu cầu Node >=22.22.2. Lần `npm ci` local không hoàn tất trong thời gian mạng cho phép nên full build/Vitest local không được dùng làm tiêu chí phát hành. GitHub Actions của repository đang là lớp kiểm tra cuối vì workflow dùng đúng Node 22.22.2 và bản 0.14.1 trước patch đã PASS workflow.
