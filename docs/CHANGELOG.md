# CHANGELOG

## Checkpoint 9.1 — Folder, Sơ đồ và Bảng trắng — 2026-08-26
- Sửa tạo thư mục: thêm nút `＋`, thông báo thành công/lỗi, chuẩn hóa tên và chặn tên rỗng.
- Sơ đồ hỗ trợ kéo vùng nền để di chuyển góc nhìn, zoom theo vị trí ngón tay/con trỏ, chụm hai ngón và nút `− / % / ＋`.
- Nút phần trăm đặt lại góc nhìn 100%.
- Khung nút Sơ đồ tự thay đổi chiều rộng theo độ dài chữ từ 110 đến 320 px; đường nối bám đúng mép khung.
- Bảng trắng hỗ trợ kéo nền, zoom tự do, kéo hình bằng thanh `⠿ Kéo` lớn hơn.
- Thêm nối hình có mũi tên, lưu quan hệ nối, bỏ nối và tự dọn đường nối khi xóa hình.
- Bổ sung 3 bài kiểm thử; tổng cộng 41/41 test đạt.

## Checkpoint 9 — 14 giao diện đồng bộ — 2026-08-25
- Thiết kế lại hệ màu trình nhạc, loại bỏ màu xanh/nâu cố định.
- Trình nhạc đổi đồng bộ nền, viền, ngọc, ánh sáng và màu nút theo theme đang chọn.
- Thêm 8 theme: Bạch Nguyệt Hàn Cung, Đào Hoa Mộng Cảnh, Cửu U Huyền Dạ, Thiên Thanh Lưu Ly, Hoàng Hôn Cổ Thành, Ngọc Sơn Vân Hải, Huyết Nguyệt Ma Cảnh, Tinh Hà Vạn Tượng.
- Tổng cộng 14 theme sáng/tối với bảng màu riêng.
- Bộ chọn theme thêm mẫu ba màu để nhận biết nhanh.
- TypeScript, 38/38 test, lint và production PWA build đều đạt.

## Checkpoint 8.2 Immortal Music — 2026-08-25
- Thiết kế lại trình phát nhạc theo phong cách cổ trang/tu tiên.
- Bong bóng nhạc thành ngọc bội nhiều lớp, phát sáng nhẹ khi đang phát.
- Thanh điều khiển dùng nền kính tối, viền đồng-ngọc, hoa văn góc và nút phát dạng ngọc.
- Thư viện nhạc đổi tên thành “Tiên Âm Các”, thống nhất ngôn ngữ giao diện.
- Giữ nguyên responsive dọc/ngang và toàn bộ chức năng MP3.
- TypeScript, 38/38 test, lint và production PWA build đều đạt.

## Checkpoint 8.1 Landscape & Pinch Zoom — 2026-08-25
- Sửa điện thoại xoay ngang bị nhận thành giao diện desktop.
- Ẩn thanh tab desktop và thu gọn thanh điều hướng khi màn hình cảm ứng nằm ngang.
- Trình nhạc tiếp tục hiển thị dạng bong bóng ở cả màn hình dọc và ngang.
- Thêm chụm hai ngón để phóng to/thu nhỏ Sơ đồ và Bảng trắng từ 35% đến 250%.
- Điều chỉnh kéo đối tượng theo đúng tỷ lệ zoom.
- TypeScript, 38/38 test và production PWA build đều đạt.

## Checkpoint 8 Mobile — 2026-08-25
- Trình phát nhạc trên điện thoại đổi thành bong bóng nổi: chạm để mở, chạm nút thu nhỏ để trở về hình tròn.
- Trình nhạc không còn chiếm một hàng cố định, trả lại không gian viết và vẽ.
- Sơ đồ trên điện thoại dùng thanh chọn gọn phía trên thay cho sidebar cố định nửa màn hình.
- Bảng trắng chia thanh công cụ thành hai hàng cuộn an toàn, dùng nhãn tiếng Việt ngắn gọn.
- Tối ưu màn hình dọc/ngang, vùng an toàn iPhone và chiều cao viewport động.
- Thanh định dạng văn bản cuộn ngang trên điện thoại; thêm Palatino, Segoe Script, Brush Script, KaiTi, Yu Mincho và Noto Serif.
- Kiểm tra lại TypeScript, 38/38 test, lint và production build.

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

## Checkpoint 6 — 2026-08-25
- Thêm đổi tên và xóa toàn bộ sơ đồ tư duy; xóa giao dịch cả node/connector và tự tạo sơ đồ mới nếu danh sách trống.
- Thêm đổi tên và xóa toàn bộ bảng trắng; xóa giao dịch toàn bộ đối tượng và tự tạo bảng mới nếu cần.
- Thêm đổi tên/xóa dự án; xóa mềm đồng bộ phần, chương, task và milestone.
- Nâng trình soạn thảo dùng chung cho Ghi chú và Viết chương: undo/redo, kiểu đoạn, 5 font, 7 cỡ chữ, đậm/nghiêng/gạch chân/gạch ngang, căn lề, danh sách, màu chữ và xóa định dạng.
- Bổ sung kiểu hiển thị H1/H2/H3, trích dẫn, mã, danh sách và nội dung dài.
- Củng cố autosave chương khi thoát chế độ tập trung; cảnh báo tách chương khi vượt 20.000 từ.
- Thay toàn bộ icon PWA bằng biểu tượng bút lông–cuộn thư–ấn ngọc phong cách tu tiên/thư pháp.
- 27/27 Vitest đạt; TypeScript strict và production PWA build thành công.

## Checkpoint 7 — 2026-08-25
- Dexie schema v4 thêm thư viện MP3 và ảnh nền tùy chỉnh, giữ nguyên toàn bộ dữ liệu schema cũ.
- Trình phát nhạc nền toàn ứng dụng: phát/tạm dừng, tua, trước/sau, âm lượng, ngẫu nhiên, lặp danh sách và lặp một bài.
- Thư viện nhạc cho phép tải nhiều MP3, lưu lâu dài trên thiết bị, đổi tên và xóa từng bài; hiển thị số bài và dung lượng.
- Ghi nhớ bài đang chọn, âm lượng, chế độ lặp và ngẫu nhiên; tích hợp Media Session cho điều khiển hệ thống khi trình duyệt hỗ trợ.
- Cho phép tải ảnh nền, lưu cục bộ, thay thế ảnh hoặc trở về nền mặc định; giới hạn ảnh 20 MB.
- Tối ưu thanh nhạc và bảng thư viện cho điện thoại, thêm safe-area cho iPhone.
- 30/30 Vitest đạt; TypeScript strict và production PWA build thành công.

## Checkpoint 7 QA — 2026-08-25
- Kiểm duyệt lại toàn bộ service dữ liệu và logic player; tăng từ 30 lên 38 bài kiểm thử.
- Sửa sơ đồ đã xóa có thể tự sinh lại node gốc khi service bị gọi bằng ID cũ.
- Sửa xóa thư mục cha làm thư mục con mồ côi; nay xóa cả cây và chuyển ghi chú về “Tất cả ghi chú”.
- Thêm đổi tên/xóa thư mục ngay trên giao diện.
- Chuẩn hóa âm lượng lưu lỗi/ngoài khoảng để audio không bị lỗi khi khởi động.
- Tách logic next/previous/shuffle/repeat thành hàm thuần và kiểm thử đủ cuối danh sách, lặp một bài, lặp danh sách, ngẫu nhiên.
- Xác nhận PWA build có service worker, manifest và icon bắt buộc.
- Bản GitHub Pages công khai được kiểm tra và vẫn là `0.1.0-checkpoint1`; cần upload bản QA này trước khi nghiệm thu trình duyệt cuối.
