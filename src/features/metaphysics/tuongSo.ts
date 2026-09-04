export type PhysiognomyFeature = {
  id: string;
  area: "Trán" | "Mắt" | "Mũi" | "Miệng" | "Cằm";
  label: string;
  traditionalMeaning: string;
};

export const PHYSIOGNOMY_CATALOG: PhysiognomyFeature[] = [
  { id: "tran-rong", area: "Trán", label: "Trán rộng, tương đối đầy", traditionalMeaning: "Trong tướng thư dân gian thường được liên hệ với khả năng tiếp thu, tư duy và tiền vận. Đây chỉ là mô tả hệ thống quan niệm cổ truyền, không phải đánh giá năng lực thực tế." },
  { id: "tran-hep", area: "Trán", label: "Trán hẹp", traditionalMeaning: "Một số tài liệu truyền thống gán đặc điểm này với tiền vận nhiều ràng buộc. Không dùng đặc điểm này để suy kết tính cách hay khả năng của một người." },
  { id: "mat-than", area: "Mắt", label: "Ánh mắt ổn định, thần sắc rõ", traditionalMeaning: "Tướng học thường gọi trọng tâm quan sát là 'thần'. Ý nghĩa cổ truyền thiên về sự ổn định, tập trung; không phải chỉ dấu tâm lý hay y khoa." },
  { id: "mat-dai", area: "Mắt", label: "Mắt dài", traditionalMeaning: "Trong catalog cổ truyền, mắt dài thường được mô tả cùng nhóm tướng thanh tú. Ý nghĩa thay đổi theo sách và phải xét toàn bộ khuôn mặt." },
  { id: "mui-day", area: "Mũi", label: "Sống mũi cân đối, chuẩn đầu đầy", traditionalMeaning: "Tướng thư thường liên hệ mũi với 'tài bạch'. Đây là ký hiệu văn hóa trong hệ thống tướng học, không dự báo tài chính thực tế." },
  { id: "mui-nho", area: "Mũi", label: "Mũi nhỏ so với tổng thể", traditionalMeaning: "Một số trường phái xem tỷ lệ mũi trong tương quan ngũ quan hơn là xét độc lập; vì vậy không nên đọc riêng một đặc điểm." },
  { id: "mieng-can", area: "Miệng", label: "Miệng cân xứng, khóe rõ", traditionalMeaning: "Quan niệm truyền thống thường gắn miệng với lời nói và hậu vận. Không dùng để đánh giá đạo đức hoặc độ đáng tin của con người." },
  { id: "moi-day", area: "Miệng", label: "Môi tương đối đầy", traditionalMeaning: "Trong tướng học dân gian có nhiều diễn giải khác nhau; bản tra cứu chỉ ghi nhận biểu tượng văn hóa, không suy luận tính cách." },
  { id: "cam-day", area: "Cằm", label: "Cằm đầy, cân đối", traditionalMeaning: "Một số tướng thư gọi khu vực này là Địa Các và liên hệ với hậu vận, nền tảng. Đây là cách phân loại truyền thống." },
  { id: "cam-nhon", area: "Cằm", label: "Cằm thon/nhọn", traditionalMeaning: "Các sách tướng học có diễn giải không hoàn toàn thống nhất; cần xem như mục tra cứu văn hóa thay vì kết luận về con người." },
];
