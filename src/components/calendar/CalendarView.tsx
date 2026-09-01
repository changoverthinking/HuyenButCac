import { useMemo, useState } from "react";
import {
  CALENDAR_MAX_YEAR,
  CALENDAR_MIN_YEAR,
  formatLunarDate,
  formatSolarDate,
  getCalendarDayInfo,
  getMonthCalendar,
  isTetHoliday,
  sameSolarDate,
  VIETNAM_TIMEZONE,
} from "../../features/calendar/lunarCalendar";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTHS = Array.from({ length: 12 }, (_, index) => index);
const YEARS = Array.from({ length: CALENDAR_MAX_YEAR - CALENDAR_MIN_YEAR + 1 }, (_, index) => CALENDAR_MIN_YEAR + index);

function clampYear(year: number) {
  return Math.min(CALENDAR_MAX_YEAR, Math.max(CALENDAR_MIN_YEAR, year));
}

function dateAtNoon(year: number, monthIndex: number, day: number) {
  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

export function CalendarView() {
  const today = useMemo(() => new Date(), []);
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(() => dateAtNoon(today.getFullYear(), today.getMonth(), today.getDate()));

  const monthDays = useMemo(() => getMonthCalendar(visibleYear, visibleMonth), [visibleYear, visibleMonth]);
  const selected = useMemo(() => getCalendarDayInfo(selectedDate), [selectedDate]);
  const holidaysThisMonth = useMemo(() => monthDays.filter((info) => info.solar.getMonth() === visibleMonth && info.holidays.length > 0), [monthDays, visibleMonth]);
  const lunarMonthsInView = useMemo(() => {
    const labels: string[] = [];
    const keys = new Set<string>();
    monthDays.forEach((info) => {
      if (info.solar.getMonth() !== visibleMonth) return;
      const key = `${info.lunar.year}-${info.lunar.month}-${info.lunar.isLeap ? 1 : 0}`;
      if (keys.has(key)) return;
      keys.add(key);
      labels.push(`T${info.lunar.month}${info.lunar.isLeap ? "N" : ""} ${info.canChi.month}`);
    });
    return labels;
  }, [monthDays, visibleMonth]);

  const goToMonth = (delta: number) => {
    const next = new Date(visibleYear, visibleMonth + delta, 1, 12);
    const nextYear = clampYear(next.getFullYear());
    if (next.getFullYear() !== nextYear) return;
    setVisibleYear(nextYear);
    setVisibleMonth(next.getMonth());
  };

  const goToday = () => {
    const now = new Date();
    setVisibleYear(clampYear(now.getFullYear()));
    setVisibleMonth(now.getMonth());
    setSelectedDate(dateAtNoon(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  const selectDay = (date: Date) => {
    setSelectedDate(dateAtNoon(date.getFullYear(), date.getMonth(), date.getDate()));
    if (date.getMonth() !== visibleMonth || date.getFullYear() !== visibleYear) {
      setVisibleMonth(date.getMonth());
      setVisibleYear(date.getFullYear());
    }
  };

  return (
    <div className="van-nien-view">
      <div className="van-nien-scroll">
        <section className="van-nien-hero">
          <div className="van-nien-hero-copy">
            <span className="van-nien-eyebrow">NHẬT NGUYỆT ĐỒ · LỊCH VIỆT NAM</span>
            <h2>Lịch Vạn Niên</h2>
            <p>Dương lịch và Âm lịch Việt Nam, Can Chi theo Lục Thập Hoa Giáp, Tết Nguyên Đán và các ngày lễ truyền thống.</p>
          </div>
          <div className="van-nien-hero-seal" aria-hidden="true">
            <span>曆</span>
            <small>VẠN NIÊN</small>
          </div>
        </section>

        <div className="van-nien-layout">
          <main className="van-nien-calendar-card">
            <header className="van-nien-calendar-toolbar">
              <div className="van-nien-month-nav">
                <button type="button" aria-label="Tháng trước" onClick={() => goToMonth(-1)}>‹</button>
                <div>
                  <strong>Tháng {visibleMonth + 1} · {visibleYear}</strong>
                  <small>Âm lịch: {lunarMonthsInView.join(" · ")}</small>
                </div>
                <button type="button" aria-label="Tháng sau" onClick={() => goToMonth(1)}>›</button>
              </div>

              <div className="van-nien-jump-controls">
                <select aria-label="Chọn tháng" value={visibleMonth} onChange={(event: { target: { value: string } }) => setVisibleMonth(Number(event.target.value))}>
                  {MONTHS.map((month) => <option key={month} value={month}>Tháng {month + 1}</option>)}
                </select>
                <select aria-label="Chọn năm" value={visibleYear} onChange={(event: { target: { value: string } }) => setVisibleYear(Number(event.target.value))}>
                  {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
                <button type="button" className="van-nien-today-button" onClick={goToday}>Hôm nay</button>
              </div>
            </header>

            <div className="van-nien-weekdays" aria-hidden="true">
              {WEEKDAYS.map((weekday, index) => <span key={weekday} className={index >= 5 ? "is-weekend" : ""}>{weekday}</span>)}
            </div>

            <div className="van-nien-grid" role="grid" aria-label={`Lịch tháng ${visibleMonth + 1} năm ${visibleYear}`}>
              {monthDays.map((info) => {
                const inMonth = info.solar.getMonth() === visibleMonth;
                const selectedDay = sameSolarDate(info.solar, selectedDate);
                const todayDay = sameSolarDate(info.solar, today);
                const sunday = info.solar.getDay() === 0;
                const saturday = info.solar.getDay() === 6;
                const tet = isTetHoliday(info);
                const majorHoliday = info.holidays.some((holiday) => holiday.importance === "major");
                const lunarMonthStart = info.lunar.day === 1;
                return (
                  <button
                    type="button"
                    role="gridcell"
                    key={`${info.solar.getFullYear()}-${info.solar.getMonth()}-${info.solar.getDate()}`}
                    className={`van-nien-day ${inMonth ? "" : "is-outside"} ${selectedDay ? "is-selected" : ""} ${todayDay ? "is-today" : ""} ${tet ? "is-tet" : ""} ${majorHoliday ? "has-major-holiday" : ""}`}
                    onClick={() => selectDay(info.solar)}
                    aria-label={`${formatSolarDate(info.solar)}, âm lịch ${formatLunarDate(info.lunar)}, ngày ${info.canChi.day}`}
                  >
                    <span className={`van-nien-solar-day ${sunday ? "is-sunday" : saturday ? "is-saturday" : ""}`}>{info.solar.getDate()}</span>
                    <span className="van-nien-lunar-date">{info.lunar.day}{lunarMonthStart ? `/${info.lunar.month}${info.lunar.isLeap ? "N" : ""}` : ""}</span>
                    <span className="van-nien-day-canchi">{info.canChi.day}</span>
                    {(info.holidays.length > 0 || lunarMonthStart) && (
                      <span className="van-nien-day-event">
                        {info.holidays.length > 0 ? (tet ? "TẾT" : info.holidays[0].name) : `Mùng 1 · ${info.canChi.month}`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <footer className="van-nien-calendar-legend">
              <span><i className="legend-dot is-solar" /> Số lớn: Dương lịch</span>
              <span><i className="legend-dot is-lunar" /> Số nhỏ: Âm lịch</span>
              <span><i className="legend-dot is-tet" /> Tết / ngày lễ lớn</span>
              <span className="van-nien-timezone">Âm lịch Việt Nam · UTC+{VIETNAM_TIMEZONE}</span>
            </footer>
          </main>

          <aside className="van-nien-detail-column">
            <section className="van-nien-day-detail">
              <div className="van-nien-detail-date">
                <span>{new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(selected.solar)}</span>
                <strong>{selected.solar.getDate()}</strong>
                <small>Tháng {selected.solar.getMonth() + 1} · {selected.solar.getFullYear()}</small>
              </div>

              <div className="van-nien-lunar-hero">
                <span>ÂM LỊCH</span>
                <strong>{selected.lunar.day}</strong>
                <div>
                  Tháng {selected.lunar.month}{selected.lunar.isLeap ? " nhuận" : ""} · {selected.lunar.year}
                </div>
                <small>{selected.canChi.year} · {selected.canChi.zodiac}</small>
              </div>

              {selected.holidays.length > 0 && (
                <div className="van-nien-holiday-list">
                  {selected.holidays.map((holiday) => (
                    <div key={`${holiday.kind}-${holiday.name}`} className={holiday.importance === "major" ? "is-major" : ""}>
                      <span aria-hidden="true">{holiday.kind === "lunar" ? "☾" : "☀"}</span>
                      <strong>{holiday.name}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="van-nien-canchi-list">
                <div>
                  <span>NĂM</span>
                  <strong>{selected.canChi.year}</strong>
                  <small>Hoa Giáp {selected.canChi.yearCycle}/60</small>
                </div>
                <div>
                  <span>THÁNG</span>
                  <strong>{selected.canChi.month}</strong>
                  <small>Hoa Giáp {selected.canChi.monthCycle}/60</small>
                </div>
                <div>
                  <span>NGÀY</span>
                  <strong>{selected.canChi.day}</strong>
                  <small>Hoa Giáp {selected.canChi.dayCycle}/60</small>
                </div>
              </div>
            </section>

            <section className="van-nien-month-events">
              <header>
                <div>
                  <span>SỰ KIỆN</span>
                  <strong>Ngày lễ trong tháng</strong>
                </div>
                <b>{holidaysThisMonth.length}</b>
              </header>
              <div className="van-nien-event-list">
                {holidaysThisMonth.length === 0 ? (
                  <p>Tháng này chưa có ngày lễ trong danh mục.</p>
                ) : holidaysThisMonth.map((info) => (
                  <button type="button" key={info.solar.toISOString()} onClick={() => selectDay(info.solar)}>
                    <time>{String(info.solar.getDate()).padStart(2, "0")}/{String(info.solar.getMonth() + 1).padStart(2, "0")}</time>
                    <span>
                      <strong>{info.holidays.map((holiday) => holiday.name).join(" · ")}</strong>
                      <small>Âm {info.lunar.day}/{info.lunar.month} · {info.canChi.day}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
