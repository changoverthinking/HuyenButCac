import { useMemo, useState } from "react";
import { solarToLunar } from "../../features/calendar/lunarCalendar";
import { getBatTrachProfile, evaluateHouseDirection, type CompassDirection, type Gender } from "../../features/metaphysics/batTrach";
import { EARTHLY_BRANCHES_INFO, HEAVENLY_STEMS_INFO, getBranchRelation, getSexagenaryByYear } from "../../features/metaphysics/canChi";
import { buildBasePeriodFlyingStars, getNinePeriod } from "../../features/metaphysics/huyenKhong";
import { PHYSIOGNOMY_CATALOG } from "../../features/metaphysics/tuongSo";
import { buildTuViFoundation, TU_VI_GRID_POSITION } from "../../features/metaphysics/tuViFoundation";

type ModuleId = "can-chi" | "bat-trach" | "tuong-so" | "tu-vi" | "phi-tinh";

const MODULES: Array<{ id: ModuleId; label: string; short: string }> = [
  { id: "can-chi", label: "Can Chi · Ngũ Hành", short: "Can Chi" },
  { id: "bat-trach", label: "Phong Thủy Bát Trạch", short: "Bát Trạch" },
  { id: "tuong-so", label: "Tướng Số", short: "Tướng Số" },
  { id: "tu-vi", label: "Tử Vi Đẩu Số", short: "Tử Vi" },
  { id: "phi-tinh", label: "Huyền Không Phi Tinh", short: "Phi Tinh" },
];

const COMPASS: CompassDirection[] = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];
const PHYSIOGNOMY_AREAS = ["Trán", "Mắt", "Mũi", "Miệng", "Cằm"] as const;

function clampYear(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function CanChiModule() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [a, setA] = useState("Tý");
  const [b, setB] = useState("Ngọ");
  const profile = useMemo(() => getSexagenaryByYear(year), [year]);
  const relation = useMemo(() => getBranchRelation(a, b), [a, b]);

  return <div className="hh-module-body">
    <div className="hh-form-row">
      <label>Năm dương lịch<input type="number" min={1} max={9999} value={year} onChange={(e) => setYear(clampYear(Number(e.target.value), 1, 9999))} /></label>
    </div>
    <div className="hh-result-card hh-element-card" data-element={profile.napAm.element.toLowerCase()}>
      <div><span className="hh-kicker">LỤC THẬP HOA GIÁP · VỊ TRÍ {profile.cyclePosition}/60</span><h4>{profile.canChi}</h4></div>
      <div className="hh-stat-grid">
        <span><small>Thiên Can</small><strong>{profile.stem.name} · {profile.stem.yinYang} {profile.stem.element}</strong></span>
        <span><small>Địa Chi</small><strong>{profile.branch.name} · {profile.branch.zodiac}</strong></span>
        <span><small>Nạp Âm</small><strong>{profile.napAm.name}</strong></span>
        <span><small>Ngũ Hành</small><strong>{profile.napAm.element}</strong></span>
      </div>
    </div>

    <div className="hh-subsection">
      <h4>Tra quan hệ hai Địa Chi</h4>
      <div className="hh-form-row hh-form-row-2">
        <label>Chi thứ nhất<select value={a} onChange={(e) => setA(e.target.value)}>{EARTHLY_BRANCHES_INFO.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
        <label>Chi thứ hai<select value={b} onChange={(e) => setB(e.target.value)}>{EARTHLY_BRANCHES_INFO.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
      </div>
      <div className="hh-relation">
        <div>{relation.labels.map((label) => <span key={label} className={label.includes("xung") ? "is-bad" : "is-good"}>{label}</span>)}</div>
        <p>{relation.elementRelation}</p>
      </div>
    </div>

    <details className="hh-reference">
      <summary>10 Thiên Can · 12 Địa Chi</summary>
      <div className="hh-reference-grid">
        {HEAVENLY_STEMS_INFO.map((item) => <div key={`can-${item.name}`}><strong>{item.name}</strong><span>Thiên Can</span><small>{item.yinYang} {item.element}</small></div>)}
        {EARTHLY_BRANCHES_INFO.map((item) => <div key={`chi-${item.name}`}><strong>{item.name}</strong><span>{item.zodiac}</span><small>{item.yinYang} {item.element} · {item.hours}</small></div>)}
      </div>
    </details>
  </div>;
}

function BatTrachModule() {
  const [year, setYear] = useState(1990);
  const [gender, setGender] = useState<Gender>("male");
  const [direction, setDirection] = useState<CompassDirection>("Nam");
  const safeYear = clampYear(year, 1900, 2099);
  const profile = useMemo(() => getBatTrachProfile(safeYear, gender), [safeYear, gender]);
  const evaluation = useMemo(() => evaluateHouseDirection(safeYear, gender, direction), [safeYear, gender, direction]);

  return <div className="hh-module-body">
    <div className="hh-form-row hh-form-row-3">
      <label>Năm sinh<input type="number" min={1900} max={2099} value={year} onChange={(e) => setYear(clampYear(Number(e.target.value), 1900, 2099))} /></label>
      <label>Giới tính<select value={gender} onChange={(e) => setGender(e.target.value as Gender)}><option value="male">Nam</option><option value="female">Nữ</option></select></label>
      <label>Hướng nhà<select value={direction} onChange={(e) => setDirection(e.target.value as CompassDirection)}>{COMPASS.map((item) => <option key={item}>{item}</option>)}</select></label>
    </div>

    <div className="hh-result-card">
      <div className="hh-battrach-head"><span className="hh-kua">{profile.kua}</span><div><span className="hh-kicker">MỆNH QUÁI</span><h4>{profile.trigram} · {profile.element}</h4><p>{profile.group} · bản cung {profile.seat}</p></div></div>
      <div className={`hh-house-eval ${evaluation.result.quality === "good" ? "is-good" : "is-bad"}`}>
        <strong>{direction}: {evaluation.result.star}</strong>
        <span>{evaluation.result.quality === "good" ? "Thuộc nhóm hướng cát theo Bát Trạch." : "Thuộc nhóm hướng hung theo Bát Trạch."}</span>
      </div>
    </div>

    <div className="hh-direction-grid">
      {profile.directions.map((item) => <article key={item.direction} className={item.quality === "good" ? "is-good" : "is-bad"}>
        <span>{item.direction}</span><strong>{item.star}</strong><small>{item.quality === "good" ? "Cát" : "Hung"}</small>
      </article>)}
    </div>
    <p className="hh-note">Cung phi dùng công thức phổ biến cho giai đoạn 1900–2099; người sinh sát Lập Xuân nên đối chiếu năm khí tiết trước khi dùng kết quả cho bố trí thực tế.</p>
  </div>;
}

function TuongSoModule() {
  const [area, setArea] = useState<(typeof PHYSIOGNOMY_AREAS)[number]>("Trán");
  const items = PHYSIOGNOMY_CATALOG.filter((item) => item.area === area);
  return <div className="hh-module-body">
    <div className="hh-segmented">{PHYSIOGNOMY_AREAS.map((item) => <button type="button" key={item} className={area === item ? "is-active" : ""} onClick={() => setArea(item)}>{item}</button>)}</div>
    <div className="hh-catalog-grid">{items.map((item) => <article key={item.id}><span>{item.area}</span><h4>{item.label}</h4><p>{item.traditionalMeaning}</p></article>)}</div>
    <p className="hh-note">Không nhận diện khuôn mặt, không suy đoán tính cách từ ảnh. Mục này chỉ là catalog mô tả quan niệm tướng học truyền thống.</p>
  </div>;
}

function TuViModule() {
  const now = new Date();
  const [date, setDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
  const [time, setTime] = useState("12:00");
  const parsed = useMemo(() => {
    const [year, month, day] = date.split("-").map(Number);
    const [hour] = time.split(":").map(Number);
    if (!year || !month || !day || Number.isNaN(hour)) return null;
    const lunar = solarToLunar(day, month, year);
    const foundation = buildTuViFoundation(lunar.month, hour);
    const sexagenary = getSexagenaryByYear(lunar.year);
    return { lunar, foundation, sexagenary };
  }, [date, time]);

  if (!parsed) return <div className="hh-module-body"><p>Ngày giờ sinh chưa hợp lệ.</p></div>;
  const palaceByBranch = new Map(parsed.foundation.palaces.map((item) => [item.branch, item.name]));

  return <div className="hh-module-body">
    <div className="hh-form-row hh-form-row-2"><label>Ngày sinh dương lịch<input type="date" min="1800-01-01" max="2199-12-31" value={date} onChange={(e) => setDate(e.target.value)} /></label><label>Giờ sinh<input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label></div>
    <div className="hh-tuvi-summary">
      <span><small>Âm lịch</small><strong>{parsed.lunar.day}/{parsed.lunar.month}{parsed.lunar.isLeap ? " nhuận" : ""}/{parsed.lunar.year}</strong></span>
      <span><small>Năm</small><strong>{parsed.sexagenary.canChi}</strong></span>
      <span><small>Giờ Chi</small><strong>{parsed.foundation.hourBranch}</strong></span>
      <span><small>Mệnh / Thân</small><strong>{parsed.foundation.menhBranch} / {parsed.foundation.thanBranch}</strong></span>
    </div>

    <div className="hh-tuvi-board">
      {Object.entries(TU_VI_GRID_POSITION).map(([branch, pos]) => <div key={branch} className="hh-tuvi-palace" style={{ gridRow: pos.row, gridColumn: pos.col }}>
        <span>{branch}</span><strong>{palaceByBranch.get(branch)}</strong>
        {branch === parsed.foundation.menhBranch && <em>MỆNH</em>}
        {branch === parsed.foundation.thanBranch && <em>THÂN</em>}
      </div>)}
      <div className="hh-tuvi-center"><strong>TỬ VI ĐẨU SỐ</strong><span>Khung 12 cung đã lập</span><small>Chưa an Cục · 14 Chính Tinh · Phụ Tinh</small></div>
    </div>
    <div className="hh-safety-box"><strong>Trạng thái thuật toán</strong><p>Bản này đã lập Âm lịch, giờ Chi, Cung Mệnh, Cung Thân và 12 cung chức. Phần Ngũ Hành Cục/an 14 chính tinh được cố ý chưa bật vì cần cố định trường phái và bộ test lá số chuẩn trước khi đưa vào sử dụng.</p></div>
  </div>;
}

const PALACE_ORDER = ["Đông Nam", "Nam", "Tây Nam", "Đông", "Trung", "Tây", "Đông Bắc", "Bắc", "Tây Bắc"];

function PhiTinhModule() {
  const [year, setYear] = useState(new Date().getFullYear());
  const safeYear = clampYear(year, 1864, 2403);
  const period = useMemo(() => getNinePeriod(safeYear), [safeYear]);
  const stars = useMemo(() => buildBasePeriodFlyingStars(safeYear), [safeYear]);
  const starMap = new Map(stars.map((item) => [item.palace, item.star]));
  return <div className="hh-module-body">
    <div className="hh-form-row"><label>Năm xây/nhập trạch<input type="number" min={1864} max={2403} value={year} onChange={(e) => setYear(clampYear(Number(e.target.value), 1864, 2403))} /></label></div>
    <div className="hh-result-card"><span className="hh-kicker">TAM NGUYÊN CỬU VẬN</span><h4>Vận {period.period} · {period.startYear}–{period.endYear}</h4><p>Chu kỳ 180 năm: {period.cycleStart}–{period.cycleEnd}</p></div>
    <div className="hh-flying-grid">{PALACE_ORDER.map((palace) => <div key={palace}><span>{palace}</span><strong>{starMap.get(palace)}</strong></div>)}</div>
    <div className="hh-safety-box"><strong>Vận tinh bàn cơ sở</strong><p>Lưới trên chỉ phi Vận tinh theo quỹ đạo Lạc Thư. Sơn tinh/Hướng tinh chưa được tính vì cần thêm tọa–hướng, phân kim và quy tắc thuận/nghịch của trường phái đã chọn.</p></div>
  </div>;
}

export function HuyenHocPanel() {
  const [active, setActive] = useState<ModuleId>("can-chi");
  return <section className="huyen-hoc-cac" aria-label="Huyền Học Các">
    <header className="hh-header"><div><span className="hh-kicker">VẠN NIÊN · HUYỀN HỌC VIỆT NAM</span><h3>Huyền Học Các</h3><p>Tra cứu Can Chi, Ngũ Hành, Bát Trạch, Tướng Số và các bàn tính nền tảng.</p></div><div className="hh-seal" aria-hidden="true">玄</div></header>
    <nav className="hh-tabs" aria-label="Các module Huyền Học">{MODULES.map((item) => <button type="button" key={item.id} className={active === item.id ? "is-active" : ""} onClick={() => setActive(item.id)}><span>{item.short}</span><small>{item.label}</small></button>)}</nav>
    {active === "can-chi" && <CanChiModule />}
    {active === "bat-trach" && <BatTrachModule />}
    {active === "tuong-so" && <TuongSoModule />}
    {active === "tu-vi" && <TuViModule />}
    {active === "phi-tinh" && <PhiTinhModule />}
    <footer className="hh-disclaimer">Huyền Học Các là công cụ tra cứu văn hóa dựa trên các hệ thống lý thuyết cổ truyền. Nội dung không phải dự đoán khoa học và chỉ nên dùng để tham khảo văn hóa, giải trí hoặc hỗ trợ sáng tác.</footer>
  </section>;
}
