# Tiểu Nhị — AI local cho Huyền Bút Các

Bản vá này thêm trợ lý **Tiểu Nhị** vào Huyền Bút Các mà không thêm API key và không thêm dependency npm mới.

## AI được chọn

- Model: `onnx-community/Qwen3-0.6B-ONNX`
- Quantization: `q4f16`
- Runtime: Transformers.js `4.2.0` tải động từ jsDelivr
- Device: WebGPU
- Model chỉ tải khi người dùng bấm **Khai mở Tiểu Nhị**.
- File model q4f16 khoảng 570 MB và được trình duyệt cache theo cơ chế của Hugging Face/Transformers.js.

## Hành vi trên điện thoại

- Không load AI khi app khởi động.
- Không chạy fallback WASM trên thiết bị thiếu WebGPU để tránh quá chậm/nóng máy.
- Khi đóng Tiểu Nhị trên màn hình dưới 768 px, worker được tự động terminate sau 90 giây để giải phóng RAM/GPU.
- Context gửi vào model được giới hạn 10 tin nhắn gần nhất; output tối đa 384 token mỗi lượt.

## Phạm vi bản đầu

Tiểu Nhị trò chuyện, hỗ trợ viết, tóm tắt, brainstorm và phân tích nội dung do người dùng cung cấp. Bản đầu **không tự ý đọc/sửa/xóa** Tàng Thư, ghi chú hoặc project. Đây là chủ đích an toàn; tool layer có thể nối ở giai đoạn sau.

## File thay đổi

- `src/main.tsx`
- `src/features/tieu-nhi/TieuNhiLauncher.tsx`
- `src/features/tieu-nhi/tieuNhi.worker.js`
- `src/features/tieu-nhi/tieu-nhi.css`

## Cài thủ công

Chép ba file trong `src/features/tieu-nhi/` vào repo và thay `src/main.tsx` bằng bản trong gói này. Sau đó chạy:

```bash
npm ci
npm run lint
npm run test
npm run build
```

Không cần thêm API key, `.env` hay dependency npm.
