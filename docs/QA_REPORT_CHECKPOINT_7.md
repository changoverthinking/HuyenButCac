# Báo cáo kiểm duyệt — Huyền Bút Các Checkpoint 7 QA

Ngày kiểm tra: 2026-08-25  
Phiên bản mã nguồn: `0.6.1-checkpoint7-qa`

## Kết luận

- 8 tệp kiểm thử, 38/38 bài đạt.
- TypeScript strict: đạt.
- Lint: không có lỗi chặn build; còn cảnh báo dependency/effect React cần tiếp tục dọn ở giai đoạn refactor.
- Production PWA build: đạt.
- Service worker, manifest và icon 192/512: có trong bản build.
- ZIP phát hành: kiểm tra toàn vẹn trước khi giao.

## Phạm vi đã kiểm tra tự động

| Nhóm | Nội dung | Kết quả |
|---|---|---|
| Ghi chú | tạo, sửa, contentText, autosave store, xóa mềm, khôi phục, xóa hẳn | ĐẠT |
| Tìm kiếm | tiếng Việt có/không dấu, loại ghi chú đã xóa, làm mới sau sửa | ĐẠT |
| Thư mục | tạo, đổi tên, di chuyển, chống vòng lặp, xóa cây, cứu ghi chú mồ côi | ĐẠT |
| Dự án | phần/chương, word count, sắp xếp, xóa chương/dự án, Markdown | ĐẠT |
| Kanban | tạo và đổi trạng thái task | ĐẠT |
| Sơ đồ | tạo, nhánh, connector, kéo/lưu tọa độ service, xóa đệ quy, bảo vệ root, xóa map | ĐẠT |
| Bảng trắng | tạo đối tượng, lưu chữ/vị trí, xóa đối tượng, đổi tên/xóa bảng | ĐẠT |
| Media | lưu/đổi tên/xóa MP3, từ chối file sai, lưu/xóa ảnh nền | ĐẠT |
| Player | next/previous, cuối danh sách, repeat one/all, shuffle, volume lỗi | ĐẠT |
| PWA | TypeScript, build, SW, manifest, icon, base `/HuyenButCac/` | ĐẠT |

## Kiểm tra trang công khai

Trang `https://changoverthinking.github.io/HuyenButCac/` mở được nhưng tại thời điểm kiểm tra vẫn hiển thị `0.1.0-checkpoint1`. Vì vậy player MP3, ảnh nền và các bản sửa Checkpoint 5–7 chưa thể nghiệm thu trên trang công khai. Cần upload gói QA, chờ Actions xanh và kiểm tra phiên bản hiển thị trước.

## Nghiệm thu bắt buộc trên thiết bị thật sau deploy

1. Chrome/Edge Windows: tải MP3 thật, nghe, tua, next/previous, reload.
2. Safari iPhone/PWA: chọn MP3 từ Files, khóa màn hình, thử Control Center; việc chạy nền phụ thuộc chính sách iOS.
3. Ảnh nền lớn trên iPhone: áp dụng, reload, quay về mặc định.
4. Kiểm tra thanh player không che bottom navigation ở iPhone 13 Pro Max.
5. Kiểm tra dung lượng lưu qua Settings của Safari; không xóa dữ liệu website khi chưa có backup.

Không tuyên bố nghiệm thu thiết bị thật cho tới khi trang công khai hiển thị đúng `0.6.1-checkpoint7-qa`.
