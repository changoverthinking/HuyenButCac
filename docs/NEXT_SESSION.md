# NEXT SESSION — Huyền Bút Các

## Checkpoint 14: Thư Viện Truyện trên nền đồng bộ mã hóa

### Đã làm
- Dexie v6: `storyCharacters`, `storyLocations`, `storyLoreEntries`, `storyTimelineEvents` + `synopsis` trên `projectChapters`.
- `storyBibleService.ts`: CRUD đầy đủ cho 4 loại dữ liệu + `exportStoryBibleMarkdown`.
- `projectsService.ts`: `exportContextPackMarkdown` (Thư Viện Truyện + tóm tắt chương, không kèm toàn văn).
- `StoryBibleTab.tsx`: UI 4 mục con (Nhân vật / Thế giới / Từ điển / Dòng thời gian) + nút xuất gói ngữ cảnh AI.
- `ProjectsView.tsx`: thêm tab "Thư Viện Truyện", ô tóm tắt chương trong Dàn ý, thanh mục tiêu số từ, sửa lỗi milestone không đặt được hạn chót.
- Thêm loại dự án `novel`.
- CSS: `.codex-card`, `.codex-subtabs`, `.scroll-divider`, `.progress-jade-*` — đồng bộ phong cách với `.immortal-panel` đã có.
- Bốn bảng Thư Viện Truyện đã tham gia mã hóa–đồng bộ Supabase; xóa dự án/chương xử lý dữ liệu liên quan an toàn.
- Việt hóa lỗi xác thực và thêm gửi lại email xác minh.
- Form và thanh tab Dự án đã tối ưu thêm cho màn hình điện thoại hẹp.

### Kiểm thử
- Vitest: 13 file, 67/67 test đạt.
- TypeScript strict: đạt.
- `npm run lint`: không có lỗi chặn; còn 5 cảnh báo `set-state-in-effect` cần tối ưu dần.
- Vite production build + PWA service worker: đạt.

### Phần còn thiếu ưu tiên cao (chưa làm trong phiên này)
1. `FocusWriter`: chưa hiển thị tóm tắt chương hoặc tiến độ mục tiêu số từ ngay trong màn hình tập trung viết.
2. Story Bible: chưa có tìm kiếm/lọc khi số lượng lớn; chưa có kéo-thả sắp xếp lại thứ tự.
3. Chưa liên kết ngược từ chương → các nhân vật/thuật ngữ xuất hiện trong chương đó (auto-tag).
4. `exportContextPackMarkdown` cần tiếp tục thử nghiệm với truyện dài thực tế để tối ưu định dạng.
5. Còn 5 cảnh báo lint `set-state-in-effect` ở các component cũ; chưa gây lỗi chạy hoặc build.

### Quyết định không được đổi
- Local-first; GitHub Pages không chứa dữ liệu người dùng.
- Không gọi mã hóa/đồng bộ/cộng tác là hoàn thành khi chưa triển khai và test thật.
- Mỗi schema mới tăng version Dexie; không sửa version cũ.
- Chỉ đổi trạng thái thành `STABLE` sau test + build + reload đạt.

### Chạy lại
```bash
npm ci
npm test
npx oxlint src
npm run build
npm run dev
```
