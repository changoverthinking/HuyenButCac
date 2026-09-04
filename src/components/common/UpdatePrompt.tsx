import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { APP_CONFIG } from "../../app/appConfig";
import { prepareForReload } from "../../features/app/appLifecycle";
import { downloadWorkspaceBackup } from "../../features/backup/workspaceBackupService";

export function UpdatePrompt() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

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
    setError("");
    try {
      // Không reload trong khi editor còn debounce/autosave. Sau đó xuất một recovery file
      // để cả dữ liệu local-only (PDF/ảnh/nhạc/Tiểu Nhị) cũng có đường khôi phục.
      await prepareForReload();
      await downloadWorkspaceBackup(APP_CONFIG.version);
      await updateServiceWorker(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể chuẩn bị dữ liệu để cập nhật.");
      setUpdating(false);
    }
  };

  return (
    <div className="hbc-update-prompt" role="status" aria-live="polite" aria-atomic="true">
      <span className="hbc-update-copy">{error || "Đã có bản cập nhật mới. App sẽ sao lưu trước khi reload."}</span>
      <button
        type="button"
        className="hbc-update-action"
        disabled={updating}
        onClick={() => void applyUpdate()}
      >
        {updating ? "Đang sao lưu…" : "Sao lưu & cập nhật"}
      </button>
    </div>
  );
}
