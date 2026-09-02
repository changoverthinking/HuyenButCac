HUYỀN BÚT CÁC — UPDATE GIAO DIỆN CHO TẤT CẢ TAB

CHỈ CẦN UPDATE:
src/media-fixes.css

SAU UPDATE, ẢNH NỀN + THEME ÁP DỤNG CHO:
1. Ghi chú
2. Tàng Thư
3. Dự án
4. Sơ đồ
5. Bảng trắng
6. Vạn niên

CHI TIẾT:
- Ghi chú: sidebar/list/editor dùng nền bán trong suốt.
- Tàng Thư: toolbar/card hòa với nền chung.
- Dự án: card/codex/kanban hòa với nền chung.
- Sơ đồ: canvas đặc bị bỏ, ảnh nền hiện phía sau lưới chấm.
- Bảng trắng: canvas đặc bị bỏ, ảnh nền hiện phía sau lưới chấm.
- Vạn niên: các card lịch dùng nền kính mờ.
- Topbar, bottom nav, rail/sidebar cùng nhận giao diện.
- Giữ hotfix xóa đường ngang Tiên Âm Các trên mobile.
- iPhone giảm blur để tránh lag.

CÁCH UPDATE:
1. Giải nén ZIP.
2. Upload đè src/media-fixes.css.
3. Commit changes.
4. Chờ GitHub Actions deploy.
5. Trên iPhone đóng hẳn PWA rồi mở lại.
