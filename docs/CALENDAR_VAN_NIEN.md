# Lịch Vạn Niên — Nhật Nguyệt Đồ

## Mục tiêu

Module lịch tích hợp trực tiếp trong Huyền Bút Các, dùng được offline trên PWA/PC/mobile và không phụ thuộc API lịch bên ngoài.

## Thông tin hiển thị

- Dương lịch theo ngày/tháng/năm.
- Âm lịch Việt Nam theo UTC+7.
- Tháng nhuận được đánh dấu `N`.
- Can Chi năm, tháng và ngày.
- Vị trí 1–60 trong Lục Thập Hoa Giáp.
- Con giáp của năm âm.
- Tết Nguyên Đán và danh mục ngày lễ âm/dương cơ bản.
- Khi bắt đầu một tháng âm mới, ô ngày Mùng 1 hiển thị Can Chi của tháng mới.

## Cách dùng

1. Chọn **Vạn niên** ở thanh điều hướng.
2. Dùng `‹` / `›` để chuyển tháng hoặc chọn trực tiếp tháng/năm.
3. Bấm **Hôm nay** để quay về ngày hiện tại.
4. Bấm một ô ngày để xem chi tiết Dương lịch, Âm lịch và Can Chi.
5. Có thể bấm ngày thuộc tháng trước/sau đang hiện mờ để chuyển nhanh sang tháng đó.

## Lịch pháp và độ chính xác

Module dùng cách tính thiên văn: Julian Day → thời điểm Sóc → kinh độ Mặt Trời → tháng 11 âm → tháng nhuận, với múi giờ Việt Nam UTC+7. Đây là lịch thiên văn Việt Nam hiện đại (proleptic khi xem lùi sâu về lịch sử), không phải cơ sở dữ liệu phục dựng lịch pháp định lịch sử trước thời hiện đại.

Các mốc hồi quy đi kèm test:

- 01/09/2026 → 20/07/2026 âm · Mậu Dần · Bính Thân · Bính Ngọ.
- 17/02/2026 → 01/01/2026 âm · Tết Nguyên Đán · Nhâm Tuất · Canh Dần · Bính Ngọ.
- 01/09/1990 → 13/07/1990 âm.
- 01/10/2002 → 25/08/2002 âm.
