# Hướng dẫn cập nhật — Mobile Stability Fix

Bản vá được tạo trên đúng `main` commit `5d0b28c63855f82da543008c6b08f33c40b76dbb`.

## Nếu dùng gói patch tối thiểu

Chép đè/thêm đúng các file sau vào repository:

- `src/components/common/UpdatePrompt.tsx`
- `src/components/metaphysics/HuyenHocPanel.tsx`
- `src/hotfix-tangthu-mobile.css`
- `src/media-fixes.css`
- `src/metaphysics.css`
- `src/tests/metaphysicsMobileUi.test.tsx`
- `docs/QA_MOBILE_STABILITY_AUDIT_0.18.0.md`
- `docs/TEST_REPORT_MOBILE_AUDIT.md`
- `docs/UPDATE_MOBILE_STABILITY_FIX.md`

Không xóa các file khác.

## Sau khi upload lên GitHub

Workflow `.github/workflows/deploy.yml` hiện tại sẽ tự chạy:

`npm ci -> Oxlint -> tsc/vite build -> Vitest -> deploy`

Chỉ sử dụng bản deploy mới khi GitHub Actions báo **success**.

## Dữ liệu

Bản vá không đổi schema IndexedDB/Supabase, không migration và không xóa dữ liệu người dùng.
