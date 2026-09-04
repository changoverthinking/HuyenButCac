export const TU_VI_BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] as const;
const BRANCH_RING = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"] as const;
export const TU_VI_HOUR_BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] as const;
export const TU_VI_PALACE_NAMES = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"] as const;

export type TuViBranch = (typeof TU_VI_BRANCHES)[number];
export type TuViPalaceName = (typeof TU_VI_PALACE_NAMES)[number];

export function mod(value: number, divisor: number) { return ((value % divisor) + divisor) % divisor; }

export function branchIndex(branch: string) {
  const index = TU_VI_BRANCHES.indexOf(branch as TuViBranch);
  if (index < 0) throw new Error(`Địa Chi không hợp lệ: ${branch}`);
  return index;
}

export function branchAt(index: number): TuViBranch {
  return TU_VI_BRANCHES[mod(index, 12)];
}

export function getHourBranch(hour: number) {
  const normalized = mod(Math.trunc(hour), 24);
  const index = normalized === 23 ? 0 : Math.floor((normalized + 1) / 2);
  return TU_VI_HOUR_BRANCHES[index % 12];
}

/**
 * Lập Mệnh/Thân và 12 cung chức.
 * - Tháng Giêng khởi tại Dần, đếm thuận đến tháng sinh.
 * - Từ vị trí tháng: nghịch giờ sinh để an Mệnh, thuận giờ sinh để an Thân.
 * - 12 cung chức đi thuận địa chi từ Mệnh: Mệnh → Phụ Mẫu → ... → Huynh Đệ.
 */
export function buildTuViFoundation(lunarMonth: number, hour: number) {
  if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) throw new Error("Tháng âm lịch phải từ 1 đến 12.");
  const hourBranch = getHourBranch(hour);
  const hourIndex = TU_VI_HOUR_BRANCHES.indexOf(hourBranch);
  const monthPosition = lunarMonth - 1; // Dần = tháng Giêng trong BRANCH_RING.
  const menhIndex = mod(monthPosition - hourIndex, 12);
  const thanIndex = mod(monthPosition + hourIndex, 12);
  const menhBranch = BRANCH_RING[menhIndex];
  const thanBranch = BRANCH_RING[thanIndex];

  // Lưu ý: các cung chức đi THUẬN từ Mệnh. Bản 0.18.0 ban đầu dùng dấu trừ
  // khiến Phụ Mẫu/Huynh Đệ đảo chiều; regression sample Mậu Dần 1998 đã bắt lỗi này.
  const palaces = TU_VI_PALACE_NAMES.map((name, offset) => ({
    name,
    branch: BRANCH_RING[mod(menhIndex + offset, 12)],
  }));

  return { hourBranch, menhBranch, thanBranch, palaces };
}

export const TU_VI_GRID_POSITION: Record<string, { row: number; col: number }> = {
  "Tỵ": { row: 1, col: 1 }, "Ngọ": { row: 1, col: 2 }, "Mùi": { row: 1, col: 3 }, "Thân": { row: 1, col: 4 },
  "Thìn": { row: 2, col: 1 }, "Dậu": { row: 2, col: 4 },
  "Mão": { row: 3, col: 1 }, "Tuất": { row: 3, col: 4 },
  "Dần": { row: 4, col: 1 }, "Sửu": { row: 4, col: 2 }, "Tý": { row: 4, col: 3 }, "Hợi": { row: 4, col: 4 },
};
