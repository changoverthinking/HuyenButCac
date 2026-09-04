import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function UpdatePrompt() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [updating, setUpdating] = useState(false);

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

  const applyUpdate = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      await updateServiceWorker(true);
    } catch {
      // Nếu trình duyệt chặn reload/cập nhật, cho phép người dùng thử lại.
      setUpdating(false);
    }
  };

  return (
    <div className="hbc-update-prompt" role="status" aria-live="polite" aria-atomic="true">
      <span className="hbc-update-copy">Đã có bản cập nhật mới.</span>
      <button
        type="button"
        className="hbc-update-action"
        disabled={updating}
        onClick={() => void applyUpdate()}
      >
        {updating ? "Đang cập nhật…" : "Cập nhật ngay"}
      </button>
    </div>
  );
}
