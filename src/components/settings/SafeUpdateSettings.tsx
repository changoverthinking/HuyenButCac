import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useRegisterSW } from "virtual:pwa-register/react";
import { APP_CONFIG } from "../../app/appConfig";
import { supabase } from "../../features/auth/supabase";
import { isVaultUnlocked } from "../../features/crypto/vaultService";
import { getActiveWorkspaceUserId } from "../../database/db";
import { getLastSync, syncNow } from "../../features/sync/syncService";
import { Icon } from "../common/Icons";

const LAST_SAFE_UPDATE_KEY = "hbc-last-safe-update";

type Notice = { tone: "success" | "warning" | "error" | "info"; text: string } | null;

function formatTime(value: number) {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleString("vi-VN");
}

export function SafeUpdateSettings() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [storagePersisted, setStoragePersisted] = useState<boolean | null>(null);
  const [lastSafeUpdate, setLastSafeUpdate] = useState(() => Number(localStorage.getItem(LAST_SAFE_UPDATE_KEY) ?? 0));
  const [notice, setNotice] = useState<Notice>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration ?? null;
    },
    onRegisterError(error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Không thể khởi tạo cơ chế cập nhật." });
    },
  });

  useEffect(() => {
    let disposed = false;
    if (supabase) {
      void supabase.auth.getSession().then(({ data }) => {
        if (!disposed) setSession(data.session);
      });
      const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (!disposed) setSession(nextSession);
      });
      return () => {
        disposed = true;
        data.subscription.unsubscribe();
      };
    }
    return () => { disposed = true; };
  }, []);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!navigator.storage?.persisted) return;
    void navigator.storage.persisted().then(setStoragePersisted).catch(() => setStoragePersisted(null));
  }, []);

  const vaultReady = Boolean(session && getActiveWorkspaceUserId() === session.user.id && isVaultUnlocked(session.user.id));
  const lastSync = session ? getLastSync(session.user.id) : 0;

  async function requestPersistentStorage() {
    if (!navigator.storage?.persist) {
      setNotice({ tone: "warning", text: "Trình duyệt này không hỗ trợ yêu cầu lưu trữ bền vững." });
      return;
    }
    try {
      const granted = await navigator.storage.persist();
      setStoragePersisted(granted);
      setNotice(granted
        ? { tone: "success", text: "Trình duyệt đã cấp lưu trữ bền vững cho dữ liệu cục bộ." }
        : { tone: "warning", text: "Trình duyệt chưa cấp lưu trữ bền vững. Dữ liệu vẫn dùng IndexedDB nhưng có thể bị hệ thống dọn khi thiếu dung lượng." });
    } catch {
      setNotice({ tone: "warning", text: "Không thể thay đổi chế độ lưu trữ trên trình duyệt này." });
    }
  }

  async function checkForUpdate() {
    setChecking(true);
    setNotice(null);
    try {
      const registration = registrationRef.current ?? await navigator.serviceWorker?.getRegistration();
      if (!registration) {
        setNotice({ tone: "warning", text: "Service Worker chưa sẵn sàng. Hãy mở lại ứng dụng sau khi deploy hoàn tất." });
        return;
      }
      registrationRef.current = registration;
      await registration.update();
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      if (registration.waiting || needRefresh) {
        setNotice({ tone: "info", text: "Đã tìm thấy bản cập nhật. Có thể dùng “Đồng bộ & cập nhật an toàn”." });
      } else {
        setNotice({ tone: "success", text: `Huyền Bút Các ${APP_CONFIG.version} đang là phiên bản mới nhất mà máy chủ cung cấp.` });
      }
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Không thể kiểm tra bản cập nhật." });
    } finally {
      setChecking(false);
    }
  }

  async function safeUpdate() {
    setUpdating(true);
    setNotice({ tone: "info", text: "Đang bảo vệ dữ liệu trước khi cập nhật…" });
    try {
      if (!online) throw new Error("Thiết bị đang ngoại tuyến. Hãy kết nối mạng trước khi cập nhật an toàn.");

      if (session) {
        if (getActiveWorkspaceUserId() !== session.user.id) {
          throw new Error("Workspace tài khoản chưa sẵn sàng. Hãy đóng Cài đặt, mở lại rồi thử lại.");
        }
        if (!isVaultUnlocked(session.user.id)) {
          throw new Error("Kho bảo mật đang khóa. Hãy mở Kho ở tab Bảo mật trước khi cập nhật để dữ liệu được sao lưu lên cloud.");
        }
        await syncNow(session.user);
      }

      if (navigator.storage?.persist) {
        try {
          const persisted = await navigator.storage.persist();
          setStoragePersisted(persisted);
        } catch {
          // Không chặn cập nhật: đồng bộ cloud/IndexedDB vẫn là lớp bảo vệ chính.
        }
      }

      const now = Date.now();
      localStorage.setItem(LAST_SAFE_UPDATE_KEY, String(now));
      setLastSafeUpdate(now);

      if (!needRefresh) {
        const registration = registrationRef.current ?? await navigator.serviceWorker?.getRegistration();
        if (registration) {
          registrationRef.current = registration;
          await registration.update();
        }
      }

      const registration = registrationRef.current;
      if (!needRefresh && !registration?.waiting) {
        setNotice({
          tone: "success",
          text: session
            ? "Dữ liệu đã đồng bộ an toàn. Hiện chưa có bản cập nhật mới để cài."
            : "Dữ liệu cục bộ đã được giữ nguyên. Hiện chưa có bản cập nhật mới để cài.",
        });
        return;
      }

      setNotice({ tone: "success", text: session ? "Đã đồng bộ dữ liệu. Đang kích hoạt bản cập nhật…" : "Đang cập nhật tại chỗ; IndexedDB được giữ nguyên." });
      await updateServiceWorker(true);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Cập nhật an toàn thất bại. Bản hiện tại vẫn được giữ nguyên." });
    } finally {
      setUpdating(false);
    }
  }

  const noticeClass = notice?.tone === "error"
    ? "border-red-500/45 bg-red-500/10"
    : notice?.tone === "warning"
      ? "border-amber-500/45 bg-amber-500/10"
      : notice?.tone === "success"
        ? "border-emerald-500/45 bg-emerald-500/10"
        : "border-[var(--color-border)] bg-[var(--color-surface-alt)]";

  return (
    <section className="appearance-settings-section">
      <h3>Cập nhật an toàn</h3>
      <p>Không cần gỡ ứng dụng khỏi màn hình chính. Hệ thống sẽ giữ IndexedDB, đồng bộ dữ liệu tài khoản trước khi kích hoạt bản PWA mới và cố gắng bật lưu trữ bền vững trên thiết bị.</p>

      <div className="grid gap-3">
        <div className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Phiên bản ứng dụng</div>
              <div className="text-sm opacity-70">Hiện tại: v{APP_CONFIG.version}</div>
            </div>
            <span className="rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: needRefresh ? "var(--color-accent)" : "var(--color-border)" }}>
              {needRefresh ? "Có bản mới" : "Chưa phát hiện bản mới"}
            </span>
          </div>
        </div>

        <div className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)" }}>
          <div className="mb-2 font-semibold">Trạng thái bảo vệ dữ liệu</div>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-3"><span>Kết nối mạng</span><b>{online ? "Sẵn sàng" : "Ngoại tuyến"}</b></div>
            <div className="flex items-center justify-between gap-3"><span>Tài khoản cloud</span><b>{session ? "Đã đăng nhập" : "Chưa đăng nhập"}</b></div>
            <div className="flex items-center justify-between gap-3"><span>Kho bảo mật</span><b>{session ? (vaultReady ? "Đã mở" : "Chưa sẵn sàng") : "Không áp dụng"}</b></div>
            <div className="flex items-center justify-between gap-3"><span>Đồng bộ gần nhất</span><b className="text-right">{session ? formatTime(lastSync) : "Không có cloud"}</b></div>
            <div className="flex items-center justify-between gap-3"><span>Lưu trữ bền vững</span><b>{storagePersisted === true ? "Đã bật" : storagePersisted === false ? "Chưa được cấp" : "Không xác định"}</b></div>
            <div className="flex items-center justify-between gap-3"><span>Cập nhật an toàn gần nhất</span><b className="text-right">{formatTime(lastSafeUpdate)}</b></div>
          </div>
        </div>

        {!session && <div className="rounded-xl border border-amber-500/45 bg-amber-500/10 p-3 text-sm">
          Bạn chưa đăng nhập. Cập nhật tại chỗ vẫn giữ IndexedDB, nhưng sẽ không có bản sao cloud. Không gỡ ứng dụng hoặc xóa dữ liệu website nếu chưa có bản sao lưu.
        </div>}

        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={checking || updating} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium disabled:opacity-50" style={{ borderColor: "var(--color-border)" }} onClick={() => void checkForUpdate()}>
            <Icon name="refresh" size={16} /> {checking ? "Đang kiểm tra…" : "Kiểm tra cập nhật"}
          </button>
          <button type="button" disabled={updating || checking || !online} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: "var(--color-accent)", color: "var(--color-bg)" }} onClick={() => void safeUpdate()}>
            <Icon name="check" size={16} /> {updating ? "Đang bảo vệ dữ liệu…" : needRefresh ? "Đồng bộ & cập nhật an toàn" : "Bảo vệ dữ liệu trước cập nhật"}
          </button>
          {storagePersisted !== true && <button type="button" disabled={updating} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm disabled:opacity-50" style={{ borderColor: "var(--color-border)" }} onClick={() => void requestPersistentStorage()}>
            <Icon name="lock" size={16} /> Bật lưu trữ bền vững
          </button>}
        </div>

        <p className="text-xs opacity-65">Lưu ý: cập nhật PWA tại chỗ không xóa IndexedDB. Việc gỡ ứng dụng hoặc xóa dữ liệu trang web vẫn có thể xóa dữ liệu cục bộ, vì vậy tài khoản cloud là lớp khôi phục quan trọng nhất.</p>

        {notice && <div className={`rounded-xl border p-3 text-sm ${noticeClass}`}>{notice.text}</div>}
      </div>
    </section>
  );
}
