# Cách áp dụng bản nâng cấp Huyền Bút Các 0.15.0 — Tàng Thư

Bản ZIP này là **gói nâng cấp theo đúng cấu trúc thư mục của repository**. Giải nén trực tiếp vào thư mục gốc `HuyenButCac` và chọn **ghi đè/Replace** các file trùng tên.

Sau khi ghi đè, chạy:

```bash
npm ci
npm run build
npm run test
```

Nếu cả `build` và `test` đều thành công, có thể chạy local bằng:

```bash
npm run dev
```

## Các file chính được thêm/sửa

- `src/App.tsx` — thêm mode Tàng Thư, đổi hệ icon điều hướng sang SVG.
- `src/components/library/LibraryView.tsx` — giao diện Tàng Thư + đọc PDF + ghim trang + bìa.
- `src/features/library/libraryService.ts` — IndexedDB/Dexie cho sách, PDF, bìa và vị trí đọc.
- `src/components/common/ResponsiveSidebar.tsx` — sidebar mới có thể thu gọn.
- `src/components/notes-mode/NotesModeView.tsx` — danh sách ghi chú/sidebar có thể thu gọn.
- `src/components/editor/RichTextToolbar.tsx` — toolbar soạn thảo có thể thu gọn, icon SVG.
- `src/components/editor/NoteEditor.tsx` — bỏ emoji/glyph dễ lỗi font ở các nút khóa/xóa.
- `src/themes/festival-themes.css` + `src/stores/themeStore.ts` + `src/types/entities.ts` — 6 theme ngày lễ.
- `src/app-enhancements.css` — CSS responsive/icon/collapse.
- `.github/workflows/deploy.yml` — sau khi push sẽ build/test và tạo artifact ZIP mã nguồn.

## Lưu ý PDF

PDF được giữ nguyên dưới dạng Blob trong IndexedDB, không chuyển đổi nội dung nên tránh lỗi do encode/chuyển định dạng. Trình đọc dùng PDF viewer gốc của trình duyệt; có nút mở cửa sổ riêng nếu thiết bị không nhúng PDF tốt. File tối đa 150 MB, ảnh bìa tối đa 12 MB.
