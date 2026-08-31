# Hướng dẫn cập nhật Huyền Bút Các 0.12.2 lên GitHub

## Upload đúng cấu trúc

1. Giải nén file ZIP bản 0.12.2.
2. Mở thư mục `HuyenButCac-main` bên trong.
3. Upload **toàn bộ nội dung bên trong thư mục này** lên thư mục gốc repository `changoverthinking/HuyenButCac`.
4. Đảm bảo các đường dẫn quan trọng vẫn đúng:
   - `.github/workflows/deploy.yml`
   - `src/App.tsx`
   - `src/components/...`
   - `src/features/...`
   - `src/database/db.ts`
   - `supabase/schema.sql`
   - `package.json`
5. Không upload `node_modules` hoặc `dist`.
6. Commit gợi ý: `Release 0.12.2 - stable sync and account workspaces`.
7. Mở tab **Actions** và kiểm tra workflow **Deploy Huyền Bút Các**. Cả `build` và `deploy` phải xanh.

## Supabase

- Project mới: chạy toàn bộ `supabase/schema.sql`.
- Project cũ: xem `HUONG_DAN_SUPABASE.md`; nếu chưa có chức năng reset Kho, chạy thêm `supabase/migration_checkpoint_14_2_reset_vault.sql`.
- GitHub Actions Variables phải có `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.

## Kiểm tra sau cập nhật

- Phiên bản hiển thị: `0.12.2-stable-sync-workspaces`.
- Tài khoản A tạo/sửa ghi chú → logout → tài khoản B không được nhìn thấy dữ liệu local của A.
- Đăng nhập lại A: dữ liệu local A vẫn còn.
- Gõ liên tục trong ghi chú/chương trong lúc auto-sync: nội dung mới không được đổi ngược về bản cũ.
- Xóa vĩnh viễn một note: note biến mất khỏi thùng rác và tombstone không còn title/content/tag/ciphertext.
- Xóa Section: chapter trong Section chuyển về cấp Project, không mất.
- Xóa Project: Mind Map đã vẽ vẫn còn nhưng link tới Project/Section/Chapter đã xóa được gỡ.
- Tạo thư mục con bằng nút `＋` bên cạnh thư mục cha.
- Khóa một ghi chú bằng mật khẩu, tải lại trang: nội dung phải bị che; nhập đúng mật khẩu mới mở được.
- Mở Tiên Âm Các và phát nhạc; thao tác play/pause/next/previous vẫn hoạt động.

## Dữ liệu bản cũ

Phiên bản 0.12.2 giữ database cũ `huyen-but-cac` và thực hiện migration **copy một lần** vào workspace phù hợp. Bản cũ không bị `clear()` khi chuyển tài khoản.

Nếu phiên bản cũ đã từng đồng bộ với một user, marker user cũ được dùng để tránh copy dữ liệu đó nhầm sang tài khoản khác. Dữ liệu khách không có owner được chuyển vào workspace đang hoạt động ở lần migration đầu tiên.
