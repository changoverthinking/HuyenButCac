# Chính sách quyền riêng tư — Huyền Bút Các

**Cập nhật: Checkpoint 1 (giai đoạn nền tảng + ghi chú cơ bản).**

## Dữ liệu của bạn ở đâu?
Toàn bộ ghi chú, thư mục, cài đặt của bạn được lưu **trên thiết bị của bạn**, trong IndexedDB của trình duyệt. Không có gì được gửi lên bất kỳ server nào.

## App có theo dõi tôi không?
Không. Không tracker, không analytics, không quảng cáo. Trang GitHub Pages chỉ chứa mã nguồn tĩnh (HTML/CSS/JS) và service worker để app chạy offline.

## Nếu tôi xóa trình duyệt / cache?
Dữ liệu trong IndexedDB sẽ mất theo, trừ khi bạn đã xuất (export) trước đó. Tính năng xuất/nhập dữ liệu sẽ có ở checkpoint sau.

## Ghi chú "khóa" có thực sự mã hóa không?
**Chưa.** Ở checkpoint hiện tại, đánh dấu "khóa" chỉ ẩn ghi chú khỏi danh sách/tìm kiếm mặc định — nội dung vẫn ở dạng văn bản thường trong IndexedDB. Mã hóa AES-GCM thật sẽ được triển khai ở giai đoạn 7 và tài liệu này sẽ cập nhật khi đó, đúng theo nguyên tắc không tuyên bố bảo mật khi chưa triển khai thật.

## Nếu sau này có tính năng đồng bộ đám mây?
Sẽ là tùy chọn (opt-in), dữ liệu được mã hóa ngay trên thiết bị trước khi rời thiết bị, server chỉ nhận được dữ liệu đã mã hóa. Chi tiết ở `docs/PRIVACY_ARCHITECTURE.md` khi triển khai.

## Xóa dữ liệu
Bạn có thể xóa toàn bộ dữ liệu bất cứ lúc nào qua trình duyệt (Cài đặt trình duyệt → Xóa dữ liệu trang web). Nút "Xóa toàn bộ dữ liệu" trong app sẽ được thêm ở checkpoint sau.
