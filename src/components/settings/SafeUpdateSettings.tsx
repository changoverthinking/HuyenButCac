import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useRegisterSW } from "virtual:pwa-register/react";
import { APP_CONFIG } from "../../app/appConfig";
import { supabase } from "../../features/auth/supabase";
import { isVaultUnlocked } from "../../features/crypto/vaultService";
import { getActiveWorkspaceUserId } from "../../database/db";
import { getLastSync, syncNow } from "../../features/sync/syncService";
import { prepareForReload } from "../../features/app/appLifecycle";
import { localGet, localSet } from "../../features/app/safeStorage";
import {
  downloadWorkspaceBackup,
  restoreWorkspaceBackupFile,
} from "../../features/backup/workspaceBackupService";
import {
  getLastFullCloudBackup,
  restoreLatestWorkspaceBackup,
  uploadLatestWorkspaceBackup,
} from "../../features/backup/cloudBackupService";
import { Icon } from "../common/Icons";

const LAST_SAFE_UPDATE_KEY = "hbc-last-safe-update";

type Notice = { tone: "success" | "warning" | "error" | "info"; text: string } | null;

function formatTime(value: number) {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleString("vi-VN");
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function SafeUpdateSettings() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const restoreInputRef = useRef<HTMLInputElement | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [storagePersisted, setStoragePersisted] = useState<boolean | null>(null);
  const [lastSafeUpdate, setLastSafeUpdate] = useState(() => Number(localGet(LAST_SAFE_UPDATE_KEY) ?? 0));
  const [, setBackupRevision] = useState(0);
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
    let authEventSeen = false;
    if (supabase) {
      void supabase.auth.getSession().then(({ data }) => {
        if (!disposed && !authEventSeen) setSession(data.session);
      });
      const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        authEventSeen = true;
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
  const lastFullBackup = session ? getLastFullCloudBackup(session.user.id) : 0;

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

  async function exportBackup() {
    setBackupBusy(true);
    setNotice({ tone: "info", text: "Đang chốt autosave và tạo bản sao toàn workspace…" });
    try {
      await prepareForReload();
      const result = await downloadWorkspaceBackup(APP_CONFIG.version);
      setNotice({ tone: "success", text: `Đã xuất bản sao toàn workspace (${result.databaseCount} database, ${formatBytes(result.bytes)}). PDF, ảnh, nhạc và dữ liệu Tiểu Nhị nằm trong cùng tệp.` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Không thể xuất bản sao lưu." });
    } finally {
      setBackupBusy(false);
    }
  }

  async function uploadCloudBackup() {
    if (!session) {
      setNotice({ tone: "warning", text: "Hãy đăng nhập để tạo bản sao cloud toàn workspace." });
      return;
    }
    if (!vaultReady) {
      setNotice({ tone: "warning", text: "Hãy mở Kho bảo mật trước. Bản sao cloud toàn workspace luôn được mã hóa AES-256-GCM ở client." });
      return;
    }
    setBackupBusy(true);
    setNotice({ tone: "info", text: "Đang mã hóa và sao lưu toàn workspace lên cloud…" });
    try {
      await prepareForReload();
      await syncNow(session.user);
      const result = await uploadLatestWorkspaceBackup(session.user, APP_CONFIG.version);
      setBackupRevision((value) => value + 1);
      setNotice({ tone: "success", text: `Đã tạo bản sao cloud toàn bộ: ${result.databaseCount} database, dữ liệu mã hóa ${formatBytes(result.encryptedBytes)}.` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Không thể sao lưu cloud toàn bộ." });
    } finally {
      setBackupBusy(false);
    }
  }

  async function importBackupFile(file: File) {
    if (!window.confirm("Khôi phục sẽ thay dữ liệu trong workspace hiện tại bằng dữ liệu trong bản sao. Tiếp tục?")) return;
    setRestoreBusy(true);
    setNotice({ tone: "info", text: "Đang khôi phục bản sao cục bộ…" });
    try {
      await prepareForReload();
      const result = await restoreWorkspaceBackupFile(file);
      setNotice({ tone: "success", text: `Đã khôi phục ${result.restoredRecords} bản ghi. Ứng dụng sẽ tải lại để mọi công cụ đọc dữ liệu mới.` });
      window.setTimeout(() => window.location.reload(), 350);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Không thể khôi phục bản sao lưu." });
      setRestoreBusy(false);
    }
  }

  async function restoreCloudBackup() {
    if (!session) {
      setNotice({ tone: "warning", text: "Hãy đăng nhập đúng tài khoản trước khi khôi phục cloud." });
      return;
    }
    if (!vaultReady) {
      setNotice({ tone: "warning", text: "Hãy mở Kho bảo mật để giải mã bản sao cloud." });
      return;
    }
    if (!window.confirm("Khôi phục bản sao cloud gần nhất sẽ thay dữ liệu trong workspace hiện tại. Tiếp tục?")) return;
    setRestoreBusy(true);
    setNotice({ tone: "info", text: "Đang tải, giải mã và khôi phục bản sao cloud…" });
    try {
      await prepareForReload();
      const result = await restoreLatestWorkspaceBackup(session.user);
      setNotice({ tone: "success", text: `Đã khôi phục ${result.restoredRecords} bản ghi từ cloud. Ứng dụng sẽ tải lại.` });
      window.setTimeout(() => window.location.reload(), 350);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Không thể khôi phục bản sao cloud." });
      setRestoreBusy(false);
    }
  }

  async function safeUpdate() {
    setUpdating(true);
    setNotice({ tone: "info", text: "Đang chốt dữ liệu đang soạn trước khi cập nhật…" });
    try {
      await prepareForReload();
      if (!online) throw new Error("Thiết bị đang ngoại tuyến. Hãy kết nối mạng trước khi cập nhật an toàn.");

      if (session) {
        if (getActiveWorkspaceUserId() !== session.user.id) {
          throw new Error("Workspace tài khoản chưa sẵn sàng. Hãy đóng Cài đặt, mở lại rồi thử lại.");
        }
        if (!isVaultUnlocked(session.user.id)) {
          throw new Error("Kho bảo mật đang khóa. Hãy mở Kho ở tab Bảo mật trước khi cập nhật để dữ liệu được sao lưu lên cloud.");
        }
        setNotice({ tone: "info", text: "Đang đồng bộ thay đổi và tạo bản sao cloud toàn workspace…" });
        await syncNow(session.user);
        await uploadLatestWorkspaceBackup(session.user, APP_CONFIG.version);
        setBackupRevision((value) => value + 1);
      } else {
        setNotice({ tone: "info", text: "Chưa đăng nhập: đang xuất bản sao toàn workspace trước khi cập nhật…" });
        await downloadWorkspaceBackup(APP_CONFIG.version);
      }

      if (navigator.storage?.persist) {
        try {
          const persisted = await navigator.storage.persist();
          setStoragePersisted(persisted);
        } catch {
          // Không chặn cập nhật: backup/sync đã chạy trước bước này.
        }
      }

      const now = Date.now();
      localSet(LAST_SAFE_UPDATE_KEY, String(now));
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
            ? "Đã đồng bộ và tạo bản sao cloud toàn workspace. Hiện chưa có bản cập nhật mới để cài."
            : "Đã xuất bản sao toàn workspace. Hiện chưa có bản cập nhật mới để cài.",
        });
        return;
      }

      setNotice({ tone: "success", text: "Dữ liệu đã được bảo vệ. Đang kích hoạt bản cập nhật…" });
      await updateServiceWorker(true);
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : "Cập nhật an toàn thất bại. Bản hiện tại vẫn được giữ nguyên." });
    } finally {
      setUpdating(false);
    }
  }

  const busy = checking || updating || backupBusy || restoreBusy;
  const noticeClass = notice?.tone === "error"
    ? "border-red-500/45 bg-red-500/10"
    : notice?.tone === "warning"
      ? "border-amber-500/45 bg-amber-500/10"
      : notice?.tone === "success"
        ? "border-emerald-500/45 bg-emerald-500/10"
        : "border-[var(--color-border)] bg-[var(--color-surface-alt)]";

  return (
    <section className="appearance-settings-section">
      <h3>Cập nhật an toàn & sao lưu</h3>
      <p>Trước khi reload PWA, app chờ autosave của Ghi chú/Dự án hoàn tất. Bản sao toàn workspace bao gồm cả IndexedDB phụ của Tàng Thư, ảnh giao diện và Tiểu Nhị.</p>

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
          <div className="mb-2 font-semibold">Phạm vi bảo vệ dữ liệu</div>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-3"><span>Ghi chú · dự án · lịch · sơ đồ · bảng trắng</span><b>{session ? "Delta sync + backup" : "Backup cục bộ"}</b></div>
            <div className="flex items-center justify-between gap-3"><span>Tàng Thư · PDF · bìa sách</span><b>Backup toàn bộ</b></div>
            <div className="flex items-center justify-between gap-3"><span>Nhạc · ảnh giao diện · avatar</span><b>Backup toàn bộ</b></div>
            <div className="flex items-center justify-between gap-3"><span>Tiểu Nhị · history · memory · index</span><b>Backup toàn bộ</b></div>
          </div>
        </div>

        <div className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)" }}>
          <div className="mb-2 font-semibold">Trạng thái bảo vệ</div>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between gap-3"><span>Kết nối mạng</span><b>{online ? "Sẵn sàng" : "Ngoại tuyến"}</b></div>
            <div className="flex items-center justify-between gap-3"><span>Tài khoản cloud</span><b>{session ? "Đã đăng nhập" : "Chưa đăng nhập"}</b></div>
            <div className="flex items-center justify-between gap-3"><span>Kho bảo mật</span><b>{session ? (vaultReady ? "Đã mở" : "Chưa sẵn sàng") : "Không áp dụng"}</b></div>
            <div className="flex items-center justify-between gap-3"><span>Delta sync gần nhất</span><b className="text-right">{session ? formatTime(lastSync) : "Không có cloud"}</b></div>
            <div className="flex items-center justify-between gap-3"><span>Backup cloud toàn bộ</span><b className="text-right">{session ? formatTime(lastFullBackup) : "Không có cloud"}</b></div>
            <div className="flex items-center justify-between gap-3"><span>Lưu trữ bền vững</span><b>{storagePersisted === true ? "Đã bật" : storagePersisted === false ? "Chưa được cấp" : "Không xác định"}</b></div>
            <div className="flex items-center justify-between gap-3"><span>Cập nhật an toàn gần nhất</span><b className="text-right">{formatTime(lastSafeUpdate)}</b></div>
          </div>
        </div>

        {!session && <div className="rounded-xl border border-amber-500/45 bg-amber-500/10 p-3 text-sm">
          Bạn chưa đăng nhập. Nút cập nhật an toàn sẽ tự xuất bản sao toàn workspace trước khi reload. Không gỡ PWA hoặc xóa dữ liệu website nếu chưa giữ tệp backup.
        </div>}

        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium disabled:opacity-50" style={{ borderColor: "var(--color-border)" }} onClick={() => void exportBackup()}>
            <Icon name="export" size={16} /> {backupBusy ? "Đang sao lưu…" : "Xuất backup toàn bộ"}
          </button>
          <button type="button" disabled={busy} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium disabled:opacity-50" style={{ borderColor: "var(--color-border)" }} onClick={() => restoreInputRef.current?.click()}>
            <Icon name="refresh" size={16} /> Khôi phục từ tệp
          </button>
          <input
            ref={restoreInputRef}
            type="file"
            accept=".json,.hbc-backup.json,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = "";
              if (file) void importBackupFile(file);
            }}
          />
          {session && <button type="button" disabled={busy || !online || !vaultReady} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium disabled:opacity-50" style={{ borderColor: "var(--color-border)" }} onClick={() => void uploadCloudBackup()}>
            <Icon name="lock" size={16} /> Backup cloud toàn bộ
          </button>}
          {session && <button type="button" disabled={busy || !online || !vaultReady} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium disabled:opacity-50" style={{ borderColor: "var(--color-border)" }} onClick={() => void restoreCloudBackup()}>
            <Icon name="refresh" size={16} /> Khôi phục cloud
          </button>}
        </div>

        <div className="flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
          <button type="button" disabled={busy} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium disabled:opacity-50" style={{ borderColor: "var(--color-border)" }} onClick={() => void checkForUpdate()}>
            <Icon name="refresh" size={16} /> {checking ? "Đang kiểm tra…" : "Kiểm tra cập nhật"}
          </button>
          <button type="button" disabled={busy || !online} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: "var(--color-accent)", color: "var(--color-bg)" }} onClick={() => void safeUpdate()}>
            <Icon name="check" size={16} /> {updating ? "Đang bảo vệ dữ liệu…" : needRefresh ? "Đồng bộ · backup · cập nhật" : "Bảo vệ dữ liệu trước cập nhật"}
          </button>
          {storagePersisted !== true && <button type="button" disabled={busy} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm disabled:opacity-50" style={{ borderColor: "var(--color-border)" }} onClick={() => void requestPersistentStorage()}>
            <Icon name="lock" size={16} /> Bật lưu trữ bền vững
          </button>}
        </div>

        <p className="text-xs opacity-65">Backup cloud toàn bộ được nén rồi mã hóa AES-256-GCM trên thiết bị trước khi upload vào bucket private. Mật khẩu Kho không được upload.</p>

        {notice && <div className={`rounded-xl border p-3 text-sm ${noticeClass}`} role="status" aria-live="polite">{notice.text}</div>}
      </div>
    </section>
  );
}
