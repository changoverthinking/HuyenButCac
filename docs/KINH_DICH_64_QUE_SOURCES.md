# Kinh Dịch · 64 Quẻ — nguồn và quy ước dữ liệu

## Phạm vi bản tích hợp

Module `Kinh Dịch · 64 Quẻ` được đặt trong Huyền Học Các của tab Vạn Niên. Bản này cung cấp:

- đủ 64 quẻ theo thứ tự Văn Vương;
- tên Hán tự và tên Hán–Việt;
- thượng quái, hạ quái, tượng Bát Quái và Ngũ Hành quy ước;
- hình 6 hào Dương/Âm;
- định nghĩa/ý nghĩa tổng quát của từng quẻ bằng tiếng Việt;
- mục “Khi ra quẻ này” để đọc tình thế theo hướng tham khảo;
- gieo 3 đồng xu 6 lần;
- nhận 6/7/8/9, hào động và quẻ biến;
- nhập thủ công sáu hào nếu người dùng gieo bên ngoài.

Không sao chép dài nguyên văn quẻ từ. Phần diễn giải tiếng Việt là bản tóm lược/biên soạn phục vụ tra cứu văn hóa.

## Nguồn chính

### ZHOUYI — Chu Dịch
- Wikisource: https://zh.wikisource.org/zh-hant/周易
- Dùng để đối chiếu tên quẻ và cấu trúc văn bản cổ.

### CTEXT — Book of Changes · Chinese Text Project
- https://ctext.org/book-of-changes
- Dùng để khóa thứ tự 1–64, tên quẻ và đối chiếu Tượng/Thoán ở mức cấu trúc.
- Hệ Từ cũng mô tả việc Bát Quái phối hợp thành 64 quẻ: https://ctext.org/book-of-changes/xi-ci-shang

## Nguồn kiểm tra chéo cấu trúc dữ liệu

### TAIBU
- https://github.com/hhszzzz/taibu/blob/master/packages/core/src/data/hexagrams.ts
- Dùng kiểm tra mã 6 hào, thượng quái và hạ quái của đủ 64 quẻ.

### King Wen JSON dataset
- https://github.com/FENGTING2025/iching-64-hexagrams-json/blob/main/hexagrams.json
- Dataset MIT, dùng kiểm tra độc lập số thứ tự và tên quẻ.

## Gieo ba đồng xu

App dùng quy ước phổ biến:

- mỗi đồng xu nhận giá trị 2 hoặc 3;
- tổng 3 đồng xu tạo một hào: 6, 7, 8 hoặc 9;
- 6 = Lão Âm, hào động;
- 7 = Thiếu Dương, hào tĩnh;
- 8 = Thiếu Âm, hào tĩnh;
- 9 = Lão Dương, hào động;
- gieo từ Hào 1 (dưới) lên Hào 6 (trên).

Nguồn kiểm tra quy ước: https://en.wikipedia.org/wiki/I_Ching_divination

Ba đồng xu công bằng tạo phân bố 6/7/8/9 là 1/8, 3/8, 3/8, 1/8. Đây khác phương pháp cỏ thi; app ghi rõ đang mô phỏng **ba đồng xu**, không gọi đó là cỏ thi.

## Nguyên tắc luận

- Quẻ chủ mô tả cấu trúc/tình thế chính trong hệ biểu tượng Kinh Dịch.
- Hào động được đánh dấu theo vị trí từ dưới lên.
- Nếu có hào động, app lập quẻ biến bằng cách đổi Âm ↔ Dương tại các hào động.
- “Khi ra quẻ này” là diễn giải tham khảo, không phải lời khẳng định chắc chắn về tương lai.
- Không dùng kết quả quẻ để thay thế quyết định y khoa, pháp lý hoặc tài chính.
