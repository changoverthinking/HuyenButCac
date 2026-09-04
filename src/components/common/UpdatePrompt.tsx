import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function UpdatePrompt() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration ?? null;
    },
  });

  useEffect(() => {
    const checkForUpdate = () => {
      const registration = registrationRef.current;
      if (!registration) return;
      void registration.update().catch(() => undefined);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };

    const intervalId = window.setInterval(checkForUpdate, 60_000);
    window.addEventListener("focus", checkForUpdate);
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Kiểm tra sớm sau khi app được mở.
    const initialId = window.setTimeout(checkForUpdate, 1500);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(initialId);
      window.removeEventListener("focus", checkForUpdate);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  if (!needRefresh) return null;

  return (
    <div
      className="hbc-update-prompt fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 border"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-accent)" }}
    >
      <span style={{ color: "var(--color-text)" }} className="text-sm">
        Đã có bản cập nhật mới.
      </span>
      <button
        className="px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap"
        style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
        onClick={() => updateServiceWorker(true)}
      >
        Cập nhật ngay
      </button>
    </div>
  );
}
