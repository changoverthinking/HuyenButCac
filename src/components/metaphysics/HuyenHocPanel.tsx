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
  ICHING_HEXAGRAMS,
  ICHING_SOURCES,
  ICHING_TRIGRAMS,
  MOVING_LINE_POSITION_NOTES,
  buildIChingCast,
  castThreeCoins,
  getHexagramByNumber,
  type IChingCast,
} from "../../features/metaphysics/kinhDich";
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
import {
  TU_VI_STAR_DEFINITIONS,
  TU_VI_STAR_SOURCES,
  getTuViStarDefinition,
} from "../../features/metaphysics/tuViStarDefinitions";


type ModuleId = "can-chi" | "bat-trach" | "tuong-so" | "tu-vi" | "kinh-dich" | "phi-tinh";

const MODULES: Array<{ id: ModuleId; label: string; short: string }> = [
  { id: "can-chi", label: "Can Chi · Ngũ Hành", short: "Can Chi" },
  { id: "bat-trach", label: "Phong Thủy Bát Trạch", short: "Bát Trạch" },
  { id: "tuong-so", label: "Tướng Số", short: "Tướng Số" },
  { id: "tu-vi", label: "Tử Vi Đẩu Số", short: "Tử Vi" },
  { id: "kinh-dich", label: "Kinh Dịch · 64 Quẻ", short: "64 Quẻ" },
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

function StarLine({ star, onSelect }: { star: TuViStar; onSelect?: (star: TuViStar) => void }) {
  const definition = getTuViStarDefinition(star.name);
  const content = <>
    <strong>{star.name}</strong>
    {star.brightness && <small>{star.brightness}</small>}
    {star.transformation && <em>{star.transformation}</em>}
  </>;

  if (!definition || !onSelect) return <div className={`hh-star-line ${star.category}`}>{content}</div>;
  return <button type="button" className={`hh-star-line hh-star-line-button ${star.category}`} onClick={() => onSelect(star)} title="Chạm để xem định nghĩa sao">
    {content}
  </button>;
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
  const [selectedStar, setSelectedStar] = useState<TuViStar | null>(null);
  const [starQuery, setStarQuery] = useState("");

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
  const selectedDefinition = selectedStar ? getTuViStarDefinition(selectedStar.name) : null;
  const selectedTransformation = selectedStar?.transformation ? getTuViStarDefinition(selectedStar.transformation) : null;
  const normalizedStarQuery = starQuery.trim().toLocaleLowerCase("vi");
  const starMatches = useMemo(() => TU_VI_STAR_DEFINITIONS.filter((item) => {
    if (!normalizedStarQuery) return true;
    return [item.name, item.group, item.meaning, ...item.keywords].join(" ").toLocaleLowerCase("vi").includes(normalizedStarQuery);
  }), [normalizedStarQuery]);

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

      <div className="hh-tuvi-helpbar"><strong>Đọc lá số</strong><span>Chạm vào tên sao có định nghĩa để mở phần giải thích. Trên điện thoại lá số chuyển thành thẻ 2 cột để chữ không bị bẻ từng ký tự.</span></div>
      {selectedDefinition && <article className="hh-star-inspector">
        <div className="hh-star-inspector-head"><div><small>{selectedDefinition.group}</small><h4>{selectedDefinition.name}</h4></div><button type="button" onClick={() => setSelectedStar(null)} aria-label="Đóng định nghĩa sao">×</button></div>
        <div className="hh-star-keywords">{selectedDefinition.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
        <p>{selectedDefinition.meaning}</p>
        {selectedStar?.brightness && <p className="hh-star-context"><strong>Trạng thái trên lá số:</strong> {selectedStar.brightness}{selectedStar.transformation ? ` · ${selectedStar.transformation}` : ""}. Miếu/Vượng/Đắc/Bình/Hãm là lớp đánh giá vị trí truyền thống, không thay thế việc đọc toàn cung và tam phương tứ chính.</p>}
        {selectedTransformation && <div className="hh-star-transform-note"><strong>{selectedTransformation.name}</strong><span>{selectedTransformation.meaning}</span></div>}
        <div className="hh-star-source-links">{selectedDefinition.sourceIds.map((sourceId) => {
          const source = TU_VI_STAR_SOURCES.find((item) => item.id === sourceId);
          return source ? <a key={sourceId} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a> : null;
        })}</div>
      </article>}

      <div className="hh-tuvi-board-scroll">
        <div className="hh-tuvi-board hh-tuvi-board-full">
          {Object.entries(TU_VI_GRID_POSITION).map(([branch, pos]) => {
            const palace = palaceByBranch?.get(branch as typeof parsed.chart.foundation.menhBranch);
            return <div key={branch} className="hh-tuvi-palace hh-tuvi-palace-full" style={{ gridRow: pos.row, gridColumn: pos.col }}>
              <div className="hh-palace-head"><span>{branch}</span><strong>{palace?.name}</strong><div>{palace?.isMenh && <em>MỆNH</em>}{palace?.isThan && <em>THÂN</em>}{palace?.voids.map((item) => <i key={item} className="hh-void-badge">{item}</i>)}</div></div>
              <div className="hh-main-stars">{palace?.mainStars.map((star) => <StarLine key={`${branch}-${star.name}`} star={star} onSelect={setSelectedStar} />)}</div>
              <div className="hh-aux-stars">{palace?.auxiliaryStars.map((star) => <StarLine key={`${branch}-${star.name}`} star={star} onSelect={setSelectedStar} />)}</div>
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

      <details className="hh-reference hh-star-dictionary">
        <summary>Từ điển sao Tử Vi ({TU_VI_STAR_DEFINITIONS.length} mục)</summary>
        <label className="hh-dictionary-search">Tìm sao / ý nghĩa<input type="search" value={starQuery} onChange={(e) => setStarQuery(e.target.value)} placeholder="Ví dụ: Thái Dương, quý nhân, hao tán…" /></label>
        <div className="hh-star-dictionary-grid">{starMatches.map((item) => <article key={item.name}>
          <div><small>{item.group}</small><strong>{item.name}</strong></div>
          <p>{item.meaning}</p>
          <div className="hh-star-keywords">{item.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
        </article>)}</div>
        <div className="hh-source-list hh-tuvi-source-list">{TU_VI_STAR_SOURCES.map((source) => <article key={source.id}><div><strong>{source.id} · {source.title}</strong></div><a href={source.url} target="_blank" rel="noreferrer">Mở tài liệu đối chiếu ↗</a></article>)}</div>
      </details>

      <details className="hh-reference hh-tuvi-glossary">
        <summary>Chú giải ký hiệu trên lá số</summary>
        <div className="hh-glossary-grid">
          <article><strong>Miếu · Vượng · Đắc · Bình · Hãm</strong><p>Mức độ đắc địa truyền thống của chính tinh tại từng Địa Chi. Đây là một lớp đánh giá sức biểu hiện của sao, không phải thang điểm tốt/xấu độc lập.</p></article>
          <article><strong>Tuần · Triệt</strong><p>Hai dạng Không Vong được dùng như “điểm chặn/điểm biến đổi” trong nhiều trường phái. Khi gặp cần đọc cùng cung, chính tinh, hạn và tam phương tứ chính.</p></article>
          <article><strong>Mệnh · Thân</strong><p>Cung Mệnh là trục khởi đầu để đọc cấu trúc lá số; Cung Thân bổ sung nơi đời sống dễ dồn trọng tâm và thường được đọc phối hợp với Mệnh.</p></article>
          <article><strong>Tràng Sinh</strong><p>Vòng 12 trạng thái khí như Tràng Sinh, Mộc Dục, Quan Đới… dùng để mô tả chu kỳ sinh–trưởng–thịnh–suy của Ngũ Hành Cục.</p></article>
          <article><strong>Đại Hạn · Tiểu Hạn</strong><p>Đại Hạn chia các giai đoạn 10 năm; Tiểu Hạn là một lớp vận theo năm. Không nên đọc hạn tách khỏi lá số gốc và lưu niên.</p></article>
          <article><strong>Tứ Hóa</strong><p>Hóa Lộc, Quyền, Khoa, Kỵ là bốn trạng thái biến hóa gắn vào sao theo Thiên Can. Bản app cho phép chọn profile trường phái ở phần cấu hình.</p></article>
        </div>
      </details>

      <div className="hh-safety-box"><strong>Thuật toán đang dùng</strong><p>Đã an Ngũ Hành Cục, 14 Chính Tinh, Tả/Hữu, Xương/Khúc, Khôi/Việt, Lộc Tồn–Kình–Đà, Hỏa/Linh, Không/Kiếp, Tứ Hóa, Tràng Sinh, vòng Thái Tuế, vòng Bác Sĩ, Tuần/Triệt, Đại Hạn, Tiểu Hạn, Lưu Thái Tuế/Lộc Tồn/Tứ Hóa và Mệnh/Thân chủ. Phần định nghĩa sao là lớp tra cứu truyền thống, không phải kết luận định mệnh từ một sao đơn lẻ.</p></div>
    </>}
  </div>;
}

function HexagramFigure({ code, movingLines = [] }: { code: string; movingLines?: number[] }) {
  const lines = code.split("").map((value, index) => ({ value, position: index + 1 })).reverse();
  return <div className="hh-hex-figure" aria-label="Hình sáu hào">
    {lines.map((line) => <div key={line.position} className={`hh-hex-line ${movingLines.includes(line.position) ? "is-moving" : ""}`} title={`Hào ${line.position}${movingLines.includes(line.position) ? " · động" : ""}`}>
      {line.value === "1" ? <span className="is-yang" /> : <span className="is-yin"><i /><i /></span>}
      {movingLines.includes(line.position) && <b>{line.position}</b>}
    </div>)}
  </div>;
}

function KinhDichModule() {
  const [selectedNumber, setSelectedNumber] = useState(1);
  const [query, setQuery] = useState("");
  const [cast, setCast] = useState<IChingCast | null>(null);
  const [manualLines, setManualLines] = useState<Array<6 | 7 | 8 | 9>>([7, 7, 7, 7, 7, 7]);
  const selected = getHexagramByNumber(selectedNumber) ?? ICHING_HEXAGRAMS[0];
  const activeHexagram = cast?.primary ?? selected;
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const matches = useMemo(() => ICHING_HEXAGRAMS.filter((item) => {
    if (!normalizedQuery) return true;
    return [String(item.number), item.chinese, item.hanViet, item.theme, item.meaning, item.whenCast, ...item.keywords].join(" ").toLocaleLowerCase("vi").includes(normalizedQuery);
  }), [normalizedQuery]);
  const upper = ICHING_TRIGRAMS[activeHexagram.upper];
  const lower = ICHING_TRIGRAMS[activeHexagram.lower];

  const selectHexagram = (number: number) => {
    setSelectedNumber(number);
    setCast(null);
  };
  const castRandom = () => {
    const next = castThreeCoins();
    setCast(next);
    setSelectedNumber(next.primary.number);
  };
  const buildManual = () => {
    const next = buildIChingCast(manualLines);
    setCast(next);
    setSelectedNumber(next.primary.number);
  };
  const updateManualLine = (index: number, value: 6 | 7 | 8 | 9) => {
    setManualLines((current) => current.map((line, lineIndex) => lineIndex === index ? value : line));
  };

  return <div className="hh-module-body hh-iching-module">
    <div className="hh-iching-toolbar">
      <label>Tìm trong 64 quẻ<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Số quẻ, tên quẻ, ý nghĩa…" /></label>
      <button type="button" className="hh-primary-action" onClick={castRandom}>Gieo 3 đồng xu × 6</button>
    </div>

    <div className="hh-iching-main">
      <div className="hh-iching-visual">
        <span className="hh-hex-unicode">{activeHexagram.symbol}</span>
        <HexagramFigure code={activeHexagram.code} movingLines={cast?.movingLines ?? []} />
      </div>
      <div className="hh-iching-reading">
        <span className="hh-kicker">QUẺ {activeHexagram.number}/64 · {activeHexagram.chinese}</span>
        <h4>{activeHexagram.hanViet}</h4>
        <div className="hh-trigram-pair">
          <span><small>Thượng quái</small><strong>{upper.symbol} {upper.name} · {upper.image}</strong><em>{upper.element} · {upper.nature}</em></span>
          <span><small>Hạ quái</small><strong>{lower.symbol} {lower.name} · {lower.image}</strong><em>{lower.element} · {lower.nature}</em></span>
        </div>
        <div className="hh-iching-meaning"><strong>Ý nghĩa / định nghĩa</strong><p>{activeHexagram.meaning}</p></div>
        <div className="hh-iching-cast-reading"><strong>Khi ra quẻ này</strong><p>{activeHexagram.whenCast}</p></div>
        <div className="hh-star-keywords">{activeHexagram.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
      </div>
    </div>

    {cast && <div className="hh-cast-result">
      <div className="hh-cast-result-head"><strong>Kết quả gieo quẻ</strong><button type="button" onClick={() => setCast(null)}>Trở về tra cứu</button></div>
      <div className="hh-cast-lines">{cast.lines.map((value, index) => {
        const moving = value === 6 || value === 9;
        const label = value === 6 ? "Lão Âm" : value === 7 ? "Thiếu Dương" : value === 8 ? "Thiếu Âm" : "Lão Dương";
        return <span key={index}><small>Hào {index + 1}</small><strong>{value} · {label}</strong>{moving && <em>Động</em>}</span>;
      })}</div>
      {cast.movingLines.length > 0 ? <>
        <div className="hh-changing-hexagram"><div><small>Quẻ chủ</small><strong>{cast.primary.number}. {cast.primary.hanViet}</strong></div><span>→</span><div><small>Quẻ biến</small><strong>{cast.changed?.number}. {cast.changed?.hanViet}</strong></div></div>
        <div className="hh-moving-notes">{cast.movingLines.map((position) => <p key={position}><strong>Hào {position} động:</strong> {MOVING_LINE_POSITION_NOTES[position - 1]} Khi luận chi tiết cần đọc hào từ của chính quẻ ở vị trí này; phần mềm không biến một hào riêng lẻ thành phán quyết tuyệt đối.</p>)}</div>
        {cast.changed && <div className="hh-iching-changed-reading"><strong>Ý nghĩa quẻ biến · {cast.changed.hanViet}</strong><p>{cast.changed.meaning}</p><p><b>Xu hướng sau biến:</b> {cast.changed.whenCast}</p></div>}
      </> : <p className="hh-note">Không có hào động: tập trung đọc quẻ chủ và hoàn cảnh hiện tại, không có quẻ biến.</p>}
    </div>}

    <details className="hh-advanced hh-manual-cast">
      <summary>Nhập 6 hào từ một lần gieo bên ngoài</summary>
      <p className="hh-note">Nhập từ Hào 1 (dưới cùng) đến Hào 6 (trên cùng): 6 = Lão Âm, 7 = Thiếu Dương, 8 = Thiếu Âm, 9 = Lão Dương.</p>
      <div className="hh-manual-lines">{manualLines.map((value, index) => <label key={index}>Hào {index + 1}<select value={value} onChange={(e) => updateManualLine(index, Number(e.target.value) as 6 | 7 | 8 | 9)}><option value={6}>6 · Lão Âm (động)</option><option value={7}>7 · Thiếu Dương</option><option value={8}>8 · Thiếu Âm</option><option value={9}>9 · Lão Dương (động)</option></select></label>)}</div>
      <button type="button" className="hh-primary-action" onClick={buildManual}>Lập quẻ từ 6 hào</button>
    </details>

    <details className="hh-reference hh-trigram-library">
      <summary>Bát Quái căn bản · định nghĩa 8 quái</summary>
      <div className="hh-trigram-grid">{Object.values(ICHING_TRIGRAMS).map((trigram) => <article key={trigram.name}>
        <span>{trigram.symbol}</span><div><strong>{trigram.name} · {trigram.chinese}</strong><small>{trigram.image} · {trigram.element}</small><p>{trigram.nature}</p></div>
      </article>)}</div>
    </details>

    <div className="hh-hexagram-library">
      <div className="hh-library-head"><div><span className="hh-kicker">VĂN VƯƠNG QUÁI TỰ</span><h4>Thư viện 64 quẻ</h4></div><strong>{matches.length}/64</strong></div>
      <div className="hh-hexagram-grid">{matches.map((item) => <button type="button" key={item.number} className={selectedNumber === item.number && !cast ? "is-active" : ""} onClick={() => selectHexagram(item.number)}>
        <span>{item.symbol}</span><div><small>{item.number}. {item.chinese}</small><strong>{item.hanViet}</strong><em>{item.theme}</em></div>
      </button>)}</div>
    </div>

    <details className="hh-reference hh-iching-sources">
      <summary>Nguồn & cách đối chiếu</summary>
      <div className="hh-source-list">{ICHING_SOURCES.map((source) => <article key={source.id}><div><strong>{source.id} · {source.title}</strong></div><a href={source.url} target="_blank" rel="noreferrer">Mở nguồn ↗</a></article>)}</div>
    </details>
    <div className="hh-safety-box"><strong>Cách dùng</strong><p>64 quẻ được sắp theo thứ tự Văn Vương. “Gieo 3 đồng xu” mô phỏng phép gieo truyền thống bằng số ngẫu nhiên trong trình duyệt; phần luận là diễn giải văn hóa từ tượng quẻ, không phải dự báo khoa học và không nên thay thế quyết định y khoa, pháp lý hay tài chính.</p></div>
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
    <header className="hh-header"><div><span className="hh-kicker">VẠN NIÊN · HUYỀN HỌC VIỆT NAM</span><h3>Huyền Học Các</h3><p>Tra cứu có cấu trúc: Can Chi, Ngũ Hành, Bát Trạch, Tướng Số, Tử Vi, Kinh Dịch 64 Quẻ và Huyền Không Phi Tinh.</p></div><div className="hh-seal" aria-hidden="true">玄</div></header>
    <nav className="hh-tabs" aria-label="Các module Huyền Học">{MODULES.map((item) => <button type="button" key={item.id} className={active === item.id ? "is-active" : ""} onClick={() => setActive(item.id)}><span>{item.short}</span><small>{item.label}</small></button>)}</nav>
    {active === "can-chi" && <CanChiModule />}
    {active === "bat-trach" && <BatTrachModule />}
    {active === "tuong-so" && <TuongSoModule />}
    {active === "tu-vi" && <TuViModule />}
    {active === "kinh-dich" && <KinhDichModule />}
    {active === "phi-tinh" && <PhiTinhModule />}
    <footer className="hh-disclaimer">Huyền Học Các là công cụ tra cứu văn hóa dựa trên các hệ thống lý thuyết cổ truyền. Nội dung không phải dự đoán khoa học và chỉ nên dùng để tham khảo văn hóa, giải trí hoặc hỗ trợ sáng tác.</footer>
  </section>;
}
