# Huyền Bút Các 0.16.1 — Mobile navigation hotfix

- Sửa lỗi drawer menu trên mobile bị CSS ép từ `position: fixed` thành `position: relative`.
- Drawer giờ phủ đúng toàn màn hình, chặn tương tác xuyên xuống bottom navigation.
- Khi đổi tab, drawer luôn tự đóng để loại bỏ race khi chạm gần như đồng thời hai vùng điều hướng.
- Sửa cùng nguyên nhân cho các overlay `fixed` khác nằm trực tiếp trong workspace (ví dụ Account Panel).
- Không thay đổi dữ liệu, IndexedDB, Tàng Thư, dự án, ghi chú hoặc API.
