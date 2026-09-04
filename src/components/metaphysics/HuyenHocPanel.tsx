import { useMemo, useState } from "react";
import { solarToLunar } from "../../features/calendar/lunarCalendar";
import { getBatTrachProfile, evaluateHouseDirection, type CompassDirection, type Gender } from "../../features/metaphysics/batTrach";
import {
  EARTHLY_BRANCHES_INFO,
  HEAVENLY_STEMS_INFO,
  getBranchRelation,
  getSexagenaryByYear,
  getStemRelation,
} from "../../features/metaphysics/canChi";
import {
  buildNatalFlyingStarChart,
  FLYING_STAR_DISPLAY_ORDER,
  getNinePeriod,
  type ReplacementProfile,
} from "../../features/metaphysics/huyenKhong";
import {
  PHYSIOGNOMY_AREAS,
  PHYSIOGNOMY_CATALOG,
  PHYSIOGNOMY_SOURCES,
  getPhysiognomySource,
  type PhysiognomyArea,
} from "../../features/metaphysics/tuongSo";
import {
  buildAnnualTransit,
  buildTuViChart,
  resolveTuViLunarMonth,
  type HoaLinhProfile,
  type LeapMonthProfile,
  type TuViGender,
  type TuViHoaProfile,
  type TuViStar,
} from "../../features/metaphysics/tuViEngine";
import { TU_VI_GRID_POSITION } from "../../features/metaphysics/tuViFoundation";

type ModuleId = "can-chi" | "bat-trach" | "tuong-so" | "tu-vi" | "phi-tinh";

const MODULES: Array<{ id: ModuleId; label: string; short: string }> = [
  { id: "can-chi", label: "Can Chi · Ngũ Hành", short: "Can Chi" },
  { id: "bat-trach", label: "Phong Thủy Bát Trạch", short: "Bát Trạch" },
  { id: "tuong-so", label: "Tướng Số", short: "Tướng Số" },
  { id: "tu-vi", label: "Tử Vi Đẩu Số", short: "Tử Vi" },
  { id: "phi-tinh", label: "Huyền Không Phi Tinh", short: "Phi Tinh" },
];

const COMPASS: CompassDirection[] = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];

function clampYear(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}
function clampDegree(value: number) {
  if (!Number.isFinite(value)) return 0;
  return ((value % 360) + 360) % 360;
}

function CanChiModule() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [a, setA] = useState("Tý");
  const [b, setB] = useState("Ngọ");
  const [stemA, setStemA] = useState("Giáp");
  const [stemB, setStemB] = useState("Kỷ");
  const profile = useMemo(() => getSexagenaryByYear(year), [year]);
  const relation = useMemo(() => getBranchRelation(a, b), [a, b]);
  const stemRelation = useMemo(() => getStemRelation(stemA, stemB), [stemA, stemB]);

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
        <div>{relation.labels.map((label) => <span key={label} className={/(xung|hại|phá|hình)/i.test(label) ? "is-bad" : "is-good"}>{label}</span>)}</div>
        <p>{relation.elementRelation}</p>
      </div>
    </div>

    <div className="hh-subsection">
      <h4>Tra quan hệ hai Thiên Can</h4>
      <div className="hh-form-row hh-form-row-2">
        <label>Can thứ nhất<select value={stemA} onChange={(e) => setStemA(e.target.value)}>{HEAVENLY_STEMS_INFO.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
        <label>Can thứ hai<select value={stemB} onChange={(e) => setStemB(e.target.value)}>{HEAVENLY_STEMS_INFO.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
      </div>
      <div className="hh-relation">
        <div>{stemRelation.labels.map((label) => <span key={label} className={label.includes("xung") ? "is-bad" : "is-good"}>{label}</span>)}</div>
        <p>{stemRelation.elementRelation}</p>
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
  const [area, setArea] = useState<PhysiognomyArea>("Tổng luận");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const items = useMemo(() => PHYSIOGNOMY_CATALOG.filter((item) => {
    if (item.area !== area) return false;
    if (!normalizedQuery) return true;
    return [item.label, item.traditionalMeaning, item.howToRead, ...item.tags]
      .join(" ")
      .toLocaleLowerCase("vi")
      .includes(normalizedQuery);
  }), [area, normalizedQuery]);

  return <div className="hh-module-body hh-tuong-library">
    <div className="hh-tuong-intro">
      <div>
        <span className="hh-kicker">THƯ VIỆN TƯỚNG PHÁP · {PHYSIOGNOMY_CATALOG.length} MỤC</span>
        <h4>Tra cứu theo bộ vị, đọc theo cụm</h4>
        <p>Kho dữ liệu được tổng hợp và đối chiếu từ cổ thư Trung Hoa cùng các tài liệu Việt ngữ. Mỗi mục tách rõ <strong>lời luận truyền thống</strong> và <strong>cách đọc thận trọng</strong>.</p>
      </div>
      <div className="hh-tuong-count"><strong>{items.length}</strong><small>mục trong nhóm</small></div>
    </div>

    <div className="hh-tuong-toolbar">
      <label className="hh-tuong-search">Tìm trong Tướng Số
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ví dụ: mày dài, Ấn Đường, thần khí…" />
      </label>
    </div>

    <div className="hh-segmented hh-tuong-areas">{PHYSIOGNOMY_AREAS.map((item) => <button type="button" key={item} className={area === item ? "is-active" : ""} onClick={() => setArea(item)}>{item}</button>)}</div>

    {items.length > 0 ? <div className="hh-catalog-grid hh-tuong-grid">{items.map((item) => <article key={item.id} className="hh-tuong-card">
      <div className="hh-tuong-card-head"><span>{item.area}</span><div>{item.tags.slice(0, 2).map((tag) => <small key={tag}>#{tag}</small>)}</div></div>
      <h4>{item.label}</h4>
      <div className="hh-tuong-reading"><strong>Luận theo cổ thư</strong><p>{item.traditionalMeaning}</p></div>
      <div className="hh-tuong-method"><strong>Cách đọc</strong><p>{item.howToRead}</p></div>
      <div className="hh-source-chips" aria-label="Nguồn tham khảo">{item.sourceIds.map((sourceId) => {
        const source = getPhysiognomySource(sourceId);
        return source ? <span key={sourceId} title={`${source.title} · ${source.note}`}>{sourceId}</span> : null;
      })}</div>
    </article>)}</div> : <div className="hh-empty-state">Không có mục nào khớp từ khóa trong nhóm này.</div>}

    <details className="hh-reference hh-tuong-sources">
      <summary>Nguồn tài liệu đã đối chiếu ({PHYSIOGNOMY_SOURCES.length})</summary>
      <div className="hh-source-list">{PHYSIOGNOMY_SOURCES.map((source) => <article key={source.id}>
        <div><strong>{source.id} · {source.title}</strong><span>{source.period}</span></div>
        <small>{source.role}</small>
        <p>{source.note}</p>
        <a href={source.url} target="_blank" rel="noreferrer">Mở nguồn tham khảo ↗</a>
      </article>)}</div>
    </details>

    <div className="hh-safety-box hh-tuong-disclaimer"><strong>Nguyên tắc sử dụng</strong><p>Đây là thư viện văn hóa về tướng học truyền thống, không phải phương pháp khoa học để xác định tính cách, đạo đức, sức khỏe, tuổi thọ, khả năng sinh sản hay tương lai của một người. Không luận từ ảnh và không dùng một nét riêng lẻ để kết luận con người.</p></div>
  </div>;
}

function StarLine({ star }: { star: TuViStar }) {
  return <div className={`hh-star-line ${star.category}`}>
    <strong>{star.name}</strong>
    {star.brightness && <small>{star.brightness}</small>}
    {star.transformation && <em>{star.transformation}</em>}
  </div>;
}

function TuViModule() {
  const now = new Date();
  const [date, setDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
  const [time, setTime] = useState("12:00");
  const [gender, setGender] = useState<TuViGender>("male");
  const [hoaProfile, setHoaProfile] = useState<TuViHoaProfile>("luc-ban-trieu");
  const [hoaLinhProfile, setHoaLinhProfile] = useState<HoaLinhProfile>("truyen-thong");
  const [leapProfile, setLeapProfile] = useState<LeapMonthProfile>("chia-15");
  const [ziHourNextDay, setZiHourNextDay] = useState(true);
  const [annualYear, setAnnualYear] = useState(now.getFullYear());

  const parsed = useMemo(() => {
    try {
      const [year, month, day] = date.split("-").map(Number);
      const [hour] = time.split(":").map(Number);
      if (!year || !month || !day || !Number.isInteger(hour) || hour < 0 || hour > 23) return null;

      // Không để Date tự chuẩn hóa ngày không hợp lệ (ví dụ 31/02 -> tháng kế tiếp).
      const civil = new Date(year, month - 1, day, 12);
      if (civil.getFullYear() !== year || civil.getMonth() !== month - 1 || civil.getDate() !== day) return null;

      // Profile mặc định: 23:00–23:59 coi là đầu ngày mới trong Tử Vi.
      if (ziHourNextDay && hour === 23) civil.setDate(civil.getDate() + 1);
      const lunar = solarToLunar(civil.getDate(), civil.getMonth() + 1, civil.getFullYear());
      const chartMonth = resolveTuViLunarMonth(lunar.month, lunar.day, lunar.isLeap, leapProfile);
      const chart = buildTuViChart({
        lunarDay: lunar.day,
        lunarMonth: chartMonth,
        lunarYear: lunar.year,
        hour,
        gender,
        hoaProfile,
        hoaLinhProfile,
      });
      return { lunar, chartMonth, chart, shiftedZiDay: ziHourNextDay && hour === 23 };
    } catch {
      return null;
    }
  }, [date, time, gender, hoaProfile, hoaLinhProfile, leapProfile, ziHourNextDay]);

  const palaceByBranch = parsed ? new Map(parsed.chart.palaces.map((item) => [item.branch, item])) : null;
  const annual = parsed && annualYear >= parsed.lunar.year
    ? buildAnnualTransit({ birthLunarYear: parsed.lunar.year, targetLunarYear: annualYear, gender, hoaProfile })
    : null;

  return <div className="hh-module-body">
    <div className="hh-form-row hh-form-row-3 hh-tuvi-input-row">
      <label>Ngày sinh dương lịch<input type="date" min="1800-01-01" max="2199-12-31" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      <label>Giờ sinh<input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
      <label>Giới tính<select value={gender} onChange={(e) => setGender(e.target.value as TuViGender)}><option value="male">Nam</option><option value="female">Nữ</option></select></label>
    </div>

    <details className="hh-advanced">
      <summary>Cấu hình trường phái / dị bản</summary>
      <div className="hh-form-row hh-form-row-3">
        <label>Tứ Hóa<select value={hoaProfile} onChange={(e) => setHoaProfile(e.target.value as TuViHoaProfile)}><option value="luc-ban-trieu">Lục Bân Triệu / Khâm Thiên</option><option value="vuong-dinh-chi">Trung Châu · Vương Đình Chi</option></select></label>
        <label>Hỏa · Linh<select value={hoaLinhProfile} onChange={(e) => setHoaLinhProfile(e.target.value as HoaLinhProfile)}><option value="truyen-thong">Bảng truyền thống</option><option value="vu-thien">Dị bản Vũ Thiên</option></select></label>
        <label>Tháng nhuận<select value={leapProfile} onChange={(e) => setLeapProfile(e.target.value as LeapMonthProfile)}><option value="chia-15">1–15 giữ tháng · 16+ sang tháng sau</option><option value="giu-nguyen">Luôn giữ nguyên tháng nhuận</option><option value="sang-thang-sau">Luôn tính sang tháng sau</option></select></label>
      </div>
      <div className="hh-form-row"><label>Năm xem Lưu niên / Tiểu Hạn<input type="number" min={1800} max={2400} value={annualYear} onChange={(e) => setAnnualYear(clampYear(Number(e.target.value), 1800, 2400))} /></label></div>
      <label className="hh-check"><input type="checkbox" checked={ziHourNextDay} onChange={(e) => setZiHourNextDay(e.target.checked)} /> 23:00–23:59 (đầu giờ Tý) tính sang ngày âm lịch kế tiếp</label>
    </details>

    {!parsed ? <div className="hh-validation-message" role="alert">
      <strong>Ngày giờ sinh chưa hợp lệ.</strong>
      <span>Hãy nhập đủ ngày, tháng, năm và giờ. Biểu mẫu vẫn được giữ nguyên để bạn chỉnh tiếp mà không làm màn hình nhảy.</span>
    </div> : <>
      <div className="hh-tuvi-summary">
        <span><small>Âm lịch</small><strong>{parsed.lunar.day}/{parsed.lunar.month}{parsed.lunar.isLeap ? " nhuận" : ""}/{parsed.lunar.year}</strong></span>
        <span><small>Năm</small><strong>{parsed.chart.year.canChi}</strong></span>
        <span><small>Giờ Chi</small><strong>{parsed.chart.foundation.hourBranch}</strong></span>
        <span><small>Mệnh / Thân</small><strong>{parsed.chart.foundation.menhBranch} / {parsed.chart.foundation.thanBranch}</strong></span>
        <span><small>Ngũ Hành Cục</small><strong>{parsed.chart.cuc.name}</strong></span>
        <span><small>Mệnh chủ / Thân chủ</small><strong>{parsed.chart.menhChu} / {parsed.chart.thanChu}</strong></span>
      </div>
      {parsed.lunar.isLeap && <p className="hh-note">Tháng nhuận đang dùng tháng {parsed.chartMonth} để an Mệnh và sao theo profile đã chọn.</p>}
      {parsed.shiftedZiDay && <p className="hh-note">Ca sinh đầu giờ Tý đã được chuyển sang ngày âm lịch kế tiếp theo cấu hình hiện tại.</p>}
      {annual ? <div className="hh-annual-strip">
        <span><small>Lưu niên</small><strong>{annualYear} · {annual.year.canChi}</strong></span>
        <span><small>Tuổi mụ</small><strong>{annual.ageNominal}</strong></span>
        <span><small>Tiểu Hạn tại</small><strong>{annual.minorLimitPalace}</strong></span>
        <span><small>Lưu Thái Tuế</small><strong>{annual.luuThaiTue}</strong></span>
        <span><small>Lưu Lộc Tồn</small><strong>{annual.luuLocTon}</strong></span>
        <span><small>Lưu Tứ Hóa</small><strong>{annual.transformations.map((x) => `${x.transformation.replace("Hóa ", "")}:${x.starName}`).join(" · ")}</strong></span>
      </div> : <p className="hh-note">Năm xem Lưu niên phải từ năm sinh âm lịch trở đi.</p>}

      <div className="hh-tuvi-board-scroll">
        <div className="hh-tuvi-board hh-tuvi-board-full">
          {Object.entries(TU_VI_GRID_POSITION).map(([branch, pos]) => {
            const palace = palaceByBranch?.get(branch as typeof parsed.chart.foundation.menhBranch);
            return <div key={branch} className="hh-tuvi-palace hh-tuvi-palace-full" style={{ gridRow: pos.row, gridColumn: pos.col }}>
              <div className="hh-palace-head"><span>{branch}</span><strong>{palace?.name}</strong><div>{palace?.isMenh && <em>MỆNH</em>}{palace?.isThan && <em>THÂN</em>}{palace?.voids.map((item) => <i key={item} className="hh-void-badge">{item}</i>)}</div></div>
              <div className="hh-main-stars">{palace?.mainStars.map((star) => <StarLine key={`${branch}-${star.name}`} star={star} />)}</div>
              <div className="hh-aux-stars">{palace?.auxiliaryStars.map((star) => <StarLine key={`${branch}-${star.name}`} star={star} />)}</div>
              <div className="hh-palace-meta"><span>{palace?.trangSinh}</span>{palace?.minorLimit && <small>Tiểu hạn {palace.minorLimit}</small>}{palace?.decade && <small>Đại hạn {palace.decade.fromAge}–{palace.decade.toAge}</small>}</div>
            </div>;
          })}
          <div className="hh-tuvi-center">
            <strong>TỬ VI ĐẨU SỐ</strong>
            <span>{parsed.chart.cuc.name}</span>
            <small>{parsed.chart.year.canChi} · {gender === "male" ? "Nam" : "Nữ"}</small>
            <small>Tứ Hóa: {hoaProfile === "luc-ban-trieu" ? "Lục Bân Triệu" : "Vương Đình Chi"}</small>
            <small>Hỏa/Linh: {hoaLinhProfile === "truyen-thong" ? "Truyền thống" : "Vũ Thiên"}</small>
          </div>
        </div>
      </div>
      <div className="hh-safety-box"><strong>Thuật toán đang dùng</strong><p>Đã an Ngũ Hành Cục, 14 Chính Tinh, Tả/Hữu, Xương/Khúc, Khôi/Việt, Lộc Tồn–Kình–Đà, Hỏa/Linh, Không/Kiếp, Tứ Hóa, Tràng Sinh, vòng Thái Tuế, vòng Bác Sĩ, Tuần/Triệt, Đại Hạn, Tiểu Hạn, Lưu Thái Tuế/Lộc Tồn/Tứ Hóa và Mệnh/Thân chủ. Các dị bản có tranh chấp được tách thành profile; ứng dụng không tự sinh lời phán đoán dài.</p></div>
    </>}
  </div>;
}


function PhiTinhModule() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [facingDegree, setFacingDegree] = useState(180);
  const [replacementProfile, setReplacementProfile] = useState<ReplacementProfile>("shen-shi");
  const safeYear = clampYear(year, 1864, 2403);
  const degree = clampDegree(facingDegree);
  const period = useMemo(() => getNinePeriod(safeYear), [safeYear]);
  const natal = useMemo(() => buildNatalFlyingStarChart(safeYear, degree, { replacementProfile }), [safeYear, degree, replacementProfile]);
  const cellMap = new Map(natal.chart.map((item) => [item.palace, item]));
  return <div className="hh-module-body">
    <div className="hh-form-row hh-form-row-3">
      <label>Năm xây/đại tu/nhập trạch<input type="number" min={1864} max={2403} value={year} onChange={(e) => setYear(clampYear(Number(e.target.value), 1864, 2403))} /></label>
      <label>Độ Hướng (0° Bắc · 90° Đông · 180° Nam)<input type="number" min={0} max={359.99} step={0.1} value={facingDegree} onChange={(e) => setFacingDegree(clampDegree(Number(e.target.value)))} /></label>
      <label>Kiêm hướng / Thế Quái<select value={replacementProfile} onChange={(e) => setReplacementProfile(e.target.value as ReplacementProfile)}><option value="shen-shi">Tự động · 沈氏替星 (±4.5°)</option><option value="off">Tắt · cưỡng chế Hạ Quái</option></select></label>
    </div>
    <div className="hh-result-card">
      <span className="hh-kicker">TAM NGUYÊN CỬU VẬN · {natal.chartMode.toUpperCase()}</span><h4>Vận {period.period} · {period.startYear}–{period.endYear}</h4>
      <div className="hh-stat-grid">
        <span><small>Hướng</small><strong>{natal.facing.code} · {natal.facing.name} {natal.facing.han}</strong></span>
        <span><small>Sơn / Tọa</small><strong>{natal.sitting.code} · {natal.sitting.name} {natal.sitting.han}</strong></span>
        <span><small>Hướng tinh nhập trung</small><strong>{natal.facingCenterStar} · {natal.facingFlight}</strong></span>
        <span><small>Sơn tinh nhập trung</small><strong>{natal.mountainCenterStar} · {natal.mountainFlight}</strong></span>
      </div>
      <div className="hh-structure-list">{natal.structure.map((item) => <span key={item}>{item}</span>)}{natal.repetition.mountain && <span>Sơn tinh · {natal.repetition.mountain}</span>}{natal.repetition.facing && <span>Hướng tinh · {natal.repetition.facing}</span>}<span>{natal.chartMode} · lệch tâm Sơn {natal.mountainOffset.toFixed(1)}°</span></div>
      {natal.replacement.active && <div className="hh-replacement-strip">
        <span><small>Sơn tinh</small><strong>{natal.replacement.mountainOriginalStar} → {natal.replacement.mountainReplacementStar}</strong><em>{natal.replacement.mountainReference?.name} {natal.replacement.mountainReference?.han}</em></span>
        <span><small>Hướng tinh</small><strong>{natal.replacement.facingOriginalStar} → {natal.replacement.facingReplacementStar}</strong><em>{natal.replacement.facingReference?.name} {natal.replacement.facingReference?.han}</em></span>
      </div>}
    </div>
    {natal.nearBoundary && <div className="hh-warning"><strong>Gần ranh 24 Sơn</strong><span>Chỉ cách biên {natal.boundaryDistance.toFixed(1)}°. Sai số la bàn có thể đổi sang Sơn kế cận; nên đo nhiều lần trước khi dùng bàn.</span></div>}
    {natal.chartMode === "Hạ Quái · cưỡng chế" && <div className="hh-warning"><strong>Đang tắt Thế Quái</strong><span>Độ hướng đã ra ngoài 9° trung tâm nhưng profile替星 bị tắt. Chế độ này chỉ nên dùng để so sánh kỹ thuật.</span></div>}
    <div className="hh-flying-grid hh-flying-grid-full">{FLYING_STAR_DISPLAY_ORDER.map((palace) => {
      const cell = cellMap.get(palace)!;
      const facingMark = palace === natal.facing.direction ? " HƯỚNG" : "";
      const sittingMark = palace === natal.sitting.direction ? " SƠN" : "";
      return <div key={palace}><span>{palace}{facingMark}{sittingMark}</span><div className="hh-flying-triple"><b title="Sơn tinh">S{cell.mountainStar}</b><strong title="Vận tinh">V{cell.periodStar}</strong><b title="Hướng tinh">H{cell.facingStar}</b></div></div>;
    })}</div>
    <div className="hh-safety-box"><strong>{natal.profile}</strong><p>{natal.note} Năm nằm sát Lập Xuân cũng nên đối chiếu mốc nhập vận theo tiết khí thay vì chỉ nhìn số năm dương lịch.</p></div>
  </div>;
}

export function HuyenHocPanel() {
  const [active, setActive] = useState<ModuleId>("can-chi");
  return <section className="huyen-hoc-cac" aria-label="Huyền Học Các">
    <header className="hh-header"><div><span className="hh-kicker">VẠN NIÊN · HUYỀN HỌC VIỆT NAM</span><h3>Huyền Học Các</h3><p>Tra cứu và lập bàn có cấu trúc: Can Chi, Ngũ Hành, Bát Trạch, Tử Vi và Huyền Không Phi Tinh.</p></div><div className="hh-seal" aria-hidden="true">玄</div></header>
    <nav className="hh-tabs" aria-label="Các module Huyền Học">{MODULES.map((item) => <button type="button" key={item.id} className={active === item.id ? "is-active" : ""} onClick={() => setActive(item.id)}><span>{item.short}</span><small>{item.label}</small></button>)}</nav>
    {active === "can-chi" && <CanChiModule />}
    {active === "bat-trach" && <BatTrachModule />}
    {active === "tuong-so" && <TuongSoModule />}
    {active === "tu-vi" && <TuViModule />}
    {active === "phi-tinh" && <PhiTinhModule />}
    <footer className="hh-disclaimer">Huyền Học Các là công cụ tra cứu văn hóa dựa trên các hệ thống lý thuyết cổ truyền. Nội dung không phải dự đoán khoa học và chỉ nên dùng để tham khảo văn hóa, giải trí hoặc hỗ trợ sáng tác.</footer>
  </section>;
}
