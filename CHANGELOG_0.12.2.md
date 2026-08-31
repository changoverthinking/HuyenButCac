# Huyền Bút Các 0.12.2 — bản sửa ổn định dữ liệu

## Sửa lỗi quan trọng

- Tách IndexedDB thành workspace riêng cho guest và từng Supabase user; không còn clear toàn bộ DB khi đổi tài khoản.
- Migration một lần từ database `huyen-but-cac` cũ vào workspace phù hợp để giữ dữ liệu phiên bản trước.
- Sửa race condition sync: chỉ record giống đúng snapshot đã upload mới được đánh dấu `synced`.
- Cờ ghi nội bộ sync chuyển từ boolean toàn cục sang transaction-local của Dexie.
- Remote pull không ghi đè record local đang `local`/`pending` và không dùng remote cũ hơn local đã sync.
- Xóa vĩnh viễn ghi chú xóa sạch nội dung/ciphertext, giữ tombstone tối thiểu để đồng bộ thao tác xóa.
- Autosave NoteEditor/FocusWriter không làm mất bản gõ mới nếu thao tác lưu trước đó đang chờ; flush thêm khi tab chuyển nền/pagehide.
- Xóa Project không xóa Mind Map; tự tách `projectId` và link node đã mất.
- Xóa Section chuyển chapter về cấp project thay vì làm chapter mồ côi; gỡ link section trên Mind Map.
- Xóa Chapter gỡ link chapter trên Timeline và Mind Map.
- Sidebar hiển thị thư mục con và cho tạo thư mục con trực tiếp.
- Media Session không đăng ký lại handler theo mỗi lần cập nhật thời gian phát.
- Khóa ghi chú thật bằng PBKDF2 + AES-256-GCM; plaintext của ghi chú khóa không nằm trong IndexedDB.

## Cấu hình/triển khai

- Thêm `.gitignore`, `.env.example`, `.nvmrc`.
- Node tối thiểu: 22.22.2.
- GitHub Actions cố định Node 22.22.2 và kiểm tra Supabase Variables trước build.
- Cập nhật Privacy Policy/Supabase guide.
- Thêm migration `migration_checkpoint_14_2_reset_vault.sql`.

## Gia cố cuối trước đóng gói

- Phiên sync được ghim vào đúng instance workspace lúc bắt đầu; nếu đăng xuất/đổi tài khoản giữa request, phiên sync cũ tự dừng và không thể ghi sang DB mới.
- Migration legacy đọc database cũ trước rồi mới mở transaction ghi của workspace mới, tránh `TransactionInactiveError` trên Safari/Chromium.
- Workspace đã có dữ liệu được đánh dấu migration hoàn tất để database legacy không thể bị copy ngược lại sau này.
- Autosave NoteEditor/FocusWriter được tuần tự hóa bằng save queue, ngăn request lưu cũ hoàn thành muộn rồi ghi đè bản mới.
- Khi xóa Project/Section/Chapter, link chết được gỡ trên mọi Mind Map, kể cả sơ đồ tự do không thuộc trực tiếp Project đó.
- Nếu mở/migrate IndexedDB thất bại, app hiển thị màn hình lỗi có nút thử lại thay vì treo ở trạng thái khởi động.
- Làm rõ UI đăng nhập: tùy chọn chỉ ghi nhớ email; mật khẩu không được ứng dụng tự lưu.
- Reset Kho bảo mật dùng RPC nguyên tử: cloud cũ chỉ bị xóa nếu vault profile mới cũng được tạo thành công trong cùng transaction PostgreSQL.
