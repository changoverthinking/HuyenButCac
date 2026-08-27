export function authErrorMessage(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("email not confirmed")) {
    return "Email chưa được xác minh. Hãy mở thư xác nhận hoặc bấm “Gửi lại email xác minh”.";
  }
  if (normalized.includes("invalid login credentials")) return "Email hoặc mật khẩu không đúng. Hãy kiểm tra chính xác email đã dùng khi đăng ký.";
  if (normalized.includes("user already registered")) return "Email này đã được đăng ký.";
  if (normalized.includes("email rate limit exceeded")) return "Bạn đã gửi quá nhiều email. Hãy chờ vài phút rồi thử lại.";
  if (normalized.includes("password should be at least")) return "Mật khẩu chưa đủ độ dài yêu cầu.";
  if (normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "Không thể kết nối máy chủ. Dữ liệu vẫn được giữ trên thiết bị; hãy kiểm tra mạng rồi thử lại.";
  }
  return message;
}

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}
