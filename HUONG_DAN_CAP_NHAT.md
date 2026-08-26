# Hướng dẫn cập nhật Huyền Bút Các lên GitHub

## Cách dễ nhất: tải đè toàn bộ mã nguồn

1. Giải nén gói `Huyen_But_Cac_Checkpoint_9_2_Node_Drag.zip` trên máy tính.
2. Mở repo: <https://github.com/changoverthinking/HuyenButCac>
3. Ở tab **Code**, bấm **Add file** → **Upload files**.
4. Mở thư mục vừa giải nén, chọn **toàn bộ nội dung bên trong thư mục** (không chọn chính thư mục bọc ngoài), rồi kéo vào vùng upload của GitHub.
5. Chờ GitHub tải xong. Các tệp trùng tên sẽ được cập nhật đúng đường dẫn.
6. Ở ô commit, nhập: `Update Checkpoint 9.2 - draggable mindmap nodes`
7. Chọn **Commit directly to the main branch**, rồi bấm **Commit changes**.
8. Mở tab **Actions**. Chọn lần chạy **Deploy Huyền Bút Các** mới nhất và chờ cả `build` lẫn `deploy` chuyển màu xanh.
9. Mở <https://changoverthinking.github.io/HuyenButCac/> rồi bấm **Cập nhật ngay** nếu ứng dụng hỏi. Nếu vẫn thấy bản cũ, đóng hẳn ứng dụng/tab rồi mở lại; trên Windows có thể bấm `Ctrl+F5`.

## Kiểm tra sau cập nhật

- Thanh bên phải hiển thị phiên bản `0.7.2-checkpoint9.2-node-drag`. Nếu vẫn thấy phiên bản cũ, GitHub Pages vẫn đang dùng bản cũ.
- Mở **Đổi giao diện**, thử các theme mới và xác nhận trình nhạc đổi đồng bộ màu nền, viền, ngọc và ánh sáng.
- Trên điện thoại, nút nhạc là bong bóng tròn nổi ở góc dưới bên phải. Chạm để mở; chạm dấu `⌄` để thu nhỏ.
- Tạo ghi chú, gõ nhanh cả tiêu đề và nội dung, chờ “Đã lưu”, tải lại trang: cả hai vẫn còn.
- Chuyển ghi chú vào Thùng rác: thấy nút **Khôi phục** và **Xóa vĩnh viễn**.
- Trong Sơ đồ: giữ và kéo dấu `⠿` ở mé trái của từng ô để đặt ô ở vị trí mong muốn; chạm phần chữ để sửa tên. Nút trung tâm không thể xóa.
- Trong Sơ đồ và Bảng trắng: có nút đổi tên và xóa toàn bộ mục đang mở.
- Trong Bảng trắng: kéo bằng vùng `⋮⋮ Kéo`; bấm vùng chữ vẫn chọn được đối tượng.
- Trong Ghi chú và Viết chương: thử đậm/nghiêng, font, cỡ chữ, màu chữ, căn lề và undo/redo.
- Icon mới xuất hiện sau khi trình duyệt/PWA nhận bản cập nhật; nếu icon cũ còn được hệ điều hành cache, gỡ biểu tượng khỏi màn hình chính rồi cài lại.
- Bấm `♫`, thêm vài tệp MP3, thử phát/tạm dừng, tua, trước/sau, ngẫu nhiên và lặp; đóng/mở lại app để kiểm tra bài vẫn còn.
- Trong menu Ghi chú, chọn **Chọn ảnh nền**, đóng/mở lại app để kiểm tra ảnh vẫn được giữ; thử **Dùng lại nền mặc định**.
- Trên điện thoại: trong Ghi chú có nút `☰` để mở thư mục, Thùng rác và đổi giao diện.
- Xoay điện thoại dọc/ngang: thanh điều hướng, bong bóng nhạc, Sơ đồ và Bảng trắng phải tự co lại, không che nội dung.
- Trong Sơ đồ và Bảng trắng, đặt hai ngón tay lên vùng vẽ rồi chụm/mở để thu nhỏ hoặc phóng to từ 35% đến 250%.
- Kéo vùng trống để di chuyển toàn bộ góc nhìn; bấm số phần trăm để trở về 100% và góc ban đầu.
- Trong Bảng trắng: chọn hình nguồn → bấm **Nối** → chạm hình đích. Dùng **Bỏ nối** để xóa các đường liên quan.

## Lưu ý

- Không tải thư mục `node_modules` hoặc `dist` lên GitHub; gói này đã loại chúng ra.
- Không cần sửa lại GitHub Pages. Workflow `.github/workflows/deploy.yml` sẽ tự build và deploy sau mỗi commit vào `main`.
- Tệp `deploy.yml` nằm ở thư mục gốc repo (nếu còn) không được GitHub Actions sử dụng; có thể xóa sau khi bản mới chạy xanh. Workflow đúng nằm trong `.github/workflows/deploy.yml`.
- Việc cập nhật mã nguồn không xóa ghi chú đang lưu trong trình duyệt trên cùng thiết bị và cùng địa chỉ GitHub Pages. Tuy vậy, bản hiện tại chưa có tính năng sao lưu toàn bộ dữ liệu và chưa mã hóa bằng PIN/AES.
