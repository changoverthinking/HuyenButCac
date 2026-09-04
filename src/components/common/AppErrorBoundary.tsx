import { Component, type ErrorInfo, type ReactNode } from "react";
import { localSet } from "../../features/app/safeStorage";

type Props = {
  children: ReactNode;
  area?: string;
  compact?: boolean;
};

type State = {
  error: Error | null;
  errorId: string;
};

function makeErrorId() {
  return `HBC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorId: "" };

  static getDerivedStateFromError(error: Error): State {
    return { error, errorId: makeErrorId() };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    try {
      const key = "hbc-last-ui-error";
      localSet(key, JSON.stringify({
        id: this.state.errorId,
        area: this.props.area ?? "Ứng dụng",
        message: error.message,
        stack: error.stack ?? "",
        componentStack: info.componentStack ?? "",
        at: new Date().toISOString(),
        version: document.querySelector('meta[name="hbc-version"]')?.getAttribute("content") ?? "unknown",
      }));
    } catch {
      // Lỗi logging không được phép che lỗi gốc.
    }
  }

  retry = () => this.setState({ error: null, errorId: "" });

  render() {
    const { error, errorId } = this.state;
    if (!error) return this.props.children;

    if (this.props.compact) {
      return (
        <div className="m-3 rounded-xl border p-3 text-sm" role="alert" style={{ borderColor: "var(--color-error)" }}>
          <strong>{this.props.area ?? "Khu vực này"} tạm thời gặp lỗi.</strong>
          <div className="mt-1 opacity-70">Mã: {errorId}. Dữ liệu cục bộ không bị xóa.</div>
          <button type="button" className="mt-2 rounded-lg border px-3 py-1.5" onClick={this.retry}>Thử mở lại</button>
        </div>
      );
    }

    return (
      <div className="min-h-dvh grid place-items-center p-6" role="alert" style={{ background: "var(--color-bg)", color: "var(--color-text)" }}>
        <div className="max-w-xl rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
          <h1 className="text-xl font-semibold">Huyền Bút Các gặp lỗi giao diện</h1>
          <p className="mt-2 text-sm opacity-75">Ứng dụng đã chặn lỗi để tránh lan sang các công cụ khác. Dữ liệu IndexedDB không bị xóa.</p>
          <p className="mt-2 text-xs opacity-60">Mã lỗi: {errorId}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="rounded-xl border px-3 py-2 text-sm" onClick={this.retry}>Thử lại khu vực</button>
            <button type="button" className="rounded-xl border px-3 py-2 text-sm" onClick={() => window.location.reload()}>Tải lại ứng dụng</button>
          </div>
        </div>
      </div>
    );
  }
}
