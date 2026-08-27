import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { cloudConfigured, missingCloudSettings, supabase } from "../../features/auth/supabase";
import { getLastSync, syncNow, type SyncStatus } from "../../features/sync/syncService";
import { getVaultState, isVaultUnlocked, lockVault, setupVault, unlockVault } from "../../features/crypto/vaultService";

export function AccountPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<SyncStatus>(navigator.onLine ? "idle" : "offline");
  const [lastSync, setLastSync] = useState(0);
  const [recovering, setRecovering] = useState(false);
  const [vaultState, setVaultState] = useState<"loading" | "setup" | "locked" | "unlocked">("loading");
  const [vaultPassphrase, setVaultPassphrase] = useState("");
  const [vaultConfirm, setVaultConfirm] = useState("");
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  async function runSync(activeSession = session) {
    if (!activeSession) return;
    if (!isVaultUnlocked(activeSession.user.id)) { setStatus("idle"); return; }
    setStatus("syncing");
    try {
      await syncNow(activeSession.user);
      setStatus("synced");
      setLastSync(getLastSync(activeSession.user.id));
    } catch (error) {
      setStatus(navigator.onLine ? "error" : "offline");
      setMessage(error instanceof Error ? error.message : "Đồng bộ thất bại");
    }
  }

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      const previousUserId = sessionRef.current?.user.id;
      setSession(next);
      if (event === "PASSWORD_RECOVERY") { setRecovering(true); setPassword(""); }
      if (event === "SIGNED_OUT") {
        lockVault(previousUserId);
        setVaultState("loading"); setStatus("idle"); setLastSync(0);
        setVaultPassphrase(""); setVaultConfirm("");
      }
    });
    const online = () => setStatus("idle");
    const offline = () => setStatus("offline");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => { data.subscription.unsubscribe(); window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled=false;
    setLastSync(getLastSync(session.user.id));
    void getVaultState(session.user.id).then(state=>{if(!cancelled){setVaultState(state);if(state==="unlocked")void runSync(session);}}).catch(error=>setMessage(error instanceof Error?error.message:"Không thể kiểm tra Kho"));
    const timer = window.setInterval(() => { if (navigator.onLine && isVaultUnlocked(session.user.id)) void runSync(session); }, 45_000);
    const visible = () => { if (document.visibilityState === "visible" && navigator.onLine && isVaultUnlocked(session.user.id)) void runSync(session); };
    const online = () => { if (isVaultUnlocked(session.user.id)) void runSync(session); };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", online);
    return () => { cancelled=true; window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); window.removeEventListener("online", online); };
  }, [session]);

  async function submitVault(event: React.FormEvent) {
    event.preventDefault();
    if (!session) return;
    if (vaultPassphrase.length < 12) { setMessage("Mật khẩu Kho cần ít nhất 12 ký tự."); return; }
    if (vaultState === "setup" && vaultPassphrase !== vaultConfirm) { setMessage("Hai mật khẩu Kho chưa giống nhau."); return; }
    setBusy(true); setMessage("");
    try {
      if (vaultState === "setup") await setupVault(session.user, vaultPassphrase);
      else await unlockVault(session.user, vaultPassphrase);
      setVaultState("unlocked"); setVaultPassphrase(""); setVaultConfirm("");
      await runSync(session);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể mở Kho bảo mật"); }
    finally { setBusy(false); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setMessage("Chưa thể kết nối Supabase. Hãy thêm đủ hai GitHub Actions Variable rồi chạy lại Deploy.");
      return;
    }
    setBusy(true); setMessage("");
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
        if (error) throw error;
        setMessage("Đã tạo tài khoản. Hãy mở email xác minh rồi đăng nhập.");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
        if (error) throw error;
        setMessage("Đã gửi liên kết đặt lại mật khẩu vào email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể thực hiện"); }
    finally { setBusy(false); }
  }

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMessage(error.message);
    else { setRecovering(false); setMessage("Đã đổi mật khẩu thành công."); }
  }

  async function signOutSafely() {
    if (!supabase || !session) return;
    setBusy(true); setMessage("");
    try {
      if (!navigator.onLine) throw new Error("Đang ngoại tuyến. Hãy kết nối mạng để đồng bộ lần cuối trước khi đăng xuất.");
      await syncNow(session.user);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      lockVault(session.user.id); setVaultState("loading");
      setStatus("idle");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể đăng xuất an toàn");
    } finally { setBusy(false); }
  }

  if (!open) return null;
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4" onMouseDown={onClose}>
    <section className="account-panel immortal-panel max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border p-5 shadow-2xl" onMouseDown={e=>e.stopPropagation()}>
      <div className="account-heading flex items-center justify-between mb-4"><div className="flex items-center gap-3"><span className="brand-sigil small">鑰</span><div><h2 className="text-xl font-bold">Tàng Thư Mật Cảnh</h2><p className="text-xs opacity-65">Tài khoản · Kho bảo mật · Đồng bộ</p></div></div><button className="mystic-close" onClick={onClose} aria-label="Đóng">✕</button></div>
      {!cloudConfigured && <div className="mb-4 rounded-xl border p-3" style={{background:"var(--color-surface-alt)",borderColor:"var(--color-warning)"}}>
        <p>Máy chủ Supabase chưa được đưa vào bản triển khai. Dữ liệu hiện vẫn lưu trên thiết bị này.</p>
        <p className="mt-2 text-sm">Thiếu GitHub Actions Variable: <b>{missingCloudSettings.join(" và ")}</b>.</p>
        <p className="mt-2 text-sm">Hãy lưu đúng hai biến theo <b>HUONG_DAN_SUPABASE.md</b>, rồi chạy lại workflow Deploy.</p>
      </div>}
      {recovering ? <form className="space-y-3" onSubmit={updatePassword}>
          <p>Nhập mật khẩu mới cho tài khoản.</p>
          <input required minLength={8} type="password" autoComplete="new-password" placeholder="Mật khẩu mới (ít nhất 8 ký tự)" value={password} onChange={e=>setPassword(e.target.value)} />
          <button disabled={busy} className="account-primary w-full" type="submit">{busy?"Đang lưu…":"Đổi mật khẩu"}</button>
        </form>
      : session && vaultState !== "unlocked" ? <div className="space-y-4">
          <div className="rounded-xl p-3" style={{background:"var(--color-surface-alt)"}}>
            <div className="font-semibold">🔐 {vaultState === "setup" ? "Tạo Kho bảo mật" : vaultState === "locked" ? "Mở Kho bảo mật" : "Đang kiểm tra Kho…"}</div>
            <p className="mt-1 text-sm opacity-75">{vaultState === "setup" ? "Tạo mật khẩu riêng để mã hóa dữ liệu trước khi đồng bộ." : "Nhập mật khẩu Kho đã tạo trên thiết bị đầu tiên."}</p>
          </div>
          {vaultState !== "loading" && <form className="space-y-3" onSubmit={submitVault}>
            <input required minLength={12} type="password" autoComplete="off" placeholder="Mật khẩu Kho (ít nhất 12 ký tự)" value={vaultPassphrase} onChange={e=>setVaultPassphrase(e.target.value)} />
            {vaultState === "setup" && <input required minLength={12} type="password" autoComplete="off" placeholder="Nhập lại mật khẩu Kho" value={vaultConfirm} onChange={e=>setVaultConfirm(e.target.value)} />}
            <button disabled={busy} className="account-primary w-full" type="submit">{busy?"Đang xử lý mã hóa…":vaultState==="setup"?"Tạo Kho và mã hóa dữ liệu":"Mở Kho và đồng bộ"}</button>
          </form>}
          <p className="text-xs opacity-65">Mật khẩu Kho chỉ tồn tại trong bộ nhớ phiên này. Nếu quên, dữ liệu đám mây không thể giải mã hoặc khôi phục.</p>
        </div>
      : session ? <div className="space-y-4">
          <div className="rounded-xl p-3" style={{background:"var(--color-surface-alt)"}}><div className="text-sm opacity-70">Đã đăng nhập</div><div className="font-semibold break-all">{session.user.email}</div></div>
          <div className="text-sm">Trạng thái: <b>{status === "syncing" ? "Đang đồng bộ…" : status === "synced" ? "Đã đồng bộ" : status === "offline" ? "Ngoại tuyến – sẽ đồng bộ khi có mạng" : status === "error" ? "Có lỗi" : "Sẵn sàng"}</b>{lastSync>0 && <div className="opacity-70 mt-1">Lần cuối: {new Date(lastSync).toLocaleString("vi-VN")}</div>}</div>
          <button className="account-primary w-full" disabled={status==="syncing"} onClick={()=>void runSync()}>↻ Đồng bộ ngay</button>
          <button className="w-full rounded-xl border px-4 py-2" style={{borderColor:"var(--color-border)"}} onClick={()=>{lockVault(session.user.id);setVaultState("locked");setStatus("idle");}}>🔒 Khóa Kho ngay</button>
          <button disabled={busy} className="w-full rounded-xl border px-4 py-2" style={{borderColor:"var(--color-border)"}} onClick={()=>void signOutSafely()}>{busy?"Đang đồng bộ…":"Đăng xuất an toàn"}</button>
        </div>
      : <>
        <div className="flex gap-2 mb-4">{(["login","register"] as const).map(item=><button key={item} className="flex-1 rounded-xl px-3 py-2" style={{background:mode===item?"var(--color-surface-alt)":"transparent"}} onClick={()=>setMode(item)}>{item==="login"?"Đăng nhập":"Đăng ký"}</button>)}</div>
        <form className="space-y-3" onSubmit={submit}>
          <input required type="email" autoComplete="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          {mode!=="forgot" && <input required minLength={8} type="password" autoComplete={mode==="register"?"new-password":"current-password"} placeholder="Mật khẩu (ít nhất 8 ký tự)" value={password} onChange={e=>setPassword(e.target.value)} />}
          <button disabled={busy} className="account-primary w-full" type="submit">{busy?"Đang xử lý…":!cloudConfigured?"Kiểm tra cấu hình Supabase":mode==="login"?"Đăng nhập":mode==="register"?"Tạo tài khoản":"Gửi email khôi phục"}</button>
        </form>
        <button className="mt-3 text-sm underline" onClick={()=>setMode(mode==="forgot"?"login":"forgot")}>{mode==="forgot"?"Quay lại đăng nhập":"Quên mật khẩu?"}</button>
      </>}
      {message && <p className="mt-4 rounded-lg p-2 text-sm" style={{background:"var(--color-surface-alt)"}}>{message}</p>}
      <p className="mt-4 text-xs opacity-65">Ghi chú, dự án, sơ đồ và bảng trắng được đồng bộ. MP3 và ảnh nền tự chọn vẫn lưu riêng trên từng thiết bị.</p>
    </section>
  </div>;
}
