# NEXT SESSION — Huyền Bút Các

## Checkpoint 4: Sơ đồ tư duy và bảng trắng đã qua kiểm thử

### Đã làm
- Migration Dexie v3, giữ nguyên schema v1/v2.
- Mind map lưu thật: tạo nhiều sơ đồ, node trung tâm, thêm nhánh, sửa tên, kéo node, connector cong, xóa node và toàn bộ nhánh con.
- Whiteboard lưu thật: tạo nhiều bảng, sticky note, text, rectangle, ellipse, sửa nội dung, chọn/kéo/xóa, grid và zoom 35–250%.
- Bỏ toàn bộ placeholder “sắp có” của hai chế độ này.

### Kiểm thử
- Vitest: 4 file, 19/19 test đạt.
- TypeScript strict: đạt.
- Vite production build + PWA service worker: đạt.

### Phần còn thiếu ưu tiên cao
1. Chạy `npm ci && npm test && npm run build`; sửa mọi lỗi nếu có.
2. Unit test CRUD và reload cho mind map/whiteboard.
3. Mind map: undo/redo, collapse, auto-layout, edge tùy chỉnh, export/import.
4. Whiteboard: pan, resize/rotate, connector, vẽ tay, group/layer, minimap, export.
5. Ghi chú: editor hoàn chỉnh, sanitize, bảng/ảnh/template.
6. AES-GCM + PBKDF2, khóa ghi chú và backup mã hóa; sau đó mới sync/cộng tác.

### Quyết định không được đổi
- Local-first; GitHub Pages không chứa dữ liệu người dùng.
- Không gọi mã hóa/đồng bộ/cộng tác là hoàn thành khi chưa triển khai và test thật.
- Mỗi schema mới tăng version Dexie; không sửa version cũ.
- Chỉ đổi trạng thái thành `STABLE` sau test + build + reload đạt.

### Chạy lại
```bash
npm ci
npm test
npm run build
npm run dev
```
