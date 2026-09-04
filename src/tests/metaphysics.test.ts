import { describe, expect, it } from "vitest";
import { calculateKuaNumber, evaluateHouseDirection, getBatTrachProfile } from "../features/metaphysics/batTrach";
import { getBranchRelation, getSexagenaryByYear, getStemRelation } from "../features/metaphysics/canChi";
import {
  buildBasePeriodFlyingStars,
  buildNatalFlyingStarChart,
  getBoundaryDistance,
  getMountainByDegree,
  getNinePeriod,
  getReferenceMountainForCenterStar,
  getReplacementStar,
  getShanXiangFlightDirection,
} from "../features/metaphysics/huyenKhong";
import {
  buildAnnualTransit,
  buildMinorLimits,
  buildTuViChart,
  calculateTuViCuc,
  getFourTransformations,
  getTuanTriet,
  locateZiWei,
  resolveTuViLunarMonth,
} from "../features/metaphysics/tuViEngine";
import { buildTuViFoundation, getHourBranch } from "../features/metaphysics/tuViFoundation";

describe("Can Chi & Nạp Âm", () => {
  it("dùng đúng mốc 1984 = Giáp Tý", () => {
    const result = getSexagenaryByYear(1984);
    expect(result.canChi).toBe("Giáp Tý");
    expect(result.napAm.name).toBe("Hải Trung Kim");
  });

  it("tra đúng Can Chi/Nạp Âm cho 2000 và 2026", () => {
    expect(getSexagenaryByYear(2000).canChi).toBe("Canh Thìn");
    expect(getSexagenaryByYear(2000).napAm.name).toBe("Bạch Lạp Kim");
    expect(getSexagenaryByYear(2026).canChi).toBe("Bính Ngọ");
    expect(getSexagenaryByYear(2026).napAm.name).toBe("Thiên Hà Thủy");
  });

  it("nhận diện Tam hợp, Lục hợp, Xung, Hại, Phá và Hình", () => {
    expect(getBranchRelation("Thân", "Tý").labels.join(" ")).toContain("Tam hợp");
    expect(getBranchRelation("Tý", "Sửu").labels).toContain("Lục hợp");
    expect(getBranchRelation("Tý", "Ngọ").labels).toContain("Lục xung");
    expect(getBranchRelation("Tý", "Mùi").labels).toContain("Lục hại");
    expect(getBranchRelation("Tý", "Dậu").labels).toContain("Lục phá");
    expect(getBranchRelation("Dần", "Tỵ").labels).toContain("Tam hình");
    expect(getBranchRelation("Tý", "Mão").labels).toContain("Tương hình");
    expect(getBranchRelation("Thìn", "Thìn").labels).toContain("Tự hình");
  });

  it("nhận diện Thiên Can Ngũ Hợp và tương xung", () => {
    expect(getStemRelation("Giáp", "Kỷ").labels).toContain("Thiên Can Ngũ Hợp");
    expect(getStemRelation("Giáp", "Canh").labels).toContain("Thiên Can tương xung");
    expect(getStemRelation("Đinh", "Nhâm").labels).toContain("Thiên Can Ngũ Hợp");
  });
});

describe("Bát Trạch", () => {
  it("tính đúng các mốc cung phi phổ biến", () => {
    expect(calculateKuaNumber(1985, "male")).toBe(6);
    expect(calculateKuaNumber(1990, "male")).toBe(1);
    expect(calculateKuaNumber(1990, "female")).toBe(8);
    expect(calculateKuaNumber(2000, "male")).toBe(9);
    expect(calculateKuaNumber(2000, "female")).toBe(6);
    expect(calculateKuaNumber(2001, "male")).toBe(8);
    expect(calculateKuaNumber(2001, "female")).toBe(7);
  });

  it("nam 1985 = Càn và Tây là Sinh Khí", () => {
    const profile = getBatTrachProfile(1985, "male");
    expect(profile.trigram).toBe("Càn");
    const result = evaluateHouseDirection(1985, "male", "Tây");
    expect(result.result.star).toBe("Sinh Khí");
    expect(result.result.quality).toBe("good");
  });
});

describe("Tử Vi foundation", () => {
  it("chia giờ Chi đúng biên", () => {
    expect(getHourBranch(23)).toBe("Tý");
    expect(getHourBranch(0)).toBe("Tý");
    expect(getHourBranch(1)).toBe("Sửu");
    expect(getHourBranch(5)).toBe("Mão");
    expect(getHourBranch(22)).toBe("Hợi");
  });

  it("tháng Giêng giờ Tý cho Mệnh/Thân tại Dần", () => {
    const result = buildTuViFoundation(1, 23);
    expect(result.menhBranch).toBe("Dần");
    expect(result.thanBranch).toBe("Dần");
    expect(result.palaces).toHaveLength(12);
  });

  it("regression: 12 cung chức phải đi thuận từ Mệnh, không bị đảo chiều", () => {
    const result = buildTuViFoundation(2, 5); // tháng 2, giờ Mão → Mệnh Tý, Thân Ngọ
    const palace = Object.fromEntries(result.palaces.map((item) => [item.name, item.branch]));
    expect(result.menhBranch).toBe("Tý");
    expect(result.thanBranch).toBe("Ngọ");
    expect(palace["Quan Lộc"]).toBe("Thìn");
    expect(palace["Nô Bộc"]).toBe("Tỵ");
    expect(palace["Thiên Di"]).toBe("Ngọ");
    expect(palace["Tật Ách"]).toBe("Mùi");
    expect(palace["Tài Bạch"]).toBe("Thân");
  });
});

describe("Tử Vi Đẩu Số engine", () => {
  it("định đúng Ngũ Hành Cục theo Can năm + cung Mệnh", () => {
    expect(calculateTuViCuc(1988, "Tý").name).toBe("Kim Tứ Cục"); // Mậu Thìn + Tý
    expect(calculateTuViCuc(1989, "Thìn").name).toBe("Mộc Tam Cục"); // Kỷ Tỵ + Thìn
    expect(calculateTuViCuc(1985, "Thìn").name).toBe("Kim Tứ Cục"); // Ất Sửu + Thìn
  });

  it("an Tử Vi khớp bảng 10 ngày đầu của đủ 5 Cục", () => {
    const expected: Record<number, string[]> = {
      2: ["Sửu","Dần","Dần","Mão","Mão","Thìn","Thìn","Tỵ","Tỵ","Ngọ"],
      3: ["Thìn","Sửu","Dần","Tỵ","Dần","Mão","Ngọ","Mão","Thìn","Mùi"],
      4: ["Hợi","Thìn","Sửu","Dần","Tý","Tỵ","Dần","Mão","Sửu","Ngọ"],
      5: ["Ngọ","Hợi","Thìn","Sửu","Dần","Mùi","Tý","Tỵ","Dần","Mão"],
      6: ["Dậu","Ngọ","Hợi","Thìn","Sửu","Dần","Tuất","Mùi","Tý","Tỵ"],
    };
    for (const [cuc, branches] of Object.entries(expected)) {
      branches.forEach((branch, index) => expect(locateZiWei(index + 1, Number(cuc))).toBe(branch));
    }
  });

  it("lá số mẫu Mậu Dần tháng 2 ngày 8 giờ Mão nữ khớp các vị trí công khai", () => {
    const chart = buildTuViChart({ lunarDay: 8, lunarMonth: 2, lunarYear: 1998, hour: 5, gender: "female" });
    const main = Object.fromEntries(chart.mainStars.map((star) => [star.name, star.branch]));
    const aux = Object.fromEntries(chart.auxiliaryStars.map((star) => [star.name, star.branch]));
    expect(chart.foundation.menhBranch).toBe("Tý");
    expect(chart.foundation.thanBranch).toBe("Ngọ");
    expect(chart.cuc.name).toBe("Kim Tứ Cục");
    expect(main["Tử Vi"]).toBe("Mão");
    expect(main["Thiên Tướng"]).toBe("Tỵ");
    expect(main["Thiên Lương"]).toBe("Ngọ");
    expect(main["Liêm Trinh"]).toBe("Mùi");
    expect(main["Thất Sát"]).toBe("Mùi");
    expect(main["Cự Môn"]).toBe("Thìn");
    expect(aux["Tả Phụ"]).toBe("Tỵ");
    expect(aux["Văn Xương"]).toBe("Mùi");
    expect(aux["Văn Khúc"]).toBe("Mùi");
    expect(aux["Thiên Việt"]).toBe("Mùi");
    expect(aux["Địa Không"]).toBe("Thân");
    expect(aux["Lộc Tồn"]).toBe("Tỵ");
    expect(aux["Kình Dương"]).toBe("Ngọ");
    expect(aux["Đà La"]).toBe("Thìn");
    expect(aux["Linh Tinh"]).toBe("Ngọ");
    expect(chart.menhChu).toBe("Tham Lang");
    expect(chart.thanChu).toBe("Thiên Lương");
  });

  it("luôn an đủ và không trùng tên 14 Chính Tinh", () => {
    const chart = buildTuViChart({ lunarDay: 8, lunarMonth: 2, lunarYear: 1998, hour: 5, gender: "female" });
    expect(chart.mainStars).toHaveLength(14);
    expect(new Set(chart.mainStars.map((star) => star.name)).size).toBe(14);
  });

  it("tách profile Tứ Hóa thay vì trộn trường phái", () => {
    const mauLuc = getFourTransformations("Mậu", "luc-ban-trieu").find((x) => x.transformation === "Hóa Khoa");
    const mauVuong = getFourTransformations("Mậu", "vuong-dinh-chi").find((x) => x.transformation === "Hóa Khoa");
    const canhLuc = getFourTransformations("Canh", "luc-ban-trieu").find((x) => x.transformation === "Hóa Khoa");
    const canhVuong = getFourTransformations("Canh", "vuong-dinh-chi").find((x) => x.transformation === "Hóa Khoa");
    expect(mauLuc?.starName).toBe("Hữu Bật");
    expect(mauVuong?.starName).toBe("Thái Dương");
    expect(canhLuc?.starName).toBe("Thái Âm");
    expect(canhVuong?.starName).toBe("Thiên Phủ");
  });

  it("xử lý tháng nhuận theo ba profile có chủ đích", () => {
    expect(resolveTuViLunarMonth(6, 10, true, "chia-15")).toBe(6);
    expect(resolveTuViLunarMonth(6, 16, true, "chia-15")).toBe(7);
    expect(resolveTuViLunarMonth(6, 20, true, "giu-nguyen")).toBe(6);
    expect(resolveTuViLunarMonth(6, 5, true, "sang-thang-sau")).toBe(7);
    expect(resolveTuViLunarMonth(6, 20, false, "sang-thang-sau")).toBe(6);
  });

  it("an đủ vòng Thái Tuế và Bác Sĩ", () => {
    const chart = buildTuViChart({ lunarDay: 8, lunarMonth: 2, lunarYear: 1998, hour: 5, gender: "female" });
    const aux = chart.auxiliaryStars;
    expect(aux.find((s) => s.name === "Thái Tuế")?.branch).toBe("Dần");
    expect(aux.find((s) => s.name === "Tuế Phá")?.branch).toBe("Thân");
    expect(aux.find((s) => s.name === "Bác Sĩ")?.branch).toBe("Tỵ");
    expect(aux.find((s) => s.name === "Lực Sĩ")?.branch).toBe("Thìn");
    expect(aux.filter((s) => ["Thái Tuế","Thiếu Dương","Tang Môn","Thiếu Âm","Quan Phù","Tử Phù","Tuế Phá","Long Đức","Bạch Hổ","Phúc Đức","Điếu Khách","Trực Phù"].includes(s.name))).toHaveLength(12);
    expect(aux.filter((s) => ["Bác Sĩ","Lực Sĩ","Thanh Long","Tiểu Hao","Tướng Quân","Tấu Thư","Phi Liêm","Hỷ Thần","Bệnh Phù","Đại Hao","Phục Binh","Quan Phủ"].includes(s.name))).toHaveLength(12);
  });

  it("an Tiểu Hạn Nam thuận/Nữ nghịch và Tuần Triệt", () => {
    const female = buildMinorLimits(1998, "female");
    expect(female[0]).toEqual({ yearBranch: "Dần", palaceBranch: "Thìn" });
    expect(female[1]).toEqual({ yearBranch: "Mão", palaceBranch: "Mão" });
    const male = buildMinorLimits(1998, "male");
    expect(male[1]).toEqual({ yearBranch: "Mão", palaceBranch: "Tỵ" });
    expect(getTuanTriet(1998)).toEqual({ tuan: ["Thân","Dậu"], triet: ["Tý","Sửu"] });
  });

  it("lập Lưu niên cơ sở: Tiểu Hạn, Lưu Thái Tuế, Lộc Tồn và Tứ Hóa", () => {
    const annual = buildAnnualTransit({ birthLunarYear: 1998, targetLunarYear: 2026, gender: "female" });
    expect(annual.year.canChi).toBe("Bính Ngọ");
    expect(annual.ageNominal).toBe(29);
    expect(annual.minorLimitPalace).toBe("Tý");
    expect(annual.luuThaiTue).toBe("Ngọ");
    expect(annual.luuLocTon).toBe("Tỵ");
    expect(annual.transformations).toHaveLength(4);
  });
});

describe("Tam Nguyên Cửu Vận & Huyền Không Phi Tinh", () => {
  it("2024-2043 là Vận 9, 2044 mở Vận 1 mới", () => {
    expect(getNinePeriod(2024).period).toBe(9);
    expect(getNinePeriod(2043).period).toBe(9);
    expect(getNinePeriod(2044).period).toBe(1);
  });

  it("phi Vận tinh từ trung cung theo quỹ đạo Lạc Thư", () => {
    const board = buildBasePeriodFlyingStars(2026);
    expect(board[0]).toEqual({ palace: "Trung", star: 9 });
    expect(board[1]).toEqual({ palace: "Tây Bắc", star: 1 });
  });

  it("nhận đúng 24 Sơn tại các độ chuẩn và quanh 0°", () => {
    expect(getMountainByDegree(345).code).toBe("N1");
    expect(getMountainByDegree(0).code).toBe("N2");
    expect(getMountainByDegree(15).code).toBe("N3");
    expect(getMountainByDegree(90).code).toBe("E2");
    expect(getMountainByDegree(180).code).toBe("S2");
    expect(getMountainByDegree(359.9).code).toBe("N2");
    expect(getBoundaryDistance(180)).toBeCloseTo(7.5);
    expect(getBoundaryDistance(187.5)).toBeCloseTo(0);
  });

  it("quy tắc thuận/nghịch theo sao nhập Trung + Sơn 1/2/3", () => {
    expect(getShanXiangFlightDirection(3, 1, 8)).toBe("thuận");
    expect(getShanXiangFlightDirection(3, 2, 8)).toBe("nghịch");
    expect(getShanXiangFlightDirection(2, 1, 8)).toBe("nghịch");
    expect(getShanXiangFlightDirection(2, 2, 8)).toBe("thuận");
    expect(getShanXiangFlightDirection(5, 2, 8)).toBe("thuận"); // sao 5 xét theo Vận 8
  });

  it("benchmark Vận 8 · N2 tọa S2 hướng khớp bảng Phi Tinh công khai", () => {
    const chart = buildNatalFlyingStarChart(2009, 180);
    expect(chart.sitting.code).toBe("N2");
    expect(chart.facing.code).toBe("S2");
    const cells = Object.fromEntries(chart.chart.map((cell) => [cell.palace, cell]));
    const expected: Record<string, [number, number, number]> = {
      "Đông Nam": [3,7,4], "Nam": [8,3,8], "Tây Nam": [1,5,6],
      "Đông": [2,6,5], "Trung": [4,8,3], "Tây": [6,1,1],
      "Đông Bắc": [7,2,9], "Bắc": [9,4,7], "Tây Bắc": [5,9,2],
    };
    for (const [palace, triple] of Object.entries(expected)) {
      expect([cells[palace].mountainStar, cells[palace].periodStar, cells[palace].facingStar]).toEqual(triple);
    }
  });

  it("Thế Quái profile 沈氏: Vận 8 · Tý sơn Ngọ hướng kiêm cho hướng cung 173", () => {
    // 185° = Ngọ hướng lệch tâm 5°, thuộc vùng替卦.
    const chart = buildNatalFlyingStarChart(2009, 185);
    expect(chart.chartMode).toBe("Thế Quái · 替卦");
    expect(chart.replacement.active).toBe(true);
    expect(chart.replacement.mountainOriginalStar).toBe(4);
    expect(chart.replacement.mountainReference?.name).toBe("Tốn");
    expect(chart.replacement.mountainReplacementStar).toBe(6);
    expect(chart.replacement.facingOriginalStar).toBe(3);
    expect(chart.replacement.facingReference?.name).toBe("Mão");
    expect(chart.replacement.facingReplacementStar).toBe(2);
    const south = chart.chart.find((cell) => cell.palace === "Nam");
    expect([south?.mountainStar, south?.facingStar, south?.periodStar]).toEqual([1,7,3]);
  });

  it("bảng替星 quy chiếu theo cùng nguyên long; sao 5 giữ nguyên nhập Trung", () => {
    const zi = getMountainByDegree(0);
    const xun = getReferenceMountainForCenterStar(4, zi, 8);
    expect(xun?.name).toBe("Tốn");
    expect(getReplacementStar(4, zi, 8).star).toBe(6);
    const five = getReplacementStar(5, zi, 8);
    expect(five.star).toBe(5);
    expect(five.reference?.name).toBe("Cấn");
  });

  it("mỗi tầng Phi Tinh luôn chứa đủ 1–9 đúng một lần", () => {
    for (const degree of [0, 15, 45, 90, 135, 180, 225, 270, 315]) {
      const chart = buildNatalFlyingStarChart(2026, degree);
      for (const key of ["periodStar", "mountainStar", "facingStar"] as const) {
        expect(chart.chart.map((cell) => cell[key]).sort((a,b) => a-b)).toEqual([1,2,3,4,5,6,7,8,9]);
      }
    }
  });

  it("nhận dạng cách cục cơ sở, Phục/Phản Ngâm và vùng cần xét Thế Quái", () => {
    expect(buildNatalFlyingStarChart(2009, 180).structure).toContain("Song Tinh Đáo Hướng");
    const phucNgam = buildNatalFlyingStarChart(2009, 45);
    expect(phucNgam.structure).toContain("Thượng Sơn Hạ Thủy");
    expect(phucNgam.repetition.mountain).toBe("Phục Ngâm");
    expect(buildNatalFlyingStarChart(2009, 184.5).chartMode).toBe("Hạ Quái");
    expect(buildNatalFlyingStarChart(2009, 184.6).chartMode).toContain("Thế Quái");
  });
});
