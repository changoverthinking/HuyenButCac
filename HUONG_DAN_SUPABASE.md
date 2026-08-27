# Bật đăng ký, đăng nhập và đồng bộ

## 1. Tạo máy chủ miễn phí

1. Vào https://supabase.com và tạo một project.
2. Mở **SQL Editor**, dán toàn bộ nội dung `supabase/schema.sql`, rồi bấm **Run**.
3. Mở **Authentication → URL Configuration**.
4. Đặt **Site URL** là URL GitHub Pages của Huyền Bút Các.
5. Thêm chính URL đó vào **Redirect URLs** (có thể thêm dấu `/**` ở cuối).

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
4. Tạo một ghi chú, bấm **Đồng bộ ngay**.
5. Trên thiết bị thứ hai, đăng nhập cùng tài khoản và bấm **Đồng bộ ngay**.

Lần đăng nhập đầu tiên sẽ hợp nhất dữ liệu trên thiết bị với dữ liệu đám mây. Bản có `updatedAt` mới hơn được giữ. Dữ liệu cục bộ không bị xóa hàng loạt.
