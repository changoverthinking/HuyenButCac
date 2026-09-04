import { describe, expect, it } from "vitest";
import {
  ICHING_HEXAGRAMS,
  ICHING_TRIGRAMS,
  buildIChingCast,
  getHexagramByCode,
  getHexagramByNumber,
} from "../features/metaphysics/kinhDich";

const REFERENCE_CODES = "111111 000000 100010 010001 111010 010111 010000 000010 111011 110111 111000 000111 101111 111101 001000 000100 100110 011001 110000 000011 100101 101001 000001 100000 100111 111001 100001 011110 010010 101101 001110 011100 001111 111100 000101 101000 101011 110101 001010 010100 110001 100011 111110 011111 000110 011000 010110 011010 101110 011101 100100 001001 001011 110100 101100 001101 011011 110110 010011 110010 110011 001100 101010 010101".split(" ");
const REFERENCE_NAMES = "乾 坤 屯 蒙 需 訟 師 比 小畜 履 泰 否 同人 大有 謙 豫 隨 蠱 臨 觀 噬嗑 賁 剝 復 無妄 大畜 頤 大過 坎 離 咸 恆 遯 大壯 晉 明夷 家人 睽 蹇 解 損 益 夬 姤 萃 升 困 井 革 鼎 震 艮 漸 歸妹 豐 旅 巽 兌 渙 節 中孚 小過 既濟 未濟".split(" ");

describe("Kinh Dịch 64 quẻ", () => {
  it("có đủ 64 quẻ theo thứ tự Văn Vương, không trùng mã", () => {
    expect(ICHING_HEXAGRAMS).toHaveLength(64);
    expect(ICHING_HEXAGRAMS.map((item) => item.number)).toEqual(Array.from({ length: 64 }, (_, index) => index + 1));
    expect(new Set(ICHING_HEXAGRAMS.map((item) => item.code)).size).toBe(64);
    expect(ICHING_HEXAGRAMS.every((item) => /^[01]{6}$/.test(item.code))).toBe(true);
  });

  it("khớp toàn bộ tên quẻ và mã 6 hào với bảng đối chiếu", () => {
    expect(ICHING_HEXAGRAMS.map((item) => item.chinese)).toEqual(REFERENCE_NAMES);
    expect(ICHING_HEXAGRAMS.map((item) => item.code)).toEqual(REFERENCE_CODES);
  });

  it("khớp các mốc đầu/cuối và cấu trúc thượng hạ quái", () => {
    expect(getHexagramByNumber(1)?.hanViet).toBe("Thuần Càn");
    expect(getHexagramByNumber(2)?.hanViet).toBe("Thuần Khôn");
    expect(getHexagramByNumber(3)?.hanViet).toBe("Thủy Lôi Truân");
    expect(getHexagramByNumber(64)?.hanViet).toBe("Hỏa Thủy Vị Tế");
    expect(ICHING_HEXAGRAMS.every((item) => Boolean(ICHING_TRIGRAMS[item.upper]) && Boolean(ICHING_TRIGRAMS[item.lower]))).toBe(true);
  });

  it("ánh xạ mã hào đáy->đỉnh đúng", () => {
    expect(getHexagramByCode("111111")?.number).toBe(1);
    expect(getHexagramByCode("000000")?.number).toBe(2);
    expect(getHexagramByCode("100010")?.number).toBe(3);
    expect(getHexagramByCode("010101")?.number).toBe(64);
  });

  it("gieo toàn thiếu dương ra Càn và không có quẻ biến", () => {
    const cast = buildIChingCast([7, 7, 7, 7, 7, 7]);
    expect(cast.primary.number).toBe(1);
    expect(cast.changed).toBeNull();
    expect(cast.movingLines).toEqual([]);
  });

  it("gieo toàn lão dương ra Càn biến Khôn", () => {
    const cast = buildIChingCast([9, 9, 9, 9, 9, 9]);
    expect(cast.primary.number).toBe(1);
    expect(cast.changed?.number).toBe(2);
    expect(cast.movingLines).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("gieo mẫu mã 100010 ra quẻ Truân", () => {
    const cast = buildIChingCast([7, 8, 8, 8, 7, 8]);
    expect(cast.primary.number).toBe(3);
    expect(cast.changed).toBeNull();
  });
});
