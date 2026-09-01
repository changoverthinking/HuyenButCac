# Huyền Bút Các 0.16.0 — Huyền Bút UI V2

## Mục tiêu

Bản này thay đổi **cấu trúc và cảm giác sử dụng**, không chỉ thay palette màu. Giao diện được chuyển sang phong cách **Thư Các hiện đại**: panel nổi, chiều sâu, khoảng thở, chất liệu giấy/mực/kim loại và motif riêng cho các giao diện lễ.

## Thay đổi chính

- Khung ứng dụng desktop thành bố cục nổi: App Rail và workspace là hai khối card độc lập, bo góc, có đổ bóng và lớp viền nội.
- App Rail được làm lại thành “tủ mục lục”: icon lớn hơn, mục đang chọn có chiều sâu, marker dọc, khoảng cách rõ ràng và trạng thái hover thực sự.
- Topbar đổi thành command deck; mỗi khu vực có context riêng thay vì dùng ô tìm ghi chú cho mọi chế độ.
- Notes Studio chuyển thành ba panel có khoảng cách: thư mục, danh sách ghi chú, trang soạn thảo.
- Danh sách ghi chú dùng card, marker lựa chọn, icon SVG ghim/sao và hiệu ứng hover.
- Editor có cảm giác trang giấy: tiêu đề serif lớn, toolbar nổi, nền kẻ cực nhẹ, chiều rộng đọc tối ưu và empty state mới.
- Tàng Thư được tăng chiều sâu: card sách có “gáy”, hover nâng card, toolbar thủ thư, reader PDF được đóng khung rõ hơn.
- Music Player thành dock tách khỏi mép cửa sổ trên desktop.
- Mobile giữ bố cục một tay: bỏ khoảng trống desktop, bottom nav rõ hơn, editor và Tàng Thư tối ưu 2 cột.
- Các theme lễ có motif riêng chứ không chỉ đổi màu:
  - Tết Nguyên Đán: song cửa/đồng tiền/ánh vàng.
  - Trung Thu: vầng trăng và quầng sáng.
  - Quốc Khánh: dải sáng + sao năm cánh.
  - 8/3: lớp cánh hoa mềm.
  - 20/11: nhịp giấy kẻ và trang sách.
  - 30/4–1/5: lớp sóng/núi và đường chân trời.

## File thay đổi

- `src/App.tsx`
- `src/app/appConfig.ts`
- `src/app-enhancements.css`
- `src/components/common/Icons.tsx`
- `src/components/common/NoteList.tsx`
- `src/components/editor/NoteEditor.tsx`
- `src/components/notes-mode/NotesModeView.tsx`

## Kiểm tra đã thực hiện trong môi trường tạo gói

- Kiểm tra cú pháp TS/TSX bằng TypeScript `transpileModule`: **PASS** cho toàn bộ file TS/TSX thay đổi.
- Kiểm tra cân bằng dấu ngoặc CSS: **PASS**.
- So sánh với source CI xanh #67: chỉ 7 file ứng dụng ở trên được thay đổi.
- Không thể chạy `npm ci` trong sandbox do môi trường không có Internet/npm cache đầy đủ; CI GitHub vẫn là bước xác nhận typecheck/build/test cuối cùng sau khi áp dụng.
