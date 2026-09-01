import { describe, expect, it } from "vitest";
import { canChiDay, getCalendarDayInfo, julianDay, solarToLunar } from "../features/calendar/lunarCalendar";

describe("Vietnamese lunar calendar", () => {
  it("converts 01/09/2026 to the verified Vietnamese lunar date", () => {
    const lunar = solarToLunar(1, 9, 2026);
    expect(lunar).toEqual({ day: 20, month: 7, year: 2026, isLeap: false });

    const info = getCalendarDayInfo(new Date(2026, 8, 1, 12));
    expect(info.canChi.day).toBe("Mậu Dần");
    expect(info.canChi.month).toBe("Bính Thân");
    expect(info.canChi.year).toBe("Bính Ngọ");
  });

  it("recognizes Lunar New Year 2026", () => {
    const eve = getCalendarDayInfo(new Date(2026, 1, 16, 12));
    expect(eve.holidays.some((holiday) => holiday.name.includes("Giao thừa"))).toBe(true);

    const info = getCalendarDayInfo(new Date(2026, 1, 17, 12));
    expect(info.lunar).toEqual({ day: 1, month: 1, year: 2026, isLeap: false });
    expect(info.canChi.day).toBe("Nhâm Tuất");
    expect(info.canChi.month).toBe("Canh Dần");
    expect(info.holidays.some((holiday) => holiday.name.includes("Tết Nguyên Đán"))).toBe(true);
  });

  it("matches known historical month samples", () => {
    expect(solarToLunar(1, 9, 1990)).toEqual({ day: 13, month: 7, year: 1990, isLeap: false });
    expect(solarToLunar(1, 10, 2002)).toEqual({ day: 25, month: 8, year: 2002, isLeap: false });
  });

  it("calculates Can Chi day from the continuous 60-day cycle", () => {
    expect(canChiDay(30, 8, 2026)).toBe("Bính Tý");
    expect(canChiDay(1, 9, 2026)).toBe("Mậu Dần");
    expect(julianDay(1, 9, 2026) - julianDay(30, 8, 2026)).toBe(2);
  });
});
