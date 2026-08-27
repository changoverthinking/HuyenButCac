# Huyền Bút Các (Mystic Notes)

Ứng dụng ghi chú, viết dự án, sơ đồ tư duy và bảng trắng phong cách tu tiên — local-first, offline-first, PWA.

> **Trạng thái:** Checkpoint 14.1 — local-first, có Thư Viện Truyện, đăng nhập đa thiết bị và đồng bộ được mã hóa qua Supabase. Xem `HUONG_DAN_SUPABASE.md`.

## Chạy local

```bash
npm install
npm run dev
```

Mở http://localhost:5173

## Test

```bash
npm run test
```

## Build production

```bash
npm run build
npm run preview   # xem thử bản build tại http://localhost:4173
```

## Deploy GitHub Pages

1. Đổi tên repo/App ID nếu cần trong `src/app/appConfig.ts` (trường `repository` phải khớp tên repo GitHub thật, vì nó quyết định `base` path trong `vite.config.ts`).
2. Push lên nhánh `main`. GitHub Actions (`.github/workflows/deploy.yml`) sẽ tự typecheck, test, build và deploy lên GitHub Pages.
3. Bật GitHub Pages trong repo Settings → Pages → Source: GitHub Actions.

## Cài trên iPhone (PWA)

1. Mở link GitHub Pages bằng **Safari** trên iPhone (bắt buộc Safari, không phải Chrome iOS).
2. Bấm nút Chia sẻ (hình vuông có mũi tên lên) ở thanh dưới.
3. Chọn **"Thêm vào MH chính"** (Add to Home Screen).
4. Xác nhận. App sẽ có icon riêng và mở toàn màn hình như app gốc.
5. Khi có bản cập nhật mới, app sẽ hiện nút "Cập nhật ngay" ở góc dưới màn hình — bấm để tải bản mới nhất.

## Cấu trúc thư mục

Xem `docs/ARCHITECTURE.md` — cấu trúc `src/{app,components,features,database,services,stores,hooks,themes,i18n,types,utils,tests}` đã được dựng sẵn.

## Không commit gì vào repo này

Không commit `.env` thật, API key, token, private key, database production hay backup người dùng. GitHub Pages chỉ chứa static asset đã build.
