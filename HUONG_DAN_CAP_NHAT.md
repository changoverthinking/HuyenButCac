# Hướng dẫn cập nhật Huyền Bút Các 0.13.0 lên GitHub

## Upload đúng cấu trúc

1. Giải nén file ZIP bản 0.13.0.
2. Mở thư mục `HuyenButCac-main` bên trong.
3. Upload **toàn bộ nội dung bên trong thư mục này** lên thư mục gốc repository `changoverthinking/HuyenButCac`.
4. Đảm bảo các đường dẫn quan trọng vẫn đúng:
   - `.github/workflows/deploy.yml`
   - `src/App.tsx`
   - `src/components/calendar/CalendarView.tsx`
   - `src/features/calendar/lunarCalendar.ts`
   - `src/components/...`
   - `src/features/...`
   - `src/database/db.ts`
   - `supabase/schema.sql`
   - `package.json`
5. Không upload `node_modules`, `dist`, `.env` thật hoặc file backup dữ liệu người dùng.
6. Commit gợi ý: `Release 0.13.0 - Vietnamese perpetual lunar calendar`.
7. Mở tab **Actions** và kiểm tra workflow **Deploy Huyền Bút Các**. Cả `build` và `deploy` phải xanh.

## Supabase

Bản 0.13.0 không thêm bảng Supabase cho Lịch Vạn Niên; lịch chạy offline trên frontend.

- Project mới: chạy toàn bộ `supabase/schema.sql` như trước.
- Project cũ: xem `HUONG_DAN_SUPABASE.md`; nếu chưa có chức năng reset Kho, chạy thêm `supabase/migration_checkpoint_14_2_reset_vault.sql`.
- GitHub Actions Variables phải có `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.

## Kiểm tra Lịch Vạn Niên sau cập nhật

- Phiên bản hiển thị: `0.13.0-van-nien-calendar`.
- Thanh điều hướng có mục **Vạn niên / NHẬT NGUYỆT ĐỒ**.
- 01/09/2026 phải hiện: **20/07/2026 âm · Mậu Dần · Bính Thân · Bính Ngọ**.
- 16/02/2026 phải hiện **Giao thừa**; 17/02/2026 phải hiện **Mùng 1 Tết Nguyên Đán**.
- Trong lịch tháng, mỗi ô có ngày Dương, ngày Âm và tên Can Chi ngày.
- Khi sang Mùng 1 tháng âm mới, ô lịch có tên Can Chi của tháng mới.
- Bấm một ngày phải hiện đủ Can Chi năm/tháng/ngày và Hoa Giáp x/60.
- Trên mobile, 5 tab dưới đáy phải bấm được, không tràn ngang.

## Kiểm tra hồi quy các tính năng cũ

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

Cơ chế workspace tách theo tài khoản từ 0.12.2 được giữ nguyên. Bản 0.13.0 không thay schema IndexedDB cho tính năng lịch, vì vậy cập nhật Lịch Vạn Niên không cần migration dữ liệu người dùng.
