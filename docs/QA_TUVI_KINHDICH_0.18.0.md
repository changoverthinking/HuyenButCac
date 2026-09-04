# QA — Tử Vi readability + Kinh Dịch 64 Quẻ

Baseline: `main` commit `246a47b9fa630a875f2738875fa81084b8efaf24`.

## Lỗi giao diện Tử Vi được sửa

Ảnh thực tế trên iPhone cho thấy bàn 4 cột bị ép vào chiều rộng điện thoại, làm tên sao tiếng Việt bị bẻ thành từng ký tự/dòng rất khó đọc.

### Sửa

- Desktop vẫn giữ bàn 4×4 truyền thống.
- Mobile <= 760px chuyển cung thành **2 cột đọc dễ**.
- Mobile rất hẹp <= 380px chuyển **1 cột**.
- Reset `grid-row/grid-column` inline của từng cung trên mobile để không giữ vị trí 4×4.
- Không dùng `overflow-wrap:anywhere` cho tên sao ở lớp override cuối.
- Tên sao dùng `word-break: normal`, `overflow-wrap: normal`, không bẻ từng ký tự.
- Miếu/Vượng/Hãm và Tứ Hóa nằm cột phụ, không chen vào tên sao.

## Từ điển sao Tử Vi

- 55 mục.
- 14/14 Chính Tinh có định nghĩa.
- Phụ/sát tinh cốt lõi đang an trên lá số có định nghĩa.
- Tứ Hóa có định nghĩa.
- Chạm sao trên lá số để mở inspector.
- Có ô tìm kiếm từ điển sao.
- Có nguồn tham khảo trong giao diện.

## Kinh Dịch

- 64/64 quẻ.
- 64 mã hào duy nhất.
- Đối chiếu đủ 64 tên và 64 mã hào với hai nguồn dữ liệu độc lập.
- Gieo ba đồng xu.
- Nhập sáu hào thủ công.
- Lập quẻ chủ, hào động, quẻ biến.
- Hiển thị thượng/hạ quái và tượng Bát Quái.
- Mỗi quẻ có `meaning` và `whenCast`.

## Test đã chạy cục bộ

1. **TS/TSX syntax audit:** 96 file, 0 lỗi parse.
2. **Relative import audit:** 0 import tương đối bị thiếu.
3. **TypeScript semantic check HuyenHocPanel + dependency:** PASS.
4. **CSS structural audit:** 10 stylesheet, 0 lỗi cân bằng block.
5. **Mobile UI static regression:** 7/7 PASS.
6. **Existing metaphysics regression:** 27/27 PASS.
7. **Kinh Dịch test:** 7/7 PASS.
8. **Từ điển sao test:** 6/6 PASS.
9. **Pure data regression:** 231 assertions PASS.
10. **Cross-check 64 structural codes:** 0 mismatch.
11. **Exhaustive casting:** 4.096/4.096 tổ hợp 6/7/8/9 PASS; bao phủ 64/64 quẻ chủ và 64/64 quẻ biến.

## Giới hạn môi trường

Baseline `main` trước bản vá này đã chạy GitHub Actions thành công với `npm ci -> Oxlint -> tsc/vite build -> Vitest -> deploy`.

Trong container tạo bản vá, `npm ci` không hoàn tất do kết nối package registry bị treo, nên **không tuyên bố** đã chạy lại nguyên bộ `npm run lint && npm run build && npm run test` với node_modules production cho bản vá này. Các kiểm tra cục bộ phía trên đã được chạy trên source đã sửa; hai test mới nằm trong ZIP để GitHub Actions của repo chạy lại sau khi upload.
