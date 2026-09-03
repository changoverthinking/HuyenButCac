# Tiểu Nhị — AI quản gia Huyền Bút Các 0.17.0

Tiểu Nhị 0.17.0 nâng từ chatbot độc lập thành trợ lý AI có thể đọc ngữ cảnh Huyền Bút Các, truy xuất tài liệu và đề xuất thao tác dữ liệu có xác nhận.

## Chế độ Local

- Model: `onnx-community/Qwen3-0.6B-ONNX`, `q4f16`, WebGPU trong Web Worker.
- Model chỉ tải khi người dùng chủ động chọn Local.
- Không gửi nội dung chat/dữ liệu Huyền Bút Các cho dịch vụ AI bên ngoài.
- RAG local truy xuất Ghi chú, Dự án/Story Bible, Tàng Thư đã lập chỉ mục, memory và tệp đính kèm.
- Hỗ trợ lệnh ghi an toàn dạng đề xuất + xác nhận: `/note`, `/project`, `/chapter`, `/remember` và một số câu lệnh tiếng Việt trực tiếp.
- Model Local là text-only; ảnh cần Online.

## Chế độ Online

- Dùng Puter.js, không nhúng API key bí mật vào repository.
- Model mặc định: `gpt-5-nano`, có thể đổi trong Thiết lập Tiểu Nhị.
- Dùng function/tool calling thật để tìm dữ liệu, đọc ghi chú/dự án và tạo đề xuất ghi dữ liệu.
- Hỗ trợ phân tích ảnh khi người dùng chủ động đính kèm ảnh.
- Mặc định **không gửi dữ liệu Huyền Bút Các cho Online**. Người dùng phải bật `Cho Tiểu Nhị Online dùng dữ liệu Huyền Bút Các`.
- Khi quyền chia sẻ tắt, lịch sử Local không được đưa vào context Online.
- Tệp người dùng chủ động đính kèm trong lượt hiện tại được xem là consent cho chính tệp đó; nó không tự mở quyền cho các tài liệu khác.

## Quyền và thao tác ghi

Tiểu Nhị có 4 scope đọc độc lập:

- Ghi chú
- Dự án + Story Bible
- Tàng Thư đã lập chỉ mục
- Memory Tiểu Nhị

Mọi thao tác ghi/xóa đều theo luồng:

`AI/tool -> đề xuất -> thẻ Chờ xác nhận -> người dùng bấm Xác nhận -> service hiện có -> Dexie`

Không có tool nào được tự ý ghi hoặc xóa ngay khi model yêu cầu. Xóa ghi chú/chương là soft-delete.

Ghi chú khóa vẫn tuân theo cơ chế hiện tại: nếu chưa được mở khóa trong phiên, Tiểu Nhị không đọc được plaintext.

## Memory và lịch sử chat

- Lịch sử chat và memory được lưu lâu dài trong IndexedDB riêng theo workspace.
- Database: `huyen-but-cac-tieu-nhi-v1-<workspace>`.
- Memory AI không tự đồng bộ cloud ở 0.17.0; tránh thay đổi schema sync/E2EE chính và tránh phát tán dữ liệu AI không cần thiết.
- Đổi tài khoản tự động tách lịch sử/memory theo workspace.

## RAG tài liệu

Tiểu Nhị có thể lập chỉ mục:

- PDF
- DOCX
- EPUB
- TXT / Markdown
- CSV / JSON / XML / HTML

PDF.js và JSZip được tải động từ CDN **chỉ khi người dùng lập chỉ mục tài liệu**, nên không làm tăng bundle khởi động chính.

Văn bản được chia thành chunk khoảng 1.500 ký tự có overlap, lưu trong IndexedDB theo workspace và xếp hạng lexical tiếng Việt có bỏ dấu + stopword. Đây là local RAG nhẹ, không cần tải thêm embedding model.

PDF scan không có text layer sẽ cần OCR/Online ở phiên bản tiếp theo nếu muốn trích xuất toàn bộ tự động.

## Ngữ cảnh màn hình đang mở

Tiểu Nhị đọc metadata từ Zustand để biết:

- Ghi chú đang chọn
- Dự án đang chọn
- Chương đang mở

Local dùng metadata này để ưu tiên RAG. Online chỉ nhận metadata màn hình khi quyền chia sẻ workspace đã bật.

## Các file chính

- `src/features/tieu-nhi/TieuNhiLauncher.tsx` — UI, Local/Online, tool loop, permission, attachment, confirmation.
- `src/features/tieu-nhi/tieuNhiDataService.ts` — AI workspace DB, memory, RAG, file extraction, read/write action layer.
- `src/features/tieu-nhi/tieuNhi.worker.js` — Qwen3 Local (giữ nguyên runtime hiện có).
- `src/features/tieu-nhi/tieu-nhi.css` — giao diện desktop/mobile.
- `src/features/library/libraryService.ts` — thêm `getLibraryBook()` để lập chỉ mục PDF qua service boundary.
- `src/tests/tieuNhiDataService.test.ts` — regression test cho workspace isolation, memory, write confirmation và RAG.

## Giới hạn có chủ đích

- Local Qwen3 0.6B ưu tiên nhẹ và riêng tư, không phải model suy luận mạnh.
- Online phụ thuộc model/hạn mức mà Puter cung cấp cho tài khoản người dùng.
- AI không tự động chạy nền, không tự sửa/xóa dữ liệu, không tự gửi toàn bộ thư viện lên mạng.
