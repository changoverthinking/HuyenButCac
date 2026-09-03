import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useThemeStore } from "./stores/themeStore";
import { useAppearanceStore } from "./stores/appearanceStore";
import { UpdatePrompt } from "./components/common/UpdatePrompt";
import { NotesModeView } from "./components/notes-mode/NotesModeView";
import { MusicPlayer } from "./components/music/MusicPlayer";
import { ResponsiveSidebar } from "./components/common/ResponsiveSidebar";
import { Icon, type IconName } from "./components/common/Icons";
import { AppearanceIcon, AppearanceLayer } from "./components/common/AdjustedImage";
import "./features/appearance/appearance.css";
import { useProjectsStore } from "./stores/projectsStore";
import { useNotesStore } from "./stores/notesStore";
import { useFoldersStore } from "./stores/foldersStore";
import { AccountPanel } from "./components/auth/AccountPanel";
import { APP_CONFIG } from "./app/appConfig";
import { supabase } from "./features/auth/supabase";
import { isPasswordRecoveryUrl } from "./features/auth/authFlow";
import { getActiveWorkspaceUserId, switchWorkspace } from "./database/db";
import { clearAllNoteUnlockSessions } from "./features/notes/notesService";
import { lockVault } from "./features/crypto/vaultService";
import { registerPushSubscription, startCalendarReminderRuntime } from "./features/calendar/notificationService";
import { reconcileCalendarReminderJobs } from "./features/calendar/calendarEventsService";

const ProjectsView = lazy(() => import("./components/projects/ProjectsView").then((module) => ({ default: module.ProjectsView })));
const MindMapView = lazy(() => import("./components/mind-map/MindMapView").then((module) => ({ default: module.MindMapView })));
const WhiteboardView = lazy(() => import("./components/whiteboard/WhiteboardView").then((module) => ({ default: module.WhiteboardView })));
const CalendarView = lazy(() => import("./components/calendar/CalendarView").then((module) => ({ default: module.CalendarView })));
const LibraryView = lazy(() => import("./components/library/LibraryView").then((module) => ({ default: module.LibraryView })));
const TieuNhiLauncher = lazy(() => import("./features/tieu-nhi/TieuNhiLauncher").then((module) => ({ default: module.TieuNhiLauncher })));

type Mode = "notes" | "library" | "projects" | "mindmap" | "whiteboard" | "calendar";

function initialMode(): Mode {
  if (typeof window === "undefined") return "notes";
  const candidate = new URLSearchParams(window.location.search).get("mode");
  return candidate === "library" || candidate === "projects" || candidate === "mindmap" || candidate === "whiteboard" || candidate === "calendar" ? candidate : "notes";
}

const MODE_TABS: { id: Mode; label: string; kicker: string; icon: IconName }[] = [
  { id: "notes", label: "Ghi chú", kicker: "TRÚC GIẢN", icon: "notes" },
  { id: "library", label: "Tàng Thư", kicker: "VẠN QUYỂN", icon: "book" },
  { id: "projects", label: "Dự án", kicker: "THƯ VIỆN TRUYỆN", icon: "projects" },
  { id: "mindmap", label: "Sơ đồ", kicker: "LINH ĐỒ", icon: "mindmap" },
  { id: "whiteboard", label: "Bảng trắng", kicker: "BẠCH ĐÀI", icon: "whiteboard" },
  { id: "calendar", label: "Vạn niên", kicker: "NHẬT NGUYỆT ĐỒ", icon: "clock" },
];

function AppRail({ mode, setMode, collapsed, setCollapsed, online, onAccount, onTieuNhi }: {
  mode: Mode;
  setMode: (mode: Mode) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  online: boolean;
  onAccount: () => void;
  onTieuNhi: () => void;
}) {
  return (
    <aside className={`app-rail ${collapsed ? "is-collapsed" : ""}`} aria-label="Điều hướng Huyền Bút Các">
      <AppearanceLayer target="tools" />
      <div className="app-rail-edge" aria-hidden="true" />
      <div className="app-rail-brand">
        <span className="app-rail-sigil"><Icon name="pencil" size={18} /></span>
        <span className="app-rail-brand-copy"><strong>Huyền Bút Các</strong><small>VÂN THƯ ĐÀI</small></span>
      </div>
      <div className="app-rail-seal" aria-hidden="true"><span><Icon name="seal" size={22} /></span><small>KHÔNG GIAN SÁNG TÁC</small></div>
      <nav className="app-rail-nav" aria-label="Các khu vực làm việc">
        {MODE_TABS.map((tab) => {
          const active = mode === tab.id;
          return (
            <button key={tab.id} type="button" className={`app-rail-nav-item ${active ? "is-active" : ""}`} onClick={() => setMode(tab.id)} aria-current={active ? "page" : undefined} aria-label={tab.label} title={collapsed ? tab.label : undefined}>
              <span className="app-rail-nav-icon" aria-hidden="true"><Icon name={tab.icon} size={18} /></span>
              <span className="app-rail-nav-copy"><span>{tab.label}</span><small>{tab.kicker}</small></span>
              {active && <span className="app-rail-active-mark" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>
      <div className="app-rail-footer">
        <div className="app-rail-local-status" title={online ? "Thiết bị đang có Internet; trạng thái đồng bộ xem trong Tàng Thư Mật Cảnh" : "Thiết bị đang ngoại tuyến"}>
          <span className={`app-status-dot ${online ? "is-online" : "is-offline"}`} aria-hidden="true" />
          <span className="app-rail-nav-copy"><span>{online ? "Có mạng" : "Ngoại tuyến"}</span><small>LOCAL-FIRST</small></span>
        </div>
        <button type="button" className="app-rail-account tieu-nhi-nav-entry" onClick={onTieuNhi} title={collapsed ? "Tiểu Nhị" : undefined}>
          <span className="app-rail-account-icon" aria-hidden="true"><AppearanceIcon target="tieu-nhi-avatar" className="app-tieu-nhi-icon" fallback={<Icon name="spark" size={16} />} /></span>
          <span className="app-rail-nav-copy"><span>Tiểu Nhị</span><small>TRỢ LÝ AI</small></span>
        </button>
        <button type="button" className="app-rail-account" onClick={onAccount} title={collapsed ? "Tàng Thư Mật Cảnh" : undefined}>
          <span className="app-rail-account-icon" aria-hidden="true"><Icon name="user" size={18} /></span>
          <span className="app-rail-nav-copy"><span>Tàng Thư Mật Cảnh</span><small>TÀI KHOẢN · BẢO MẬT</small></span>
        </button>
        <button type="button" className="app-rail-collapse" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"} title={collapsed ? "Mở rộng" : "Thu gọn"}>
          <span aria-hidden="true"><Icon name={collapsed ? "chevron-right" : "chevron-left"} size={17} /></span>
          <span className="app-rail-nav-copy">{collapsed ? "" : "Thu gọn"}</span>
        </button>
      </div>
    </aside>
  );
}

function AppTopbar({ mode, online, onAccount, onTieuNhi, onSearch }: { mode: Mode; online: boolean; onAccount: () => void; onTieuNhi: () => void; onSearch: (query: string) => void }) {
  const meta = MODE_TABS.find((tab) => tab.id === mode) ?? MODE_TABS[0];
  const [query, setQuery] = useState("");
  return (
    <header className="app-topbar">
      <div className="app-topbar-title"><span>{meta.kicker}</span><h1>{meta.label}</h1></div>
      {mode === "notes" ? (
        <form className="app-topbar-search" onSubmit={(event) => { event.preventDefault(); onSearch(query.trim()); }}>
          <span aria-hidden="true"><Icon name="search" size={17} /></span>
          <input aria-label="Tìm trong ghi chú" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tiêu đề, nội dung, ý tưởng…" />
        </form>
      ) : mode === "calendar" ? (
        <div className="app-topbar-context" aria-label="Thông tin lịch"><span aria-hidden="true"><Icon name="clock" size={18} /></span><div><strong>Nhật Nguyệt Đồ</strong><small>Dương lịch · Âm lịch · Can Chi · sự kiện</small></div></div>
      ) : mode === "library" ? (
        <div className="app-topbar-context" aria-label="Thông tin Tàng Thư"><span aria-hidden="true"><Icon name="book" size={18} /></span><div><strong>Tàng Thư cá nhân</strong><small>PDF · sách · tiểu thuyết · dấu trang đọc</small></div></div>
      ) : mode === "projects" ? (
        <div className="app-topbar-context" aria-label="Thông tin Dự án"><span aria-hidden="true"><Icon name="projects" size={18} /></span><div><strong>Xưởng bản thảo</strong><small>Chương · mục tiêu · tiến độ · Story Bible</small></div></div>
      ) : mode === "mindmap" ? (
        <div className="app-topbar-context" aria-label="Thông tin Sơ đồ"><span aria-hidden="true"><Icon name="mindmap" size={18} /></span><div><strong>Linh Đồ ý tưởng</strong><small>Nút · liên kết · cấu trúc · mở về bản thảo</small></div></div>
      ) : (
        <div className="app-topbar-context" aria-label="Thông tin Bảng trắng"><span aria-hidden="true"><Icon name="whiteboard" size={18} /></span><div><strong>Bạch Đài sáng tác</strong><small>Phác thảo tự do · hình · nét · bố cục</small></div></div>
      )}
      <div className="app-topbar-actions">
        <div className="app-sync-chip" aria-live="polite" title={online ? "Có Internet; đây không phải trạng thái đồng bộ Supabase" : "Không có Internet"}><span className={`app-status-dot ${online ? "is-online" : "is-offline"}`} aria-hidden="true" /><span>{online ? "Có mạng" : "Ngoại tuyến"}</span></div>
        <span className="app-topbar-version">{APP_CONFIG.version}</span>
        <button type="button" className="app-topbar-account" onClick={onTieuNhi} aria-label="Mở Tiểu Nhị"><AppearanceIcon target="tieu-nhi-avatar" className="app-tieu-nhi-icon" fallback={<Icon name="spark" size={16} />} /><span className="hidden sm:inline">Tiểu Nhị</span></button>
        <button type="button" className="app-topbar-account" onClick={onAccount} aria-label="Mở Tàng Thư Mật Cảnh"><span aria-hidden="true"><Icon name="user" size={17} /></span><span className="hidden sm:inline">Tài khoản</span></button>
      </div>
    </header>
  );
}

export default function App() {
  const loadTheme = useThemeStore((state) => state.load);
  const loadAppearance = useAppearanceStore((state) => state.load);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(() => isPasswordRecoveryUrl());
  const [tieuNhiOpen, setTieuNhiOpen] = useState(false);
  const [tieuNhiLoaded, setTieuNhiLoaded] = useState(false);
  const openRecovery = useCallback(() => setAccountOpen(true), []);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [syncRevision, setSyncRevision] = useState(0);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [workspaceError, setWorkspaceError] = useState("");
  const loadProjects = useProjectsStore((state) => state.loadProjects);
  const selectProject = useProjectsStore((state) => state.selectProject);
  const selectChapter = useProjectsStore((state) => state.selectChapter);
  const setSearchQuery = useNotesStore((state) => state.setSearchQuery);

  // Trên mobile, mọi thay đổi tab phải đóng drawer. Điều này loại bỏ race khi
  // người dùng chạm gần như đồng thời nút menu và một tab ở bottom navigation.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [mode]);

  useEffect(() => {
    let disposed = false;
    let switchSequence = 0;
    let unsubscribeAuth: (() => void) | undefined;
    const resetStores = () => {
      useNotesStore.setState({ notes: [], trashedNotes: [], selectedNoteId: null, searchQuery: "", searchResults: [], loading: false, activeFolderId: undefined, view: "active" });
      useFoldersStore.setState({ folders: [], selectedFolderId: null });
      useProjectsStore.setState({ projects: [], selectedProjectId: null, sections: [], chapters: [], tasks: [], milestones: [], selectedChapterId: null, characters: [], locations: [], loreEntries: [], timelineEvents: [] });
    };
    const activate = async (userId: string | null) => {
      const sequence = ++switchSequence;
      setWorkspaceReady(false); setWorkspaceError("");
      try {
        if (getActiveWorkspaceUserId() !== userId) { clearAllNoteUnlockSessions(); lockVault(); }
        await switchWorkspace(userId);
        if (disposed || sequence !== switchSequence) return;
        resetStores();
        await loadTheme();
        await loadAppearance();
        if (disposed || sequence !== switchSequence) return;
        setFocusedSectionId(null); setSyncRevision((value) => value + 1); setWorkspaceReady(true);
      } catch (error) {
        if (disposed || sequence !== switchSequence) return;
        setWorkspaceError(error instanceof Error ? error.message : "Không thể mở không gian dữ liệu.");
      }
    };
    if (!supabase) void activate(null);
    else {
      void supabase.auth.getSession().then(({ data }) => activate(data.session?.user.id ?? null));
      const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => { void activate(nextSession?.user.id ?? null); });
      unsubscribeAuth = () => data.subscription.unsubscribe();
    }
    const refresh = () => setSyncRevision((value) => value + 1);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("hbc-sync-complete", refresh); window.addEventListener("online", handleOnline); window.addEventListener("offline", handleOffline);
    return () => { disposed = true; unsubscribeAuth?.(); window.removeEventListener("hbc-sync-complete", refresh); window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, [loadAppearance, loadTheme]);

  useEffect(() => {
    if (!workspaceReady) return;
    const stop = startCalendarReminderRuntime();
    void reconcileCalendarReminderJobs();
    if (typeof Notification !== "undefined" && Notification.permission === "granted") void registerPushSubscription().catch(() => undefined);
    const reconcile = () => { void reconcileCalendarReminderJobs(); if (typeof Notification !== "undefined" && Notification.permission === "granted") void registerPushSubscription().catch(() => undefined); };
    window.addEventListener("online", reconcile); window.addEventListener("hbc-workspace-changed", reconcile);
    return () => { stop(); window.removeEventListener("online", reconcile); window.removeEventListener("hbc-workspace-changed", reconcile); };
  }, [workspaceReady, syncRevision]);

  if (!workspaceReady) {
    return <div className="grid h-screen w-screen place-items-center p-6" style={{ background: "var(--color-bg)", color: "var(--color-text)" }}><div className="max-w-md text-center"><div className="brand-sigil mx-auto mb-3"><Icon name="seal" size={24} /></div>{workspaceError ? <><div className="font-semibold">Không thể mở không gian dữ liệu</div><div className="mt-2 text-sm opacity-70">{workspaceError}</div><button type="button" className="mt-4 rounded-xl border px-4 py-2" style={{ borderColor: "var(--color-border)" }} onClick={() => window.location.reload()}>Thử mở lại</button></> : <><div className="font-semibold">Đang mở không gian dữ liệu…</div><div className="mt-1 text-sm opacity-60">Đang tách dữ liệu theo tài khoản để bảo vệ ghi chú trên thiết bị này.</div></>}</div></div>;
  }

  const activeMeta = MODE_TABS.find((tab) => tab.id === mode) ?? MODE_TABS[0];
  const openAccount = () => setAccountOpen(true);
  const openTieuNhi = () => { setTieuNhiLoaded(true); setTieuNhiOpen(true); };
  const navigate = (nextMode: Mode) => {
    setMode(nextMode); setMobileMenuOpen(false);
    const url = new URL(window.location.href); url.searchParams.set("mode", nextMode);
    if (nextMode !== "calendar") { url.searchParams.delete("event"); url.searchParams.delete("calendar"); }
    window.history.replaceState({}, "", url);
  };
  const searchNotes = (query: string) => { void setSearchQuery(query); navigate("notes"); };

  return (
    <div className="app-shell app-shell--figma flex w-screen overflow-hidden" data-mode={mode}>
      <UpdatePrompt />
      <AppRail mode={mode} setMode={navigate} collapsed={railCollapsed} setCollapsed={setRailCollapsed} online={online} onAccount={openAccount} onTieuNhi={openTieuNhi} />
      <section className="app-workspace">
        <div className="mobile-topbar md:hidden flex items-center gap-2 px-2 py-1.5 border-b shrink-0">
          <button aria-label="Mở menu" className="mobile-icon-button mystic-icon" onClick={() => setMobileMenuOpen(true)}><Icon name="menu" size={19} /></button>
          <div className="flex-1 text-center min-w-0"><div className="mobile-brand">Huyền Bút Các</div><div className="mobile-mode">{activeMeta.label}</div></div>
          <button aria-label="Mở Tiểu Nhị" className="mobile-icon-button mystic-icon tieu-nhi-mobile-tab" onClick={openTieuNhi}><AppearanceIcon target="tieu-nhi-avatar" className="app-tieu-nhi-icon" fallback={<Icon name="spark" size={16} />} /></button>
          <button aria-label="Mở tài khoản" className="mobile-icon-button mystic-icon" onClick={openAccount}><Icon name="user" size={18} /></button>
        </div>
        {mobileMenuOpen && <div className="mobile-drawer-layer md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Menu điều hướng"><div className="relative z-10 h-full"><ResponsiveSidebar onNavigate={() => setMobileMenuOpen(false)} onOpenNotes={() => navigate("notes")} /></div><button type="button" aria-label="Đóng menu" className="mobile-drawer-backdrop absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} /></div>}
        <div className="hidden md:block"><AppTopbar mode={mode} online={online} onAccount={openAccount} onTieuNhi={openTieuNhi} onSearch={searchNotes} /></div>
        <div className="app-content flex-1 overflow-hidden">
          <AppearanceLayer target="app-background" className="app-mode-background" />
          <AppearanceLayer target={mode} className="app-mode-background app-tab-background" />
          <div className="app-mode-content">
            <Suspense fallback={<div className="grid h-full place-items-center text-sm opacity-65">Đang mở khu vực…</div>}>
              {mode === "notes" && <NotesModeView key={`notes-${syncRevision}`} />}
              {mode === "library" && <LibraryView key={`library-${syncRevision}`} onOpenProject={async (projectId) => { await loadProjects(); await selectProject(projectId); navigate("projects"); }} />}
              {mode === "projects" && <ProjectsView key={`projects-${syncRevision}`} focusedSectionId={focusedSectionId} />}
              {mode === "mindmap" && <MindMapView onOpenProject={async (target) => { setFocusedSectionId(target.sectionId); await loadProjects(); await selectProject(target.projectId); selectChapter(target.chapterId); navigate("projects"); }} />}
              {mode === "whiteboard" && <WhiteboardView key={`whiteboard-${syncRevision}`} />}
              {mode === "calendar" && <CalendarView />}
            </Suspense>
          </div>
        </div>
        <MusicPlayer />
        <AccountPanel open={accountOpen} onClose={() => setAccountOpen(false)} onRecoveryRequired={openRecovery} />
        {tieuNhiLoaded && <Suspense fallback={null}><TieuNhiLauncher open={tieuNhiOpen} onOpenChange={setTieuNhiOpen} /></Suspense>}
        <nav className="mobile-bottom-nav md:hidden flex justify-around border-t py-1 shrink-0" style={{ paddingBottom: "max(.25rem, env(safe-area-inset-bottom))" }}>
          {MODE_TABS.map((tab) => <button key={tab.id} type="button" onClick={() => navigate(tab.id)} className={`mobile-nav-item flex flex-col items-center px-3 py-1.5 text-xs ${mode === tab.id ? "is-active" : ""}`} aria-current={mode === tab.id ? "page" : undefined}><Icon name={tab.icon} size={18} />{tab.label}</button>)}
        </nav>
      </section>
    </div>
  );
}
