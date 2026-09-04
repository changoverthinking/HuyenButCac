# Huyền Học Các trong tab Vạn Niên

## Kiến trúc tích hợp

Huyền Học được mount vào `.van-nien-scroll` bằng `HuyenHocBridge`. `CalendarView.tsx` không bị sửa, nên phần lịch âm, lịch hẹn và notification hiện tại được giữ nguyên. Module dùng CSS riêng `src/metaphysics.css` và logic riêng dưới `src/features/metaphysics/`.

## 1. Can Chi · Ngũ Hành

- 10 Thiên Can và 12 Địa Chi.
- Lục Thập Hoa Giáp, 30 Nạp Âm.
- Ngũ Hành tương sinh/tương khắc.
- Tam Hợp, Lục Hợp, Lục Xung, Lục Hại, Lục Phá, Tam Hình/Tương Hình/Tự Hình.
- Thiên Can Ngũ Hợp và các cặp Can tương xung cơ bản.
- Tra năm dương lịch → Can Chi, con giáp, Nạp Âm.

## 2. Bát Trạch

- Cung phi nam/nữ 1900–2099.
- Đông Tứ Mệnh / Tây Tứ Mệnh.
- Sinh Khí, Diên Niên, Thiên Y, Phục Vị.
- Tuyệt Mệnh, Ngũ Quỷ, Lục Sát, Họa Hại.
- Kiểm tra hướng nhà theo 8 phương.

Người sinh sát Lập Xuân cần đối chiếu năm khí tiết trước khi áp dụng thực tế.

## 3. Tướng Số

Catalog tra cứu theo đặc điểm, không upload/nhận diện khuôn mặt và không dùng AI để suy đoán tính cách từ ảnh.

## 4. Tử Vi Đẩu Số

### Đã triển khai

- Dùng `solarToLunar` hiện có của Vạn Niên.
- Xử lý giờ Chi, Cung Mệnh, Cung Thân và 12 cung chức.
- Profile tháng nhuận: giữ tháng / chia ngày 15 / chuyển tháng sau.
- Ngũ Hành Cục.
- 14 Chính Tinh theo hai tinh hệ Tử Vi / Thiên Phủ.
- Độ sáng chính tinh theo profile tham khảo đã ghi trong code.
- Tả Phụ, Hữu Bật, Văn Xương, Văn Khúc, Khôi Việt, Lộc Tồn, Kình Dương, Đà La, Hỏa Tinh, Linh Tinh, Địa Không, Địa Kiếp.
- Tứ Hóa với profile riêng (`luc-ban-trieu`, `vuong-dinh-chi`).
- Vòng Tràng Sinh, Thái Tuế, Bác Sĩ.
- Tuần, Triệt.
- Mệnh chủ, Thân chủ.
- Đại Hạn, Tiểu Hạn.
- Lưu Thái Tuế, Lưu Lộc Tồn và Lưu Tứ Hóa theo năm xem.

### Nguyên tắc

Không sinh đoạn “luận số” dài tự động. Các bảng có dị bản được tách profile, không nhập chung thành một đáp án giả định duy nhất.

## 5. Huyền Không Phi Tinh

### Hạ Quái

- Tam Nguyên Cửu Vận (mốc chu kỳ 1864, mỗi Vận 20 năm).
- 24 Sơn, mỗi Sơn 15°.
- Vận tinh, Sơn tinh, Hướng tinh.
- Thuận/nghịch theo nguyên long quy chiếu; sao 5 dùng số Vận để xét chiều phi nhưng vẫn giữ 5 nhập Trung.
- Nhận dạng Vượng Sơn Vượng Hướng, Song Tinh Đáo Hướng, Song Tinh Đáo Sơn, Thượng Sơn Hạ Thủy, Phục Ngâm và Phản Ngâm.

### Thế Quái / 替卦

- 9° giữa mỗi Sơn (±4.5° từ tâm): Hạ Quái.
- Hai mép còn lại: tự động lập Thế Quái theo profile `shen-shi`.
- Bảng替星 trong profile:
  - Tý/Quý/Giáp/Thân → 1.
  - Nhâm/Mão/Ất/Mùi/Khôn → 2.
  - Càn/Hợi/Thìn/Tốn/Tỵ/Tuất → 6.
  - Dậu/Tân/Sửu/Cấn/Bính → 7.
  - Dần/Ngọ/Canh/Đinh → 9.
- Với sao 5: giữ nguyên sao 5 nhập Trung; số Vận được dùng để xác định quy chiếu/thuận nghịch.
- UI có tùy chọn tắt替星 để đối chiếu Hạ Quái cưỡng chế, nhưng không dùng đó làm mặc định.

### Benchmark khóa regression

- Vận 8, Tý sơn – Ngọ hướng, chính hướng 180°: khớp đủ 9 cung Hạ Quái.
- Vận 8, Tý sơn – Ngọ hướng kiêm, độ hướng 185°: cung Nam = **Sơn 1 · Hướng 7 · Vận 3 (173)**.

## File liên quan

- `src/main.tsx`
- `src/metaphysics.css`
- `src/components/metaphysics/HuyenHocBridge.tsx`
- `src/components/metaphysics/HuyenHocPanel.tsx`
- `src/features/metaphysics/canChi.ts`
- `src/features/metaphysics/batTrach.ts`
- `src/features/metaphysics/tuongSo.ts`
- `src/features/metaphysics/tuViFoundation.ts`
- `src/features/metaphysics/tuViEngine.ts`
- `src/features/metaphysics/huyenKhong.ts`
- `src/tests/metaphysics.test.ts`

## Tuyên bố

Đây là module tra cứu văn hóa dựa trên các hệ thống lý thuyết cổ truyền. Nội dung không phải dự đoán khoa học và chỉ nên dùng để tham khảo văn hóa, giải trí hoặc hỗ trợ sáng tác.
