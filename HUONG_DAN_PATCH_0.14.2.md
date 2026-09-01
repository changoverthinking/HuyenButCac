# HƯỚNG DẪN UP PATCH 0.14.2

Bản vá này được tạo để cập nhật trực tiếp trên Huyền Bút Các 0.14.1.

## Cách nhanh nhất
Giải nén `HBC_PATCH_0.14.2_DELETE_FIX.zip`, sau đó upload các file theo đúng cấu trúc thư mục đã có trong ZIP lên **root repository HuyenButCac**.

GitHub sẽ hỏi ghi đè nếu file đã tồn tại. Giữ nguyên đúng đường dẫn.

## Các file cần cập nhật
- `package.json`
- `package-lock.json`
- `src/app/appConfig.ts`
- `src/components/whiteboard/WhiteboardView.tsx`
- `src/components/mind-map/MindMapView.tsx`
- `src/components/projects/ProjectsView.tsx`
- `src/components/projects/KanbanBoard.tsx`
- `src/features/projects/projectsService.ts`
- `src/stores/projectsStore.ts`
- `src/tests/projectsService.test.ts`
- `src/tests/mindMapView.test.tsx`
- `src/tests/whiteboardView.test.tsx` (file mới)
- `CHANGELOG_0.14.2.md`
- `docs/QA_REPORT_0.14.2.md`

## Không cần upload/chạy lại
- Không có file `.github` thay đổi.
- Không có migration Supabase mới.
- Không cần sửa `schema.sql`.
- Không cần xóa dữ liệu cũ.
- Không upload `node_modules` hoặc `dist`.

## Sau khi upload
Vào `Actions` và chờ workflow `Deploy Huyền Bút Các` chạy xanh. Workflow hiện tại sẽ chạy build + Vitest trước khi deploy.
