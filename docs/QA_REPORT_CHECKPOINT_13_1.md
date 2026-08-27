# QA Report — Checkpoint 13.1

## Kết quả

- Vitest: 53/53 PASS.
- TypeScript: PASS.
- Vite/PWA production build: PASS.
- npm audit production dependencies: 0 vulnerabilities.
- ZIP integrity: PASS.
- Secret scan: không có service role, database URL hoặc khóa bí mật.

## Lỗi đã phát hiện và sửa

1. Khóa Kho còn trong RAM khi phiên bị đăng xuất từ bên ngoài → khóa ngay ở sự kiện `SIGNED_OUT`.
2. Focus Writer cùng lớp nổi với Music Player → nâng lớp Focus Writer, giữ Account Panel cao hơn.
3. Focus Writer thiếu safe-area iPhone → thêm padding bốn cạnh theo `env(safe-area-inset-*)`.
4. Autosave Note dùng closure cũ → `flushSave` gắn đúng `note.id`, có trạng thái lưu thất bại.
5. Autosave Chapter có thể gọi lặp sau khi store refresh → theo dõi `lastSavedHtml` riêng.
6. Editor có thể reset con trỏ sau autosave → chỉ khởi tạo `innerHTML` một lần cho mỗi ID.
7. Audio source và trạng thái playing dùng chung effect thiếu dependency → tách nạp Blob và play/pause.
8. Các loader theme/note/folder/project thiếu dependency → bổ sung dependency ổn định.

## Cảnh báo không chặn

Oxlint còn cảnh báo `set-state-in-effect` tại các effect chủ đích: nạp track async, đổi mobile view theo lựa chọn, cuộn tới section và cập nhật trạng thái Kho. Không có lỗi lint mức error.
