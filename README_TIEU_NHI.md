# Tiểu Nhị — trợ lý AI của Huyền Bút Các

Tiểu Nhị đã được tích hợp trực tiếp vào giao diện Huyền Bút Các. Từ bản 0.16.2, nút Tiểu Nhị được React render cạnh **Tàng Thư Mật Cảnh** trên desktop và cạnh nút tài khoản trên mobile; không còn chèn DOM bằng `MutationObserver`.

## Hai chế độ

### Local
- Model: `onnx-community/Qwen3-0.6B-ONNX`.
- Quantization: `q4f16`.
- Runtime: Transformers.js tải động từ jsDelivr.
- Chạy bằng WebGPU trong Web Worker.
- Chỉ tải model khi người dùng chủ động chọn AI local; lần đầu khoảng 570 MB.
- Trên mobile, khi đóng Tiểu Nhị và không dùng tiếp, worker local được giải phóng sau một khoảng chờ để giảm RAM/GPU.

### Online
- Dùng Puter.js, không nhúng API key bí mật vào repository.
- Có thể yêu cầu người dùng đăng nhập Puter tùy dịch vụ/hạn mức.
- Nội dung chat online được gửi tới dịch vụ AI bên ngoài, vì vậy giao diện có thông báo rõ trước khi dùng.

## Phạm vi quyền

Tiểu Nhị hỗ trợ viết truyện, dàn ý, tóm tắt, brainstorm và phân tích nội dung người dùng đưa vào chat. Bản này **không tự ý đọc, sửa, xóa hoặc lưu** Ghi chú, Tàng Thư hay Dự án.

## Kiến trúc 0.16.2

- `src/App.tsx`: render nút mở Tiểu Nhị trực tiếp và lazy-load component AI.
- `src/features/tieu-nhi/TieuNhiLauncher.tsx`: panel chat và quản lý Local/Online.
- `src/features/tieu-nhi/tieuNhi.worker.js`: tải/chạy Qwen3 local bằng WebGPU.
- `src/features/tieu-nhi/tieu-nhi.css`: giao diện desktop/mobile.

Không cần chạy script `apply-tieu-nhi.*`; các script vá cũ đã được loại khỏi bản 0.16.2 để tránh ghi đè source mới.
