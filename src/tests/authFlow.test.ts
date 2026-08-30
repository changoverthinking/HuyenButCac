import { describe, expect, it } from "vitest";
import { getAuthRedirectUrl, isPasswordRecoveryUrl } from "../features/auth/authFlow";

describe("auth redirect flow", () => {
  it("tạo URL chuyển hướng đúng với base GitHub Pages", () => {
    expect(getAuthRedirectUrl({ origin: "https://changoverthinking.github.io" } as Location, "/HuyenButCac/"))
      .toBe("https://changoverthinking.github.io/HuyenButCac/");
  });

  it("nhận biết liên kết khôi phục trong hash hoặc query", () => {
    expect(isPasswordRecoveryUrl({ search: "", hash: "#access_token=x&type=recovery" } as Location)).toBe(true);
    expect(isPasswordRecoveryUrl({ search: "?type=recovery", hash: "" } as Location)).toBe(true);
    expect(isPasswordRecoveryUrl({ search: "", hash: "" } as Location)).toBe(false);
  });
});
