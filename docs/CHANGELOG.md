# CHANGELOG

## Checkpoint 10 — Liên kết Dự án, Sơ đồ và bút vẽ — 2026-08-26
- Liên kết Sơ đồ với Dự án bằng ID bền vững; tự tạo/đồng bộ cây Dự án → Phần → Chương mà không sinh trùng.
- Nút `Đọc chi tiết` xác thực đích rồi mở đúng dự án, phần hoặc chương; nội dung đã xóa không làm nhảy sang mục khác.
- Đồng bộ lại tiêu đề, quan hệ cha–con và đường nối khi dàn ý dự án thay đổi.
- Chuyển `＋ Nhánh` thành nút `＋` nổi ở góc dưới vùng Sơ đồ.
- Menu `☰` và nút mở Tiên Âm Các xuất hiện xuyên suốt mọi tab trên điện thoại; trình nhạc được chuyển vào menu phía trên Đổi giao diện.
- Thêm bút chì cho Sơ đồ và Bảng trắng: nét liền/đứt/chấm, độ dày 1–12, làm mượt, mũi tên cuối/hai đầu.
- Nét vẽ được lưu cục bộ, có thể chọn, kéo di chuyển, khóa/mở khóa và xóa.
- Đối tượng Bảng trắng có thể khóa để chặn kéo hoặc xóa nhầm.
- Dexie v5 thêm kho nét vẽ riêng, giữ nguyên toàn bộ dữ liệu cũ.
- TypeScript, 44/44 test, lint không có lỗi chặn và production PWA build thành công.

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
# Checkpoint 9.2 — 2026-08-26
- Sửa vùng nhập chữ che toàn bộ thao tác kéo của các ô trong Sơ đồ trên điện thoại.
- Thêm tay cầm `⠿` riêng cho từng ô: giữ và kéo để đặt tự do, chạm phần chữ để sửa tên.
- Giữ đúng phép quy đổi tọa độ khi kéo ở mọi mức zoom và lưu vị trí sau khi thả.
# Checkpoint 11 — 0.9.0

- Đăng ký, đăng nhập, đăng xuất và xác minh email qua Supabase Auth.
- Khôi phục và đổi mật khẩu qua liên kết email.
- Đồng bộ ghi chú, thư mục, dự án, chương, sơ đồ, bảng trắng và nét vẽ giữa nhiều thiết bị.
- Hợp nhất dữ liệu cục bộ với dữ liệu tài khoản theo `updatedAt`; giữ soft-delete.
- Tự đồng bộ khi đăng nhập, trở lại ứng dụng, có mạng lại và theo chu kỳ 45 giây.
- Giữ chế độ offline-first khi chưa cấu hình máy chủ hoặc mất mạng.
- RLS bắt buộc: mỗi người chỉ đọc/ghi bản ghi thuộc chính tài khoản.
- MP3 và ảnh nền tùy chọn tiếp tục lưu cục bộ trên từng thiết bị.
# Checkpoint 11.1 — 0.9.1

- Tách cache đồng bộ theo chủ tài khoản, ngăn dữ liệu tài khoản A đi sang tài khoản B.
- Đăng xuất an toàn: đồng bộ lần cuối trước khi kết thúc phiên; chặn đăng xuất ngoại tuyến.
- Xóa vĩnh viễn dùng tombstone ẩn để lệnh xóa truyền sang mọi thiết bị và không sống lại.
- Tự làm mới màn hình khi nhận dữ liệu mới từ thiết bị khác.
- Đánh dấu `pending/synced` tự động ở tầng cơ sở dữ liệu; không dùng đồng hồ thiết bị để quyết định ghi đè.
- Đồng bộ ngay khi mạng được khôi phục.
# Checkpoint 12 — 0.10.0

- Mã hóa đầu cuối nội dung đồng bộ bằng AES-256-GCM ngay trên thiết bị.
- Dẫn xuất khóa bằng PBKDF2-SHA-256 với 600.000 vòng và salt riêng cho tài khoản.
- IV ngẫu nhiên 96-bit cho từng bản ghi; AAD ràng buộc user, loại dữ liệu và ID để chống tráo ciphertext.
- Mật khẩu Kho không gửi lên Supabase, không lưu trong GitHub và chỉ giữ trong bộ nhớ phiên.
- Tự chuyển payload Checkpoint 11 dạng thường sang dạng mã hóa sau khi mở Kho.
- RLS chỉ cấp quyền cho `authenticated`; thu hồi quyền bảng khỏi `anon`.
- Migration riêng cho project Supabase hiện có.
# Checkpoint 13 — 0.11.0

- Thiết kế lại shell theo phong cách tiên hiệp: pháp ấn ngọc, viền kim loại, sơn thủy nhiều lớp và mặt kính theo theme.
- Thanh điều hướng desktop có nhận diện Huyền Bút Các, trạng thái đang chọn và nút tài khoản thống nhất.
- Header mobile hai tầng gọn; bottom navigation dạng pháp bàn với chỉ báo phát sáng.
- Sidebar, trình soạn thảo, form và Kho bảo mật dùng chung hệ bề mặt, viền, focus và vùng chạm.
- Sửa bong bóng Tiên Âm Các không xuất hiện khi thu nhỏ.
- Sửa header/menu trên điện thoại cảm ứng xoay ngang rộng hơn 768px.
- Chuẩn hóa z-index, safe-area, vùng cuộn toolbar và kích thước dọc/ngang.
- Giữ nguyên 14 theme; toàn bộ lớp trang trí tự đổi màu theo theme hiện tại.
# Checkpoint 13.1 — 0.11.1

- Khóa khóa giải mã khỏi bộ nhớ ngay cả khi phiên bị đăng xuất/hết hạn từ bên ngoài.
- Chế độ viết tập trung nằm đúng lớp nổi và có safe-area, không bị trình nhạc che.
- Sửa autosave Ghi chú/Chương dùng closure cũ; trạng thái lưu thất bại không còn báo nhầm “Đã lưu”.
- Ngăn editor bị reset con trỏ sau mỗi lần Zustand nạp lại dữ liệu.
- Tách nạp Blob âm thanh khỏi phát/tạm dừng, tránh lệch bài và trạng thái nút khi đổi nhanh.
- Chuẩn hóa dependency của các effect nạp theme, ghi chú, thư mục và dự án.
