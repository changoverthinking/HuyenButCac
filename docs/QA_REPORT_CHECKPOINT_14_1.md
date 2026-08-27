# QA Report — Checkpoint 14.1

Phiên bản: `0.12.1-checkpoint14.1-login-ux`

## Nguyên nhân lỗi được báo

- Email trong ảnh PC là `nductienth36@gmail.com`.
- Email xuất hiện trong ảnh đăng ký trước đó trên điện thoại là `nguyenductienks@gmail.com`.
- Supabase xác định đây là hai tài khoản khác nhau và trả về `Invalid login credentials`.

## Thay đổi

- Chuẩn hóa email trước khi gửi Supabase.
- Việt hóa lỗi sai email/mật khẩu.
- Thêm ẩn/hiện mật khẩu.
- Thêm ghi nhớ email và phiên đăng nhập.
- Hỗ trợ Chrome/Safari/iCloud Keychain nhận đúng form để lưu mật khẩu.
- Không lưu mật khẩu dạng chữ thường trong bộ nhớ lâu dài của ứng dụng.

## Kiểm tra bắt buộc

1. Đăng nhập bằng đúng email đã đăng ký trên điện thoại.
2. Bật/tắt nút hiện mật khẩu và kiểm tra giá trị không bị thay đổi.
3. Bật ghi nhớ đăng nhập, đăng nhập thành công rồi mở lại ứng dụng.
4. Đăng xuất, mở form lại và kiểm tra email được điền sẵn.
5. Tắt ghi nhớ, đăng nhập lại và xác nhận email ghi nhớ được xóa.
6. Thử email có khoảng trắng/chữ hoa và xác nhận được chuẩn hóa.

## Kết quả tự động

- Vitest: 14 file, 70/70 test đạt.
- Có kiểm thử component cho nút ẩn/hiện mật khẩu và email ghi nhớ.
- TypeScript strict và production PWA build thành công.
