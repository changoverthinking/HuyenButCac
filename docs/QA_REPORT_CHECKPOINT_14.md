# QA Report — Checkpoint 14

Phiên bản: `0.12.0-checkpoint14-story-codex`

## Phạm vi

- Hợp nhất gói Story Codex vào nền Checkpoint 13.3.
- Giữ nguyên tài khoản, Kho bảo mật, Supabase, giao diện tu tiên và PWA.
- Thêm Thư Viện Truyện, tóm tắt chương, mục tiêu số từ, hạn milestone và xuất gói ngữ cảnh AI.

## Kiểm tra dữ liệu

- Dexie nâng cộng thêm lên v6, không sửa schema v1–v5.
- Chương cũ được bổ sung `synopsis` rỗng qua migration.
- Bốn bảng Story Codex được đưa vào mã hóa–đồng bộ Supabase.
- Xóa dự án xóa mềm dữ liệu Story Codex liên quan trong cùng giao dịch.
- Xóa chương tự gỡ liên kết chương khỏi dòng thời gian.

## Kiểm tra tài khoản

- Lỗi Supabase Auth thông dụng được Việt hóa.
- `Email not confirmed` hiển thị hướng dẫn xác minh rõ ràng.
- Có nút gửi lại email xác minh.
- Mất mạng không xóa dữ liệu cục bộ và hiển thị thông báo dễ hiểu.

## Kiểm tra giao diện

- Form tạo dự án và dữ liệu Story Codex tự xuống dòng trên điện thoại hẹp.
- Thanh tab Dự án cuộn ngang, không ép co chữ hoặc làm tràn khung.
- Thẻ thuật ngữ chuyển sang bố cục dọc trên mobile.
- Bong bóng nhạc vẫn được loại bỏ; Tiên Âm Các mở từ menu `☰`.

## Kết quả tự động

- Vitest: 13 file, 67/67 test đạt.
- TypeScript strict: đạt.
- Production PWA: build thành công, sinh manifest và service worker.
- Lint: không có lỗi chặn; còn 5 cảnh báo `set-state-in-effect` từ các component hiện có.

## Kiểm tra sau deploy

1. Xác minh phiên bản hiển thị đúng.
2. Tạo một dự án Tiểu thuyết/Truyện dài.
3. Thêm dữ liệu vào cả bốn mục Thư Viện Truyện.
4. Tạo chương, tóm tắt chương, mục tiêu số từ và hạn milestone.
5. Đồng bộ, mở cùng tài khoản trên thiết bị thứ hai và kiểm tra dữ liệu.
6. Xuất gói ngữ cảnh AI và mở tệp Markdown.
