# CHANGELOG

## Checkpoint 1 — 2026-08-25
- Khởi tạo dự án (Vite + React 19 + TS strict + Tailwind v4 + Zustand + Dexie).
- Ghi chú cơ bản: CRUD, autosave, thư mục, ghim/yêu thích, thùng rác, tìm kiếm có/không dấu.
- 6 theme tu tiên đầy đủ token.
- PWA: manifest, service worker, icon, nút cập nhật.
- Docs: FEATURE_MATRIX, ARCHITECTURE, THREAT_MODEL, PRIVACY_POLICY, NEXT_SESSION.
- 7/7 Vitest pass, build sạch.

## Checkpoint 2 — 2026-08-25
- Giai đoạn 4: Chế độ Viết dự án.
- Dexie v2: projects, projectSections, projectChapters, projectTasks, projectMilestones.
- CRUD dự án/phần/chương, trình viết tập trung (focus mode) với đếm từ + đồng hồ phiên viết + autosave.
- Kanban 5 cột, Milestone checklist, xuất Markdown.
- Mode switcher trong App.tsx (tab desktop + bottom nav mobile) — Ghi chú/Dự án hoạt động, Sơ đồ/Bảng trắng đánh dấu "sắp có" (chưa code).
- 13/13 Vitest pass (7 notes + 6 projects), build sạch.
# Checkpoint 3 — Mind map và bảng trắng nền tảng
- Dexie v3 thêm mindMaps/nodes/edges và whiteboards/objects.
- Sơ đồ tư duy hoạt động thật: nhiều sơ đồ, node gốc, nhánh, sửa tên, kéo, nối và xóa đệ quy.
- Bảng trắng hoạt động thật: nhiều bảng, 4 loại đối tượng, sửa chữ, chọn, kéo, xóa, zoom và grid.
- Thay hai màn hình placeholder bằng công cụ lưu dữ liệu thật.

## Checkpoint 4 — 2026-08-25
- Sửa lỗi cú pháp JSX khiến Checkpoint 3 không thể build.
- Bổ sung bộ chọn để chuyển qua lại giữa nhiều bảng trắng.
- Thêm 6 unit test cho mind map và whiteboard; tổng cộng 19/19 test đạt.
- TypeScript strict và production PWA build thành công.

## Checkpoint 5 — 2026-08-25
- Sửa autosave để tiêu đề và nội dung được gộp, không còn ghi đè nhau khi nhập nhanh.
- Hoàn thiện Thùng rác: danh sách, khôi phục, xác nhận xóa vĩnh viễn.
- Giữ nguyên bộ lọc thư mục sau khi sửa, yêu thích hoặc xóa ghi chú.
- Tự làm mới kết quả tìm kiếm sau khi nội dung ghi chú thay đổi.
- Thêm menu di động để truy cập thư mục, Thùng rác và bộ chọn giao diện.
- Sửa kéo node sơ đồ và đối tượng bảng trắng bằng tọa độ delta; thêm tay nắm kéo bảng trắng.
- Không cho xóa nút trung tâm; tự phục hồi sơ đồ cũ đã mất nút trung tâm.
- Cập nhật cấu hình GitHub Pages cho repo `HuyenButCac` và phiên bản `0.4.0-checkpoint5`.
- 24/24 Vitest đạt; TypeScript strict, lint không lỗi và production PWA build thành công.
