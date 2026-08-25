import { useRegisterSW } from "virtual:pwa-register/react";

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW() {
      // no-op: đăng ký thành công
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-accent)" }}
    >
      <span style={{ color: "var(--color-text)" }} className="text-sm">
        Đã có bản cập nhật mới.
      </span>
      <button
        className="px-3 py-1.5 rounded text-sm font-medium"
        style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
        onClick={() => updateServiceWorker(true)}
      >
        Cập nhật ngay
      </button>
    </div>
  );
}
