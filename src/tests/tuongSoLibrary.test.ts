import { describe, expect, it } from "vitest";
import {
  PHYSIOGNOMY_AREAS,
  PHYSIOGNOMY_CATALOG,
  PHYSIOGNOMY_SOURCES,
  getPhysiognomySource,
} from "../features/metaphysics/tuongSo";

describe("Tướng Số library", () => {
  it("có đủ dữ liệu mở rộng và không trùng id", () => {
    expect(PHYSIOGNOMY_CATALOG.length).toBeGreaterThanOrEqual(90);
    expect(new Set(PHYSIOGNOMY_CATALOG.map((item) => item.id)).size).toBe(PHYSIOGNOMY_CATALOG.length);
  });

  it("mỗi nhóm có ít nhất 6 mục", () => {
    for (const area of PHYSIOGNOMY_AREAS) {
      expect(PHYSIOGNOMY_CATALOG.filter((item) => item.area === area).length).toBeGreaterThanOrEqual(6);
    }
  });

  it("mọi mục đều có luận, cách đọc và nguồn hợp lệ", () => {
    for (const item of PHYSIOGNOMY_CATALOG) {
      expect(item.traditionalMeaning.length).toBeGreaterThan(40);
      expect(item.howToRead.length).toBeGreaterThan(25);
      expect(item.sourceIds.length).toBeGreaterThan(0);
      for (const sourceId of item.sourceIds) expect(getPhysiognomySource(sourceId)).toBeTruthy();
    }
  });

  it("có nhiều nguồn độc lập để đối chiếu", () => {
    expect(PHYSIOGNOMY_SOURCES.length).toBeGreaterThanOrEqual(8);
    expect(PHYSIOGNOMY_SOURCES.some((source) => source.role === "cổ thư")).toBe(true);
    expect(PHYSIOGNOMY_SOURCES.some((source) => source.role === "đối chiếu Việt ngữ")).toBe(true);
  });
});
