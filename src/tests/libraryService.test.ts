import { describe, expect, it } from "vitest";
import { libraryDatabaseNameForWorkspace, validateCoverFile, validatePdfFile } from "../features/library/libraryService";

describe("Tàng Thư - kiểm tra tệp và workspace", () => {
  it("tách database theo workspace", () => {
    expect(libraryDatabaseNameForWorkspace(null)).toBe("huyen-but-cac-library-v1-local");
    expect(libraryDatabaseNameForWorkspace("user/a")).toBe("huyen-but-cac-library-v1-user%2Fa");
  });

  it("chấp nhận PDF hợp lệ và từ chối file khác", () => {
    const pdf = new File(["%PDF-1.7"], "kinh.pdf", { type: "application/pdf" });
    expect(() => validatePdfFile(pdf)).not.toThrow();
    const text = new File(["hello"], "kinh.txt", { type: "text/plain" });
    expect(() => validatePdfFile(text)).toThrow(/không phải PDF/i);
  });

  it("kiểm tra ảnh bìa", () => {
    const image = new File(["image"], "bia.webp", { type: "image/webp" });
    expect(() => validateCoverFile(image)).not.toThrow();
    const text = new File(["text"], "bia.txt", { type: "text/plain" });
    expect(() => validateCoverFile(text)).toThrow(/hình ảnh/i);
  });
});
