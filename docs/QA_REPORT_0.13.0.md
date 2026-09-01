# QA REPORT — Huyền Bút Các 0.13.0

## Phạm vi bản này

Tích hợp Lịch Vạn Niên vào bản 0.12.2 đã sửa đồng bộ/workspace, không đổi cấu trúc module cũ.

## Kiểm tra đã thực hiện

- TS/TSX syntax scan toàn bộ `src`: 0 lỗi parse.
- Kiểm tra import tương đối: không có import trỏ tới file không tồn tại.
- `lunarCalendar.ts` strict typecheck độc lập: đạt.
- `CalendarView.tsx` strict typecheck với React type shim tối thiểu: đạt.
- JSON `package.json` / `package-lock.json`: hợp lệ.
- GitHub Actions YAML: hợp lệ.
- CSS: số ngoặc khối cân bằng.
- Thuật toán âm lịch đã chạy trực tiếp qua JS build từ TypeScript với các mốc:
  - 01/09/2026 → 20/07/2026 âm.
  - 17/02/2026 → 01/01/2026 âm (Mùng 1 Tết).
  - 29/01/2025 → 01/01/2025 âm.
  - 10/02/2024 → 01/01/2024 âm.
  - 01/09/1990 → 13/07/1990 âm.
  - 01/10/2002 → 25/08/2002 âm.
- Can Chi 01/09/2026: Mậu Dần / Bính Thân / Bính Ngọ.
- Giao thừa 2026 tự nhận ngày 16/02/2026 (29 tháng Chạp Ất Tỵ), sau đó Mùng 1–3 Tết.

## Full npm build/test

Môi trường đóng gói hiện không hoàn thành `npm ci` do registry bị timeout và Node local là 22.16.0. Project yêu cầu Node >=22.22.2. Không có dependency mới được thêm ở bản Lịch Vạn Niên; GitHub Actions của repo vẫn dùng Node 22.22.2 và sẽ chạy `npm ci`, test, build trước deploy.

## Lưu ý lịch pháp

Phần lịch là lịch thiên văn Việt Nam UTC+7. Khi xem lùi sâu về lịch sử, đây là lịch proleptic hiện đại; không thay thế dữ liệu phục dựng lịch pháp định của từng triều đại/giai đoạn lịch sử.
