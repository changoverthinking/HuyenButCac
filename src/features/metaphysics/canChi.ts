export type FiveElement = "Kim" | "Mộc" | "Thủy" | "Hỏa" | "Thổ";
export type YinYang = "Dương" | "Âm";

export type HeavenlyStemInfo = {
  name: string;
  element: FiveElement;
  yinYang: YinYang;
};

export type EarthlyBranchInfo = {
  name: string;
  element: FiveElement;
  yinYang: YinYang;
  zodiac: string;
  hours: string;
};

export const HEAVENLY_STEMS_INFO: HeavenlyStemInfo[] = [
  { name: "Giáp", element: "Mộc", yinYang: "Dương" },
  { name: "Ất", element: "Mộc", yinYang: "Âm" },
  { name: "Bính", element: "Hỏa", yinYang: "Dương" },
  { name: "Đinh", element: "Hỏa", yinYang: "Âm" },
  { name: "Mậu", element: "Thổ", yinYang: "Dương" },
  { name: "Kỷ", element: "Thổ", yinYang: "Âm" },
  { name: "Canh", element: "Kim", yinYang: "Dương" },
  { name: "Tân", element: "Kim", yinYang: "Âm" },
  { name: "Nhâm", element: "Thủy", yinYang: "Dương" },
  { name: "Quý", element: "Thủy", yinYang: "Âm" },
];

export const EARTHLY_BRANCHES_INFO: EarthlyBranchInfo[] = [
  { name: "Tý", element: "Thủy", yinYang: "Dương", zodiac: "Chuột", hours: "23:00–00:59" },
  { name: "Sửu", element: "Thổ", yinYang: "Âm", zodiac: "Trâu", hours: "01:00–02:59" },
  { name: "Dần", element: "Mộc", yinYang: "Dương", zodiac: "Hổ", hours: "03:00–04:59" },
  { name: "Mão", element: "Mộc", yinYang: "Âm", zodiac: "Mèo", hours: "05:00–06:59" },
  { name: "Thìn", element: "Thổ", yinYang: "Dương", zodiac: "Rồng", hours: "07:00–08:59" },
  { name: "Tỵ", element: "Hỏa", yinYang: "Âm", zodiac: "Rắn", hours: "09:00–10:59" },
  { name: "Ngọ", element: "Hỏa", yinYang: "Dương", zodiac: "Ngựa", hours: "11:00–12:59" },
  { name: "Mùi", element: "Thổ", yinYang: "Âm", zodiac: "Dê", hours: "13:00–14:59" },
  { name: "Thân", element: "Kim", yinYang: "Dương", zodiac: "Khỉ", hours: "15:00–16:59" },
  { name: "Dậu", element: "Kim", yinYang: "Âm", zodiac: "Gà", hours: "17:00–18:59" },
  { name: "Tuất", element: "Thổ", yinYang: "Dương", zodiac: "Chó", hours: "19:00–20:59" },
  { name: "Hợi", element: "Thủy", yinYang: "Âm", zodiac: "Lợn", hours: "21:00–22:59" },
];

const NAP_AM_PAIRS: Array<{ name: string; element: FiveElement }> = [
  { name: "Hải Trung Kim", element: "Kim" }, { name: "Lư Trung Hỏa", element: "Hỏa" },
  { name: "Đại Lâm Mộc", element: "Mộc" }, { name: "Lộ Bàng Thổ", element: "Thổ" },
  { name: "Kiếm Phong Kim", element: "Kim" }, { name: "Sơn Đầu Hỏa", element: "Hỏa" },
  { name: "Giản Hạ Thủy", element: "Thủy" }, { name: "Thành Đầu Thổ", element: "Thổ" },
  { name: "Bạch Lạp Kim", element: "Kim" }, { name: "Dương Liễu Mộc", element: "Mộc" },
  { name: "Tuyền Trung Thủy", element: "Thủy" }, { name: "Ốc Thượng Thổ", element: "Thổ" },
  { name: "Tích Lịch Hỏa", element: "Hỏa" }, { name: "Tùng Bách Mộc", element: "Mộc" },
  { name: "Trường Lưu Thủy", element: "Thủy" }, { name: "Sa Trung Kim", element: "Kim" },
  { name: "Sơn Hạ Hỏa", element: "Hỏa" }, { name: "Bình Địa Mộc", element: "Mộc" },
  { name: "Bích Thượng Thổ", element: "Thổ" }, { name: "Kim Bạch Kim", element: "Kim" },
  { name: "Phú Đăng Hỏa", element: "Hỏa" }, { name: "Thiên Hà Thủy", element: "Thủy" },
  { name: "Đại Trạch Thổ", element: "Thổ" }, { name: "Thoa Xuyến Kim", element: "Kim" },
  { name: "Tang Đố Mộc", element: "Mộc" }, { name: "Đại Khê Thủy", element: "Thủy" },
  { name: "Sa Trung Thổ", element: "Thổ" }, { name: "Thiên Thượng Hỏa", element: "Hỏa" },
  { name: "Thạch Lựu Mộc", element: "Mộc" }, { name: "Đại Hải Thủy", element: "Thủy" },
];

const TAM_HOP: Array<{ branches: string[]; bureau: string }> = [
  { branches: ["Thân", "Tý", "Thìn"], bureau: "Thủy cục" },
  { branches: ["Dần", "Ngọ", "Tuất"], bureau: "Hỏa cục" },
  { branches: ["Tỵ", "Dậu", "Sửu"], bureau: "Kim cục" },
  { branches: ["Hợi", "Mão", "Mùi"], bureau: "Mộc cục" },
];

const LUC_HOP = [["Tý", "Sửu"], ["Dần", "Hợi"], ["Mão", "Tuất"], ["Thìn", "Dậu"], ["Tỵ", "Thân"], ["Ngọ", "Mùi"]];
const LUC_XUNG = [["Tý", "Ngọ"], ["Sửu", "Mùi"], ["Dần", "Thân"], ["Mão", "Dậu"], ["Thìn", "Tuất"], ["Tỵ", "Hợi"]];

const GENERATES: Record<FiveElement, FiveElement> = { Kim: "Thủy", Thủy: "Mộc", Mộc: "Hỏa", Hỏa: "Thổ", Thổ: "Kim" };
const CONTROLS: Record<FiveElement, FiveElement> = { Kim: "Mộc", Mộc: "Thổ", Thổ: "Thủy", Thủy: "Hỏa", Hỏa: "Kim" };

function mod(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function pairMatches(pair: string[], a: string, b: string) {
  return pair.includes(a) && pair.includes(b);
}

export function getSexagenaryByYear(year: number) {
  // 1984 = Giáp Tý, dùng làm mốc neo của Lục Thập Hoa Giáp.
  const cycleIndex = mod(year - 1984, 60);
  const stem = HEAVENLY_STEMS_INFO[cycleIndex % 10];
  const branch = EARTHLY_BRANCHES_INFO[cycleIndex % 12];
  const napAm = NAP_AM_PAIRS[Math.floor(cycleIndex / 2)];
  return {
    year,
    cycleIndex,
    cyclePosition: cycleIndex + 1,
    canChi: `${stem.name} ${branch.name}`,
    stem,
    branch,
    napAm,
  };
}

export function getBranchRelation(branchA: string, branchB: string) {
  const a = EARTHLY_BRANCHES_INFO.find((item) => item.name === branchA);
  const b = EARTHLY_BRANCHES_INFO.find((item) => item.name === branchB);
  if (!a || !b) return { labels: ["Không xác định"], elementRelation: "Không đủ dữ liệu." };
  if (a.name === b.name) return { labels: ["Đồng chi"], elementRelation: `Cùng hành ${a.element}.` };

  const labels: string[] = [];
  const tamHop = TAM_HOP.find((group) => group.branches.includes(a.name) && group.branches.includes(b.name));
  if (tamHop) labels.push(`Tam hợp · ${tamHop.bureau}`);
  if (LUC_HOP.some((pair) => pairMatches(pair, a.name, b.name))) labels.push("Lục hợp");
  if (LUC_XUNG.some((pair) => pairMatches(pair, a.name, b.name))) labels.push("Lục xung");
  if (labels.length === 0) labels.push("Không thuộc Tam hợp/Lục hợp/Lục xung cơ bản");

  let elementRelation = `Đồng hành ${a.element}.`;
  if (a.element !== b.element) {
    if (GENERATES[a.element] === b.element) elementRelation = `${a.element} sinh ${b.element}.`;
    else if (GENERATES[b.element] === a.element) elementRelation = `${b.element} sinh ${a.element}.`;
    else if (CONTROLS[a.element] === b.element) elementRelation = `${a.element} khắc ${b.element}.`;
    else if (CONTROLS[b.element] === a.element) elementRelation = `${b.element} khắc ${a.element}.`;
    else elementRelation = `${a.element} và ${b.element}.`;
  }
  return { labels, elementRelation };
}

export function getFiveElementRelation(source: FiveElement, target: FiveElement) {
  if (source === target) return "Đồng hành";
  if (GENERATES[source] === target) return `${source} sinh ${target}`;
  if (CONTROLS[source] === target) return `${source} khắc ${target}`;
  if (GENERATES[target] === source) return `${target} sinh ${source}`;
  return `${target} khắc ${source}`;
}
