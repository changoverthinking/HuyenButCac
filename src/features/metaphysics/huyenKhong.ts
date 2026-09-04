export type FlyingStarCell = { palace: string; star: number };

const LO_SHU_FLIGHT = ["Trung", "Tây Bắc", "Tây", "Đông Bắc", "Nam", "Bắc", "Tây Nam", "Đông", "Đông Nam"] as const;

function mod(value: number, divisor: number) { return ((value % divisor) + divisor) % divisor; }

export function getNinePeriod(year: number) {
  if (!Number.isInteger(year) || year < 1864 || year > 2403) throw new Error("Cửu Vận bản này hỗ trợ năm 1864–2403.");
  const cycleOffset = mod(year - 1864, 180);
  const period = Math.floor(cycleOffset / 20) + 1;
  const cycleStart = year - cycleOffset;
  const startYear = cycleStart + (period - 1) * 20;
  return { period, startYear, endYear: startYear + 19, cycleStart, cycleEnd: cycleStart + 179 };
}

export function buildBasePeriodFlyingStars(year: number): FlyingStarCell[] {
  const { period } = getNinePeriod(year);
  return LO_SHU_FLIGHT.map((palace, step) => ({ palace, star: ((period - 1 + step) % 9) + 1 }));
}
