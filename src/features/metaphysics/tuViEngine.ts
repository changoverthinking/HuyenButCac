import type { FiveElement, YinYang } from "./canChi";
import { getSexagenaryByYear } from "./canChi";
import {
  branchAt,
  branchIndex,
  buildTuViFoundation,
  getHourBranch,
  TU_VI_BRANCHES,
  type TuViBranch,
  type TuViPalaceName,
} from "./tuViFoundation";

export type TuViGender = "male" | "female";
export type TuViStarCategory = "chinh-tinh" | "cat-tinh" | "sat-tinh" | "vong-sao";
export type TuViBrightness = "Miếu" | "Vượng" | "Đắc" | "Bình" | "Hãm";
export type TuViTransformation = "Hóa Lộc" | "Hóa Quyền" | "Hóa Khoa" | "Hóa Kỵ";
export type TuViHoaProfile = "luc-ban-trieu" | "vuong-dinh-chi";
export type HoaLinhProfile = "truyen-thong" | "vu-thien";
export type LeapMonthProfile = "giu-nguyen" | "chia-15" | "sang-thang-sau";

export type TuViCuc = {
  element: FiveElement;
  number: 2 | 3 | 4 | 5 | 6;
  name: string;
};

export type TuViStar = {
  name: string;
  branch: TuViBranch;
  category: TuViStarCategory;
  brightness?: TuViBrightness;
  transformation?: TuViTransformation;
};

export type TuViPalace = {
  name: TuViPalaceName;
  branch: TuViBranch;
  isMenh: boolean;
  isThan: boolean;
  mainStars: TuViStar[];
  auxiliaryStars: TuViStar[];
  trangSinh?: string;
  decade?: { fromAge: number; toAge: number };
  minorLimit?: TuViBranch;
  voids: string[];
};

const MAIN_STAR_NAMES = [
  "Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh",
  "Thiên Phủ", "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân",
] as const;

const STAR_BRIGHTNESS: Record<(typeof MAIN_STAR_NAMES)[number], TuViBrightness[]> = {
  // Profile hiển thị: bảng 5 bậc đang dùng bởi KhoaHocTuVi (ghi chú là phái Bắc/Khâm Thiên).
  // Đây là bảng *profile*, không được coi là chuẩn duy nhất giữa mọi trường phái.
  "Tử Vi":       ["Miếu","Bình","Đắc","Vượng","Bình","Hãm","Miếu","Bình","Đắc","Vượng","Bình","Hãm"],
  "Thiên Cơ":    ["Hãm","Bình","Đắc","Miếu","Bình","Hãm","Hãm","Bình","Đắc","Miếu","Bình","Hãm"],
  "Thái Dương":  ["Hãm","Hãm","Vượng","Miếu","Vượng","Đắc","Miếu","Bình","Bình","Hãm","Hãm","Hãm"],
  "Vũ Khúc":     ["Miếu","Miếu","Bình","Hãm","Miếu","Bình","Miếu","Miếu","Bình","Hãm","Miếu","Bình"],
  "Thiên Đồng":  ["Miếu","Bình","Miếu","Hãm","Bình","Hãm","Miếu","Bình","Miếu","Hãm","Bình","Hãm"],
  "Liêm Trinh":  ["Hãm","Bình","Vượng","Hãm","Bình","Miếu","Hãm","Bình","Vượng","Hãm","Bình","Miếu"],
  "Thiên Phủ":   ["Miếu","Bình","Miếu","Bình","Bình","Bình","Miếu","Bình","Miếu","Bình","Bình","Bình"],
  "Thái Âm":     ["Miếu","Miếu","Hãm","Bình","Bình","Bình","Hãm","Hãm","Hãm","Bình","Bình","Miếu"],
  "Tham Lang":   ["Miếu","Hãm","Vượng","Vượng","Hãm","Bình","Miếu","Hãm","Vượng","Vượng","Hãm","Bình"],
  "Cự Môn":      ["Miếu","Hãm","Đắc","Bình","Bình","Bình","Miếu","Hãm","Đắc","Bình","Bình","Bình"],
  "Thiên Tướng": ["Miếu","Bình","Miếu","Hãm","Bình","Hãm","Miếu","Bình","Miếu","Hãm","Bình","Hãm"],
  "Thiên Lương": ["Đắc","Bình","Miếu","Miếu","Bình","Bình","Đắc","Bình","Miếu","Miếu","Bình","Bình"],
  "Thất Sát":    ["Hãm","Bình","Miếu","Hãm","Bình","Bình","Vượng","Bình","Miếu","Hãm","Bình","Bình"],
  "Phá Quân":    ["Miếu","Hãm","Vượng","Vượng","Hãm","Bình","Miếu","Hãm","Vượng","Vượng","Hãm","Bình"],
};

const CUC_BY_RESULT: Record<number, TuViCuc> = {
  1: { element: "Kim", number: 4, name: "Kim Tứ Cục" },
  2: { element: "Thủy", number: 2, name: "Thủy Nhị Cục" },
  3: { element: "Hỏa", number: 6, name: "Hỏa Lục Cục" },
  4: { element: "Thổ", number: 5, name: "Thổ Ngũ Cục" },
  5: { element: "Mộc", number: 3, name: "Mộc Tam Cục" },
};

const TRANG_SINH_NAMES = ["Tràng Sinh", "Mộc Dục", "Quan Đới", "Lâm Quan", "Đế Vượng", "Suy", "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng"] as const;
const TRANG_SINH_START: Record<FiveElement, TuViBranch> = { Thủy: "Thân", Thổ: "Thân", Mộc: "Hợi", Kim: "Tỵ", Hỏa: "Dần" };
const THAI_TUE_RING = ["Thái Tuế","Thiếu Dương","Tang Môn","Thiếu Âm","Quan Phù","Tử Phù","Tuế Phá","Long Đức","Bạch Hổ","Phúc Đức","Điếu Khách","Trực Phù"] as const;
const BAC_SI_RING = ["Bác Sĩ","Lực Sĩ","Thanh Long","Tiểu Hao","Tướng Quân","Tấu Thư","Phi Liêm","Hỷ Thần","Bệnh Phù","Đại Hao","Phục Binh","Quan Phủ"] as const;
const MINOR_LIMIT_START: Array<{ branches: string[]; start: TuViBranch }> = [
  { branches:["Dần","Ngọ","Tuất"], start:"Thìn" },
  { branches:["Thân","Tý","Thìn"], start:"Tuất" },
  { branches:["Tỵ","Dậu","Sửu"], start:"Mùi" },
  { branches:["Hợi","Mão","Mùi"], start:"Sửu" },
];
const TRIET_BY_STEM: Record<string, [TuViBranch,TuViBranch]> = {
  "Giáp":["Thân","Dậu"], "Kỷ":["Thân","Dậu"],
  "Ất":["Ngọ","Mùi"], "Canh":["Ngọ","Mùi"],
  "Bính":["Thìn","Tỵ"], "Tân":["Thìn","Tỵ"],
  "Đinh":["Dần","Mão"], "Nhâm":["Dần","Mão"],
  "Mậu":["Tý","Sửu"], "Quý":["Tý","Sửu"],
};
const TUAN_BY_DECADE: Array<[TuViBranch,TuViBranch]> = [["Tuất","Hợi"],["Thân","Dậu"],["Ngọ","Mùi"],["Thìn","Tỵ"],["Dần","Mão"],["Tý","Sửu"]];

const LOC_TON_BY_STEM: Record<string, TuViBranch> = {
  "Giáp":"Dần", "Ất":"Mão", "Bính":"Tỵ", "Đinh":"Ngọ", "Mậu":"Tỵ", "Kỷ":"Ngọ", "Canh":"Thân", "Tân":"Dậu", "Nhâm":"Hợi", "Quý":"Tý",
};

const KHOI_VIET_BY_STEM: Record<string, [TuViBranch, TuViBranch]> = {
  "Giáp":["Sửu","Mùi"], "Mậu":["Sửu","Mùi"],
  "Ất":["Tý","Thân"], "Kỷ":["Tý","Thân"],
  "Canh":["Ngọ","Dần"], "Tân":["Ngọ","Dần"],
  "Bính":["Hợi","Dậu"], "Đinh":["Hợi","Dậu"],
  "Nhâm":["Mão","Tỵ"], "Quý":["Mão","Tỵ"],
};

const TU_HOA_PROFILES: Record<TuViHoaProfile, Record<string, [string,string,string,string]>> = {
  // Hóa Lộc – Hóa Quyền – Hóa Khoa – Hóa Kỵ.
  // Profile 1: cột “Tử Vi Đẩu Số Toàn Tập / Trung Châu Lục Bân Triệu / Khâm Thiên”
  "luc-ban-trieu": {
    "Giáp":["Liêm Trinh","Phá Quân","Vũ Khúc","Thái Dương"],
    "Ất":["Thiên Cơ","Thiên Lương","Tử Vi","Thái Âm"],
    "Bính":["Thiên Đồng","Thiên Cơ","Văn Xương","Liêm Trinh"],
    "Đinh":["Thái Âm","Thiên Đồng","Thiên Cơ","Cự Môn"],
    "Mậu":["Tham Lang","Thái Âm","Hữu Bật","Thiên Cơ"],
    "Kỷ":["Vũ Khúc","Tham Lang","Thiên Lương","Văn Khúc"],
    "Canh":["Thái Dương","Vũ Khúc","Thái Âm","Thiên Đồng"],
    "Tân":["Cự Môn","Thái Dương","Văn Khúc","Văn Xương"],
    "Nhâm":["Thiên Lương","Tử Vi","Tả Phụ","Vũ Khúc"],
    "Quý":["Phá Quân","Cự Môn","Thái Âm","Tham Lang"],
  },
  // Profile 2: Trung Châu phái Vương Đình Chi — khác chủ yếu ở Khoa của Mậu/Canh/Nhâm.
  "vuong-dinh-chi": {
    "Giáp":["Liêm Trinh","Phá Quân","Vũ Khúc","Thái Dương"],
    "Ất":["Thiên Cơ","Thiên Lương","Tử Vi","Thái Âm"],
    "Bính":["Thiên Đồng","Thiên Cơ","Văn Xương","Liêm Trinh"],
    "Đinh":["Thái Âm","Thiên Đồng","Thiên Cơ","Cự Môn"],
    "Mậu":["Tham Lang","Thái Âm","Thái Dương","Thiên Cơ"],
    "Kỷ":["Vũ Khúc","Tham Lang","Thiên Lương","Văn Khúc"],
    "Canh":["Thái Dương","Vũ Khúc","Thiên Phủ","Thiên Đồng"],
    "Tân":["Cự Môn","Thái Dương","Văn Khúc","Văn Xương"],
    "Nhâm":["Thiên Lương","Tử Vi","Thiên Phủ","Vũ Khúc"],
    "Quý":["Phá Quân","Cự Môn","Thái Âm","Tham Lang"],
  },
};

const MENH_THAN_CHU_BY_YEAR_BRANCH: Record<string, [string,string]> = {
  "Tý":["Tham Lang","Linh Tinh"], "Sửu":["Cự Môn","Thiên Tướng"], "Dần":["Lộc Tồn","Thiên Lương"],
  "Mão":["Văn Khúc","Thiên Đồng"], "Thìn":["Liêm Trinh","Văn Xương"], "Tỵ":["Vũ Khúc","Thiên Cơ"],
  "Ngọ":["Phá Quân","Hỏa Tinh"], "Mùi":["Vũ Khúc","Thiên Tướng"], "Thân":["Văn Khúc","Thiên Lương"],
  "Dậu":["Vũ Khúc","Thiên Đồng"], "Tuất":["Lộc Tồn","Văn Xương"], "Hợi":["Cự Môn","Thiên Cơ"],
};

function positiveMod(value: number, divisor: number) { return ((value % divisor) + divisor) % divisor; }

function isForward(yearYinYang: YinYang, gender: TuViGender) {
  return (yearYinYang === "Dương" && gender === "male") || (yearYinYang === "Âm" && gender === "female");
}


/** Xử lý tháng nhuận theo profile vì cổ thư/phái hiện hành không thống nhất. */
export function resolveTuViLunarMonth(lunarMonth: number, lunarDay: number, isLeap: boolean, profile: LeapMonthProfile = "chia-15") {
  if (!isLeap || profile === "giu-nguyen") return lunarMonth;
  if (profile === "sang-thang-sau" || (profile === "chia-15" && lunarDay >= 16)) return lunarMonth === 12 ? 1 : lunarMonth + 1;
  return lunarMonth;
}

/**
 * Định Cục theo Can năm + địa chi cung Mệnh.
 * Quy tắc số: Giáp/Kỷ=1 ... Mậu/Quý=5; nhóm cung Mệnh = 1..5;
 * cộng lại, >5 trừ 5; 1=Kim4, 2=Thủy2, 3=Hỏa6, 4=Thổ5, 5=Mộc3.
 */
export function calculateTuViCuc(year: number, menhBranch: TuViBranch): TuViCuc {
  const sexagenary = getSexagenaryByYear(year);
  const stemIndex = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"].indexOf(sexagenary.stem.name);
  const stemGroup = (stemIndex % 5) + 1;
  let branchGroup: number;
  if (["Tý","Sửu"].includes(menhBranch)) branchGroup = 1;
  else if (["Dần","Mão","Tuất","Hợi"].includes(menhBranch)) branchGroup = 2;
  else if (["Ngọ","Mùi"].includes(menhBranch)) branchGroup = 3;
  else if (["Thìn","Tỵ"].includes(menhBranch)) branchGroup = 4;
  else branchGroup = 5;
  const result = ((stemGroup + branchGroup - 1) % 5) + 1;
  return { ...CUC_BY_RESULT[result] };
}

/** An Tử Vi bằng “mượn đủ Cục; lẻ lùi, chẵn tiến”. */
export function locateZiWei(lunarDay: number, cucNumber: number): TuViBranch {
  if (!Number.isInteger(lunarDay) || lunarDay < 1 || lunarDay > 30) throw new Error("Ngày âm lịch phải từ 1 đến 30.");
  if (![2,3,4,5,6].includes(cucNumber)) throw new Error("Số Cục phải thuộc 2–6.");
  const quotient = Math.ceil(lunarDay / cucNumber);
  const borrowed = quotient * cucNumber - lunarDay;
  const baseIndex = branchIndex("Dần") + quotient - 1;
  const delta = borrowed === 0 ? 0 : borrowed % 2 === 0 ? borrowed : -borrowed;
  return branchAt(baseIndex + delta);
}

export function buildMainStars(lunarDay: number, cuc: TuViCuc): TuViStar[] {
  const ziWei = locateZiWei(lunarDay, cuc.number);
  const zi = branchIndex(ziWei);
  const placements: Array<[typeof MAIN_STAR_NAMES[number], number]> = [
    ["Tử Vi", zi], ["Thiên Cơ", zi - 1], ["Thái Dương", zi - 3], ["Vũ Khúc", zi - 4], ["Thiên Đồng", zi - 5], ["Liêm Trinh", zi - 8],
  ];
  const fu = positiveMod(4 - zi, 12); // Đối xứng Tử Vi qua trục Dần–Thân.
  placements.push(
    ["Thiên Phủ", fu], ["Thái Âm", fu + 1], ["Tham Lang", fu + 2], ["Cự Môn", fu + 3],
    ["Thiên Tướng", fu + 4], ["Thiên Lương", fu + 5], ["Thất Sát", fu + 6], ["Phá Quân", fu + 10],
  );
  return placements.map(([name, index]) => {
    const branch = branchAt(index);
    return { name, branch, category: "chinh-tinh", brightness: STAR_BRIGHTNESS[name][branchIndex(branch)] };
  });
}

function addStar(stars: TuViStar[], name: string, branch: TuViBranch, category: TuViStarCategory) {
  stars.push({ name, branch, category });
}

function getHoaLinhBases(yearBranch: string, profile: HoaLinhProfile): [TuViBranch, TuViBranch] {
  if (["Dần","Ngọ","Tuất"].includes(yearBranch)) return ["Sửu","Mão"];
  if (["Thân","Tý","Thìn"].includes(yearBranch)) return ["Dần","Tuất"];
  if (["Tỵ","Dậu","Sửu"].includes(yearBranch)) return [profile === "vu-thien" ? "Tuất" : "Mão", "Tuất"];
  return ["Dậu","Tuất"]; // Hợi – Mão – Mùi.
}

export function buildAuxiliaryStars(input: {
  lunarMonth: number;
  hour: number;
  lunarYear: number;
  gender: TuViGender;
  hoaLinhProfile?: HoaLinhProfile;
}): TuViStar[] {
  const { lunarMonth, hour, lunarYear, gender, hoaLinhProfile = "truyen-thong" } = input;
  const sexagenary = getSexagenaryByYear(lunarYear);
  const stem = sexagenary.stem.name;
  const yearBranch = sexagenary.branch.name;
  const hourBranch = getHourBranch(hour);
  const hourIndex = branchIndex(hourBranch);
  const stars: TuViStar[] = [];

  // Tả Phụ / Hữu Bật: tháng Giêng khởi Thìn/Tuất, Tả thuận – Hữu nghịch.
  addStar(stars, "Tả Phụ", branchAt(branchIndex("Thìn") + lunarMonth - 1), "cat-tinh");
  addStar(stars, "Hữu Bật", branchAt(branchIndex("Tuất") - (lunarMonth - 1)), "cat-tinh");

  // Xương/Khúc và Không/Kiếp theo giờ: Tuất/Thìn/Hợi làm giờ Tý.
  addStar(stars, "Văn Xương", branchAt(branchIndex("Tuất") - hourIndex), "cat-tinh");
  addStar(stars, "Văn Khúc", branchAt(branchIndex("Thìn") + hourIndex), "cat-tinh");
  addStar(stars, "Địa Không", branchAt(branchIndex("Hợi") - hourIndex), "sat-tinh");
  addStar(stars, "Địa Kiếp", branchAt(branchIndex("Hợi") + hourIndex), "sat-tinh");

  const [khoi, viet] = KHOI_VIET_BY_STEM[stem];
  addStar(stars, "Thiên Khôi", khoi, "cat-tinh");
  addStar(stars, "Thiên Việt", viet, "cat-tinh");

  const locTon = LOC_TON_BY_STEM[stem];
  addStar(stars, "Lộc Tồn", locTon, "cat-tinh");
  addStar(stars, "Kình Dương", branchAt(branchIndex(locTon) + 1), "sat-tinh");
  addStar(stars, "Đà La", branchAt(branchIndex(locTon) - 1), "sat-tinh");

  // Hỏa/Linh: profile truyền thống Việt Nam; chiều phụ thuộc Âm/Dương + giới tính.
  const [hoaBase, linhBase] = getHoaLinhBases(yearBranch, hoaLinhProfile);
  const forward = isForward(sexagenary.stem.yinYang, gender);
  addStar(stars, "Hỏa Tinh", branchAt(branchIndex(hoaBase) + (forward ? hourIndex : -hourIndex)), "sat-tinh");
  addStar(stars, "Linh Tinh", branchAt(branchIndex(linhBase) + (forward ? -hourIndex : hourIndex)), "sat-tinh");

  // Vòng Thái Tuế: Thái Tuế tại Chi năm, sau đó đi thuận đủ 12 cung.
  const thaiTueStart = branchIndex(yearBranch);
  THAI_TUE_RING.forEach((name, offset) => addStar(stars, name, branchAt(thaiTueStart + offset), "vong-sao"));

  // Vòng Bác Sĩ: Bác Sĩ đồng cung Lộc Tồn; Dương Nam/Âm Nữ thuận, ngược lại nghịch.
  const bacSiDirection = forward ? 1 : -1;
  const bacSiStart = branchIndex(locTon);
  BAC_SI_RING.forEach((name, offset) => addStar(stars, name, branchAt(bacSiStart + bacSiDirection * offset), "vong-sao"));

  return stars;
}

export function getFourTransformations(stem: string, profile: TuViHoaProfile = "luc-ban-trieu") {
  const row = TU_HOA_PROFILES[profile][stem];
  if (!row) throw new Error(`Không có bảng Tứ Hóa cho Can ${stem}.`);
  const labels: TuViTransformation[] = ["Hóa Lộc","Hóa Quyền","Hóa Khoa","Hóa Kỵ"];
  return row.map((starName, index) => ({ starName, transformation: labels[index] }));
}

function applyTransformations(stars: TuViStar[], transformations: ReturnType<typeof getFourTransformations>) {
  const byName = new Map(transformations.map((item) => [item.starName, item.transformation]));
  return stars.map((star) => ({ ...star, transformation: byName.get(star.name) }));
}

export function buildTrangSinh(cuc: TuViCuc, yearYinYang: YinYang, gender: TuViGender) {
  const direction = isForward(yearYinYang, gender) ? 1 : -1;
  const startIndex = branchIndex(TRANG_SINH_START[cuc.element]);
  return TRANG_SINH_NAMES.map((name, offset) => ({ name, branch: branchAt(startIndex + direction * offset) }));
}

export function buildDecades(menhBranch: TuViBranch, cuc: TuViCuc, yearYinYang: YinYang, gender: TuViGender) {
  const direction = isForward(yearYinYang, gender) ? 1 : -1;
  const start = branchIndex(menhBranch);
  return Array.from({ length: 12 }, (_, offset) => ({
    branch: branchAt(start + direction * offset),
    fromAge: cuc.number + offset * 10,
    toAge: cuc.number + offset * 10 + 9,
  }));
}

/** Tiểu Hạn: khởi theo Tam Hợp Chi năm; Nam thuận, Nữ nghịch. */
export function buildMinorLimits(lunarYear: number, gender: TuViGender) {
  const birthBranch = getSexagenaryByYear(lunarYear).branch.name;
  const group = MINOR_LIMIT_START.find((item) => item.branches.includes(birthBranch));
  if (!group) throw new Error(`Không xác định được cung khởi Tiểu Hạn cho ${birthBranch}.`);
  const direction = gender === "male" ? 1 : -1;
  const start = branchIndex(group.start);
  const birthIndex = branchIndex(birthBranch);
  return Array.from({length:12}, (_,offset) => ({
    yearBranch: branchAt(birthIndex + offset),
    palaceBranch: branchAt(start + direction * offset),
  }));
}

export function getTuanTriet(lunarYear: number) {
  const year = getSexagenaryByYear(lunarYear);
  const tuan = TUAN_BY_DECADE[Math.floor(year.cycleIndex / 10)];
  const triet = TRIET_BY_STEM[year.stem.name];
  return { tuan, triet };
}

export function buildAnnualTransit(input: { birthLunarYear: number; targetLunarYear: number; gender: TuViGender; hoaProfile?: TuViHoaProfile }) {
  const { birthLunarYear, targetLunarYear, gender, hoaProfile = "luc-ban-trieu" } = input;
  const target = getSexagenaryByYear(targetLunarYear);
  const minor = buildMinorLimits(birthLunarYear, gender);
  const offset = positiveMod(targetLunarYear - birthLunarYear, 12);
  return {
    year: target,
    ageNominal: targetLunarYear - birthLunarYear + 1,
    minorLimitPalace: minor[offset].palaceBranch,
    minorLimitYearBranch: minor[offset].yearBranch,
    luuThaiTue: target.branch.name,
    transformations: getFourTransformations(target.stem.name, hoaProfile),
    luuLocTon: LOC_TON_BY_STEM[target.stem.name],
  };
}

export function buildTuViChart(input: {
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  hour: number;
  gender: TuViGender;
  hoaProfile?: TuViHoaProfile;
  hoaLinhProfile?: HoaLinhProfile;
}) {
  const { lunarDay, lunarMonth, lunarYear, hour, gender, hoaProfile = "luc-ban-trieu", hoaLinhProfile = "truyen-thong" } = input;
  const foundation = buildTuViFoundation(lunarMonth, hour);
  const year = getSexagenaryByYear(lunarYear);
  const cuc = calculateTuViCuc(lunarYear, foundation.menhBranch);
  const mainStarsRaw = buildMainStars(lunarDay, cuc);
  const auxiliaryRaw = buildAuxiliaryStars({ lunarMonth, hour, lunarYear, gender, hoaLinhProfile });
  const transformations = getFourTransformations(year.stem.name, hoaProfile);
  const mainStars = applyTransformations(mainStarsRaw, transformations);
  const auxiliaryStars = applyTransformations(auxiliaryRaw, transformations);
  const trangSinh = buildTrangSinh(cuc, year.stem.yinYang, gender);
  const decades = buildDecades(foundation.menhBranch, cuc, year.stem.yinYang, gender);
  const minorLimits = buildMinorLimits(lunarYear, gender);
  const { tuan, triet } = getTuanTriet(lunarYear);
  const menhChu = MENH_THAN_CHU_BY_YEAR_BRANCH[foundation.menhBranch][0];
  const thanChu = MENH_THAN_CHU_BY_YEAR_BRANCH[year.branch.name][1];

  const palaces: TuViPalace[] = foundation.palaces.map((palace) => ({
    name: palace.name,
    branch: palace.branch,
    isMenh: palace.name === "Mệnh",
    isThan: palace.branch === foundation.thanBranch,
    mainStars: mainStars.filter((star) => star.branch === palace.branch),
    auxiliaryStars: auxiliaryStars.filter((star) => star.branch === palace.branch),
    trangSinh: trangSinh.find((item) => item.branch === palace.branch)?.name,
    decade: decades.find((item) => item.branch === palace.branch),
    minorLimit: minorLimits.find((item) => item.palaceBranch === palace.branch)?.yearBranch,
    voids: [tuan.includes(palace.branch) ? "TUẦN" : "", triet.includes(palace.branch) ? "TRIỆT" : ""].filter(Boolean),
  }));

  return {
    schoolProfile: {
      core: "An sao Việt Nam phổ biến · 14 chính tinh theo Tử Vi/Thiên Phủ tinh hệ",
      hoaProfile,
      hoaLinhProfile,
      brightness: "Khâm Thiên/Bắc phái tham khảo — chỉ dùng để hiển thị độ sáng, không tự luận đoán",
    },
    foundation,
    year,
    cuc,
    menhChu,
    thanChu,
    mainStars,
    auxiliaryStars,
    transformations,
    trangSinh,
    decades,
    minorLimits,
    tuan,
    triet,
    palaces,
  };
}

export const TU_VI_ENGINE_REFERENCES = [
  "Định Cục: bảng Giáp/Kỷ…Mậu/Quý và công thức quy số Can + cung Mệnh.",
  "An Tử Vi: mượn đủ Cục; số mượn lẻ lùi, chẵn tiến; Dần khởi 1.",
  "Tử Vi tinh hệ: Cơ -1, Dương -3, Vũ -4, Đồng -5, Liêm -8.",
  "Thiên Phủ tinh hệ: Phủ, Âm, Tham, Cự, Tướng, Lương, Sát; cách ba cung an Phá.",
  "Xương/Khúc: Tuất nghịch / Thìn thuận theo giờ; Không/Kiếp: Hợi nghịch / thuận.",
  "Tứ Hóa được tách profile vì các phái có bảng khác nhau ở một số Can.",
  "Vòng Thái Tuế an từ Chi năm đi thuận; Vòng Bác Sĩ khởi Lộc Tồn và thuận/nghịch theo Âm Dương + giới tính.",
  "Tiểu Hạn khởi theo Tam Hợp Chi năm; Nam thuận, Nữ nghịch. Tuần/Triệt theo tuần Giáp và Can năm.",
] as const;

export { TU_VI_BRANCHES };
