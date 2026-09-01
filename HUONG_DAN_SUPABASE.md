# Bật đăng ký, đăng nhập và đồng bộ — Huyền Bút Các 0.14.1

## 1. Tạo/cập nhật Supabase

### Project Supabase mới

1. Vào Supabase và tạo project.
2. Mở **SQL Editor**.
3. Dán toàn bộ `supabase/schema.sql` và bấm **Run**.
4. Mở **Authentication → URL Configuration**.
5. Đặt **Site URL** là URL GitHub Pages của Huyền Bút Các và thêm URL ứng dụng vào **Redirect URLs**.
6. Với repository mặc định, hãy bảo đảm redirect cho phép `https://changoverthinking.github.io/HuyenButCac/`. Luồng Quên mật khẩu sẽ quay về cùng đường dẫn với marker `?auth=recovery`; không đổi redirect sang trang gốc `changoverthinking.github.io/`.

### Project đã dùng bản cũ

Chạy theo thứ tự:

1. `supabase/migration_checkpoint_12_e2ee.sql` nếu project chưa có `vault_profiles`/RLS E2EE.
2. Chạy **bản mới nhất** của `supabase/migration_checkpoint_14_2_reset_vault.sql` để cài RPC đặt lại Kho nguyên tử. Hãy chạy lại file này cả khi bạn đã từng chạy migration 14.2 cũ, vì signature RPC đã được nâng cấp.

Các câu lệnh đều được viết theo kiểu có thể chạy lại an toàn ở mức schema/policy cần thiết.

## 2. Lấy cấu hình public

Trong **Project Settings → API**, lấy:

- Project URL
- `anon` key hoặc publishable key dành cho client

Không dùng `service_role` trong frontend.

## 3. Cấu hình GitHub Actions

Repository → **Settings → Secrets and variables → Actions → Variables**, tạo:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Workflow `.github/workflows/deploy.yml` sẽ kiểm tra hai biến này trước khi build.

## 4. Chạy local

Project yêu cầu **Node >= 22.22.2**.

```bash
cp .env.example .env.local
npm ci
npm run test
npm run build
npm run dev
```

Điền URL/key public thật vào `.env.local`. File `.env.local` đã được `.gitignore` chặn.

## 5. Kiểm tra đăng nhập, quên mật khẩu và đồng bộ

### Kiểm tra Quên mật khẩu

1. Đăng xuất khỏi tài khoản.
2. Chọn **Quên mật khẩu?** → nhập email → **Gửi email khôi phục**.
3. Mở email mới nhất và bấm liên kết reset.
4. App phải tự mở **Tàng Thư Mật Cảnh → Đặt lại mật khẩu**.
5. Nhập mật khẩu mới hai lần. Sau khi thành công, tham số `code/auth` được xóa khỏi URL.
6. Nếu link đã hết hạn, app phải báo rõ và hiện **Gửi lại email khôi phục** thay vì cho đổi mật khẩu với phiên rỗng.

### Kiểm tra đồng bộ

1. Deploy GitHub Pages.
2. Bấm **Tài khoản**.
3. Đăng ký và xác minh email.
4. Tạo **Mật khẩu Kho bảo mật** ít nhất 12 ký tự.
5. Tạo/sửa một ghi chú, bấm **Đồng bộ ngay**.
6. Trên thiết bị thứ hai, đăng nhập cùng tài khoản, mở Kho bằng cùng mật khẩu rồi đồng bộ.
7. Thử đăng xuất và đăng nhập tài khoản khác: dữ liệu local của hai tài khoản phải nằm ở hai workspace khác nhau.

## 6. An toàn khi đưa source lên GitHub

- `.env`, `.env.local`, `node_modules`, `dist`, log và file IDE đã được `.gitignore` chặn.
- Chỉ dùng publishable/anon key ở frontend.
- Không bao giờ commit `service_role`, database password, access token riêng hoặc mật khẩu Kho.
- MP3 và ảnh nền không được upload bởi sync service.
- Payload dữ liệu đồng bộ được mã hóa AES-256-GCM trên client trước khi ghi vào `sync_records`.
