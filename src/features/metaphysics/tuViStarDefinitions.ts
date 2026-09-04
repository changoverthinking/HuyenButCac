export type TuViStarDefinition = {
  name: string;
  group: "Chính tinh" | "Phụ tinh" | "Sát tinh" | "Vòng Thái Tuế" | "Vòng Bác Sĩ" | "Tứ Hóa";
  keywords: string[];
  meaning: string;
  sourceIds: string[];
};

export const TU_VI_STAR_SOURCES = [
  { id: "MAIN14", title: "Tổng hợp 14 Chính Tinh", url: "https://khoahoctuvi.vn/post/14-chinh-tinh-tu-vi" },
  { id: "TAHUU", title: "Bộ sao Tả Phụ – Hữu Bật", url: "https://tuvi.vn/bo-sao-ta-phu-huu-bat-a282" },
  { id: "XUONGKHUC", title: "Văn Xương – Văn Khúc", url: "https://lasotinhhoa.vn/kien-thuc-tu-vi/van-xuong-van-khuc-trong-tu-vi" },
  { id: "KHOIVIET", title: "Thiên Khôi – Thiên Việt", url: "https://lasotinhhoa.vn/kien-thuc-tu-vi/thien-khoi-thien-viet-trong-tu-vi" },
  { id: "KINHDA", title: "Kình Dương – Đà La", url: "https://lasotinhhoa.vn/kien-thuc-tu-vi/kinh-duong-da-la-trong-tu-vi" },
  { id: "HOALINH", title: "Hỏa Tinh – Linh Tinh", url: "https://tuvi.vn/sao-hoa-tinh-linh-tinh-trong-tu-vi-a540" },
  { id: "KHONGKIEP", title: "Địa Không – Địa Kiếp", url: "https://tuvi.vn/sao-dia-khong-dia-kiep-trong-tu-vi-a524" },
  { id: "THAITUE", title: "Vòng Thái Tuế", url: "https://khoahoctuvi.vn/post/vong-thai-tue" },
  { id: "BACSI", title: "Luận về Vòng Bác Sĩ", url: "https://sonchu.vn/nghien-cuu/luan-ve-vong-bac-si" },
] as const;

export const TU_VI_STAR_DEFINITIONS: TuViStarDefinition[] = [
  { name: "Tử Vi", group: "Chính tinh", keywords: ["đế tinh", "quản trị", "chủ trì"], meaning: "Biểu tượng trung tâm và năng lực tổ chức; khi luận thường xét khả năng chủ trì, quản trị và mức độ quy tụ. Cần phối hợp cung vị, miếu hãm và các sao hội chiếu.", sourceIds: ["MAIN14"] },
  { name: "Thiên Cơ", group: "Chính tinh", keywords: ["trí mưu", "biến động", "kế hoạch"], meaning: "Chủ tư duy, mưu lược, kỹ thuật và sự biến chuyển. Khi sáng thường thiên về linh hoạt, học hỏi; khi bị sát kỵ tác động dễ thành do dự hoặc thay đổi nhiều.", sourceIds: ["MAIN14"] },
  { name: "Thái Dương", group: "Chính tinh", keywords: ["quang minh", "danh vọng", "cống hiến"], meaning: "Tượng mặt trời, thường được dùng để đọc tính công khai, tinh thần cống hiến, danh vị và khả năng soi sáng người khác. Sức biểu hiện thay đổi mạnh theo vị trí miếu hãm.", sourceIds: ["MAIN14"] },
  { name: "Vũ Khúc", group: "Chính tinh", keywords: ["tài tinh", "quyết đoán", "thực hành"], meaning: "Thường gắn với tài chính, năng lực thực thi, kỷ luật và quyết đoán. Khi luận không đồng nghĩa chắc chắn giàu; phải xem Tài Bạch, Quan Lộc, Tứ Hóa và sát/cát tinh.", sourceIds: ["MAIN14"] },
  { name: "Thiên Đồng", group: "Chính tinh", keywords: ["phúc khí", "hòa nhã", "hưởng thụ"], meaning: "Phúc tinh thiên về sự mềm mại, thích nghi, an hòa và nhu cầu hưởng thụ. Mặt trái có thể là ngại va chạm hoặc thiếu quyết liệt khi bố cục yếu.", sourceIds: ["MAIN14"] },
  { name: "Liêm Trinh", group: "Chính tinh", keywords: ["nguyên tắc", "ranh giới", "cảm xúc"], meaning: "Mang sắc thái nguyên tắc, tự trọng, ranh giới và sức hút cá nhân. Tính chất biến đổi mạnh theo sao đi cùng, nhất là Sát Phá Tham và Tứ Hóa.", sourceIds: ["MAIN14"] },
  { name: "Thiên Phủ", group: "Chính tinh", keywords: ["kho tàng", "ổn định", "quản nguồn lực"], meaning: "Tượng kho phủ, thường đọc về khả năng giữ gìn, quản lý nguồn lực và ổn định. Cần phân biệt “giữ” với “phát”: có Phủ không tự động đồng nghĩa tài lộc lớn.", sourceIds: ["MAIN14"] },
  { name: "Thái Âm", group: "Chính tinh", keywords: ["tích lũy", "nội tâm", "tinh tế"], meaning: "Tượng mặt trăng, thiên về tích lũy, chiều sâu, sự tinh tế và tài sản mang tính bền vững. Miếu hãm và thời điểm sinh thường được các trường phái xem rất trọng.", sourceIds: ["MAIN14"] },
  { name: "Tham Lang", group: "Chính tinh", keywords: ["ham học", "giao tế", "dục vọng", "đa tài"], meaning: "Chủ tính đa dạng, giao tế, ham trải nghiệm và khả năng khai thác cơ hội. Tốt xấu phụ thuộc việc ham muốn được dẫn dắt thành tài năng hay thành phân tán.", sourceIds: ["MAIN14"] },
  { name: "Cự Môn", group: "Chính tinh", keywords: ["ngôn luận", "phản biện", "thị phi"], meaning: "Chủ lời nói, lý luận, tranh biện và vấn đề cần làm rõ. Có thể thành năng lực diễn đạt/chuyên môn, cũng có thể thành khẩu thiệt nếu hội nhiều sát kỵ.", sourceIds: ["MAIN14"] },
  { name: "Thiên Tướng", group: "Chính tinh", keywords: ["phò tá", "bảo hộ", "ngoại giao"], meaning: "Tượng người hỗ trợ và giữ phép, thường đọc về phối hợp, dịch vụ, ngoại giao và bảo vệ trật tự. Sức mạnh tùy rất nhiều vào chính tinh và cát sát đồng cung.", sourceIds: ["MAIN14"] },
  { name: "Thiên Lương", group: "Chính tinh", keywords: ["che chở", "nguyên tắc", "hóa giải"], meaning: "Ấm tinh mang sắc thái bảo hộ, đạo lý, kinh nghiệm và khả năng hóa giải. Không nên hiểu máy móc là “luôn tốt”; ở cung và tổ hợp khác nhau sẽ phát khác nhau.", sourceIds: ["MAIN14"] },
  { name: "Thất Sát", group: "Chính tinh", keywords: ["quyết liệt", "áp lực", "khai phá"], meaning: "Tướng tinh chủ quyết đoán, chịu áp lực và hành động mạnh. Khi được chế hóa có thể thành bản lĩnh khai phá; khi mất cân bằng dễ cực đoan hoặc xung đột.", sourceIds: ["MAIN14"] },
  { name: "Phá Quân", group: "Chính tinh", keywords: ["phá cũ lập mới", "biến cải", "hao tán"], meaning: "Chủ cải cách, phá khuôn và tái cấu trúc. Điểm mạnh là dám đổi; rủi ro là hao tổn hoặc đứt gãy nếu thay đổi thiếu chuẩn bị.", sourceIds: ["MAIN14"] },
  { name: "Tả Phụ", group: "Phụ tinh", keywords: ["phò trợ", "tổ chức", "cộng sự"], meaning: "Trợ tinh biểu tượng cho sự hỗ trợ, cộng sự và năng lực phối hợp. Thường tăng khả năng được giúp hoặc làm việc theo hệ thống khi hội đúng chính tinh.", sourceIds: ["TAHUU"] },
  { name: "Hữu Bật", group: "Phụ tinh", keywords: ["phò trợ", "linh hoạt", "cộng sự"], meaning: "Cặp với Tả Phụ, chủ trợ lực và người hỗ trợ. Khi đi cùng chính tinh mạnh thường làm tăng tính quy tụ; không tự tạo thành cát cách nếu bố cục chung yếu.", sourceIds: ["TAHUU"] },
  { name: "Văn Xương", group: "Phụ tinh", keywords: ["học thuật", "văn chương", "biểu đạt"], meaning: "Văn tinh thiên về học tập, văn bản, tư duy có cấu trúc và khả năng diễn đạt. Gặp Hóa Khoa thường được chú ý về học danh; gặp Kỵ cần xem lỗi giấy tờ/ngôn từ theo truyền thống.", sourceIds: ["XUONGKHUC"] },
  { name: "Văn Khúc", group: "Phụ tinh", keywords: ["văn nghệ", "thẩm mỹ", "diễn đạt"], meaning: "Văn tinh thiên về cảm thụ, ngôn ngữ, nghệ thuật và cách biểu hiện mềm. Cùng Văn Xương tạo bộ Xương Khúc, nhưng hiệu lực vẫn tùy cung và tổ hợp.", sourceIds: ["XUONGKHUC"] },
  { name: "Thiên Khôi", group: "Phụ tinh", keywords: ["quý nhân", "đầu mối", "khoa giáp"], meaning: "Quý tinh chủ cơ hội nổi bật, người dẫn đường, học hành và danh dự theo quan niệm truyền thống. Không nên luận thành “chắc chắn có quý nhân”.", sourceIds: ["KHOIVIET"] },
  { name: "Thiên Việt", group: "Phụ tinh", keywords: ["quý nhân", "cơ hội phát sinh", "nâng đỡ"], meaning: "Cặp với Thiên Khôi, nhấn mạnh cơ hội, trợ lực và sự kiện nổi bật. Cần đọc cùng Khôi và toàn cung để tránh phán quá đẹp.", sourceIds: ["KHOIVIET"] },
  { name: "Lộc Tồn", group: "Phụ tinh", keywords: ["tích lộc", "tài nguyên", "giữ của"], meaning: "Lộc tinh mang nghĩa tích lũy và nguồn lực ổn định. Đồng thời là điểm khởi vòng Bác Sĩ và bị Kình–Đà kẹp hai bên, nên lộc thường đi kèm trách nhiệm hoặc lực cản.", sourceIds: ["BACSI", "KINHDA"] },
  { name: "Kình Dương", group: "Sát tinh", keywords: ["xung kích", "cạnh tranh", "trực diện"], meaning: "Sát tinh thiên về lực đẩy trực diện, va chạm, quyết liệt và cạnh tranh. Không phải cứ có Kình là tai họa; nên đọc như nơi cần kiểm soát cách hành động và xung lực.", sourceIds: ["KINHDA"] },
  { name: "Đà La", group: "Sát tinh", keywords: ["trì kéo", "vướng mắc", "dai dẳng"], meaning: "Sát tinh thiên về lực kéo, chậm, vướng và áp lực âm ỉ. Khi phối hợp tốt có thể biểu hiện thành độ bền; khi xấu dễ thành trì trệ hoặc mắc kẹt.", sourceIds: ["KINHDA"] },
  { name: "Hỏa Tinh", group: "Sát tinh", keywords: ["bộc phát", "nóng", "tốc độ"], meaning: "Sát tinh mang tính bùng phát và phản ứng nhanh. Trong cách cục phù hợp có thể tăng quyết đoán; trong bố cục căng dễ làm sự việc phát nhanh, khó kiểm soát.", sourceIds: ["HOALINH"] },
  { name: "Linh Tinh", group: "Sát tinh", keywords: ["kích phát", "bất ngờ", "sắc bén"], meaning: "Cặp với Hỏa Tinh, thường được đọc như lực kích phát, bất ngờ và sắc bén. Ý nghĩa phải xét theo chính tinh, cung và trường phái an Hỏa–Linh đã chọn.", sourceIds: ["HOALINH"] },
  { name: "Địa Không", group: "Sát tinh", keywords: ["rỗng", "đứt đoạn", "phi truyền thống"], meaning: "Không tinh chủ tính rỗng, hụt, phá khuôn hoặc biến đổi bất ngờ. Có thể làm giảm tính ổn định nhưng đôi khi hỗ trợ tư duy khác thường khi hội cách phù hợp.", sourceIds: ["KHONGKIEP"] },
  { name: "Địa Kiếp", group: "Sát tinh", keywords: ["hao tổn", "đột biến", "cực đoan"], meaning: "Kiếp tinh thường tượng trưng cho biến động mạnh, hao tổn và sự việc ngoài dự kiến. Không nên dùng riêng sao này để kết luận tai họa.", sourceIds: ["KHONGKIEP"] },
  { name: "Thái Tuế", group: "Vòng Thái Tuế", keywords: ["danh phận", "tranh luận", "hiện diện xã hội"], meaning: "Sao đầu vòng Thái Tuế, thường dùng để đọc tính hiện diện, chính danh, lời nói và những việc công khai dễ tạo tranh luận.", sourceIds: ["THAITUE"] },
  { name: "Thiếu Dương", group: "Vòng Thái Tuế", keywords: ["sáng", "linh hoạt", "cứu giải"], meaning: "Mang sắc thái dương quang, nhanh trí và khả năng giảm nhẹ khó khăn khi được cát tinh hỗ trợ.", sourceIds: ["THAITUE"] },
  { name: "Tang Môn", group: "Vòng Thái Tuế", keywords: ["ưu tư", "việc buồn", "thâm trầm"], meaning: "Theo truyền thống gắn với ưu tư, chuyện buồn và trạng thái nặng lòng; mặt tích cực là chiều sâu và nghị lực khi được phối hợp tốt.", sourceIds: ["THAITUE"] },
  { name: "Thiếu Âm", group: "Vòng Thái Tuế", keywords: ["nhu hòa", "kín đáo", "trợ lực"], meaning: "Thiên về sự mềm, kín đáo, quan sát và hỗ trợ âm thầm; cần xét cùng nhóm sao hội chiếu.", sourceIds: ["THAITUE"] },
  { name: "Quan Phù", group: "Vòng Thái Tuế", keywords: ["quy tắc", "tranh chấp", "giấy tờ"], meaning: "Gắn với quy định, thủ tục, tranh chấp và trách nhiệm pháp lý theo ngôn ngữ Tử Vi truyền thống.", sourceIds: ["THAITUE"] },
  { name: "Tử Phù", group: "Vòng Thái Tuế", keywords: ["ràng buộc", "phiền nhiễu", "trách nhiệm"], meaning: "Chủ các việc phải xử lý, ràng buộc hoặc phiền nhiễu; không nên đồng nhất với kết quả xấu chắc chắn.", sourceIds: ["THAITUE"] },
  { name: "Tuế Phá", group: "Vòng Thái Tuế", keywords: ["đối nghịch", "phá thế", "bất đồng"], meaning: "Đứng đối Thái Tuế, thường biểu thị bất đồng, phá thế cũ hoặc sức ép từ phía đối diện.", sourceIds: ["THAITUE"] },
  { name: "Long Đức", group: "Vòng Thái Tuế", keywords: ["đức độ", "hòa giải", "giảm xung"], meaning: "Cát tinh trong vòng Thái Tuế, thiên về hòa giải, mềm hóa và nhận trợ lực nhờ cách ứng xử.", sourceIds: ["THAITUE"] },
  { name: "Bạch Hổ", group: "Vòng Thái Tuế", keywords: ["mạnh", "hình sát", "áp lực"], meaning: "Mang sắc thái mạnh, cứng và áp lực. Cổ thư thường gắn hình thương, nhưng ứng dụng hiện đại nên đọc thận trọng, không dự báo tai nạn từ một sao.", sourceIds: ["THAITUE"] },
  { name: "Phúc Đức", group: "Vòng Thái Tuế", keywords: ["phúc thiện", "điều hòa", "cứu giải"], meaning: "Cát tinh thiên về điều hòa và phúc thiện, thường được xem có khả năng giảm bớt tính căng của nhóm sát/bại tinh.", sourceIds: ["THAITUE"] },
  { name: "Điếu Khách", group: "Vòng Thái Tuế", keywords: ["giao tế", "lời nói", "cảm xúc ngoại cảnh"], meaning: "Chủ giao tế, lời nói và những sự việc khiến tâm trí bị kéo ra ngoài; trong hạn có thể gợi chuyện đi lại, xã giao hoặc buồn vui tùy tổ hợp.", sourceIds: ["THAITUE"] },
  { name: "Trực Phù", group: "Vòng Thái Tuế", keywords: ["trực diện", "cố chấp", "thủ thế"], meaning: "Mang sắc thái trực, giữ quan điểm và phản ứng thẳng. Tốt xấu phụ thuộc khả năng điều tiết và sao phối hợp.", sourceIds: ["THAITUE"] },
  { name: "Bác Sĩ", group: "Vòng Bác Sĩ", keywords: ["học hỏi", "tinh tế", "phụ trợ"], meaning: "Sao đầu vòng Bác Sĩ và đồng cung Lộc Tồn. Truyền thống liên hệ học hỏi, sự tinh tế; hiệu lực rõ hơn khi hội Xương Khúc, Khôi Việt, Tả Hữu.", sourceIds: ["BACSI"] },
  { name: "Lực Sĩ", group: "Vòng Bác Sĩ", keywords: ["sức lực", "quyền", "gánh vác"], meaning: "Chủ sức mạnh và khả năng gánh việc; bản thân không tự tạo quyền lực mà thường làm mạnh thêm sao quyền/hành động đi cùng.", sourceIds: ["BACSI"] },
  { name: "Thanh Long", group: "Vòng Bác Sĩ", keywords: ["hỷ khí", "thuận lợi", "tin vui"], meaning: "Cát tinh mang sắc thái hanh thông, hỷ khí và tin thuận; cần phối hợp với toàn cung để xác định lĩnh vực biểu hiện.", sourceIds: ["BACSI"] },
  { name: "Tiểu Hao", group: "Vòng Bác Sĩ", keywords: ["chi nhỏ", "phân tán", "lưu chuyển"], meaning: "Chủ hao tán nhỏ, chi tiêu hoặc nguồn lực phân tán; đôi khi chỉ phản ánh sự lưu chuyển cần thiết chứ không hẳn mất mát.", sourceIds: ["BACSI"] },
  { name: "Tướng Quân", group: "Vòng Bác Sĩ", keywords: ["uy thế", "chỉ huy", "chủ động"], meaning: "Mang sắc thái chủ động, chỉ huy và muốn nắm thế; cần cát tinh để thành năng lực lãnh đạo ổn định.", sourceIds: ["BACSI"] },
  { name: "Tấu Thư", group: "Vòng Bác Sĩ", keywords: ["văn thư", "báo tin", "trình bày"], meaning: "Thiên về văn bản, tin tức, trình bày và thủ tục; thường được dùng khi luận học hành, giấy tờ hoặc truyền đạt.", sourceIds: ["BACSI"] },
  { name: "Phi Liêm", group: "Vòng Bác Sĩ", keywords: ["nhanh", "di chuyển", "đột xuất"], meaning: "Mang tính nhanh, động và biến chuyển; trong hạn thường nhấn mạnh tốc độ hoặc việc đến bất ngờ.", sourceIds: ["BACSI"] },
  { name: "Hỷ Thần", group: "Vòng Bác Sĩ", keywords: ["niềm vui", "hỷ sự", "hòa khí"], meaning: "Cát tinh gắn với niềm vui, hỷ khí và sự thuận hòa; không nên hiểu là bảo đảm có hỷ sự cụ thể.", sourceIds: ["BACSI"] },
  { name: "Bệnh Phù", group: "Vòng Bác Sĩ", keywords: ["mệt mỏi", "trì trệ", "chăm sóc"], meaning: "Theo truyền thống liên hệ trạng thái suy nhược hoặc việc phải chăm lo. Không dùng sao này để chẩn đoán y khoa.", sourceIds: ["BACSI"] },
  { name: "Đại Hao", group: "Vòng Bác Sĩ", keywords: ["chi lớn", "hao tán", "đổi nguồn lực"], meaning: "Chủ biến động hoặc hao tán lớn hơn Tiểu Hao. Có thể là chi phí, đầu tư, thay đổi tài nguyên; phải xét bối cảnh cung.", sourceIds: ["BACSI"] },
  { name: "Phục Binh", group: "Vòng Bác Sĩ", keywords: ["ẩn", "nghi kỵ", "cạnh tranh hậu trường"], meaning: "Mang sắc thái kín, cạnh tranh hoặc việc chưa lộ rõ. Nên đọc như tín hiệu cần minh bạch thông tin thay vì kết luận có người hại.", sourceIds: ["BACSI"] },
  { name: "Quan Phủ", group: "Vòng Bác Sĩ", keywords: ["thủ tục", "trách nhiệm", "quy chế"], meaning: "Chủ quy chế, thủ tục và việc phải giải quyết theo khuôn phép; tên gần Quan Phù nhưng thuộc vòng Bác Sĩ.", sourceIds: ["BACSI"] },
  { name: "Hóa Lộc", group: "Tứ Hóa", keywords: ["tăng ích", "tài nguyên", "thuận lợi"], meaning: "Khi một sao Hóa Lộc, tính chất của sao đó được khuếch đại theo hướng sinh lợi, thu hút hoặc dễ tiếp nhận nguồn lực; không đồng nghĩa chắc chắn giàu.", sourceIds: ["MAIN14"] },
  { name: "Hóa Quyền", group: "Tứ Hóa", keywords: ["quyền chủ động", "sức đẩy", "trách nhiệm"], meaning: "Tăng tính chủ động, quyền hành hoặc áp lực phải gánh trách nhiệm của sao được hóa.", sourceIds: ["MAIN14"] },
  { name: "Hóa Khoa", group: "Tứ Hóa", keywords: ["danh học", "chuẩn hóa", "giải ách"], meaning: "Tăng tính học thuật, danh tiếng, trật tự và khả năng làm rõ/hóa giải theo quan niệm truyền thống.", sourceIds: ["MAIN14"] },
  { name: "Hóa Kỵ", group: "Tứ Hóa", keywords: ["vướng mắc", "ám ảnh", "sai lệch"], meaning: "Làm tính chất sao trở nên khó xử, dễ vướng, chấp hoặc phát sinh vấn đề cần sửa. Không nên đọc Hóa Kỵ như “xấu tuyệt đối”.", sourceIds: ["MAIN14"] },
];

const BY_NAME = new Map(TU_VI_STAR_DEFINITIONS.map((item) => [item.name, item]));

export function getTuViStarDefinition(name: string) {
  if (BY_NAME.has(name)) return BY_NAME.get(name) ?? null;
  const normalized = name.replace("Tả Phù", "Tả Phụ");
  return BY_NAME.get(normalized) ?? null;
}
