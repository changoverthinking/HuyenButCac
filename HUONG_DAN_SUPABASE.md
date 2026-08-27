# Bật đăng ký, đăng nhập và đồng bộ

## 1. Tạo máy chủ miễn phí

1. Vào https://supabase.com và tạo một project.
2. Project mới: mở **SQL Editor**, dán toàn bộ nội dung `supabase/schema.sql`, rồi bấm **Run**.
3. Nếu đã dùng Checkpoint 11/11.1: chỉ chạy `supabase/migration_checkpoint_12_e2ee.sql`.
4. Mở **Authentication → URL Configuration**.
5. Đặt **Site URL** là URL GitHub Pages của Huyền Bút Các và thêm URL này vào **Redirect URLs**.

## 2. Lấy cấu hình công khai

Trong **Project Settings → API**, lấy:

- Project URL
- `anon` / publishable key

Đây là khóa công khai dành cho trình duyệt. Không dùng `service_role` và không đưa khóa quản trị lên GitHub.

## 3. Thêm vào GitHub Actions

Trong repository, mở **Settings → Secrets and variables → Actions → Variables**, tạo:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Workflow build phải truyền hai biến này vào bước `npm run build`. Nếu build trực tiếp trên máy, sao chép `.env.example` thành `.env.local` rồi thay giá trị thật.

## 4. Kiểm tra

1. Deploy lại GitHub Pages.
2. Bấm biểu tượng tài khoản ở góc trên.
3. Đăng ký bằng email và xác minh email.
4. Tạo **Mật khẩu Kho bảo mật** dài ít nhất 12 ký tự và cất ở trình quản lý mật khẩu.
5. Tạo một ghi chú, bấm **Đồng bộ ngay**.
6. Trên thiết bị thứ hai, đăng nhập cùng tài khoản, nhập đúng Mật khẩu Kho rồi đồng bộ.

Nội dung được mã hóa AES-256-GCM trên thiết bị trước khi tải lên. Mật khẩu Kho không được gửi lên Supabase hay GitHub. Nếu quên mật khẩu này, dữ liệu mã hóa không thể khôi phục.

## An toàn khi đưa lên GitHub

- `.env.local` đã bị `.gitignore` chặn.
- Chỉ dùng publishable/anon key trong `VITE_SUPABASE_ANON_KEY`.
- Không bao giờ đặt `service_role`, secret key hoặc mật khẩu database vào GitHub Variables, source code hay ZIP.
- Mật khẩu Kho chỉ nhập trong ứng dụng, không đặt trong bất kỳ tệp cấu hình nào.
