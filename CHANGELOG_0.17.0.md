# Huyền Bút Các 0.17.0 — Tiểu Nhị quản gia

## Tiểu Nhị

- Nâng Tiểu Nhị từ chatbot độc lập thành AI quản gia có RAG và tool calling.
- Lưu lịch sử hội thoại và memory lâu dài theo từng workspace.
- Local Qwen3 0.6B dùng RAG trực tiếp trên dữ liệu được cấp quyền.
- Online Puter dùng function calling để tìm/đọc dữ liệu và đề xuất thao tác.
- Thêm phân tích ảnh Online bằng file người dùng đính kèm.
- Thêm file attachment và lập chỉ mục PDF, DOCX, EPUB, TXT, Markdown, CSV, JSON, XML, HTML.
- PDF.js/JSZip tải động, không tăng bundle khởi động.
- Thêm scope quyền Ghi chú / Dự án / Tàng Thư / Memory.
- Online mặc định không được đọc dữ liệu app cho tới khi người dùng bật consent.
- Ngăn lịch sử Local bị đưa sang Online khi consent đang tắt.
- Đọc ngữ cảnh Ghi chú/Dự án/Chương đang mở để ưu tiên truy xuất.

## An toàn dữ liệu

- Tool ghi dữ liệu chỉ tạo đề xuất; người dùng phải xác nhận trước khi service thực thi.
- Xóa ghi chú/chương qua Tiểu Nhị là soft-delete.
- Ghi chú khóa vẫn cần phiên unlock hiện có, không lưu key/mật khẩu cho AI.
- Memory/chat AI được tách theo workspace, không đọc chéo tài khoản.

## Kiểm thử

- Thêm regression test cho isolation memory AI.
- Thêm test xác nhận action chưa execute thì chưa có dữ liệu mới.
- Thêm test RAG tìm theo từ khóa rời/không dấu thay vì yêu cầu khớp nguyên câu.
