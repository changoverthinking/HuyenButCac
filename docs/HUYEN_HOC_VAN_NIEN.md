# Huyền Học Các trong tab Vạn Niên

## Phạm vi bản cập nhật

Bản này thêm một module Huyền Học vào **bên trong vùng cuộn Vạn Niên**, không thay thế `CalendarView` và không sửa schema IndexedDB/Supabase.

### Đã hoàn thành

- Can Chi & Ngũ Hành: 10 Can, 12 Chi, 60 Hoa Giáp, 30 Nạp Âm, Tam hợp, Lục hợp, Lục xung, tương sinh/tương khắc.
- Bát Trạch: cung phi 1900–2099, Đông/Tây Tứ Mệnh, đủ 4 hướng cát + 4 hướng hung và kiểm tra hướng nhà.
- Tướng Số: catalog tra cứu thủ công, không nhận diện ảnh và không suy luận đặc điểm cá nhân bằng AI.
- Tử Vi foundation: dùng `solarToLunar` có sẵn của Vạn Niên; xác định giờ Chi, Cung Mệnh, Cung Thân và an khung 12 cung.
- Huyền Không foundation: Tam Nguyên Cửu Vận và Vận tinh bàn cơ sở theo quỹ đạo Lạc Thư.
- Responsive cho desktop/mobile.
- Tuyên bố rõ đây là nội dung tra cứu văn hóa, không phải dự đoán khoa học.

### Cố ý chưa bật

- Ngũ Hành Cục + 14 Chính Tinh + phụ tinh/Tứ Hóa của Tử Vi.
- Sơn tinh/Hướng tinh của Huyền Không.

Hai phần trên phụ thuộc trường phái và bộ quy tắc cần được cố định + đối chiếu bằng lá số/bàn mẫu trước khi đưa vào production. Không có dữ liệu giả hoặc thuật toán phỏng đoán trong bản này.

## File thay đổi

- `src/main.tsx` — thêm CSS và `HuyenHocBridge`.
- `src/metaphysics.css` — CSS riêng, không sửa stylesheet cũ.

## File mới

- `src/components/metaphysics/HuyenHocBridge.tsx`
- `src/components/metaphysics/HuyenHocPanel.tsx`
- `src/features/metaphysics/canChi.ts`
- `src/features/metaphysics/batTrach.ts`
- `src/features/metaphysics/tuongSo.ts`
- `src/features/metaphysics/tuViFoundation.ts`
- `src/features/metaphysics/huyenKhong.ts`
- `src/tests/metaphysics.test.ts`
- `docs/HUYEN_HOC_VAN_NIEN.md`

## Cách cập nhật

Giải nén ZIP vào thư mục gốc của repository và cho phép ghi đè `src/main.tsx`. Các file khác đều là file mới.

Sau khi cập nhật trên máy có dependencies của dự án:

```bash
npm test
npm run lint
npm run build
```

## Quy tắc dữ liệu Bát Trạch đang dùng

- 1900–1999: rút gọn 2 số cuối năm; nam `10 - số`, nữ `5 + số`.
- Từ 2000: nam `9 - số`, nữ `6 + số`, tiếp tục rút gọn; quái 5 quy nam → Khôn (2), nữ → Cấn (8).
- Người sinh sát Lập Xuân cần xét năm khí tiết trước khi áp dụng thực tế.

## Tử Vi foundation

- Tháng Giêng khởi tại Dần.
- Từ cung tháng: đếm nghịch theo giờ để an Mệnh, đếm thuận theo giờ để an Thân.
- Từ Cung Mệnh an đủ 12 cung chức theo vòng cố định.
- Chưa an sao nên giao diện ghi rõ trạng thái này, không tạo cảm giác đã có lá số hoàn chỉnh.
