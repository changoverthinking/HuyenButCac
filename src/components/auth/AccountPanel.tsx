import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { cloudConfigured, missingCloudSettings, supabase } from "../../features/auth/supabase";
import { authErrorMessage, normalizeAuthEmail } from "../../features/auth/authMessages";
import { clearAuthRedirectParams, getAuthRedirectUrl, isPasswordRecoveryUrl } from "../../features/auth/authFlow";
import { getLastSync, syncNow, type SyncStatus } from "../../features/sync/syncService";
import { getVaultState, isVaultUnlocked, lockVault, resetVault, setupVault, unlockVault } from "../../features/crypto/vaultService";
import { getActiveWorkspaceUserId } from "../../database/db";

type AccountTab = "profile" | "security" | "sync";

export function AccountPanel({ open, onClose, onRecoveryRequired }: { open: boolean; onClose: () => void; onRecoveryRequired?: () => void }) {
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const rememberedEmail = localStorage.getItem("hbc-remembered-email") ?? "";
  const [email, setEmail] = useState(rememberedEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(Boolean(rememberedEmail));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<SyncStatus>(navigator.onLine ? "idle" : "offline");
  const [lastSync, setLastSync] = useState(0);
  const [recovering, setRecovering] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [accountTab, setAccountTab] = useState<AccountTab>("profile");
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [vaultState, setVaultState] = useState<"loading" | "setup" | "locked" | "unlocked">("loading");
  const [vaultPassphrase, setVaultPassphrase] = useState("");
  const [vaultConfirm, setVaultConfirm] = useState("");
  const [resettingVault, setResettingVault] = useState(false);
  const [confirmVaultReset, setConfirmVaultReset] = useState(false);
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  async function runSync(activeSession = session) {
    if (!activeSession) return;
    if (getActiveWorkspaceUserId() !== activeSession.user.id) { setStatus("idle"); return; }
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
    if (isPasswordRecoveryUrl()) { setRecovering(true); onRecoveryRequired?.(); }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      const previousUserId = sessionRef.current?.user.id;
      setSession(next);
      if (event === "PASSWORD_RECOVERY") { setRecovering(true); setPassword(""); setPasswordConfirm(""); onRecoveryRequired?.(); }
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
  }, [onRecoveryRequired]);

  useEffect(() => {
    if (!session) return;
    let cancelled=false;
    setLastSync(getLastSync(session.user.id));
    void getVaultState(session.user.id).then(state=>{if(!cancelled){setVaultState(state);if(state==="unlocked")void runSync(session);}}).catch(error=>setMessage(error instanceof Error?error.message:"Không thể kiểm tra Kho"));
    const timer = window.setInterval(() => { if (navigator.onLine && isVaultUnlocked(session.user.id)) void runSync(session); }, 45_000);
    const visible = () => { if (document.visibilityState === "visible" && navigator.onLine && isVaultUnlocked(session.user.id)) void runSync(session); };
    const online = () => { if (isVaultUnlocked(session.user.id)) void runSync(session); };
    const workspaceChanged = () => { if (getActiveWorkspaceUserId() === session.user.id && navigator.onLine && isVaultUnlocked(session.user.id)) void runSync(session); };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", online);
    window.addEventListener("hbc-workspace-changed", workspaceChanged);
    return () => { cancelled=true; window.clearInterval(timer); document.removeEventListener("visibilitychange", visible); window.removeEventListener("online", online); window.removeEventListener("hbc-workspace-changed", workspaceChanged); };
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

  async function submitVaultReset(event: React.FormEvent) {
    event.preventDefault();
    if (!session) return;
    if (vaultPassphrase.length < 12) { setMessage("Mật khẩu Kho mới cần ít nhất 12 ký tự."); return; }
    if (vaultPassphrase !== vaultConfirm) { setMessage("Hai mật khẩu Kho mới chưa giống nhau."); return; }
    if (!confirmVaultReset) { setMessage("Hãy xác nhận rằng bạn hiểu dữ liệu đám mây mã hóa bằng mật khẩu cũ sẽ bị thay thế."); return; }
    setBusy(true); setMessage("");
    try {
      await resetVault(session.user, vaultPassphrase);
      setVaultState("unlocked"); setResettingVault(false); setConfirmVaultReset(false);
      setVaultPassphrase(""); setVaultConfirm("");
      await runSync(session);
      setMessage("Đã tạo lại Kho bảo mật và mã hóa dữ liệu trên thiết bị bằng mật khẩu mới.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể đặt lại Kho bảo mật"); }
    finally { setBusy(false); }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setMessage("Chưa thể kết nối Supabase. Hãy thêm đủ hai GitHub Actions Variable rồi chạy lại Deploy.");
      return;
    }
    const normalizedEmail = normalizeAuthEmail(email);
    setEmail(normalizedEmail);
    setBusy(true); setMessage("");
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email: normalizedEmail, password, options: { emailRedirectTo: getAuthRedirectUrl() } });
        if (error) throw error;
        if (rememberLogin) localStorage.setItem("hbc-remembered-email", normalizedEmail);
        setNeedsEmailConfirmation(true);
        setMessage("Đã tạo tài khoản. Hãy mở email xác minh rồi đăng nhập.");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: getAuthRedirectUrl() });
        if (error) throw error;
        setMessage("Đã gửi liên kết đặt lại mật khẩu vào email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;
        if (rememberLogin) localStorage.setItem("hbc-remembered-email", normalizedEmail);
        else localStorage.removeItem("hbc-remembered-email");
        setNeedsEmailConfirmation(false);
      }
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Không thể thực hiện";
      setNeedsEmailConfirmation(rawMessage.toLowerCase().includes("email not confirmed"));
      setMessage(authErrorMessage(rawMessage));
    }
    finally { setBusy(false); }
  }

  async function resendConfirmation() {
    if (!supabase) { setMessage("Chưa thể kết nối Supabase."); return; }
    const normalizedEmail = normalizeAuthEmail(email);
    if (!normalizedEmail) { setMessage("Hãy nhập email cần xác minh."); return; }
    setBusy(true); setMessage("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: { emailRedirectTo: getAuthRedirectUrl() },
      });
      if (error) throw error;
      setNeedsEmailConfirmation(true);
      setMessage("Đã gửi lại email xác minh. Hãy kiểm tra Hộp thư đến và Thư rác.");
    } catch (error) {
      setMessage(authErrorMessage(error instanceof Error ? error.message : "Không thể gửi lại email xác minh"));
    } finally { setBusy(false); }
  }

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    if (password.length < 8) { setMessage("Mật khẩu mới cần ít nhất 8 ký tự."); return; }
    if (password !== passwordConfirm) { setMessage("Hai mật khẩu mới chưa giống nhau."); return; }
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMessage(authErrorMessage(error.message));
    else { setRecovering(false); setPassword(""); setPasswordConfirm(""); clearAuthRedirectParams(); setAccountTab("profile"); setMessage("Đã đổi mật khẩu thành công. Bạn đang đăng nhập bằng mật khẩu mới."); }
  }

  async function signOutSafely() {
    if (!supabase || !session) return;
    setBusy(true); setMessage("");
    try {
      if (navigator.onLine && isVaultUnlocked(session.user.id)) {
        try { await syncNow(session.user); } catch { setMessage("Không thể đồng bộ lần cuối, nhưng dữ liệu trên thiết bị vẫn được giữ nguyên."); }
      }
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      lockVault(session.user.id); setVaultState("loading");
      setStatus("idle");
    } catch (error) {
      setMessage(error instanceof Error ? authErrorMessage(error.message) : "Không thể đăng xuất");
    } finally { setBusy(false); }
  }

  if (!open) return null;
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4" onMouseDown={onClose}>
    <section className="account-panel immortal-panel max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border p-5 shadow-2xl" onMouseDown={e=>e.stopPropagation()}>
      <div className="account-heading flex items-center justify-between mb-4"><div className="flex items-center gap-3"><span className="brand-sigil small">鑰</span><div><h2 className="text-xl font-bold">Tàng Thư Mật Cảnh</h2><p className="text-xs opacity-65">Tài khoản · Kho bảo mật · Đồng bộ</p></div></div><button className="mystic-close" onClick={onClose} aria-label="Quay lại" title="Quay lại">←</button></div>
      {!cloudConfigured && <div className="mb-4 rounded-xl border p-3" style={{background:"var(--color-surface-alt)",borderColor:"var(--color-warning)"}}>
        <p>Máy chủ Supabase chưa được đưa vào bản triển khai. Dữ liệu hiện vẫn lưu trên thiết bị này.</p>
        <p className="mt-2 text-sm">Thiếu GitHub Actions Variable: <b>{missingCloudSettings.join(" và ")}</b>.</p>
        <p className="mt-2 text-sm">Hãy lưu đúng hai biến theo <b>HUONG_DAN_SUPABASE.md</b>, rồi chạy lại workflow Deploy.</p>
      </div>}
      {recovering ? <form className="space-y-3" onSubmit={updatePassword}>
          <div className="rounded-xl p-3" style={{background:"var(--color-surface-alt)"}}><div className="font-semibold">Đặt lại mật khẩu</div><p className="mt-1 text-sm opacity-70">Liên kết khôi phục đã được xác nhận. Hãy tạo mật khẩu mới.</p></div>
          <input required minLength={8} type={showPassword?"text":"password"} autoComplete="new-password" placeholder="Mật khẩu mới (ít nhất 8 ký tự)" value={password} onChange={e=>setPassword(e.target.value)} />
          <input required minLength={8} type={showPassword?"text":"password"} autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" value={passwordConfirm} onChange={e=>setPasswordConfirm(e.target.value)} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={showPassword} onChange={e=>setShowPassword(e.target.checked)} /> Hiện mật khẩu</label>
          <button disabled={busy} className="account-primary w-full" type="submit">{busy?"Đang lưu…":"Đổi mật khẩu"}</button>
        </form>
      : session ? <div className="space-y-4">
          <div className="account-tabs" role="tablist" aria-label="Quản lý tài khoản">{([["profile","Thông tin"],["security","Bảo mật"],["sync","Đồng bộ"]] as const).map(([tab,label])=><button key={tab} role="tab" aria-selected={accountTab===tab} className={accountTab===tab?"is-active":""} onClick={()=>{setAccountTab(tab);setMessage("");}}>{label}</button>)}</div>
          {accountTab === "profile" && <div className="space-y-3">
            <div className="account-profile-card"><div className="account-avatar">{session.user.email?.slice(0,1).toUpperCase() ?? "道"}</div><div className="min-w-0"><div className="text-xs opacity-65">Tài khoản đang đăng nhập</div><div className="font-semibold break-all">{session.user.email}</div></div></div>
            <dl className="account-details"><div><dt>Xác minh email</dt><dd>{session.user.email_confirmed_at ? "Đã xác minh" : "Chưa xác minh"}</dd></div><div><dt>Ngày tạo</dt><dd>{new Date(session.user.created_at).toLocaleDateString("vi-VN")}</dd></div><div><dt>Kho bảo mật</dt><dd>{vaultState === "unlocked" ? "Đang mở" : vaultState === "setup" ? "Chưa thiết lập" : vaultState === "loading" ? "Đang kiểm tra" : "Đang khóa"}</dd></div></dl>
            <p className="text-xs opacity-65">Đăng xuất không xóa workspace của tài khoản này trên thiết bị; dữ liệu được ẩn khỏi tài khoản khác.</p>
            <button disabled={busy} className="w-full rounded-xl border px-4 py-2" style={{borderColor:"var(--color-border)"}} onClick={()=>void signOutSafely()}>{busy?"Đang đăng xuất…":"Đăng xuất"}</button>
          </div>}
          {accountTab === "security" && <div className="space-y-4">
          <div className="rounded-xl p-3" style={{background:"var(--color-surface-alt)"}}>
            <div className="font-semibold">🔐 {vaultState === "setup" ? "Tạo Kho bảo mật" : vaultState === "locked" ? "Mở Kho bảo mật" : vaultState === "unlocked" ? "Kho bảo mật đang mở" : "Đang kiểm tra Kho…"}</div>
            <p className="mt-1 text-sm opacity-75">{vaultState === "setup" ? "Tạo mật khẩu riêng để mã hóa dữ liệu trước khi đồng bộ." : vaultState === "unlocked" ? "Dữ liệu có thể được mã hóa và đồng bộ an toàn." : "Nhập mật khẩu Kho đã tạo trên thiết bị đầu tiên."}</p>
          </div>
          {resettingVault ? <form className="space-y-3" onSubmit={submitVaultReset}>
            <div className="rounded-xl border p-3 text-sm" style={{borderColor:"var(--color-warning)",background:"var(--color-surface-alt)"}}><b>Đặt lại Kho bảo mật</b><p className="mt-1 opacity-75">Không thể giải mã bản sao đám mây nếu đã quên mật khẩu cũ. Thao tác này xóa bản mã cũ trên đám mây, giữ dữ liệu đang có trên thiết bị này và mã hóa lại bằng mật khẩu mới.</p></div>
            <input required minLength={12} type="password" autoComplete="new-password" placeholder="Mật khẩu Kho mới (ít nhất 12 ký tự)" value={vaultPassphrase} onChange={e=>setVaultPassphrase(e.target.value)} />
            <input required minLength={12} type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu Kho mới" value={vaultConfirm} onChange={e=>setVaultConfirm(e.target.value)} />
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4" checked={confirmVaultReset} onChange={e=>setConfirmVaultReset(e.target.checked)} /><span>Tôi đã kiểm tra dữ liệu cần giữ vẫn đang hiển thị trên thiết bị này.</span></label>
            <button disabled={busy} className="account-primary w-full" type="submit">{busy?"Đang tạo lại Kho…":"Đặt lại Kho và đồng bộ"}</button>
            <button type="button" className="w-full rounded-xl border px-4 py-2" style={{borderColor:"var(--color-border)"}} onClick={()=>{setResettingVault(false);setVaultPassphrase("");setVaultConfirm("");setConfirmVaultReset(false);setMessage("");}}>Quay lại mở Kho</button>
          </form> : vaultState !== "loading" && vaultState !== "unlocked" && <form className="space-y-3" onSubmit={submitVault}>
            <input required minLength={12} type="password" autoComplete="off" placeholder="Mật khẩu Kho (ít nhất 12 ký tự)" value={vaultPassphrase} onChange={e=>setVaultPassphrase(e.target.value)} />
            {vaultState === "setup" && <input required minLength={12} type="password" autoComplete="off" placeholder="Nhập lại mật khẩu Kho" value={vaultConfirm} onChange={e=>setVaultConfirm(e.target.value)} />}
            <button disabled={busy} className="account-primary w-full" type="submit">{busy?"Đang xử lý mã hóa…":vaultState==="setup"?"Tạo Kho và mã hóa dữ liệu":"Mở Kho và đồng bộ"}</button>
          </form>}
          {vaultState === "locked" && !resettingVault && <button className="text-sm underline" onClick={()=>{setResettingVault(true);setVaultPassphrase("");setVaultConfirm("");setMessage("");}}>Quên mật khẩu Kho?</button>}
          {vaultState === "unlocked" && <button className="w-full rounded-xl border px-4 py-2" style={{borderColor:"var(--color-border)"}} onClick={()=>{lockVault(session.user.id);setVaultState("locked");setStatus("idle");}}>🔒 Khóa Kho ngay</button>}
          <p className="text-xs opacity-65">Mật khẩu Kho chỉ tồn tại trong bộ nhớ phiên này. Nếu quên, dữ liệu đám mây không thể giải mã hoặc khôi phục.</p>
        </div>}
          {accountTab === "sync" && <div className="space-y-4">
          <div className="text-sm">Trạng thái: <b>{status === "syncing" ? "Đang đồng bộ…" : status === "synced" ? "Đã đồng bộ" : status === "offline" ? "Ngoại tuyến – sẽ đồng bộ khi có mạng" : status === "error" ? "Có lỗi" : "Sẵn sàng"}</b>{lastSync>0 && <div className="opacity-70 mt-1">Lần cuối: {new Date(lastSync).toLocaleString("vi-VN")}</div>}</div>
          {vaultState !== "unlocked" && <p className="rounded-xl p-3 text-sm" style={{background:"var(--color-surface-alt)"}}>Hãy mở Kho bảo mật trong tab Bảo mật trước khi đồng bộ.</p>}
          <button className="account-primary w-full" disabled={status==="syncing" || vaultState!=="unlocked"} onClick={()=>void runSync()}>↻ Đồng bộ ngay</button>
          </div>}
        </div>
      : <>
        <div className="flex gap-2 mb-4">{(["login","register"] as const).map(item=><button key={item} className="flex-1 rounded-xl px-3 py-2" style={{background:mode===item?"var(--color-surface-alt)":"transparent"}} onClick={()=>{setMode(item);setMessage("");}}>{item==="login"?"Đăng nhập":"Đăng ký"}</button>)}</div>
        <form className="space-y-3" onSubmit={submit}>
          <input required name="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          {mode!=="forgot" && <div className="relative">
            <input required name="password" minLength={8} className="account-password-input" type={showPassword?"text":"password"} autoComplete={mode==="register"?"new-password":"current-password"} placeholder="Mật khẩu (ít nhất 8 ký tự)" value={password} onChange={e=>setPassword(e.target.value)} />
            <button type="button" className="absolute inset-y-0 right-0 grid w-12 place-items-center text-lg opacity-70" aria-label={showPassword?"Ẩn mật khẩu":"Hiện mật khẩu"} title={showPassword?"Ẩn mật khẩu":"Hiện mật khẩu"} onClick={()=>setShowPassword(value=>!value)}>{showPassword?"◉":"◎"}</button>
          </div>}
          {mode!=="forgot" && <div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={rememberLogin} onChange={e=>setRememberLogin(e.target.checked)} /> Ghi nhớ email đăng nhập</label>
            <p className="mt-1 text-xs opacity-60">Tùy chọn này chỉ lưu email để điền nhanh. Phiên Supabase được duy trì cho tới khi bạn đăng xuất; ứng dụng không tự lưu mật khẩu.</p>
          </div>}
          <button disabled={busy} className="account-primary w-full" type="submit">{busy?"Đang xử lý…":!cloudConfigured?"Kiểm tra cấu hình Supabase":mode==="login"?"Đăng nhập":mode==="register"?"Tạo tài khoản":"Gửi email khôi phục"}</button>
        </form>
        {needsEmailConfirmation && <button disabled={busy} className="mt-3 w-full rounded-xl border px-4 py-2 text-sm" style={{borderColor:"var(--color-accent)",color:"var(--color-accent)"}} onClick={()=>void resendConfirmation()}>{busy?"Đang gửi…":"Gửi lại email xác minh"}</button>}
        <button className="mt-3 text-sm underline" onClick={()=>setMode(mode==="forgot"?"login":"forgot")}>{mode==="forgot"?"Quay lại đăng nhập":"Quên mật khẩu?"}</button>
      </>}
      {message && <p className="mt-4 rounded-lg p-2 text-sm" style={{background:"var(--color-surface-alt)"}}>{message}</p>}
      <p className="mt-4 text-xs opacity-65">Ghi chú, dự án, sơ đồ và bảng trắng được đồng bộ. MP3 và ảnh nền tự chọn vẫn lưu riêng trên từng thiết bị.</p>
    </section>
  </div>;
}
