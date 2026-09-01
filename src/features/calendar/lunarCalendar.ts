export const VIETNAM_TIMEZONE = 7;
export const CALENDAR_MIN_YEAR = 1800;
export const CALENDAR_MAX_YEAR = 2199;

export const HEAVENLY_STEMS = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"] as const;
export const EARTHLY_BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"] as const;
export const ZODIAC = ["Tý · Chuột", "Sửu · Trâu", "Dần · Hổ", "Mão · Mèo", "Thìn · Rồng", "Tỵ · Rắn", "Ngọ · Ngựa", "Mùi · Dê", "Thân · Khỉ", "Dậu · Gà", "Tuất · Chó", "Hợi · Lợn"] as const;

export type LunarDate = {
  day: number;
  month: number;
  year: number;
  isLeap: boolean;
};

export type CanChiInfo = {
  year: string;
  month: string;
  day: string;
  yearCycle: number;
  monthCycle: number;
  dayCycle: number;
  zodiac: string;
};

export type CalendarHoliday = {
  name: string;
  kind: "lunar" | "solar";
  importance: "major" | "normal";
};

export type CalendarDayInfo = {
  solar: Date;
  lunar: LunarDate;
  canChi: CanChiInfo;
  holidays: CalendarHoliday[];
};

const TWO_PI = Math.PI * 2;

function intFloor(value: number) {
  return Math.floor(value);
}

/** Julian day number for the Gregorian/Julian civil date. */
export function julianDay(day: number, month: number, year: number) {
  const a = intFloor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  let jd = day + intFloor((153 * m + 2) / 5) + 365 * y + intFloor(y / 4) - intFloor(y / 100) + intFloor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = day + intFloor((153 * m + 2) / 5) + 365 * y + intFloor(y / 4) - 32083;
  }
  return jd;
}

/** Astronomical new moon time, expressed as Julian day. */
function newMoon(k: number) {
  const t = k / 1236.85;
  const t2 = t * t;
  const t3 = t2 * t;
  const dr = Math.PI / 180;

  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * dr);

  const m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3;
  const mPrime = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3;
  const f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3;

  let correction = (0.1734 - 0.000393 * t) * Math.sin(m * dr) + 0.0021 * Math.sin(2 * m * dr);
  correction -= 0.4068 * Math.sin(mPrime * dr);
  correction += 0.0161 * Math.sin(2 * mPrime * dr);
  correction -= 0.0004 * Math.sin(3 * mPrime * dr);
  correction += 0.0104 * Math.sin(2 * f * dr) - 0.0051 * Math.sin((m + mPrime) * dr);
  correction -= 0.0074 * Math.sin((m - mPrime) * dr);
  correction += 0.0004 * Math.sin((2 * f + m) * dr);
  correction -= 0.0004 * Math.sin((2 * f - m) * dr);
  correction -= 0.0006 * Math.sin((2 * f + mPrime) * dr);
  correction += 0.0010 * Math.sin((2 * f - mPrime) * dr) + 0.0005 * Math.sin((2 * mPrime + m) * dr);

  const deltaT = t < -11
    ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3
    : -0.000278 + 0.000265 * t + 0.000262 * t2;

  return jd1 + correction - deltaT;
}

function newMoonDay(k: number, timeZone = VIETNAM_TIMEZONE) {
  return intFloor(newMoon(k) + 0.5 + timeZone / 24);
}

function sunLongitudeRadians(jdn: number) {
  const t = (jdn - 2451545.0) / 36525;
  const t2 = t * t;
  const dr = Math.PI / 180;
  const m = 357.52910 + 35999.05030 * t - 0.0001559 * t2 - 0.00000048 * t * t2;
  const l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
  let dl = (1.914600 - 0.004817 * t - 0.000014 * t2) * Math.sin(dr * m);
  dl += (0.019993 - 0.000101 * t) * Math.sin(2 * dr * m) + 0.000290 * Math.sin(3 * dr * m);
  let longitude = (l0 + dl) * dr;
  longitude -= TWO_PI * intFloor(longitude / TWO_PI);
  return longitude;
}

function sunLongitudeSector(dayNumber: number, timeZone = VIETNAM_TIMEZONE) {
  return intFloor((sunLongitudeRadians(dayNumber - 0.5 - timeZone / 24) / Math.PI) * 6);
}

function lunarMonth11(year: number, timeZone = VIETNAM_TIMEZONE) {
  const off = julianDay(31, 12, year) - 2415021;
  const k = intFloor(off / 29.530588853);
  let nm = newMoonDay(k, timeZone);
  if (sunLongitudeSector(nm, timeZone) >= 9) nm = newMoonDay(k - 1, timeZone);
  return nm;
}

function leapMonthOffset(a11: number, timeZone = VIETNAM_TIMEZONE) {
  const k = intFloor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let last = 0;
  let i = 1;
  let arc = sunLongitudeSector(newMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i += 1;
    arc = sunLongitudeSector(newMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

/** Convert a Gregorian solar date to the Vietnamese lunar calendar (UTC+7). */
export function solarToLunar(day: number, month: number, year: number, timeZone = VIETNAM_TIMEZONE): LunarDate {
  const dayNumber = julianDay(day, month, year);
  const k = intFloor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = newMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) monthStart = newMoonDay(k, timeZone);

  let a11 = lunarMonth11(year, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = year;
    a11 = lunarMonth11(year - 1, timeZone);
  } else {
    lunarYear = year + 1;
    b11 = lunarMonth11(year + 1, timeZone);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = intFloor((monthStart - a11) / 29);
  let lunarMonth = diff + 11;
  let isLeap = false;

  if (b11 - a11 > 365) {
    const leapDiff = leapMonthOffset(a11, timeZone);
    if (diff >= leapDiff) {
      lunarMonth = diff + 10;
      if (diff === leapDiff) isLeap = true;
    }
  }

  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  return { day: lunarDay, month: lunarMonth, year: lunarYear, isLeap };
}

function positiveMod(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

export function canChiYear(lunarYear: number) {
  return `${HEAVENLY_STEMS[positiveMod(lunarYear + 6, 10)]} ${EARTHLY_BRANCHES[positiveMod(lunarYear + 8, 12)]}`;
}

export function canChiMonth(lunarMonth: number, lunarYear: number) {
  return `${HEAVENLY_STEMS[positiveMod(lunarYear * 12 + lunarMonth + 3, 10)]} ${EARTHLY_BRANCHES[positiveMod(lunarMonth + 1, 12)]}`;
}

export function canChiDay(day: number, month: number, year: number) {
  const jd = julianDay(day, month, year);
  return `${HEAVENLY_STEMS[positiveMod(jd + 9, 10)]} ${EARTHLY_BRANCHES[positiveMod(jd + 1, 12)]}`;
}

/** 1..60 position inside the sexagenary cycle. */
export function sexagenaryCyclePosition(stemIndex: number, branchIndex: number) {
  for (let i = 0; i < 60; i += 1) {
    if (i % 10 === positiveMod(stemIndex, 10) && i % 12 === positiveMod(branchIndex, 12)) return i + 1;
  }
  return 1;
}

function cyclePositionForYear(lunarYear: number) {
  return sexagenaryCyclePosition(positiveMod(lunarYear + 6, 10), positiveMod(lunarYear + 8, 12));
}

function cyclePositionForMonth(lunarMonth: number, lunarYear: number) {
  return sexagenaryCyclePosition(positiveMod(lunarYear * 12 + lunarMonth + 3, 10), positiveMod(lunarMonth + 1, 12));
}

function cyclePositionForDay(day: number, month: number, year: number) {
  const jd = julianDay(day, month, year);
  return sexagenaryCyclePosition(positiveMod(jd + 9, 10), positiveMod(jd + 1, 12));
}

export function getCanChiInfo(day: number, month: number, year: number, lunar: LunarDate): CanChiInfo {
  const branchIndex = positiveMod(lunar.year + 8, 12);
  return {
    year: canChiYear(lunar.year),
    month: canChiMonth(lunar.month, lunar.year),
    day: canChiDay(day, month, year),
    yearCycle: cyclePositionForYear(lunar.year),
    monthCycle: cyclePositionForMonth(lunar.month, lunar.year),
    dayCycle: cyclePositionForDay(day, month, year),
    zodiac: ZODIAC[branchIndex],
  };
}

const SOLAR_HOLIDAYS: Record<string, CalendarHoliday[]> = {
  "1-1": [{ name: "Tết Dương lịch", kind: "solar", importance: "major" }],
  "3-8": [{ name: "Quốc tế Phụ nữ", kind: "solar", importance: "normal" }],
  "4-30": [{ name: "Ngày Giải phóng miền Nam", kind: "solar", importance: "major" }],
  "5-1": [{ name: "Quốc tế Lao động", kind: "solar", importance: "major" }],
  "9-2": [{ name: "Quốc khánh Việt Nam", kind: "solar", importance: "major" }],
  "10-20": [{ name: "Phụ nữ Việt Nam", kind: "solar", importance: "normal" }],
  "11-20": [{ name: "Nhà giáo Việt Nam", kind: "solar", importance: "normal" }],
};

const LUNAR_HOLIDAYS: Record<string, CalendarHoliday[]> = {
  "1-1": [{ name: "Tết Nguyên Đán · Mùng 1", kind: "lunar", importance: "major" }],
  "1-2": [{ name: "Tết Nguyên Đán · Mùng 2", kind: "lunar", importance: "major" }],
  "1-3": [{ name: "Tết Nguyên Đán · Mùng 3", kind: "lunar", importance: "major" }],
  "1-15": [{ name: "Tết Nguyên Tiêu · Rằm tháng Giêng", kind: "lunar", importance: "normal" }],
  "3-10": [{ name: "Giỗ Tổ Hùng Vương", kind: "lunar", importance: "major" }],
  "5-5": [{ name: "Tết Đoan Ngọ", kind: "lunar", importance: "normal" }],
  "7-15": [{ name: "Rằm tháng Bảy", kind: "lunar", importance: "normal" }],
  "8-15": [{ name: "Tết Trung Thu", kind: "lunar", importance: "normal" }],
  "12-23": [{ name: "Ông Công Ông Táo", kind: "lunar", importance: "normal" }],
};

export function getHolidays(day: number, month: number, year: number, lunar: LunarDate) {
  const solarKey = `${month}-${day}`;
  const lunarKey = `${lunar.month}-${lunar.day}`;
  const holidays = [...(SOLAR_HOLIDAYS[solarKey] ?? [])];
  if (!lunar.isLeap) holidays.push(...(LUNAR_HOLIDAYS[lunarKey] ?? []));

  // Giao thừa luôn là ngày cuối tháng Chạp; có năm là 29, có năm là 30.
  if (!lunar.isLeap && lunar.month === 12) {
    const nextSolar = new Date(year, month - 1, day + 1, 12);
    const nextLunar = solarToLunar(nextSolar.getDate(), nextSolar.getMonth() + 1, nextSolar.getFullYear());
    if (nextLunar.day === 1 && nextLunar.month === 1) {
      holidays.push({ name: "Giao thừa · Đêm Trừ Tịch", kind: "lunar", importance: "major" });
    }
  }
  return holidays;
}

export function getCalendarDayInfo(date: Date): CalendarDayInfo {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const lunar = solarToLunar(day, month, year);
  return {
    solar: new Date(year, month - 1, day),
    lunar,
    canChi: getCanChiInfo(day, month, year, lunar),
    holidays: getHolidays(day, month, year, lunar),
  };
}

export function isTetHoliday(info: CalendarDayInfo) {
  return info.holidays.some((holiday) => holiday.name.startsWith("Tết Nguyên Đán"));
}

export function daysInSolarMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function getMonthCalendar(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const mondayBasedOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, monthIndex, 1 - mondayBasedOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return getCalendarDayInfo(date);
  });
}

export function sameSolarDate(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatSolarDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function formatLunarDate(lunar: LunarDate) {
  return `${lunar.day}/${lunar.month}/${lunar.year}${lunar.isLeap ? " (nhuận)" : ""}`;
}

export function vietnameseLunarMonthName(month: number) {
  const names = ["Giêng", "Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy", "Tám", "Chín", "Mười", "Mười Một", "Chạp"];
  return names[month - 1] ?? String(month);
}

export function getLunarMonthTitle(info: CalendarDayInfo) {
  const leap = info.lunar.isLeap ? " nhuận" : "";
  return `Tháng ${vietnameseLunarMonthName(info.lunar.month)}${leap} · ${info.canChi.month}`;
}
