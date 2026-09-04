import { describe, expect, it } from "vitest";
import {
  TU_VI_STAR_DEFINITIONS,
  TU_VI_STAR_SOURCES,
  getTuViStarDefinition,
} from "../features/metaphysics/tuViStarDefinitions";

const MAIN_14 = [
  "Tử Vi", "Thiên Cơ", "Thái Dương", "Vũ Khúc", "Thiên Đồng", "Liêm Trinh", "Thiên Phủ",
  "Thái Âm", "Tham Lang", "Cự Môn", "Thiên Tướng", "Thiên Lương", "Thất Sát", "Phá Quân",
];
const CORE_AUX = ["Tả Phụ", "Hữu Bật", "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt", "Lộc Tồn", "Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Địa Không", "Địa Kiếp"];

describe("Từ điển sao Tử Vi", () => {
  it("không trùng tên và mỗi mục có nội dung", () => {
    expect(new Set(TU_VI_STAR_DEFINITIONS.map((item) => item.name)).size).toBe(TU_VI_STAR_DEFINITIONS.length);
    expect(TU_VI_STAR_DEFINITIONS.every((item) => item.meaning.length >= 30 && item.keywords.length > 0)).toBe(true);
  });

  it("có đủ 14 chính tinh", () => {
    for (const name of MAIN_14) expect(getTuViStarDefinition(name)?.group).toBe("Chính tinh");
  });

  it("có đủ nhóm phụ/sát tinh cốt lõi đang an trên lá số", () => {
    for (const name of CORE_AUX) expect(Boolean(getTuViStarDefinition(name))).toBe(true);
  });

  it("có đủ Tứ Hóa", () => {
    for (const name of ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"]) expect(getTuViStarDefinition(name)?.group).toBe("Tứ Hóa");
  });

  it("sourceId của mọi định nghĩa đều tồn tại", () => {
    const sourceIds = new Set(TU_VI_STAR_SOURCES.map((source) => source.id));
    expect(TU_VI_STAR_DEFINITIONS.every((item) => item.sourceIds.every((id) => sourceIds.has(id as (typeof TU_VI_STAR_SOURCES)[number]["id"])))).toBe(true);
  });

  it("hỗ trợ dị danh Tả Phù -> Tả Phụ", () => {
    expect(getTuViStarDefinition("Tả Phù")?.name).toBe("Tả Phụ");
  });
});
