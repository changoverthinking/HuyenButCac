# Huyền Bút Các 0.16.1 — Mobile navigation hotfix

## Lỗi đã sửa
Trên mobile, selector UI V2 `.app-shell--figma .app-workspace>*` ép **mọi direct child** thành `position: relative`. Điều này ghi đè utility `fixed` của drawer menu và Account Panel. Drawer vì thế đi vào normal flow, không phủ toàn màn hình, để bottom navigation vẫn nhận click/touch và có thể xuất hiện trạng thái "hai tab/chức năng cùng lúc".

## Cách áp dụng
Giải nén ZIP vào thư mục gốc repository và chọn **Replace/ghi đè**.

Các file thay đổi:
- `src/App.tsx`
- `src/app-enhancements.css`
- `src/app/appConfig.ts`
- `CHANGELOG_0.16.1.md`

Sau đó commit/push để GitHub Actions chạy `npm ci`, build, Vitest và deploy.

## Cơ chế chống tái phát
- Direct child có `.fixed` không còn bị CSS layout ép sang `position: relative`.
- Drawer có lớp riêng `mobile-drawer-layer` và được neo `fixed; inset: 0`.
- Khi `mode` thay đổi, drawer luôn tự đóng, loại race do multi-touch/rapid touch.
- Backdrop chặn touch xuyên xuống bottom navigation.
