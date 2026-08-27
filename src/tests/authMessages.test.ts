import { describe, expect, it } from "vitest";
import { authErrorMessage, normalizeAuthEmail } from "../features/auth/authMessages";

describe("authErrorMessage", () => {
  it("dịch lỗi email chưa xác minh", () => {
    expect(authErrorMessage("Email not confirmed")).toContain("Email chưa được xác minh");
  });

  it("dịch lỗi thông tin đăng nhập", () => {
    expect(authErrorMessage("Invalid login credentials")).toContain("Email hoặc mật khẩu không đúng");
  });

  it("giữ lỗi chưa biết để không che mất chẩn đoán", () => {
    expect(authErrorMessage("Unknown auth failure")).toBe("Unknown auth failure");
  });

  it("chuẩn hóa email trước khi gửi Supabase", () => {
    expect(normalizeAuthEmail("  User.Name@GMAIL.COM ")).toBe("user.name@gmail.com");
  });
});
