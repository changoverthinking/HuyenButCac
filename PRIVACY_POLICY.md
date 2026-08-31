# Chính sách quyền riêng tư — Huyền Bút Các

**Cập nhật cho phiên bản 0.12.2.**

## 1. Dữ liệu lưu trên thiết bị

Huyền Bút Các là ứng dụng local-first. Ghi chú, dự án, sơ đồ, bảng trắng và cài đặt được lưu trong IndexedDB của trình duyệt.

Từ phiên bản 0.12.2, dữ liệu local được tách thành **workspace riêng cho từng tài khoản**. Đăng xuất không xóa workspace của tài khoản cũ; khi chuyển tài khoản, ứng dụng mở một IndexedDB khác thay vì xóa hoặc dùng chung dữ liệu.

MP3 và ảnh nền tùy chọn chỉ lưu trên thiết bị/workspace hiện tại và không được gửi lên dịch vụ đồng bộ.

## 2. Dữ liệu gửi tới Supabase khi bật tài khoản/đồng bộ

Khi người dùng đăng ký hoặc đăng nhập, Supabase Authentication xử lý thông tin tài khoản cần thiết như email, ID người dùng và phiên đăng nhập.

Khi người dùng tạo/mở **Kho bảo mật** và bật đồng bộ, các bảng dữ liệu hỗ trợ đồng bộ được mã hóa trên thiết bị bằng AES-256-GCM trước khi gửi tới bảng `sync_records` trên Supabase. Mật khẩu Kho không được gửi lên Supabase và khóa giải mã chỉ được giữ trong bộ nhớ của phiên đang mở.

Máy chủ vẫn nhận được metadata cần thiết để vận hành đồng bộ như ID tài khoản, loại entity, ID entity và thời điểm cập nhật của client. Nội dung payload được lưu dưới dạng bản mã.

## 3. Khóa riêng từng ghi chú

Ghi chú có thể được khóa bằng một mật khẩu riêng. Nội dung riêng tư của ghi chú (tiêu đề, nội dung, văn bản tìm kiếm và tag) được mã hóa AES-256-GCM trước khi ghi vào IndexedDB. Mật khẩu/key ghi chú không được lưu vào IndexedDB hoặc localStorage.

Khi mở khóa, nội dung rõ chỉ tồn tại trong bộ nhớ của phiên đang mở. Khi chỉnh sửa ghi chú đã khóa, nội dung được mã hóa lại trước khi ghi xuống IndexedDB.

Nếu quên mật khẩu ghi chú thì ứng dụng không có cơ chế khôi phục nội dung đó.

## 4. Xóa dữ liệu

- **Chuyển vào thùng rác** là soft-delete và có thể khôi phục.
- **Xóa vĩnh viễn** xóa tiêu đề, nội dung, tag và ciphertext khóa khỏi bản ghi local, chỉ giữ tombstone tối thiểu để việc xóa có thể đồng bộ sang thiết bị khác và tránh dữ liệu cũ sống lại.
- Xóa dữ liệu website/IndexedDB trong cài đặt trình duyệt sẽ xóa dữ liệu local của thiết bị đó.
- Đặt lại Kho bảo mật sẽ thay thế Kho và xóa bản mã đồng bộ cũ trong một transaction Supabase nguyên tử; nếu tạo profile Kho mới thất bại thì phần xóa cũng rollback. Chỉ thực hiện khi dữ liệu cần giữ vẫn còn trên thiết bị hiện tại.

## 5. Theo dõi và quảng cáo

Mã nguồn hiện tại không tích hợp tracker quảng cáo hoặc SDK analytics của bên thứ ba. GitHub Pages phục vụ ứng dụng tĩnh; Supabase được sử dụng cho xác thực và đồng bộ theo chức năng tài khoản.

## 6. Lưu ý bảo mật

- Không đưa `service_role`, database password hoặc secret quản trị vào GitHub/Vite.
- `VITE_SUPABASE_ANON_KEY`/publishable key là khóa public dành cho client; bảo vệ dữ liệu phụ thuộc thêm vào Row Level Security trong `supabase/schema.sql`.
- Mật khẩu Kho và mật khẩu khóa ghi chú nên được lưu trong trình quản lý mật khẩu của người dùng.
