# THREAT MODEL — Huyền Bút Các (bản đầu, cập nhật theo từng giai đoạn)

## Tài sản cần bảo vệ
- Nội dung ghi chú, dự án, mind map, whiteboard của người dùng.
- (Tương lai) khóa mã hóa dẫn xuất từ mật khẩu/PIN người dùng.

## Kẻ tấn công giả định
1. Người khác dùng chung thiết bị (không phải kẻ tấn công kỹ thuật cao) → cần khóa PIN/mật khẩu cho note nhạy cảm.
2. Kẻ tấn công qua mạng khi bật đồng bộ cloud (chưa triển khai) → server chỉ được thấy ciphertext.
3. XSS qua nội dung import (HTML dán vào, file import) → phải sanitize trước khi render.
4. Rò rỉ secret qua GitHub repo/Actions log → không commit `.env` thật, dùng GitHub Actions Secrets, bật Secret Scanning + Push Protection.

## Trạng thái hiện tại (checkpoint Giai đoạn 1-3)
- **Chưa có mã hóa thật.** Ghi chú "khóa" (nếu bật ở giai đoạn 7) sẽ không hiện trong tìm kiếm/preview nhưng cho tới khi AES-GCM được triển khai, dữ liệu trong IndexedDB là plaintext — đây là giới hạn phải nêu rõ với người dùng cuối, không được quảng cáo là "đã mã hóa".
- **Chưa có đồng bộ/cộng tác** → không có bề mặt tấn công mạng ở checkpoint này.
- App không gọi network nào ngoài chính asset của nó (không tracker, không analytics).

## Việc phải làm trước khi tuyên bố "bảo mật"
- [ ] Triển khai AES-GCM + Argon2id thật, test vector rõ ràng.
- [ ] Sanitize toàn bộ nội dung import (DOMPurify hoặc tương đương) trước khi bật rich HTML import.
- [ ] CSP nghiêm ngặt trong `index.html`/headers khi deploy.
- [ ] Audit dependency (`npm audit`) trước mỗi release.
