import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { AppErrorBoundary } from "../common/AppErrorBoundary";
import type { CalendarEvent, CalendarEventColor } from "../../types/entities";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvent,
  listCalendarEvents,
  reconcileCalendarReminderJobs,
  updateCalendarEvent,
} from "../../features/calendar/calendarEventsService";
import {
  getNotificationCapability,
  registerPushSubscription,
  requestCalendarNotificationPermission,
} from "../../features/calendar/notificationService";
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

const HuyenHocPanel = lazy(() => import("../metaphysics/HuyenHocPanel").then((module) => ({ default: module.HuyenHocPanel })));

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTHS = Array.from({ length: 12 }, (_, index) => index);
const YEARS = Array.from({ length: CALENDAR_MAX_YEAR - CALENDAR_MIN_YEAR + 1 }, (_, index) => CALENDAR_MIN_YEAR + index);
const COLORS: Array<{ id: CalendarEventColor; label: string }> = [
  { id: "jade", label: "Thanh ngọc" }, { id: "gold", label: "Kim" }, { id: "crimson", label: "Chu sa" },
  { id: "azure", label: "Thanh lam" }, { id: "violet", label: "Tử vân" },
];

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const REMIND_OPTIONS = [
  { value: "none", label: "Không nhắc" }, { value: "0", label: "Đúng giờ" }, { value: "5", label: "Trước 5 phút" },
  { value: "15", label: "Trước 15 phút" }, { value: "30", label: "Trước 30 phút" }, { value: "60", label: "Trước 1 giờ" },
  { value: "1440", label: "Trước 1 ngày" },
];

function clampYear(year: number) { return Math.min(CALENDAR_MAX_YEAR, Math.max(CALENDAR_MIN_YEAR, year)); }
function dateAtNoon(year: number, monthIndex: number, day: number) { return new Date(year, monthIndex, day, 12, 0, 0, 0); }
function dayKey(date: Date | number) {
  const value = typeof date === "number" ? new Date(date) : date;
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
function dateInputValue(date: Date) { return dayKey(date); }
function timeInputValue(date: Date) { return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`; }
function parseLocalDateTime(date: string, time: string, allDay: boolean) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = (allDay ? "09:00" : time).split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
}
function reminderOffsetValue(event: CalendarEvent) {
  if (event.remindAt == null) return "none";
  const minutes = Math.round((event.startsAt - event.remindAt) / 60_000);
  return REMIND_OPTIONS.some((option) => option.value === String(minutes)) ? String(minutes) : "0";
}

export function CalendarView() {
  const today = useMemo(() => new Date(), []);
  const [visibleYear, setVisibleYear] = useState(today.getFullYear());
  const [visibleMonth, setVisibleMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(() => dateAtNoon(today.getFullYear(), today.getMonth(), today.getDate()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formDate, setFormDate] = useState(dateInputValue(today));
  const [formTime, setFormTime] = useState("09:00");
  const [formAllDay, setFormAllDay] = useState(false);
  const [formReminder, setFormReminder] = useState("15");
  const [formColor, setFormColor] = useState<CalendarEventColor>("jade");
  const [savingEvent, setSavingEvent] = useState(false);
  const [eventMessage, setEventMessage] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationRevision, setNotificationRevision] = useState(0);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const capability = useMemo(() => getNotificationCapability(), [notificationRevision]);
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

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = dayKey(event.startsAt);
      const list = map.get(key) ?? [];
      list.push(event); map.set(key, list);
    }
    return map;
  }, [events]);
  const selectedEvents = useMemo(() => eventsByDay.get(dayKey(selectedDate)) ?? [], [eventsByDay, selectedDate]);

  async function reloadEvents() {
    const rows = await listCalendarEvents();
    setEvents(rows);
  }

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      const rows = await listCalendarEvents();
      if (disposed) return;
      setEvents(rows);
      const params = new URLSearchParams(window.location.search);
      const eventId = params.get("event");
      if (eventId) {
        const target = await getCalendarEvent(eventId);
        if (target && !disposed) {
          const date = new Date(target.startsAt);
          setSelectedDate(dateAtNoon(date.getFullYear(), date.getMonth(), date.getDate()));
          setVisibleYear(date.getFullYear()); setVisibleMonth(date.getMonth());
          openEdit(target);
        }
      } else if (params.get("calendar") === "new") {
        openCreate(selectedDate);
      }
      void reconcileCalendarReminderJobs();
      if (typeof Notification !== "undefined" && Notification.permission === "granted") void registerPushSubscription().catch(() => undefined);
    };
    void load();
    const changed = () => void reloadEvents();
    const synced = (event: Event) => {
      const tables = (event as CustomEvent<{ tables?: string[] }>).detail?.tables ?? [];
      if (tables.includes("calendarEvents")) void reloadEvents();
    };
    window.addEventListener("hbc-calendar-events-changed", changed);
    window.addEventListener("hbc-sync-complete", synced);
    return () => { disposed = true; window.removeEventListener("hbc-calendar-events-changed", changed); window.removeEventListener("hbc-sync-complete", synced); };
    // Deep-link chỉ xử lý một lần khi mở module.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      const installEvent = event as BeforeInstallPromptEvent;
      installEvent.preventDefault();
      setInstallPrompt(installEvent);
    };
    const installed = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  async function installPwa() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  }

  const goToMonth = (delta: number) => {
    const next = new Date(visibleYear, visibleMonth + delta, 1, 12);
    const nextYear = clampYear(next.getFullYear());
    if (next.getFullYear() !== nextYear) return;
    setVisibleYear(nextYear); setVisibleMonth(next.getMonth());
  };
  const goToday = () => {
    const now = new Date();
    setVisibleYear(clampYear(now.getFullYear())); setVisibleMonth(now.getMonth());
    setSelectedDate(dateAtNoon(now.getFullYear(), now.getMonth(), now.getDate()));
  };
  const selectDay = (date: Date) => {
    setSelectedDate(dateAtNoon(date.getFullYear(), date.getMonth(), date.getDate()));
    if (date.getMonth() !== visibleMonth || date.getFullYear() !== visibleYear) { setVisibleMonth(date.getMonth()); setVisibleYear(date.getFullYear()); }
  };

  function resetForm(date: Date) {
    setEditing(null); setFormTitle(""); setFormNote(""); setFormDate(dateInputValue(date)); setFormTime("09:00");
    setFormAllDay(false); setFormReminder("15"); setFormColor("jade"); setEventMessage("");
  }
  function openCreate(date: Date) { resetForm(date); setComposerOpen(true); }
  function openEdit(event: CalendarEvent) {
    const date = new Date(event.startsAt);
    setEditing(event); setFormTitle(event.title); setFormNote(event.note); setFormDate(dateInputValue(date)); setFormTime(timeInputValue(date));
    setFormAllDay(event.allDay); setFormReminder(reminderOffsetValue(event)); setFormColor(event.color); setEventMessage(""); setComposerOpen(true);
  }
  async function saveEvent(e: React.FormEvent) {
    e.preventDefault(); setSavingEvent(true); setEventMessage("");
    try {
      const startsAt = parseLocalDateTime(formDate, formTime, formAllDay);
      const remindAt = formReminder === "none" ? null : startsAt - Number(formReminder) * 60_000;
      const input = { title: formTitle, note: formNote, startsAt, remindAt, allDay: formAllDay, color: formColor };
      if (editing) await updateCalendarEvent(editing.id, input); else await createCalendarEvent(input);
      const nextDate = new Date(startsAt); selectDay(nextDate); setComposerOpen(false); setEditing(null); await reloadEvents();
    } catch (error) { setEventMessage(error instanceof Error ? error.message : "Không thể lưu lịch hẹn."); }
    finally { setSavingEvent(false); }
  }
  async function removeEvent(event: CalendarEvent) {
    if (!window.confirm(`Xóa lịch hẹn “${event.title}”?`)) return;
    await deleteCalendarEvent(event.id); if (editing?.id === event.id) setComposerOpen(false); await reloadEvents();
  }
  async function enableNotifications() {
    setNotificationBusy(true); setNotificationMessage("");
    try {
      const result = await requestCalendarNotificationPermission();
      setNotificationRevision((value) => value + 1);
      if (result.mode === "push") {
        setNotificationMessage("Đã bật Web Push nền cho thiết bị này. Khi app đóng, server vẫn có thể gửi nhắc lịch đến hạn.");
      } else if ("reason" in result && result.reason) {
        setNotificationMessage(`Thông báo trên thiết bị đã bật, nhưng Web Push nền chưa đăng ký được: ${result.reason}`);
      } else {
        setNotificationMessage("Đã bật thông báo local. Để nhận khi app đóng, hãy đăng nhập và cấu hình Web Push theo tài liệu kèm dự án.");
      }
    }
    catch (error) { setNotificationMessage(error instanceof Error ? error.message : "Không thể bật thông báo."); }
    finally { setNotificationBusy(false); }
  }

  return (
    <div className="van-nien-view">
      <div className="van-nien-scroll">
        <section className="van-nien-hero">
          <div className="van-nien-hero-copy">
            <span className="van-nien-eyebrow">NHẬT NGUYỆT ĐỒ · LỊCH VIỆT NAM</span>
            <h2>Lịch Vạn Niên</h2>
            <p>Dương lịch, Âm lịch Việt Nam, Can Chi Lục Thập Hoa Giáp, lịch hẹn cá nhân và nhắc hạn trên thiết bị.</p>
          </div>
          <div className="van-nien-hero-actions">
            <button type="button" className="van-nien-add-event" onClick={() => openCreate(selectedDate)}>＋ Đặt lịch</button>
            <div className={`van-nien-notify-chip ${capability.permission === "granted" ? "is-on" : ""}`}>
              <span>{capability.permission === "granted" ? "●" : "○"}</span>
              <small>{capability.permission === "granted" ? "Thông báo đã bật" : "Chưa bật thông báo"}</small>
            </div>
          </div>
          <div className="van-nien-hero-seal" aria-hidden="true"><span>曆</span><small>VẠN NIÊN</small></div>
        </section>

        <section className="van-nien-reminder-banner">
          <div>
            <strong>🔔 Nhắc lịch trên điện thoại & máy tính</strong>
            <span>{capability.permission === "granted"
              ? (capability.pushConfigured ? "Thông báo hệ thống đã sẵn sàng. Đăng nhập cùng tài khoản trên nhiều thiết bị để nhận lịch đồng bộ." : "Thông báo local đã bật. Muốn nhận khi app đóng, cần cấu hình Web Push theo hướng dẫn Supabase kèm trong bản này.")
              : "Bật quyền một lần để lịch đến hạn hiện như thông báo của ứng dụng."}</span>
          </div>
          {capability.permission !== "granted" && <button type="button" disabled={notificationBusy || !capability.supported} onClick={() => void enableNotifications()}>{notificationBusy ? "Đang bật…" : capability.supported ? "Bật thông báo" : "Không hỗ trợ"}</button>}
          {capability.permission === "granted" && <span className="van-nien-reminder-ready">✓ Sẵn sàng</span>}
        </section>
        {notificationMessage && <p className="van-nien-notification-message" role="status">{notificationMessage}</p>}

        <div className="van-nien-layout">
          <main className="van-nien-calendar-card">
            <header className="van-nien-calendar-toolbar">
              <div className="van-nien-month-nav">
                <button type="button" aria-label="Tháng trước" onClick={() => goToMonth(-1)}>‹</button>
                <div><strong>Tháng {visibleMonth + 1} · {visibleYear}</strong><small>Âm lịch: {lunarMonthsInView.join(" · ")}</small></div>
                <button type="button" aria-label="Tháng sau" onClick={() => goToMonth(1)}>›</button>
              </div>
              <div className="van-nien-jump-controls">
                <select aria-label="Chọn tháng" value={visibleMonth} onChange={(event) => setVisibleMonth(Number(event.target.value))}>{MONTHS.map((month) => <option key={month} value={month}>Tháng {month + 1}</option>)}</select>
                <select aria-label="Chọn năm" value={visibleYear} onChange={(event) => setVisibleYear(Number(event.target.value))}>{YEARS.map((year) => <option key={year} value={year}>{year}</option>)}</select>
                <button type="button" className="van-nien-today-button" onClick={goToday}>Hôm nay</button>
              </div>
            </header>
            <div className="van-nien-weekdays" aria-hidden="true">{WEEKDAYS.map((weekday, index) => <span key={weekday} className={index >= 5 ? "is-weekend" : ""}>{weekday}</span>)}</div>
            <div className="van-nien-grid" role="grid" aria-label={`Lịch tháng ${visibleMonth + 1} năm ${visibleYear}`}>
              {monthDays.map((info) => {
                const inMonth = info.solar.getMonth() === visibleMonth;
                const selectedDay = sameSolarDate(info.solar, selectedDate);
                const todayDay = sameSolarDate(info.solar, today);
                const sunday = info.solar.getDay() === 0; const saturday = info.solar.getDay() === 6;
                const tet = isTetHoliday(info); const majorHoliday = info.holidays.some((holiday) => holiday.importance === "major"); const lunarMonthStart = info.lunar.day === 1;
                const dayEvents = eventsByDay.get(dayKey(info.solar)) ?? [];
                return (
                  <button type="button" role="gridcell" key={dayKey(info.solar)}
                    className={`van-nien-day ${inMonth ? "" : "is-outside"} ${selectedDay ? "is-selected" : ""} ${todayDay ? "is-today" : ""} ${tet ? "is-tet" : ""} ${majorHoliday ? "has-major-holiday" : ""} ${dayEvents.length ? "has-user-event" : ""}`}
                    onClick={() => selectDay(info.solar)}
                    aria-label={`${formatSolarDate(info.solar)}, âm lịch ${formatLunarDate(info.lunar)}, ngày ${info.canChi.day}, ${dayEvents.length} lịch hẹn`}>
                    <span className={`van-nien-solar-day ${sunday ? "is-sunday" : saturday ? "is-saturday" : ""}`}>{info.solar.getDate()}</span>
                    <span className="van-nien-lunar-date">{info.lunar.day}{lunarMonthStart ? `/${info.lunar.month}${info.lunar.isLeap ? "N" : ""}` : ""}</span>
                    <span className="van-nien-day-canchi">{info.canChi.day}</span>
                    {(dayEvents.length > 0 || info.holidays.length > 0 || lunarMonthStart) && <span className="van-nien-day-event">{dayEvents.length > 0 ? `● ${dayEvents[0].title}${dayEvents.length > 1 ? ` +${dayEvents.length - 1}` : ""}` : info.holidays.length > 0 ? (tet ? "TẾT" : info.holidays[0].name) : `Mùng 1 · ${info.canChi.month}`}</span>}
                  </button>
                );
              })}
            </div>
            <footer className="van-nien-calendar-legend">
              <span><i className="legend-dot is-solar" /> Số lớn: Dương lịch</span><span><i className="legend-dot is-lunar" /> Số nhỏ: Âm lịch</span><span><i className="legend-dot is-tet" /> Tết / ngày lễ lớn</span><span><i className="legend-dot is-user-event" /> Lịch cá nhân</span><span className="van-nien-timezone">Âm lịch Việt Nam · UTC+{VIETNAM_TIMEZONE}</span>
            </footer>
          </main>

          <aside className="van-nien-detail-column">
            <section className="van-nien-day-detail">
              <div className="van-nien-detail-date"><span>{new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(selected.solar)}</span><strong>{selected.solar.getDate()}</strong><small>Tháng {selected.solar.getMonth() + 1} · {selected.solar.getFullYear()}</small></div>
              <div className="van-nien-lunar-hero"><span>ÂM LỊCH</span><strong>{selected.lunar.day}</strong><div>Tháng {selected.lunar.month}{selected.lunar.isLeap ? " nhuận" : ""} · {selected.lunar.year}</div><small>{selected.canChi.year} · {selected.canChi.zodiac}</small></div>
              {selected.holidays.length > 0 && <div className="van-nien-holiday-list">{selected.holidays.map((holiday) => <div key={`${holiday.kind}-${holiday.name}`} className={holiday.importance === "major" ? "is-major" : ""}><span aria-hidden="true">{holiday.kind === "lunar" ? "☾" : "☀"}</span><strong>{holiday.name}</strong></div>)}</div>}
              <div className="van-nien-canchi-list"><div><span>NĂM</span><strong>{selected.canChi.year}</strong><small>Hoa Giáp {selected.canChi.yearCycle}/60</small></div><div><span>THÁNG</span><strong>{selected.canChi.month}</strong><small>Hoa Giáp {selected.canChi.monthCycle}/60</small></div><div><span>NGÀY</span><strong>{selected.canChi.day}</strong><small>Hoa Giáp {selected.canChi.dayCycle}/60</small></div></div>
            </section>

            <section className="van-nien-user-events">
              <header><div><span>LỊCH CỦA TÔI</span><strong>{formatSolarDate(selectedDate)}</strong></div><button type="button" onClick={() => openCreate(selectedDate)}>＋ Thêm</button></header>
              <div className="van-nien-user-event-list">
                {selectedEvents.length === 0 ? <p>Chưa có ghi chú/lịch hẹn trong ngày này.</p> : selectedEvents.map((event) => (
                  <article key={event.id} className={`event-${event.color}`}>
                    <button type="button" className="van-nien-event-main" onClick={() => openEdit(event)}>
                      <time>{event.allDay ? "Cả ngày" : new Date(event.startsAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</time>
                      <span><strong>{event.title}</strong>{event.note && <small>{event.note}</small>}{event.remindAt != null && <em>🔔 {new Date(event.remindAt).toLocaleString("vi-VN")}</em>}</span>
                    </button>
                    <button type="button" className="van-nien-event-delete" aria-label={`Xóa ${event.title}`} onClick={() => void removeEvent(event)}>×</button>
                  </article>
                ))}
              </div>
            </section>

            <section className="van-nien-shortcuts-card">
              <header><span>TIỆN ÍCH NHANH</span><strong>Shortcut màn hình</strong></header>
              <div>
                <span className="van-nien-shortcut-icon">曆</span>
                <p><strong>{capability.installedLikeApp ? "Đã mở dạng ứng dụng" : "Cài Huyền Bút Các ra màn hình chính"}</strong><small>Manifest đã có shortcut <b>Lịch hôm nay</b> và <b>Đặt lịch mới</b>. Hệ điều hành hỗ trợ có thể hiện khi nhấn giữ/chuột phải icon ứng dụng.</small></p>
              </div>
              {!capability.installedLikeApp && installPrompt && <button type="button" className="van-nien-install-button" onClick={() => void installPwa()}>＋ Cài ra màn hình</button>}
              <small>iPhone/iPad: dùng “Thêm vào Màn hình chính” trước khi bật Web Push. Widget native hiển thị trực tiếp lịch trên màn hình không thuộc chuẩn PWA.</small>
            </section>

            <section className="van-nien-month-events">
              <header><div><span>SỰ KIỆN</span><strong>Ngày lễ trong tháng</strong></div><b>{holidaysThisMonth.length}</b></header>
              <div className="van-nien-event-list">{holidaysThisMonth.length === 0 ? <p>Tháng này chưa có ngày lễ trong danh mục.</p> : holidaysThisMonth.map((info) => <button type="button" key={info.solar.toISOString()} onClick={() => selectDay(info.solar)}><time>{String(info.solar.getDate()).padStart(2, "0")}/{String(info.solar.getMonth() + 1).padStart(2, "0")}</time><span><strong>{info.holidays.map((holiday) => holiday.name).join(" · ")}</strong><small>Âm {info.lunar.day}/{info.lunar.month} · {info.canChi.day}</small></span></button>)}</div>
            </section>
          </aside>
        </div>

        <AppErrorBoundary area="Huyền Học Các" compact>
          <Suspense fallback={<div className="hh-loading">Đang mở Huyền Học Các…</div>}>
            <HuyenHocPanel />
          </Suspense>
        </AppErrorBoundary>
      </div>

      {composerOpen && <div className="van-nien-event-modal" role="dialog" aria-modal="true" aria-label={editing ? "Sửa lịch hẹn" : "Tạo lịch hẹn"}>
        <button type="button" className="van-nien-event-modal-backdrop" aria-label="Đóng" onClick={() => setComposerOpen(false)} />
        <form className="van-nien-event-editor" onSubmit={saveEvent}>
          <header><div><span>NHẬT TRÌNH</span><strong>{editing ? "Sửa lịch hẹn" : "Ghi chú & đặt lịch"}</strong></div><button type="button" onClick={() => setComposerOpen(false)}>×</button></header>
          <label><span>Nội dung lịch</span><input autoFocus required maxLength={160} value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ví dụ: Nộp hồ sơ, cuộc hẹn, sinh nhật…" /></label>
          <label><span>Ghi chú</span><textarea rows={4} value={formNote} onChange={(e) => setFormNote(e.target.value)} placeholder="Thông tin cần nhớ khi đến ngày…" /></label>
          <div className="van-nien-editor-grid">
            <label><span>Ngày</span><input required type="date" min={`${CALENDAR_MIN_YEAR}-01-01`} max={`${CALENDAR_MAX_YEAR}-12-31`} value={formDate} onChange={(e) => setFormDate(e.target.value)} /></label>
            <label><span>Giờ</span><input required={!formAllDay} disabled={formAllDay} type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} /></label>
          </div>
          <label className="van-nien-check"><input type="checkbox" checked={formAllDay} onChange={(e) => setFormAllDay(e.target.checked)} /><span>Sự kiện cả ngày</span></label>
          <div className="van-nien-editor-grid">
            <label><span>Nhắc tôi</span><select value={formReminder} onChange={(e) => setFormReminder(e.target.value)}>{REMIND_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label><span>Màu dấu lịch</span><select value={formColor} onChange={(e) => setFormColor(e.target.value as CalendarEventColor)}>{COLORS.map((color) => <option key={color.id} value={color.id}>{color.label}</option>)}</select></label>
          </div>
          {formReminder !== "none" && capability.permission !== "granted" && <button type="button" className="van-nien-inline-notify" onClick={() => void enableNotifications()}>🔔 Bật quyền thông báo để nhận nhắc hạn</button>}
          {eventMessage && <p className="van-nien-editor-message">{eventMessage}</p>}
          <footer>{editing && <button type="button" className="is-danger" onClick={() => void removeEvent(editing)}>Xóa lịch</button>}<span /><button type="button" onClick={() => setComposerOpen(false)}>Hủy</button><button type="submit" className="is-primary" disabled={savingEvent}>{savingEvent ? "Đang lưu…" : "Lưu lịch"}</button></footer>
        </form>
      </div>}
    </div>
  );
}
