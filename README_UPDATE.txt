HUYỀN BÚT CÁC — FIX ĐƯỜNG NGANG + ẢNH NỀN TOÀN APP

CHỈ CẦN UPDATE 1 FILE:
src/media-fixes.css

CÁCH LÀM:
1. Giải nén ZIP.
2. Vào repo HuyenButCac trên GitHub.
3. Upload đè:
   src/media-fixes.css
4. Commit changes.
5. Chờ GitHub Actions deploy.
6. Trên iPhone: đóng hẳn PWA rồi mở lại.

ĐÃ SỬA:
- Xóa đường ngang/vết thừa nằm trên thanh tab dưới ở tất cả màn.
- Tiên Âm Các trở lại position:fixed trên mobile, không còn chiếm chỗ layout.
- Khi đóng Tiên Âm Các: kích thước layout = 0.
- Khi mở: player nổi trên app, không đẩy nội dung.
- Ảnh nền người dùng phủ toàn bộ app.
- Workspace, topbar, bottom nav, rail/sidebar chuyển sang bán trong suốt.
- Card/editor vẫn có lớp nền đủ rõ để đọc chữ.
- iPhone không dùng background-attachment:fixed để giảm giật.

Không cần sửa:
- App.tsx
- MusicPlayer.tsx
- themeStore.ts
- mediaService.ts
- main.tsx
