# Huyền Bút Các 0.13.0 — Lịch Vạn Niên

## Tính năng mới

- Thêm khu vực **Vạn niên / Nhật Nguyệt Đồ** vào điều hướng chính trên PC và mobile.
- Lịch tháng hiển thị đồng thời ngày Dương lịch, ngày Âm lịch Việt Nam và Can Chi từng ngày.
- Chi tiết ngày hiển thị đầy đủ Can Chi **năm – tháng – ngày**, con giáp của năm và vị trí trong vòng **Lục Thập Hoa Giáp (1–60)**.
- Hỗ trợ tháng âm nhuận và đánh dấu ngày đầu tháng âm.
- Đánh dấu **Tết Nguyên Đán (Mùng 1–3)** cùng các ngày lễ âm truyền thống và một số ngày lễ dương phổ biến.
- Chọn tháng/năm, chuyển tháng trước/sau, trở về hôm nay và bấm ngày ngoài tháng để chuyển nhanh.
- Giao diện responsive theo phong cách Huyền Bút Các, tối ưu cho điện thoại và desktop.

## Lịch pháp

- Phần Âm lịch sử dụng quy tắc thiên văn của lịch Việt Nam với múi giờ **UTC+7**.
- Thuật toán nội bộ dựa trên Julian Day, thời điểm Sóc và kinh độ Mặt Trời; không cần gọi API mạng nên lịch hoạt động offline.
- Phạm vi giao diện: **1800–2199**.

## Mốc kiểm thử

- 01/09/2026 → 20/07/2026 âm; ngày **Mậu Dần**, tháng **Bính Thân**, năm **Bính Ngọ**.
- 17/02/2026 → 01/01/2026 âm; **Tết Nguyên Đán**, ngày **Nhâm Tuất**, tháng **Canh Dần**, năm **Bính Ngọ**.
- 01/09/1990 → 13/07/1990 âm.
- 01/10/2002 → 25/08/2002 âm.
