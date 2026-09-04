export type CompassOctant = "Bắc" | "Đông Bắc" | "Đông" | "Đông Nam" | "Nam" | "Tây Nam" | "Tây" | "Tây Bắc";
export type FlyingDirection = "thuận" | "nghịch";
export type ReplacementProfile = "shen-shi" | "off";

export type Mountain24 = {
  code: string;
  name: string;
  han: string;
  direction: CompassOctant;
  sector: 1 | 2 | 3;
  centerDegree: number;
  startDegree: number;
  endDegree: number;
};

export type FlyingStarCell = {
  palace: string;
  periodStar: number;
  mountainStar: number;
  facingStar: number;
};

export type NatalFlyingStarChart = {
  period: ReturnType<typeof getNinePeriod>;
  facing: Mountain24;
  sitting: Mountain24;
  facingDegrees: number;
  sittingDegrees: number;
  mountainCenterStar: number;
  facingCenterStar: number;
  mountainFlight: FlyingDirection;
  facingFlight: FlyingDirection;
  nearBoundary: boolean;
  boundaryDistance: number;
  mountainOffset: number;
  chartMode: "Hạ Quái" | "Hạ Quái · cưỡng chế" | "Thế Quái · 替卦";
  replacementProfile: ReplacementProfile;
  replacementThreshold: number;
  replacement: {
    active: boolean;
    mountainReference: Mountain24 | null;
    facingReference: Mountain24 | null;
    mountainOriginalStar: number;
    facingOriginalStar: number;
    mountainReplacementStar: number;
    facingReplacementStar: number;
  };
  structure: string[];
  repetition: { mountain: "Phục Ngâm" | "Phản Ngâm" | null; facing: "Phục Ngâm" | "Phản Ngâm" | null };
  chart: FlyingStarCell[];
  profile: "Tam Nguyên Huyền Không · Hạ Quái" | "Tam Nguyên Huyền Không · Thế Quái (沈氏替星 profile)";
  note: string;
};

// Quỹ đạo Lạc Thư: Trung → Càn → Đoài → Cấn → Ly → Khảm → Khôn → Chấn → Tốn.
const LO_SHU_FLIGHT = ["Trung", "Tây Bắc", "Tây", "Đông Bắc", "Nam", "Bắc", "Tây Nam", "Đông", "Đông Nam"] as const;
export const FLYING_STAR_DISPLAY_ORDER = ["Đông Nam", "Nam", "Tây Nam", "Đông", "Trung", "Tây", "Đông Bắc", "Bắc", "Tây Bắc"] as const;


// Nguyên Đán bàn: sao 1/2/3/4/6/7/8/9 quy về tám quái phương.
// Sao 5 không có quái riêng; khi gặp 5, Hạ Quái/Thế Quái đều giữ 5 nhập Trung
// và dùng số Vận để xác định âm dương/thuận nghịch theo quy tắc đặc biệt.
const STAR_TRIGRAM_DIRECTION: Record<number, CompassOctant | null> = {
  1: "Bắc", 2: "Tây Nam", 3: "Đông", 4: "Đông Nam", 5: null,
  6: "Tây Bắc", 7: "Tây", 8: "Đông Bắc", 9: "Nam",
};

/**
 * Bảng替星 profile 沈氏 thường dùng trong phần mềm/bảng tra hiện đại:
 * 子癸甲申=1; 壬卯乙未坤=2; 乾亥辰巽巳戌=6; 酉辛丑艮丙=7; 寅午庚丁=9.
 * Đây là một profile cụ thể, không tuyên bố thay thế các dị bản Trung Châu/Vô Thường khác.
 */
export const SHEN_SHI_REPLACEMENT_STARS: Record<string, number> = {
  "Tý":1, "Quý":1, "Giáp":1, "Thân":1,
  "Nhâm":2, "Mão":2, "Ất":2, "Mùi":2, "Khôn":2,
  "Càn":6, "Hợi":6, "Thìn":6, "Tốn":6, "Tỵ":6, "Tuất":6,
  "Dậu":7, "Tân":7, "Sửu":7, "Cấn":7, "Bính":7,
  "Dần":9, "Ngọ":9, "Canh":9, "Đinh":9,
};

function getMountainInDirectionAndSector(direction: CompassOctant, sector: 1|2|3) {
  const mountain = MOUNTAINS_24.find((item) => item.direction === direction && item.sector === sector);
  if (!mountain) throw new Error(`Không tìm thấy Sơn ${direction} / nguyên long ${sector}.`);
  return mountain;
}

/** Sơn quy chiếu của sao đến Sơn/Hướng theo Nguyên Đán bàn và cùng nguyên long. */
export function getReferenceMountainForCenterStar(centerStar: number, actualMountain: Mountain24, period: number) {
  const direction = STAR_TRIGRAM_DIRECTION[centerStar === 5 ? period : centerStar];
  if (!direction) return null;
  return getMountainInDirectionAndSector(direction, actualMountain.sector);
}

export function getReplacementStar(centerStar: number, actualMountain: Mountain24, period: number, profile: ReplacementProfile = "shen-shi") {
  if (profile === "off" || centerStar === 5) return { star: centerStar, reference: getReferenceMountainForCenterStar(centerStar, actualMountain, period) };
  const reference = getReferenceMountainForCenterStar(centerStar, actualMountain, period);
  if (!reference) return { star: centerStar, reference: null };
  return { star: SHEN_SHI_REPLACEMENT_STARS[reference.name] ?? centerStar, reference };
}

function mod(value: number, divisor: number) { return ((value % divisor) + divisor) % divisor; }
function normalizeDegree(degree: number) { return mod(degree, 360); }
function normalizeStar(star: number) { return mod(star - 1, 9) + 1; }

function makeMountain(code: string, name: string, han: string, direction: CompassOctant, sector: 1|2|3, centerDegree: number): Mountain24 {
  return {
    code, name, han, direction, sector, centerDegree,
    startDegree: normalizeDegree(centerDegree - 7.5),
    endDegree: normalizeDegree(centerDegree + 7.5),
  };
}

/**
 * 24 Sơn, mỗi Sơn 15°. Mốc 0° là chính Bắc; N2/Tý nằm quanh 0°.
 * Dùng mã N1..NW3 để người dùng có thể đối chiếu trực tiếp với la bàn/flying-star chart quốc tế.
 */
export const MOUNTAINS_24: Mountain24[] = [
  makeMountain("N1", "Nhâm", "壬", "Bắc", 1, 345),
  makeMountain("N2", "Tý", "子", "Bắc", 2, 0),
  makeMountain("N3", "Quý", "癸", "Bắc", 3, 15),
  makeMountain("NE1", "Sửu", "丑", "Đông Bắc", 1, 30),
  makeMountain("NE2", "Cấn", "艮", "Đông Bắc", 2, 45),
  makeMountain("NE3", "Dần", "寅", "Đông Bắc", 3, 60),
  makeMountain("E1", "Giáp", "甲", "Đông", 1, 75),
  makeMountain("E2", "Mão", "卯", "Đông", 2, 90),
  makeMountain("E3", "Ất", "乙", "Đông", 3, 105),
  makeMountain("SE1", "Thìn", "辰", "Đông Nam", 1, 120),
  makeMountain("SE2", "Tốn", "巽", "Đông Nam", 2, 135),
  makeMountain("SE3", "Tỵ", "巳", "Đông Nam", 3, 150),
  makeMountain("S1", "Bính", "丙", "Nam", 1, 165),
  makeMountain("S2", "Ngọ", "午", "Nam", 2, 180),
  makeMountain("S3", "Đinh", "丁", "Nam", 3, 195),
  makeMountain("SW1", "Mùi", "未", "Tây Nam", 1, 210),
  makeMountain("SW2", "Khôn", "坤", "Tây Nam", 2, 225),
  makeMountain("SW3", "Thân", "申", "Tây Nam", 3, 240),
  makeMountain("W1", "Canh", "庚", "Tây", 1, 255),
  makeMountain("W2", "Dậu", "酉", "Tây", 2, 270),
  makeMountain("W3", "Tân", "辛", "Tây", 3, 285),
  makeMountain("NW1", "Tuất", "戌", "Tây Bắc", 1, 300),
  makeMountain("NW2", "Càn", "乾", "Tây Bắc", 2, 315),
  makeMountain("NW3", "Hợi", "亥", "Tây Bắc", 3, 330),
];

export function getNinePeriod(year: number) {
  if (!Number.isInteger(year) || year < 1864 || year > 2403) throw new Error("Cửu Vận bản này hỗ trợ năm 1864–2403.");
  const cycleOffset = mod(year - 1864, 180);
  const period = Math.floor(cycleOffset / 20) + 1;
  const cycleStart = year - cycleOffset;
  const startYear = cycleStart + (period - 1) * 20;
  return { period, startYear, endYear: startYear + 19, cycleStart, cycleEnd: cycleStart + 179 };
}

/** Phi một tầng sao theo Lạc Thư từ sao nhập Trung cung. */
export function flyStars(centerStar: number, direction: FlyingDirection = "thuận") {
  const step = direction === "thuận" ? 1 : -1;
  return LO_SHU_FLIGHT.map((palace, index) => ({ palace, star: normalizeStar(centerStar + step * index) }));
}

export function buildBasePeriodFlyingStars(year: number) {
  const { period } = getNinePeriod(year);
  return flyStars(period, "thuận").map(({ palace, star }) => ({ palace, star }));
}

/** Xác định 24 Sơn từ độ hướng. Ranh 352.5°–7.5° được xử lý vòng qua 0°. */
export function getMountainByDegree(degree: number): Mountain24 {
  if (!Number.isFinite(degree)) throw new Error("Độ hướng phải là một số hữu hạn.");
  const normalized = normalizeDegree(degree);
  const index = mod(Math.floor((normalized + 7.5) / 15) + 1, 24);
  return MOUNTAINS_24[index];
}

export function getOppositeMountain(mountain: Mountain24) {
  const index = MOUNTAINS_24.findIndex((item) => item.code === mountain.code);
  return MOUNTAINS_24[mod(index + 12, 24)];
}

export function getBoundaryDistance(degree: number) {
  const normalized = normalizeDegree(degree);
  const shifted = mod(normalized + 7.5, 15);
  return Math.min(shifted, 15 - shifted);
}

/**
 * Quy tắc thuận/nghịch Hạ Quái theo tính chẵn/lẻ của sao nhập Trung và Sơn thứ 1/2/3:
 * - sao lẻ: Sơn 1 thuận, Sơn 2/3 nghịch;
 * - sao chẵn: Sơn 1 nghịch, Sơn 2/3 thuận.
 * Sao 5 là trường hợp đặc biệt: dùng số Vận thay thế để xét âm/dương.
 */
export function getShanXiangFlightDirection(centerStar: number, sector: 1|2|3, period: number): FlyingDirection {
  const parityStar = centerStar === 5 ? period : centerStar;
  const odd = parityStar % 2 === 1;
  const forward = (odd && sector === 1) || (!odd && sector > 1);
  return forward ? "thuận" : "nghịch";
}

function starAt(chart: Array<{palace: string; star: number}>, palace: string) {
  const value = chart.find((item) => item.palace === palace)?.star;
  if (!value) throw new Error(`Không tìm thấy sao tại cung ${palace}.`);
  return value;
}

function signedAngularDifference(degree: number, center: number) {
  const diff = mod(degree - center + 180, 360) - 180;
  return diff;
}

function classifyStructure(period: number, chart: FlyingStarCell[], sitting: CompassOctant, facing: CompassOctant) {
  const atSitting = chart.find((c) => c.palace === sitting)!;
  const atFacing = chart.find((c) => c.palace === facing)!;
  const result: string[] = [];
  if (atSitting.mountainStar === period && atFacing.facingStar === period) result.push("Vượng Sơn Vượng Hướng · Đáo Sơn Đáo Hướng");
  if (atFacing.mountainStar === period && atFacing.facingStar === period) result.push("Song Tinh Đáo Hướng");
  if (atSitting.mountainStar === period && atSitting.facingStar === period) result.push("Song Tinh Đáo Sơn");
  if (atFacing.mountainStar === period && atSitting.facingStar === period) result.push("Thượng Sơn Hạ Thủy");
  if (result.length === 0) result.push("Bàn Phi Tinh thông thường · cần phối hợp hình thế để đọc");
  return result;
}

/**
 * Lập Phi Tinh bàn nguyên vận. Trung tâm 9° của mỗi Sơn dùng Hạ Quái;
 * phần 3° hai mép dùng Thế Quái theo profile được chọn.
 */
export function buildNatalFlyingStarChart(
  year: number,
  facingDegrees: number,
  options: { replacementProfile?: ReplacementProfile; replacementThreshold?: number } = {},
): NatalFlyingStarChart {
  const replacementProfile = options.replacementProfile ?? "shen-shi";
  const replacementThreshold = options.replacementThreshold ?? 4.5;
  const period = getNinePeriod(year);
  const normalizedFacing = normalizeDegree(facingDegrees);
  const facing = getMountainByDegree(normalizedFacing);
  const sittingDegrees = normalizeDegree(normalizedFacing + 180);
  const sitting = getMountainByDegree(sittingDegrees);

  const periodLayer = flyStars(period.period, "thuận");
  const mountainCenterStar = starAt(periodLayer, sitting.direction);
  const facingCenterStar = starAt(periodLayer, facing.direction);
  const mountainFlight = getShanXiangFlightDirection(mountainCenterStar, sitting.sector, period.period);
  const facingFlight = getShanXiangFlightDirection(facingCenterStar, facing.sector, period.period);

  const mountainOffset = signedAngularDifference(normalizedFacing, facing.centerDegree);
  const shouldUseReplacement = Math.abs(mountainOffset) > replacementThreshold;
  const useReplacement = replacementProfile !== "off" && shouldUseReplacement;
  const mountainReplacement = useReplacement
    ? getReplacementStar(mountainCenterStar, sitting, period.period, replacementProfile)
    : { star: mountainCenterStar, reference: getReferenceMountainForCenterStar(mountainCenterStar, sitting, period.period) };
  const facingReplacement = useReplacement
    ? getReplacementStar(facingCenterStar, facing, period.period, replacementProfile)
    : { star: facingCenterStar, reference: getReferenceMountainForCenterStar(facingCenterStar, facing, period.period) };

  // Thế Quái chỉ thay sao nhập Trung; chiều phi giữ theo Sơn quy chiếu/Nguyên Long của nguyên bàn.
  const mountainLayer = flyStars(mountainReplacement.star, mountainFlight);
  const facingLayer = flyStars(facingReplacement.star, facingFlight);

  const chart = FLYING_STAR_DISPLAY_ORDER.map((palace) => ({
    palace,
    periodStar: starAt(periodLayer, palace),
    mountainStar: starAt(mountainLayer, palace),
    facingStar: starAt(facingLayer, palace),
  }));
  const boundaryDistance = getBoundaryDistance(normalizedFacing);
  const chartMode = useReplacement ? "Thế Quái · 替卦" : (shouldUseReplacement && replacementProfile === "off" ? "Hạ Quái · cưỡng chế" : "Hạ Quái");
  const repetition = {
    mountain: mountainCenterStar === 5 ? (mountainFlight === "thuận" ? "Phục Ngâm" : "Phản Ngâm") : null,
    facing: facingCenterStar === 5 ? (facingFlight === "thuận" ? "Phục Ngâm" : "Phản Ngâm") : null,
  } as const;
  const structure = classifyStructure(period.period, chart, sitting.direction, facing.direction);

  return {
    period,
    facing,
    sitting,
    facingDegrees: normalizedFacing,
    sittingDegrees,
    mountainCenterStar: mountainReplacement.star,
    facingCenterStar: facingReplacement.star,
    mountainFlight,
    facingFlight,
    nearBoundary: boundaryDistance < 3,
    boundaryDistance,
    mountainOffset,
    chartMode,
    replacementProfile,
    replacementThreshold,
    replacement: {
      active: useReplacement,
      mountainReference: mountainReplacement.reference,
      facingReference: facingReplacement.reference,
      mountainOriginalStar: mountainCenterStar,
      facingOriginalStar: facingCenterStar,
      mountainReplacementStar: mountainReplacement.star,
      facingReplacementStar: facingReplacement.star,
    },
    structure,
    repetition,
    chart,
    profile: useReplacement ? "Tam Nguyên Huyền Không · Thế Quái (沈氏替星 profile)" : "Tam Nguyên Huyền Không · Hạ Quái",
    note: useReplacement
      ? "Độ hướng nằm ngoài 9° trung tâm của Sơn nên bàn dùng替星 profile 沈氏: thay sao nhập Trung của Sơn/Hướng nhưng giữ chiều phi theo nguyên long quy chiếu. Các phái khác có dị bản替卦; hãy chọn cùng một profile khi đối chiếu."
      : shouldUseReplacement && replacementProfile === "off"
        ? "Độ hướng nằm trong vùng kiêm hướng nhưng Thế Quái đã bị tắt; bàn đang cưỡng chế dùng Hạ Quái để đối chiếu. Không nên dùng chế độ này như kết quả mặc định."
        : "Độ hướng nằm trong 9° trung tâm của Sơn nên dùng Hạ Quái theo 24 Sơn. Các ranh đo la bàn thực tế vẫn cần kiểm tra sai số thiết bị và môi trường.",
  };
}
