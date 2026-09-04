import { describe, expect, it } from "vitest";
import { calculateKuaNumber, evaluateHouseDirection, getBatTrachProfile } from "../features/metaphysics/batTrach";
import { getBranchRelation, getSexagenaryByYear } from "../features/metaphysics/canChi";
import { buildBasePeriodFlyingStars, getNinePeriod } from "../features/metaphysics/huyenKhong";
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

  it("nhận diện Tam hợp, Lục hợp và Lục xung", () => {
    expect(getBranchRelation("Thân", "Tý").labels.join(" ")).toContain("Tam hợp");
    expect(getBranchRelation("Tý", "Sửu").labels).toContain("Lục hợp");
    expect(getBranchRelation("Tý", "Ngọ").labels).toContain("Lục xung");
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
    expect(getHourBranch(22)).toBe("Hợi");
  });

  it("tháng Giêng giờ Tý cho Mệnh/Thân tại Dần", () => {
    const result = buildTuViFoundation(1, 23);
    expect(result.menhBranch).toBe("Dần");
    expect(result.thanBranch).toBe("Dần");
    expect(result.palaces).toHaveLength(12);
  });
});

describe("Tam Nguyên Cửu Vận", () => {
  it("2024-2043 là Vận 9, 2044 mở Vận 1 mới", () => {
    expect(getNinePeriod(2024).period).toBe(9);
    expect(getNinePeriod(2043).period).toBe(9);
    expect(getNinePeriod(2044).period).toBe(1);
  });

  it("phi vận tinh từ trung cung theo quỹ đạo Lạc Thư", () => {
    const board = buildBasePeriodFlyingStars(2026);
    expect(board[0]).toEqual({ palace: "Trung", star: 9 });
    expect(board[1]).toEqual({ palace: "Tây Bắc", star: 1 });
  });
});
