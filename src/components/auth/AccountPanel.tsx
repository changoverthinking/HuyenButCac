import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { cloudConfigured, supabase } from "../../features/auth/supabase";
import { getLastSync, syncNow, type SyncStatus } from "../../features/sync/syncService";

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

  async function runSync(activeSession = session) {
    if (!activeSession) return;
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
      setSession(next);
      if (event === "PASSWORD_RECOVERY") { setRecovering(true); setPassword(""); }
    });
    const online = () => setStatus("idle");
    const offline = () => setStatus("offline");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => { data.subscription.unsubscribe(); window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, []);

  useEffect(() => {
    if (!session) return;
    setLastSync(getLastSync(session.user.id));
    void runSync(session);
    const timer = window.setInterval(() => { if (navigator.onLine) void runSync(session); }, 45_000);
    const visible = () => { if (document.visibilityState === "visible" && navigator.onLine) void runSync(session); };
    document.addEventListener("visibilitychange", visible);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [session?.user.id]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
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

  if (!open) return null;
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4" onMouseDown={onClose}>
    <section className="account-panel w-full max-w-md rounded-2xl border p-5 shadow-2xl" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} onMouseDown={e=>e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold">Tài khoản & Đồng bộ</h2><button onClick={onClose} aria-label="Đóng">✕</button></div>
      {!cloudConfigured ? <div className="rounded-xl p-3" style={{background:"var(--color-surface-alt)"}}>Chưa cấu hình máy chủ đồng bộ. Ứng dụng vẫn lưu an toàn trên thiết bị này. Xem tệp <b>HUONG_DAN_SUPABASE.md</b> để bật tài khoản.</div>
      : recovering ? <form className="space-y-3" onSubmit={updatePassword}>
          <p>Nhập mật khẩu mới cho tài khoản.</p>
          <input required minLength={8} type="password" autoComplete="new-password" placeholder="Mật khẩu mới (ít nhất 8 ký tự)" value={password} onChange={e=>setPassword(e.target.value)} />
          <button disabled={busy} className="account-primary w-full" type="submit">{busy?"Đang lưu…":"Đổi mật khẩu"}</button>
        </form>
      : session ? <div className="space-y-4">
          <div className="rounded-xl p-3" style={{background:"var(--color-surface-alt)"}}><div className="text-sm opacity-70">Đã đăng nhập</div><div className="font-semibold break-all">{session.user.email}</div></div>
          <div className="text-sm">Trạng thái: <b>{status === "syncing" ? "Đang đồng bộ…" : status === "synced" ? "Đã đồng bộ" : status === "offline" ? "Ngoại tuyến – sẽ đồng bộ khi có mạng" : status === "error" ? "Có lỗi" : "Sẵn sàng"}</b>{lastSync>0 && <div className="opacity-70 mt-1">Lần cuối: {new Date(lastSync).toLocaleString("vi-VN")}</div>}</div>
          <button className="account-primary w-full" disabled={status==="syncing"} onClick={()=>void runSync()}>↻ Đồng bộ ngay</button>
          <button className="w-full rounded-xl border px-4 py-2" style={{borderColor:"var(--color-border)"}} onClick={()=>void supabase!.auth.signOut()}>Đăng xuất</button>
        </div>
      : <>
        <div className="flex gap-2 mb-4">{(["login","register"] as const).map(item=><button key={item} className="flex-1 rounded-xl px-3 py-2" style={{background:mode===item?"var(--color-surface-alt)":"transparent"}} onClick={()=>setMode(item)}>{item==="login"?"Đăng nhập":"Đăng ký"}</button>)}</div>
        <form className="space-y-3" onSubmit={submit}>
          <input required type="email" autoComplete="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          {mode!=="forgot" && <input required minLength={8} type="password" autoComplete={mode==="register"?"new-password":"current-password"} placeholder="Mật khẩu (ít nhất 8 ký tự)" value={password} onChange={e=>setPassword(e.target.value)} />}
          <button disabled={busy} className="account-primary w-full" type="submit">{busy?"Đang xử lý…":mode==="login"?"Đăng nhập":mode==="register"?"Tạo tài khoản":"Gửi email khôi phục"}</button>
        </form>
        <button className="mt-3 text-sm underline" onClick={()=>setMode(mode==="forgot"?"login":"forgot")}>{mode==="forgot"?"Quay lại đăng nhập":"Quên mật khẩu?"}</button>
      </>}
      {message && <p className="mt-4 rounded-lg p-2 text-sm" style={{background:"var(--color-surface-alt)"}}>{message}</p>}
      <p className="mt-4 text-xs opacity-65">Ghi chú, dự án, sơ đồ và bảng trắng được đồng bộ. MP3 và ảnh nền tự chọn vẫn lưu riêng trên từng thiết bị.</p>
    </section>
  </div>;
}
