export const PHYSIOGNOMY_AREAS = [
  "Tổng luận",
  "Tam đình",
  "Trán",
  "Ấn đường & Sơn căn",
  "Lông mày",
  "Mắt",
  "Tai",
  "Mũi",
  "Gò má & Lục phủ",
  "Nhân trung",
  "Miệng & Môi",
  "Răng & Lưỡi",
  "Cằm & Địa các",
  "Tóc & Râu",
  "Thần khí & Khí sắc",
  "Thanh âm & Cử chỉ",
] as const;

export type PhysiognomyArea = (typeof PHYSIOGNOMY_AREAS)[number];

export type PhysiognomySource = {
  id: string;
  title: string;
  period: string;
  role: "cổ thư" | "tổng tập" | "đối chiếu Việt ngữ" | "khung phương pháp";
  note: string;
  url: string;
};

export type PhysiognomyFeature = {
  id: string;
  area: PhysiognomyArea;
  label: string;
  traditionalMeaning: string;
  howToRead: string;
  sourceIds: string[];
  tags: string[];
};

export const PHYSIOGNOMY_SOURCES: PhysiognomySource[] = [
  {
    id: "SXQB",
    title: "Thần Tướng Toàn Biên · 神相全编",
    period: "Tổng tập lưu hành mạnh từ Minh–Thanh; quy tập nhiều lớp tướng thư cổ",
    role: "cổ thư",
    note: "Nguồn chính cho Ngũ Quan, Tam Đình, Lục Phủ, trán, mày, mắt, mũi, tai, miệng, răng, tóc, thanh âm và thần khí.",
    url: "https://ctext.org/wiki.pl?chapter=905153&if=gb&remap=gb",
  },
  {
    id: "RLDTF",
    title: "Nhân Luân Đại Thống Phú · 人伦大统赋",
    period: "Kim–Nguyên",
    role: "cổ thư",
    note: "Dùng để đối chiếu các nguyên tắc tổng thể, trán, tai, mũi, ngũ quan và cách nhìn hình–khí–thần.",
    url: "https://zh.wikisource.org/zh-hans/%E4%BA%BA%E5%80%AB%E5%A4%A7%E7%B5%B1%E8%B3%A6",
  },
  {
    id: "BINGJIAN",
    title: "Băng Giám · 冰鉴",
    period: "Thanh; tác giả lưu truyền còn tranh luận",
    role: "cổ thư",
    note: "Dùng làm nguồn so sánh cho thần cốt, dung mạo, tình thái, tu mi, thanh âm và khí sắc; không coi là chuẩn duy nhất.",
    url: "https://zh.wikisource.org/zh-hans/%E5%86%B0%E9%89%B4",
  },
  {
    id: "GJTS",
    title: "Cổ Kim Đồ Thư Tập Thành · Nghệ Thuật Điển · Tướng Thuật Bộ",
    period: "Thanh",
    role: "tổng tập",
    note: "Bách khoa thư đời Thanh chép và hệ thống lại nhiều đoạn tướng thư; dùng để kiểm tra chéo bộ vị và thuật ngữ.",
    url: "https://www.zhonghuashu.com/wiki/%E6%AC%BD%E5%AE%9A%E5%8F%A4%E4%BB%8A%E5%9C%96%E6%9B%B8%E9%9B%86%E6%88%90/%E5%8D%9A%E7%89%A9%E5%BD%99%E7%B7%A8/%E8%97%9D%E8%A1%93%E5%85%B8/%E7%AC%AC634%E5%8D%B7",
  },
  {
    id: "HYTRUONG",
    title: "Nhân Tướng Học · Hy Trương",
    period: "Biên khảo Việt ngữ hiện đại",
    role: "đối chiếu Việt ngữ",
    note: "Chỉ dùng để thống nhất cách gọi tiếng Việt như Tam Đình, Ngũ Nhạc, Tứ Đậu, Lục Phủ, Ngũ Quan và các bộ vị; không sao chép lời luận.",
    url: "https://file.nhasachmienphi.com/pdf/nhasachmienphi-nhan-tuong-hoc.pdf",
  },
  {
    id: "TVH",
    title: "Tìm hiểu Nhân Tướng Học theo Kinh Dịch · Thiếu Vi Hòa",
    period: "Biên khảo Việt ngữ hiện đại",
    role: "đối chiếu Việt ngữ",
    note: "Dùng để đối chiếu hệ phân loại và nguyên tắc nhìn tổng thể trước khi xét từng bộ vị.",
    url: "https://thuvien.kabala.vn/ebook/Huyen-Hoc-Dong-Phuong/Kinh-Dich/Nhatbook-tim-hieu-nhan-tuong-hoc-theo-kinh-dich-thieu-vi-hoa-2009.pdf",
  },
  {
    id: "SONCHU",
    title: "Nhập môn Nhân tướng học — khung luận của cổ thư · Học quán Sơn Chu",
    period: "Tổng thuật Việt ngữ đương đại",
    role: "khung phương pháp",
    note: "Dùng cho nguyên tắc không luận một điểm riêng lẻ, ưu tiên thần khí và phối hợp nhiều tầng quan sát.",
    url: "https://sonchu.vn/nghien-cuu/nhap-mon-nhan-tuong-hoc",
  },
  {
    id: "NTVN",
    title: "Tam Đình & Ngũ Quan · Nhân Tướng",
    period: "Tổng thuật Việt ngữ đương đại",
    role: "đối chiếu Việt ngữ",
    note: "Dùng để kiểm tra cách gọi phổ biến hiện nay cho Tam Đình, Ngũ Quan và các vùng khuôn mặt.",
    url: "https://nhantuong.vn/tam-dinh-ngu-quan",
  },
];

const F = (
  id: string,
  area: PhysiognomyArea,
  label: string,
  traditionalMeaning: string,
  howToRead: string,
  sourceIds: string[],
  tags: string[],
): PhysiognomyFeature => ({ id, area, label, traditionalMeaning, howToRead, sourceIds, tags });

export const PHYSIOGNOMY_CATALOG: PhysiognomyFeature[] = [
  // Tổng luận
  F("tong-hinh-than", "Tổng luận", "Hình và thần phải xem cùng nhau", "Các cổ thư đều không chỉ xét một nét đơn lẻ. Hình thể là phần dễ thấy, còn 'thần' được hiểu là trạng thái sinh động, ổn định và khí thái toàn diện. Khi hai phần mâu thuẫn, tướng pháp cổ thường ưu tiên xét tổng thể thay vì chốt theo một dấu hiệu.", "Dùng làm nguyên tắc nền: chỉ ghi nhận một đặc điểm sau khi đã nhìn tỷ lệ chung, thần sắc và sự cân xứng của toàn khuôn mặt.", ["SXQB", "RLDTF", "BINGJIAN", "SONCHU"], ["hình", "thần", "tổng thể"]),
  F("tong-ngu-quan", "Tổng luận", "Ngũ Quan thành hay khuyết", "Hệ Ngũ Quan cổ truyền gọi tai là Thái Thính Quan, mày là Bảo Thọ Quan, mắt là Giám Sát Quan, mũi là Thẩm Biện Quan và miệng là Xuất Nạp Quan. 'Quan thành' chủ yếu nói tới sự rõ ràng, cân xứng và phù hợp với toàn khuôn mặt.", "Không lấy tên gọi cổ như một khẳng định thực tế về sức khỏe, đạo đức hay tài vận. Hãy đọc nó như hệ thống phân vùng và biểu tượng.", ["SXQB", "GJTS", "HYTRUONG", "NTVN"], ["ngũ quan", "khung luận"]),
  F("tong-tam-dinh", "Tổng luận", "Tam Đình cân xứng", "Thượng Đình, Trung Đình và Hạ Đình là ba tầng khuôn mặt. Cổ thư coi ba phần tương đối cân xứng, không quá nhọn, lệch hay lõm là nền tảng thuận lợi hơn so với việc chỉ có một bộ vị nổi bật.", "Đánh giá bằng tỷ lệ tương đối của chính khuôn mặt, không dùng một con số tuyệt đối cho mọi người.", ["SXQB", "RLDTF", "HYTRUONG", "TVH"], ["tam đình", "cân xứng"]),
  F("tong-ngu-nhac", "Tổng luận", "Ngũ Nhạc tương triều", "Ngũ Nhạc quy ước trán, hai gò má, mũi và cằm thành năm 'núi'. Quan niệm cổ chuộng thế cân bằng: trung tâm không cô độc, hai bên không quá lép hoặc quá lộ.", "Xét mối tương quan giữa mũi, trán, hai gò má và cằm; tránh kết luận chỉ vì một phần cao hay thấp.", ["SXQB", "GJTS", "HYTRUONG"], ["ngũ nhạc", "tỷ lệ"]),
  F("tong-luc-phu", "Tổng luận", "Lục Phủ đầy và liền mạch", "Lục Phủ gồm các vùng xương phụ, gò má và hàm dưới ở hai bên. Cổ thư dùng khái niệm 'đầy, không khuyết hãm' để mô tả khuôn mặt có cấu trúc liên tục và cân đối.", "Quan sát hai bên đồng thời; sự đối xứng và liên kết giữa các vùng quan trọng hơn một điểm đơn lẻ.", ["SXQB", "GJTS", "HYTRUONG"], ["lục phủ", "xương mặt"]),
  F("tong-khong-mot-diem", "Tổng luận", "Không luận một nét thành cả con người", "Ngay trong truyền thống, nhiều sách đã nhấn mạnh phải tham chiếu nhiều tầng: cốt cách, ngũ hành, tam đình, ngũ quan, khí sắc, thanh âm và cử chỉ. Một nét riêng lẻ không đủ để thay thế toàn bộ hệ thống.", "Nếu một đặc điểm xuất hiện nhưng các vùng liên quan không cùng xu hướng, ghi là 'chưa đủ căn cứ theo tướng pháp cổ'.", ["SXQB", "RLDTF", "BINGJIAN", "SONCHU"], ["phương pháp", "thận trọng"]),

  // Tam đình
  F("tam-can-xung", "Tam đình", "Ba đình tương đối cân", "Cổ thư xếp Tam Đình cân xứng vào nhóm nền tảng hài hòa, thường được diễn giải là các giai đoạn đời người có tính liên tục hơn.", "So chiều cao Thượng–Trung–Hạ Đình theo tỷ lệ, không cần bằng tuyệt đối từng milimet.", ["SXQB", "HYTRUONG", "NTVN"], ["tam đình", "hài hòa"]),
  F("tam-thuong-day", "Tam đình", "Thượng Đình rộng và đầy", "Trong lối đọc cổ, vùng từ chân tóc tới mày rộng, vuông và tương đối đầy thường được xếp vào nhóm Thượng Đình 'có khí', liên hệ tượng trưng với tiền vận và nền học hỏi.", "Cần phối hợp trán, đường chân tóc và Ấn Đường; không dùng riêng để đánh giá năng lực trí tuệ thực tế.", ["SXQB", "RLDTF"], ["thượng đình", "tiền vận"]),
  F("tam-thuong-hep", "Tam đình", "Thượng Đình hẹp hoặc khuyết", "Tướng thư truyền thống thường coi Thượng Đình quá hẹp, lệch hoặc lõm là dấu hiệu bất lợi ở phần đầu của bố cục khuôn mặt.", "Chỉ ghi nhận là 'thế Thượng Đình kém đầy' và xem thêm Trung/Hạ Đình; không suy thành hoàn cảnh gia đình hay trí lực.", ["SXQB", "RLDTF"], ["thượng đình", "cẩn trọng"]),
  F("tam-trung-thang", "Tam đình", "Trung Đình ngay và ổn", "Trung Đình gồm mày–mắt–mũi–gò má. Cổ thư ưa thế ngay, đầy vừa và không bị ép hẹp, coi đây là phần trung tâm của diện tướng.", "Đọc theo cụm mũi, mắt và gò má thay vì chỉ đo chiều dài Trung Đình.", ["SXQB", "HYTRUONG"], ["trung đình", "trung tâm"]),
  F("tam-trung-ngan", "Tam đình", "Trung Đình ngắn hoặc lõm", "Trong hệ cổ, Trung Đình quá ngắn, thấp hoặc mất cân xứng thường được xếp vào nhóm bố cục cần xem kỹ hơn vì trung tâm khuôn mặt thiếu liên kết.", "So với chiều rộng gương mặt và các đình khác; không gán thành phẩm chất tính cách.", ["SXQB", "TVH"], ["trung đình", "cẩn trọng"]),
  F("tam-ha-day", "Tam đình", "Hạ Đình đầy, cằm có nền", "Hạ Đình từ dưới mũi đến cằm. Cổ thư thích thế tương đối đầy, ngay và có nền ở Địa Các, thường dùng để tượng trưng cho hậu vận và khả năng 'thu kết'.", "Xét chung Nhân trung, miệng, hàm và cằm; tránh chỉ nhìn độ nhọn của cằm.", ["SXQB", "RLDTF", "HYTRUONG"], ["hạ đình", "địa các"]),

  // Trán
  F("tran-rong-vuong", "Trán", "Trán rộng, tương đối vuông", "Trong Thần Tướng Toàn Biên và Nhân Luân Đại Thống Phú, trán rộng, ngay và có độ đầy được xếp vào nhóm thuận lợi của Thượng Đình.", "Xem thêm đường chân tóc, hai góc trán và Ấn Đường. Trán rộng một mình không đủ để luận.", ["SXQB", "RLDTF"], ["trán", "thượng đình"]),
  F("tran-cao-day", "Trán", "Trán cao và có độ đầy", "Cổ thư thường ghép trán cao với đỉnh đầu và thế xương trán; khi cao nhưng vẫn hài hòa với toàn mặt thì được xem là thế có dư.", "Phân biệt 'cao hài hòa' với 'cao nhưng hẹp/lệch'.", ["SXQB", "BINGJIAN"], ["trán", "xương trán"]),
  F("tran-thap-hep", "Trán", "Trán thấp hoặc hẹp", "Tướng thư cổ xếp trán thấp, hẹp hoặc thu gọn quá mạnh vào nhóm Thượng Đình kém đầy.", "Chỉ ghi nhận đặc điểm hình thái; không suy trực tiếp sang học lực, khả năng nhận thức hay địa vị.", ["SXQB", "RLDTF"], ["trán", "cẩn trọng"]),
  F("tran-lech-lom", "Trán", "Trán lệch, lõm hoặc khuyết rõ", "Các mô tả cổ thường coi sự khuyết, sụt hoặc bất cân xứng của phần trán là dấu hiệu làm giảm tính liền mạch của Thượng Đình.", "Xem hai bên và góc trán; nếu chỉ là cấu trúc tự nhiên nhỏ thì không nên phóng đại.", ["SXQB", "GJTS"], ["trán", "bất cân xứng"]),
  F("tran-chan-toc-gon", "Trán", "Đường chân tóc tương đối gọn", "Trong nhiều đoạn tướng thư, đường chân tóc ổn định và không xâm lấn quá mạnh vào trán được xem là giúp Thượng Đình rõ ràng hơn.", "Đọc như yếu tố bố cục. Không dùng tóc tự nhiên, hói hay kiểu tóc để suy đoán phẩm chất con người.", ["SXQB", "HYTRUONG"], ["trán", "chân tóc"]),
  F("tran-chan-toc-khong-deu", "Trán", "Đường chân tóc lồi lõm, không đều", "Cổ thư có nhắc phát tế tham sai như một yếu tố khiến Thượng Đình khó đạt thế cân chỉnh.", "Chỉ dùng khi quan sát hình thái tự nhiên, không tính tóc cắt/tạo kiểu. Đây không phải dấu hiệu sức khỏe.", ["SXQB", "GJTS"], ["trán", "chân tóc"]),

  // Ấn đường & Sơn căn
  F("an-duong-rong", "Ấn đường & Sơn căn", "Ấn Đường rộng và bằng", "Ấn Đường nằm giữa hai đầu mày. Tướng thư cổ ưa thế rộng vừa, phẳng, hai mày không ép sát; đây là bộ vị quan trọng trong hệ Mệnh Cung.", "Đọc chung với hai đầu mày và Sơn căn; tránh gắn trực tiếp với vận may thực tế.", ["SXQB", "GJTS"], ["ấn đường", "mệnh cung"]),
  F("an-duong-sang", "Ấn đường & Sơn căn", "Ấn Đường sáng, sắc da đồng đều", "Trong ngôn ngữ cổ, 'minh nhuận' ở Ấn Đường thường được xếp vào nhóm khí sắc thuận. Ở đây chỉ lưu cách diễn giải văn hóa, không phải đánh giá y khoa.", "Chỉ quan sát dưới ánh sáng bình thường; không suy bệnh, thọ yểu hoặc sự kiện tương lai từ màu da.", ["SXQB", "GJTS", "RLDTF"], ["ấn đường", "khí sắc"]),
  F("an-duong-hep", "Ấn đường & Sơn căn", "Ấn Đường hẹp hoặc lõm", "Cổ thư xếp Ấn Đường hẹp, bị hai đầu mày ép hoặc lõm rõ vào nhóm không lý tưởng của Mệnh Cung.", "Kết hợp độ rộng hai đầu mày và toàn Trung Đình; không dùng để gán tính cách.", ["SXQB", "GJTS"], ["ấn đường", "cẩn trọng"]),
  F("an-duong-may-giao", "Ấn đường & Sơn căn", "Hai đầu mày giao hoặc quá sát", "Nhiều tướng thư cổ đều coi mày giao ở Ấn Đường là thế làm vùng trung tâm bị chật và khó 'khai'.", "Chỉ mô tả hình thái; không dùng để phán đạo đức, hôn nhân hay tuổi thọ như các câu quyết cổ.", ["SXQB", "GJTS"], ["ấn đường", "lông mày"]),
  F("son-can-cao-lien", "Ấn đường & Sơn căn", "Sơn căn cao vừa, nối liền sống mũi", "Sơn căn là đoạn đầu sống mũi dưới Ấn Đường. Cổ thư ưa thế liên tục, không gãy, phối hợp được với mũi và trán.", "Xem đường chuyển tiếp trán–mũi; cao quá hoặc thấp quá đều phải xét tương quan gương mặt.", ["SXQB", "GJTS", "RLDTF"], ["sơn căn", "mũi"]),
  F("son-can-thap-gay", "Ấn đường & Sơn căn", "Sơn căn thấp hoặc đứt thế", "Trong tướng thư truyền thống, Sơn căn quá thấp, gãy hoặc lõm làm đường trung tâm từ trán xuống mũi bị ngắt, thường được xếp vào thế kém liền mạch.", "Chỉ dùng để mô tả cấu trúc. Không suy từ đây sang bệnh, tai nạn hay tuổi thọ.", ["SXQB", "GJTS"], ["sơn căn", "cẩn trọng"]),

  // Lông mày
  F("may-thanh-dai", "Lông mày", "Mày thanh, dài và có trật tự", "Luận mày cổ điển thường chuộng sợi mày tương đối thanh, mọc thuận, dáng dài và có đầu đuôi rõ; đây được gọi là mày 'thanh tú'.", "Xét mật độ, hướng mọc và tỷ lệ với mắt. Không dùng dáng mày để suy phẩm chất đạo đức.", ["SXQB", "BINGJIAN"], ["mày", "thanh tú"]),
  F("may-qua-mat", "Lông mày", "Đuôi mày dài hơn đuôi mắt", "Một số đoạn cổ coi mày dài phủ quá mắt là dấu hiệu 'quan thành', tức bộ vị mày có độ dài đầy đủ.", "Chỉ xem như tiêu chí tỷ lệ trong hệ cổ; cần phối hợp chiều cao và độ thanh của mày.", ["SXQB", "GJTS"], ["mày", "tỷ lệ"]),
  F("may-thua-thuan", "Lông mày", "Mày thưa vừa, sợi mọc thuận", "Băng Giám và Thần Tướng Toàn Biên đều có xu hướng chuộng mày 'sơ sảng', không bết và không rối. Đây là cách mô tả sự thông thoáng của vùng mày.", "Mày thưa tự nhiên không đồng nghĩa bất lợi; chỉ xét khi phối hợp với hình dáng và thần mắt.", ["SXQB", "BINGJIAN"], ["mày", "sơ sảng"]),
  F("may-ram-roi", "Lông mày", "Mày quá rậm và rối", "Các tướng thư cổ thường xếp mày rậm, mọc nghịch hoặc rối mạnh vào nhóm 'không thanh'.", "Không suy thành nóng tính, hung dữ hay hành vi xấu. Chỉ ghi là bộ vị mày thiếu trật tự theo chuẩn cổ.", ["SXQB", "BINGJIAN"], ["mày", "cẩn trọng"]),
  F("may-ap-mat", "Lông mày", "Mày thấp, áp sát mắt", "Trong cổ thư, mày áp mắt thường bị xem là làm khoảng mày–mắt quá hẹp, khiến Giám Sát Quan và Bảo Thọ Quan thiếu khoảng thoáng.", "Xét khoảng cách tương đối với kích thước mắt và trán, không dùng một ngưỡng cố định.", ["SXQB", "BINGJIAN"], ["mày", "mắt"]),
  F("may-gian-doan", "Lông mày", "Mày có đoạn đứt hoặc thiếu rõ", "Các mục 'gian đoạn mày' trong tướng thư coi sự đứt mạch rõ rệt là dạng không hoàn chỉnh của Bảo Thọ Quan.", "Phân biệt cấu trúc tự nhiên với sẹo, nhổ/cạo hoặc trang điểm. Không suy thành biến cố cụ thể.", ["SXQB", "GJTS"], ["mày", "đứt đoạn"]),

  // Mắt
  F("mat-than-dinh", "Mắt", "Ánh mắt ổn định, có thần", "Nhiều cổ thư coi mắt là nơi biểu lộ 'thần'. Ánh nhìn ổn định, không tán loạn, đồng tử rõ và thần sắc sinh động được xếp vào nhóm tốt của Giám Sát Quan.", "Quan sát trong giao tiếp tự nhiên; không dùng ánh mắt để chẩn đoán tâm lý, bệnh lý hoặc ý đồ.", ["SXQB", "BINGJIAN", "RLDTF"], ["mắt", "thần"]),
  F("mat-den-trang-ro", "Mắt", "Lòng đen và lòng trắng phân minh", "Tướng thư cổ thường dùng 'hắc bạch phân minh' để mô tả mắt rõ nét và có sinh khí.", "Đọc như một mô tả thẩm mỹ truyền thống, không phải tiêu chuẩn y khoa của mắt.", ["SXQB", "GJTS"], ["mắt", "ngũ quan"]),
  F("mat-dai-sau", "Mắt", "Mắt dài, tương đối sâu", "Trong nhiều đoạn cổ, mắt dài và có độ sâu vừa được xếp vào nhóm hình mắt thanh, nhất là khi phối hợp với thần ổn định.", "Hình mắt không tách khỏi ánh nhìn, mày và hốc mắt.", ["SXQB", "RLDTF"], ["mắt", "hình mắt"]),
  F("mat-lo-nhieu", "Mắt", "Mắt lộ hoặc nhãn cầu quá nổi", "Tướng thư cổ thường không chuộng mắt quá lộ vì xem là 'thần dễ phát ra ngoài'.", "Không dùng đặc điểm này để suy bệnh tuyến giáp, thần kinh hoặc tính cách. Chỉ ghi nghĩa cổ truyền.", ["SXQB", "GJTS"], ["mắt", "cẩn trọng"]),
  F("mat-nhin-tan", "Mắt", "Ánh nhìn hay tán hoặc đổi hướng liên tục", "Trong hệ cổ, ánh nhìn không ổn định được đặt đối lập với 'thần định'. Băng Giám cũng nhấn mạnh xem cả lúc động và tĩnh thay vì nhìn một khoảnh khắc.", "Chỉ áp dụng khi quan sát lâu và trong hoàn cảnh bình thường; không suy nói dối, tội lỗi hay rối loạn tâm lý.", ["SXQB", "BINGJIAN"], ["mắt", "thần"]),
  F("mat-bat-doi-xung", "Mắt", "Hai mắt khác nhau rõ về thế hoặc kích thước", "Cổ thư có nhóm 'âm dương nhãn' và nhiều dạng mắt không đồng thế, nhưng diễn giải giữa sách không hoàn toàn thống nhất.", "Ghi là đặc điểm cần phối hợp nhiều bộ vị; không nên tự động xếp cát/hung.", ["SXQB", "GJTS"], ["mắt", "dị bản"]),

  // Tai
  F("tai-day-chac", "Tai", "Tai dày, vành tai rõ", "Thần Tướng Toàn Biên và Nhân Luân Đại Thống Phú đều chuộng tai có độ dày, đường luân–quách tương đối rõ và hình thể chắc.", "Đọc tỷ lệ với đầu và khuôn mặt; không dùng tai để suy tuổi thọ hay sức khỏe thực tế.", ["SXQB", "RLDTF"], ["tai", "ngũ quan"]),
  F("tai-thuy-chau", "Tai", "Dái tai tương đối đầy", "Các nguồn cổ thường xếp 'thùy châu' đầy vào nhóm có phúc tượng theo ngôn ngữ biểu tượng truyền thống.", "Chỉ ghi nghĩa văn hóa; không liên hệ trực tiếp với tài sản hoặc tuổi thọ.", ["SXQB", "RLDTF"], ["tai", "thùy châu"]),
  F("tai-cao", "Tai", "Vị trí tai tương đối cao", "Một số quyết cổ đánh giá tai cao tới ngang mày hoặc cao hơn mắt là thế thuận của Thái Thính Quan.", "Xét mốc tương đối với mắt/mày và toàn đầu; không dùng để đánh giá trí thông minh.", ["SXQB", "GJTS"], ["tai", "vị trí"]),
  F("tai-ap-dau", "Tai", "Tai áp tương đối sát đầu", "Trong tướng thư, tai 'thiếp nhục' thường được liệt vào dạng gọn, không xòe quá mạnh, đặc biệt khi vành tai vẫn đầy đủ.", "Không xếp tốt/xấu nếu tai mỏng hoặc vành không rõ; cần đọc toàn bộ hình tai.", ["SXQB", "RLDTF"], ["tai", "hình tai"]),
  F("tai-mong-phan", "Tai", "Tai mỏng hoặc vành lộn rõ", "Các cổ thư thường xếp tai quá mỏng, vành lộn hoặc thiếu luân–quách vào nhóm Thái Thính Quan chưa thành.", "Không suy bệnh tai, thính lực, nhân cách hay hoàn cảnh gia đình.", ["SXQB", "RLDTF"], ["tai", "cẩn trọng"]),
  F("tai-mon-rong", "Tai", "Cửa tai tương đối rộng", "Cổ thư dùng 'nhĩ môn khoan đại' như một tiêu chí hình thể được ưa chuộng của tai.", "Đây chỉ là một tiêu chí trong hệ hình thái cổ; không suy khả năng nghe hoặc nhận thức.", ["SXQB", "GJTS"], ["tai", "cửa tai"]),

  // Mũi
  F("mui-thang-day", "Mũi", "Sống mũi ngay, đầu mũi đầy", "Nguồn cổ coi mũi là Trung Nhạc; sống ngay, đầu mũi tròn đầy và hai cánh cân thường được xếp vào nhóm Thẩm Biện Quan thành.", "Xem cả Sơn căn, Niên Thượng, Thọ Thượng, Chuẩn Đầu và hai cánh mũi.", ["SXQB", "RLDTF", "GJTS"], ["mũi", "trung nhạc"]),
  F("mui-huyen-dam", "Mũi", "Dạng 'huyền đảm': sống ngay, đầu tròn", "Hình tượng 'huyền đảm' trong tướng thư mô tả mũi tương đối thẳng và đầu mũi đầy như túi mật treo, thường được xếp vào nhóm đẹp của mũi.", "Chỉ dùng tên hình cổ để tra cứu; không cần ép mọi mũi vào một mẫu động vật/đồ vật.", ["SXQB", "RLDTF"], ["mũi", "huyền đảm"]),
  F("mui-tiet-ong", "Mũi", "Dạng 'tiệt đồng': thân mũi gọn và thẳng", "Tướng thư dùng 'tiệt đồng' để chỉ mũi nhìn như ống tre cắt thẳng, nhấn mạnh đường sống mũi ngay và tỷ lệ gọn.", "Xem phối hợp đầu mũi và cánh mũi; tên dạng chỉ là phép ví von cổ.", ["SXQB", "GJTS"], ["mũi", "tiệt đồng"]),
  F("mui-khong-lo-lo", "Mũi", "Lỗ mũi không lộ quá nhiều khi nhìn chính diện", "Trong tiêu chuẩn cổ, mũi được chuộng khi hai lỗ mũi không hếch lộ mạnh, vì được xem là hình thể 'thu'.", "Không gắn đặc điểm này với tài chính thực tế; đây là biểu tượng hình thái.", ["SXQB", "RLDTF"], ["mũi", "lỗ mũi"]),
  F("mui-lo-lo", "Mũi", "Lỗ mũi lộ rõ hoặc mũi hếch", "Cổ thư thường xếp thế mũi hếch, lỗ mũi lộ rõ vào nhóm Thẩm Biện Quan chưa thành.", "Không dùng để đánh giá tiết kiệm, tiêu tiền hay năng lực kinh tế của một người.", ["SXQB", "RLDTF"], ["mũi", "cẩn trọng"]),
  F("mui-lech-mong", "Mũi", "Sống mũi lệch, đầu mũi mỏng hoặc nhọn", "Trong hệ cổ, mũi lệch, sống đứt hoặc Chuẩn Đầu quá mỏng thường được coi là làm Trung Nhạc mất cân.", "Xem nguyên nhân cấu trúc tự nhiên, chấn thương hoặc góc nhìn; không suy đạo đức hay biến cố.", ["SXQB", "RLDTF", "GJTS"], ["mũi", "bất cân xứng"]),

  // Gò má & Lục phủ
  F("go-ma-day-can", "Gò má & Lục phủ", "Hai gò má đầy vừa và cân", "Cổ thư xem hai gò má như Đông Nhạc và Tây Nhạc. Độ đầy vừa, cân hai bên và không lấn át mắt/mũi thường được coi là thế hài hòa.", "Đọc với mũi trung tâm và cằm; gò má cao tự nhiên không đồng nghĩa tốt hay xấu.", ["SXQB", "RLDTF", "BINGJIAN"], ["gò má", "ngũ nhạc"]),
  F("go-ma-lo-xuong", "Gò má & Lục phủ", "Gò má quá lộ xương", "Các tướng thư thường không chuộng gò má lộ xương rõ mà thiếu phần thịt đệm, vì xem là thế 'cô lộ'.", "Không suy tính cách cứng rắn, hung dữ hoặc quan hệ xã hội.", ["SXQB", "GJTS"], ["gò má", "cẩn trọng"]),
  F("go-ma-lep", "Gò má & Lục phủ", "Gò má lõm hoặc lép rõ", "Trong hệ Ngũ Nhạc, gò má quá lõm làm hai Nhạc bên không nâng đỡ Trung Nhạc, nên thường được xếp vào nhóm thiếu cân bằng.", "Xem cùng mũi và độ rộng khuôn mặt; không tự động xếp cát/hung từ một tỷ lệ.", ["SXQB", "RLDTF"], ["gò má", "ngũ nhạc"]),
  F("luc-phu-day", "Gò má & Lục phủ", "Lục Phủ tương đối đầy", "Lục Phủ 'sung thực' là cách cổ thư mô tả các vùng xương hai bên trán, gò má và hàm có độ nối liền, ít chỗ khuyết.", "Quan sát hai bên cùng lúc và ưu tiên tính liên tục của đường xương.", ["SXQB", "GJTS"], ["lục phủ", "xương mặt"]),
  F("luc-phu-khuyet", "Gò má & Lục phủ", "Một hoặc nhiều vùng Lục Phủ khuyết rõ", "Cổ thư cho rằng Lục Phủ có chỗ lõm/khuyết lớn thì bố cục khuôn mặt kém đồng đều.", "Không diễn giải thành nghèo khó hay thất bại; chỉ ghi nhận theo hệ thẩm mỹ cổ.", ["SXQB", "GJTS"], ["lục phủ", "cẩn trọng"]),
  F("ngu-nhac-can", "Gò má & Lục phủ", "Ngũ Nhạc tương đối cân và 'hướng' về trung tâm", "Các sách cổ chuộng thế năm vùng trán–hai gò má–mũi–cằm có tỷ lệ hỗ trợ nhau, thường gọi là 'Ngũ Nhạc triều'.", "Đây là tiêu chí tổng hợp; không dùng riêng độ cao mũi hoặc gò má.", ["SXQB", "RLDTF", "HYTRUONG"], ["ngũ nhạc", "tổng thể"]),

  // Nhân trung
  F("nhan-trung-sau-dai", "Nhân trung", "Nhân trung rõ, tương đối sâu và dài", "Các chương Nhân Trung trong tướng thư thường chuộng rãnh nhân trung rõ, có chiều dài và đường nét ổn định.", "Chỉ đọc như cấu trúc Hạ Đình. Không dùng để suy khả năng sinh sản, tuổi thọ hoặc sức khỏe.", ["SXQB", "GJTS"], ["nhân trung", "hạ đình"]),
  F("nhan-trung-ngan-nong", "Nhân trung", "Nhân trung ngắn hoặc nông", "Trong cổ thư, nhân trung quá nông/ngắn thường bị xếp vào nhóm bộ vị chưa đầy đủ.", "Không lặp các phán đoán cổ về con cái hoặc tuổi thọ; chỉ ghi nghĩa hình thái.", ["SXQB", "GJTS"], ["nhân trung", "cẩn trọng"]),
  F("nhan-trung-thang", "Nhân trung", "Nhân trung thẳng và cân", "Cách mô tả cổ thường chuộng rãnh nhân trung đi thẳng, hai bờ rõ và nằm cân giữa mũi–miệng.", "Xét cùng độ rộng miệng và cằm; không tách rời Hạ Đình.", ["SXQB", "HYTRUONG"], ["nhân trung", "cân xứng"]),
  F("nhan-trung-lech", "Nhân trung", "Nhân trung lệch rõ", "Một số tướng thư ghi nhân trung lệch hoặc đường rãnh bất thường vào nhóm cần xét thận trọng của Hạ Đình.", "Không suy sự kiện gia đình, sinh sản hoặc quan hệ; chỉ ghi cấu trúc.", ["SXQB", "GJTS"], ["nhân trung", "bất cân xứng"]),
  F("nhan-trung-tren-hep-duoi-rong", "Nhân trung", "Trên tương đối hẹp, dưới mở vừa", "Trong các hệ tướng pháp Việt ngữ và cổ thư, nhân trung có độ mở tự nhiên xuống phía môi thường được coi là hình thái dễ nhìn, có 'khí' hơn dạng hoàn toàn phẳng.", "Chỉ xem tỷ lệ và đường bờ, không áp một mẫu cứng cho mọi khuôn mặt.", ["HYTRUONG", "TVH", "SXQB"], ["nhân trung", "tỷ lệ"]),
  F("nhan-trung-van-ngang", "Nhân trung", "Có nếp/đường ngang rõ qua Nhân trung", "Cổ thư có nhiều câu quyết về đường ngang Nhân Trung nhưng diễn giải rất mạnh và không nhất quán. Bản tra cứu chỉ ghi đây là dấu hiệu 'phá thế' trong ngôn ngữ hình thái cổ.", "Không suy tai nạn, sinh sản hay tuổi thọ từ nếp da.", ["SXQB", "GJTS"], ["nhân trung", "dị bản"]),

  // Miệng & Môi
  F("mieng-vuong-can", "Miệng & Môi", "Miệng cân, đường môi rõ", "Tướng thư thường chuộng miệng ngay, hai bên cân, đường viền rõ và tỷ lệ phù hợp khuôn mặt; đây là tiêu chí chính của Xuất Nạp Quan.", "Đọc hình dáng khi miệng ở trạng thái tự nhiên, không khi cười hay mím.", ["SXQB", "RLDTF"], ["miệng", "ngũ quan"]),
  F("mieng-rong-vua", "Miệng & Môi", "Miệng rộng vừa so với khuôn mặt", "Một số cổ thư coi miệng có độ rộng đủ và hình thể vững là thế thuận, đặc biệt khi môi không quá mỏng và khóe cân.", "Không suy khả năng ăn nói, địa vị hay mức sống từ kích thước miệng.", ["SXQB", "BINGJIAN"], ["miệng", "tỷ lệ"]),
  F("moi-day-can", "Miệng & Môi", "Hai môi có độ đầy tương xứng", "Trong tướng pháp cổ, môi được xem như thành quách của miệng; độ đầy vừa và trên–dưới tương xứng thường được coi là hình thái có nền.", "Không suy tình cảm, ham muốn hay đạo đức từ độ dày môi.", ["SXQB", "GJTS"], ["môi", "cân xứng"]),
  F("moi-mong-lech", "Miệng & Môi", "Môi quá mỏng hoặc lệch", "Cổ thư thường xếp môi quá mỏng, hai bên lệch hoặc khóe không cân vào nhóm Xuất Nạp Quan chưa chỉnh.", "Chỉ ghi cấu trúc; không suy độ đáng tin, lòng tốt hoặc khả năng giao tiếp.", ["SXQB", "GJTS"], ["môi", "cẩn trọng"]),
  F("khoe-mieng-can", "Miệng & Môi", "Hai khóe miệng cân nhau", "Thế khóe cân và miệng khép tự nhiên được các tướng thư xem là nền ổn của hình miệng.", "Quan sát lúc nghỉ; biểu cảm cười/buồn có thể làm thay đổi khóe miệng tạm thời.", ["SXQB", "RLDTF"], ["miệng", "khóe miệng"]),
  F("mieng-khep-lo-rang", "Miệng & Môi", "Miệng khép tự nhiên nhưng răng lộ nhiều", "Một số cổ thư coi trạng thái miệng nghỉ mà răng lộ nhiều là hình thể không kín của Xuất Nạp Quan.", "Không suy bệnh, thọ yểu hay tính cách; cấu trúc răng–hàm có nhiều biến thiên tự nhiên.", ["SXQB", "GJTS"], ["miệng", "răng"]),

  // Răng & Lưỡi
  F("rang-deu-day", "Răng & Lưỡi", "Răng tương đối đều và sát", "Luận răng cổ điển ưa răng tương đối thẳng, dày và xếp đều, coi đây là phần hoàn chỉnh của vùng miệng.", "Chỉ ghi thẩm mỹ truyền thống; không dùng để suy sức khỏe, tuổi thọ, trí tuệ hoặc phẩm chất.", ["SXQB", "GJTS"], ["răng", "đều"]),
  F("rang-thua", "Răng & Lưỡi", "Khe răng thưa rõ", "Cổ thư thường xếp răng quá thưa hoặc xếp không kín vào nhóm hình răng chưa chỉnh.", "Không suy mức độ giàu nghèo hay khả năng giữ tiền như các câu quyết dân gian.", ["SXQB", "GJTS"], ["răng", "cẩn trọng"]),
  F("rang-khong-deu", "Răng & Lưỡi", "Răng mọc không đều rõ", "Tướng thư có nhiều phán đoán nặng về răng lệch, nhưng bản tra cứu chỉ giữ lớp mô tả: đây là dạng hình răng không đạt chuẩn 'tề mật' của cổ pháp.", "Không suy tính cách, đạo đức hay vận mệnh.", ["SXQB"], ["răng", "dị bản"]),
  F("rang-sang-tu-nhien", "Răng & Lưỡi", "Màu răng sáng tự nhiên", "Cổ thư thường dùng 'bạch', 'như ngọc' như một tiêu chí thẩm mỹ của răng.", "Màu răng phụ thuộc nhiều yếu tố sinh học và chăm sóc; không dùng làm dấu hiệu tướng số độc lập.", ["SXQB", "GJTS"], ["răng", "màu sắc"]),
  F("luoi-can-mieng", "Răng & Lưỡi", "Lưỡi có tỷ lệ phù hợp khoang miệng", "Một số mục cổ về lưỡi chú trọng sự tương xứng giữa lưỡi và miệng, hơn là chỉ xét kích thước tuyệt đối.", "Không đánh giá chức năng nói, nuốt hoặc sức khỏe từ kích thước lưỡi.", ["SXQB", "GJTS"], ["lưỡi", "tỷ lệ"]),
  F("luoi-qua-lon", "Răng & Lưỡi", "Lưỡi có vẻ lớn so với miệng", "Cổ thư thường coi lưỡi quá lớn so với miệng là một dạng mất cân xứng của vùng Xuất Nạp.", "Chỉ ghi nghĩa hình thái cổ; nếu có vấn đề chức năng thì thuộc phạm vi y khoa, không phải tướng học.", ["SXQB"], ["lưỡi", "cẩn trọng"]),

  // Cằm & Địa các
  F("cam-day-tron", "Cằm & Địa các", "Cằm đầy, tròn hoặc vuông vừa", "Địa Các là phần cuối Hạ Đình. Cổ thư ưa thế có nền, đầy và không quá nhọn; thường dùng nó làm biểu tượng cho khả năng 'thu kết' của khuôn mặt.", "Xét cả hàm dưới và Hạ Đình; không suy hậu vận thực tế chỉ từ cằm.", ["SXQB", "RLDTF", "HYTRUONG"], ["cằm", "địa các"]),
  F("cam-nhon", "Cằm & Địa các", "Cằm thon hoặc nhọn rõ", "Trong hệ Ngũ Nhạc, Địa Các quá nhọn được coi là Bắc Nhạc chưa đầy, nhất là khi Hạ Đình cũng hẹp.", "Không suy nghèo khó, cô độc hay hôn nhân; chỉ ghi nghĩa hình thái.", ["SXQB", "GJTS"], ["cằm", "cẩn trọng"]),
  F("ham-rong", "Cằm & Địa các", "Hàm dưới tương đối rộng và có nền", "Một số tướng thư chuộng vùng hàm–cằm có độ rộng vừa, tạo cảm giác Hạ Đình đứng vững.", "Rộng phải cân với phần giữa khuôn mặt; quá rộng hoặc quá hẹp đều cần xem tương quan.", ["SXQB", "GJTS"], ["hàm", "hạ đình"]),
  F("cam-lech", "Cằm & Địa các", "Cằm hoặc hàm dưới lệch rõ", "Cổ thư thường coi Địa Các lệch là thế Ngũ Nhạc không cân.", "Kiểm tra góc chụp/tư thế đầu nếu chỉ nhìn ảnh; bản app không dùng ảnh tự động nên người đọc phải tự đối chiếu thận trọng.", ["SXQB", "RLDTF"], ["cằm", "bất cân xứng"]),
  F("ha-dinh-day", "Cằm & Địa các", "Toàn Hạ Đình đầy và liền", "Khi Nhân trung, miệng, hàm và cằm tạo thành phần dưới cân đối, cổ thư thường coi Hạ Đình có lực hơn so với chỉ cằm đầy riêng lẻ.", "Ưu tiên đọc toàn Hạ Đình, không tách cằm khỏi miệng và nhân trung.", ["SXQB", "HYTRUONG"], ["hạ đình", "tổng thể"]),
  F("ha-dinh-mong", "Cằm & Địa các", "Hạ Đình mỏng hoặc thu hẹp mạnh", "Trong Tam Đình cổ, phần dưới quá hẹp/nhọn được xem là thiếu độ 'thu' của khuôn mặt.", "Không suy hậu vận hay tài sản. Chỉ ghi nhận như một dạng tỷ lệ.", ["SXQB", "RLDTF"], ["hạ đình", "cẩn trọng"]),

  // Tóc & Râu
  F("toc-min-muot", "Tóc & Râu", "Tóc tương đối mảnh, gọn và có độ bóng tự nhiên", "Luận tóc cổ điển thường chuộng tóc có trật tự, không quá khô và không quá rối; đây là tiêu chí thẩm mỹ truyền thống.", "Không dùng tình trạng tóc để suy bệnh, nội tiết, tuổi thọ hay phẩm chất.", ["SXQB", "BINGJIAN"], ["tóc", "hình thái"]),
  F("toc-tho-kho", "Tóc & Râu", "Tóc thô, khô hoặc dựng nhiều", "Cổ thư xếp tóc quá thô/khô vào nhóm 'không nhuận', nhưng các câu quyết đi kèm thường mang định kiến mạnh.", "Chỉ giữ lớp mô tả hình thái; không suy tính cách hay đạo đức.", ["SXQB"], ["tóc", "cẩn trọng"]),
  F("toc-roi", "Tóc & Râu", "Tóc mọc/đổ rất rối ở đường viền tự nhiên", "Một số tướng thư dùng tóc lộn xộn ở trán–thái dương như yếu tố làm các bộ vị Thượng Đình khó rõ.", "Không tính kiểu tóc tạo kiểu, tóc ướt hoặc tóc bị gió làm rối.", ["SXQB", "GJTS"], ["tóc", "đường viền"]),
  F("toc-chan-cao", "Tóc & Râu", "Đường tóc cao nhưng gọn", "Trong cổ thư, phát tế cao và gọn đôi khi được xem là giúp trán mở; tuy nhiên không phải lúc nào cao cũng tốt nếu trán mất tỷ lệ.", "Luôn so với chiều cao trán và hình đầu; không xem rụng tóc là tướng.", ["SXQB"], ["tóc", "trán"]),
  F("rau-hop-may", "Tóc & Râu", "Râu hài hòa với mày và khuôn mặt", "Băng Giám đặc biệt nhấn mạnh râu phải 'hợp' với mày và thần cốt, không phải càng nhiều càng tốt.", "Chỉ áp dụng cho râu tự nhiên; cạo/tỉa làm thay đổi hình thái nên không dùng để kết luận.", ["BINGJIAN", "SXQB"], ["râu", "tương quan"]),
  F("rau-roi-kho", "Tóc & Râu", "Râu quá rối, khô hoặc không ăn nhập khuôn mặt", "Trong tướng thư, râu quá rối hoặc khô thường được xếp vào nhóm hình thái kém chỉnh, nhất là khi mày cũng rối.", "Không suy hành vi, nghề nghiệp hay bản chất con người từ râu.", ["BINGJIAN", "SXQB"], ["râu", "cẩn trọng"]),

  // Thần khí & Khí sắc
  F("than-on-dinh", "Thần khí & Khí sắc", "Thần thái ổn định", "'Thần định' là khái niệm trung tâm của nhiều tướng thư: ánh nhìn, biểu cảm và tư thế có sự tập trung, không tán loạn. Đây là mô tả quan sát chứ không phải chẩn đoán tâm lý.", "Quan sát qua thời gian và trong trạng thái bình thường; một khoảnh khắc mệt mỏi không đại diện toàn bộ.", ["SXQB", "BINGJIAN", "RLDTF"], ["thần", "tổng thể"]),
  F("than-tan", "Thần khí & Khí sắc", "Thần thái tán, khó ổn định", "Trong đối chiếu cổ, trạng thái tán loạn được đặt đối lập với 'thần định'. Băng Giám khuyên xem cả lúc động và tĩnh để tránh nhầm.", "Không suy lo âu, ADHD, bệnh tâm thần hay nói dối. Chỉ ghi nhận trạng thái quan sát.", ["BINGJIAN", "SXQB"], ["thần", "cẩn trọng"]),
  F("khi-sac-minh-nhuan", "Thần khí & Khí sắc", "Khí sắc sáng, đồng đều trong điều kiện bình thường", "Cổ thư dùng từ 'minh nhuận' để mô tả sắc diện có vẻ tươi và đều. Trong hệ tướng học, đây được coi là trạng thái thuận.", "Ánh sáng, thời tiết, trang điểm và sức khỏe ảnh hưởng mạnh màu da; không dùng để dự báo sự kiện hay chẩn đoán bệnh.", ["SXQB", "RLDTF", "BINGJIAN"], ["khí sắc", "minh nhuận"]),
  F("khi-sac-am", "Thần khí & Khí sắc", "Sắc diện tối hoặc không đều tạm thời", "Tướng thư cổ có hệ luận màu sắc rất chi tiết, nhưng độ tin cậy thực tế thấp và dễ lẫn với yếu tố sinh học/môi trường. Bản này chỉ ghi đây là trạng thái mà cổ thư xem là cần thận trọng.", "Không suy bệnh, tang, tai nạn, tử vong hoặc thời điểm sự kiện từ màu da.", ["SXQB", "RLDTF", "BINGJIAN"], ["khí sắc", "cẩn trọng"]),
  F("than-hinh-hop", "Thần khí & Khí sắc", "Hình thể và thần thái tương hợp", "Các cổ thư thường đánh giá cao khi cấu trúc khuôn mặt và thần thái 'ăn nhập' với nhau; ví dụ khuôn mặt mạnh nhưng thần không quá tán, hoặc mặt thanh nhưng thần không suy.", "Đây là tiêu chí tổng hợp, không có thang đo tuyệt đối.", ["SXQB", "BINGJIAN"], ["hình thần", "tổng hợp"]),
  F("than-hinh-nghich", "Thần khí & Khí sắc", "Hình và thần cho tín hiệu trái nhau", "Khi hình thể và thần thái mâu thuẫn, cổ pháp không khuyến khích chốt nhanh. Một số sách gọi đây là trường hợp cần 'tham tường' thêm.", "Đánh dấu 'chưa đủ căn cứ'; không cố ép về cát hoặc hung.", ["SXQB", "BINGJIAN", "SONCHU"], ["hình thần", "dị bản"]),

  // Thanh âm & Cử chỉ
  F("giong-tron-ro", "Thanh âm & Cử chỉ", "Giọng rõ, tròn và có lực vừa", "Luận thanh âm cổ thường chuộng tiếng rõ, có độ vang tự nhiên, nhịp không quá gấp và câu nói có đầu cuối.", "Không dùng chất giọng để suy địa vị, đạo đức, giới tính hay sức khỏe.", ["SXQB", "BINGJIAN"], ["thanh âm", "giọng nói"]),
  F("giong-gap-kho", "Thanh âm & Cử chỉ", "Giọng quá gấp, khô hoặc đứt quãng", "Trong tướng thư, giọng quá gấp/khô/không đều được xếp vào nhóm 'khí âm chưa hòa'.", "Giọng thay đổi theo mệt, bệnh, cảm xúc và môi trường; không dùng làm kết luận cố định.", ["SXQB", "BINGJIAN"], ["thanh âm", "cẩn trọng"]),
  F("than-lon-giong-nho", "Thanh âm & Cử chỉ", "Thân hình lớn nhưng giọng rất nhỏ", "Một số câu quyết cổ xem sự chênh mạnh giữa vóc dáng và âm lượng là dấu hiệu hình–thanh không tương xứng.", "Chỉ giữ như nguyên tắc 'tương xứng'; không suy vận hạn hay năng lực.", ["SXQB"], ["thanh âm", "tương xứng"]),
  F("noi-co-nhip", "Thanh âm & Cử chỉ", "Nói có nhịp, không quá vội", "Cổ thư về thanh âm và Băng Giám đều chú ý cách phát lời có tiết độ hơn là chỉ âm sắc. Nhịp ổn định được xếp vào nhóm 'khí hòa'.", "Không dùng tốc độ nói để phán tâm lý hoặc tính cách; xem nó như một quan sát tình huống.", ["SXQB", "BINGJIAN"], ["thanh âm", "nhịp"]),
  F("tu-the-on", "Thanh âm & Cử chỉ", "Ngồi, đứng tương đối ổn định", "Các chương về thần, tình thái và uy nghi thường coi tư thế ổn, không quá chao đảo hoặc hấp tấp là dấu hiệu hình–thần có độ định.", "Quan sát trong hoàn cảnh thoải mái; khuyết tật, đau đớn hoặc bệnh lý không phải đối tượng để luận tướng.", ["SXQB", "BINGJIAN"], ["cử chỉ", "tư thế"]),
  F("buoc-di-co-nhip", "Thanh âm & Cử chỉ", "Bước đi có nhịp và tương đối vững", "Tướng thư cổ dành riêng mục luận đi–đứng–ngồi–nằm, thường chuộng động tác có nhịp, không quá gấp hoặc mất kiểm soát.", "Không dùng dáng đi để suy sức khỏe, thần kinh, tính cách hoặc đạo đức. Chỉ lưu lớp quan niệm văn hóa.", ["SXQB", "BINGJIAN"], ["cử chỉ", "dáng đi"]),
];

export function getPhysiognomySource(id: string) {
  return PHYSIOGNOMY_SOURCES.find((source) => source.id === id);
}
