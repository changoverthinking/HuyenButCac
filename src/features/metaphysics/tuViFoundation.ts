const BRANCH_RING = ["Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu"] as const;
const HOUR_BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] as const;
const PALACE_NAMES = ["Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ"] as const;

function mod(value: number, divisor: number) { return ((value % divisor) + divisor) % divisor; }

export function getHourBranch(hour: number) {
  const normalized = mod(Math.trunc(hour), 24);
  const index = normalized === 23 ? 0 : Math.floor((normalized + 1) / 2);
  return HOUR_BRANCHES[index % 12];
}

export function buildTuViFoundation(lunarMonth: number, hour: number) {
  if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) throw new Error("Tháng âm lịch phải từ 1 đến 12.");
  const hourBranch = getHourBranch(hour);
  const hourIndex = HOUR_BRANCHES.indexOf(hourBranch);
  const monthPosition = lunarMonth - 1; // Dần = tháng Giêng.
  const menhIndex = mod(monthPosition - hourIndex, 12);
  const thanIndex = mod(monthPosition + hourIndex, 12);
  const menhBranch = BRANCH_RING[menhIndex];
  const thanBranch = BRANCH_RING[thanIndex];

  const palaces = PALACE_NAMES.map((name, offset) => ({
    name,
    branch: BRANCH_RING[mod(menhIndex - offset, 12)],
  }));

  return { hourBranch, menhBranch, thanBranch, palaces };
}

export const TU_VI_GRID_POSITION: Record<string, { row: number; col: number }> = {
  "Tỵ": { row: 1, col: 1 }, "Ngọ": { row: 1, col: 2 }, "Mùi": { row: 1, col: 3 }, "Thân": { row: 1, col: 4 },
  "Thìn": { row: 2, col: 1 }, "Dậu": { row: 2, col: 4 },
  "Mão": { row: 3, col: 1 }, "Tuất": { row: 3, col: 4 },
  "Dần": { row: 4, col: 1 }, "Sửu": { row: 4, col: 2 }, "Tý": { row: 4, col: 3 }, "Hợi": { row: 4, col: 4 },
};
