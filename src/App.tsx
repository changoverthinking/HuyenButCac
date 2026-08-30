import { useCallback, useEffect, useState } from "react";
import { useThemeStore } from "./stores/themeStore";
import { UpdatePrompt } from "./components/common/UpdatePrompt";
import { NotesModeView } from "./components/notes-mode/NotesModeView";
import { ProjectsView } from "./components/projects/ProjectsView";
import { MindMapView } from "./components/mind-map/MindMapView";
import { WhiteboardView } from "./components/whiteboard/WhiteboardView";
import { MusicPlayer } from "./components/music/MusicPlayer";
import { Sidebar } from "./components/common/Sidebar";
import { useProjectsStore } from "./stores/projectsStore";
import { useNotesStore } from "./stores/notesStore";
import { AccountPanel } from "./components/auth/AccountPanel";
import { APP_CONFIG } from "./app/appConfig";

type Mode = "notes" | "projects" | "mindmap" | "whiteboard";

const MODE_TABS: { id: Mode; label: string; kicker: string; icon: string }[] = [
  { id: "notes", label: "Ghi chú", kicker: "TRÚC GIẢN", icon: "▤" },
  { id: "projects", label: "Dự án", kicker: "THƯ VIỆN TRUYỆN", icon: "◈" },
  { id: "mindmap", label: "Sơ đồ", kicker: "LINH ĐỒ", icon: "◎" },
  { id: "whiteboard", label: "Bảng trắng", kicker: "BẠCH ĐÀI", icon: "◇" },
];

function AppRail({
  mode,
  setMode,
  collapsed,
  setCollapsed,
  online,
  onAccount,
}: {
  mode: Mode;
  setMode: (mode: Mode) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  online: boolean;
  onAccount: () => void;
}) {
  return (
    <aside className={`app-rail ${collapsed ? "is-collapsed" : ""}`} aria-label="Điều hướng Huyền Bút Các">
      <div className="app-rail-edge" aria-hidden="true" />
      <div className="app-rail-brand">
        <span className="app-rail-sigil">✍</span>
        <span className="app-rail-brand-copy">
          <strong>Huyền Bút Các</strong>
          <small>VÂN THƯ ĐÀI</small>
        </span>
      </div>

      <div className="app-rail-seal" aria-hidden="true">
        <span>道</span>
        <small>KHÔNG GIAN SÁNG TÁC</small>
      </div>

      <nav className="app-rail-nav" aria-label="Các khu vực làm việc">
        {MODE_TABS.map((tab) => {
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`app-rail-nav-item ${active ? "is-active" : ""}`}
              onClick={() => setMode(tab.id)}
              aria-current={active ? "page" : undefined}
              aria-label={tab.label}
              title={collapsed ? tab.label : undefined}
            >
              <span className="app-rail-nav-icon" aria-hidden="true">{tab.icon}</span>
              <span className="app-rail-nav-copy">
                <span>{tab.label}</span>
                <small>{tab.kicker}</small>
              </span>
              {active && <span className="app-rail-active-mark" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      <div className="app-rail-footer">
        <div className="app-rail-local-status" title={online ? "Đang có kết nối mạng" : "Đang ngoại tuyến"}>
          <span className={`app-status-dot ${online ? "is-online" : "is-offline"}`} aria-hidden="true" />
          <span className="app-rail-nav-copy"><span>{online ? "Đang kết nối" : "Ngoại tuyến"}</span><small>LOCAL-FIRST</small></span>
        </div>
        <button type="button" className="app-rail-account" onClick={onAccount} title={collapsed ? "Tài khoản" : undefined}>
          <span className="app-rail-account-icon" aria-hidden="true">♙</span>
          <span className="app-rail-nav-copy"><span>Tài khoản</span><small>KHO BẢO MẬT</small></span>
        </button>
        <button
          type="button"
          className="app-rail-collapse"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          title={collapsed ? "Mở rộng" : "Thu gọn"}
        >
          <span aria-hidden="true">{collapsed ? "›" : "‹"}</span>
          <span className="app-rail-nav-copy">{collapsed ? "" : "Thu gọn"}</span>
        </button>
      </div>
    </aside>
  );
}

function AppTopbar({ mode, online, onAccount, onSearch }: { mode: Mode; online: boolean; onAccount: () => void; onSearch: (query: string) => void }) {
  const meta = MODE_TABS.find((tab) => tab.id === mode) ?? MODE_TABS[0];
  const [query, setQuery] = useState("");
  return (
    <header className="app-topbar">
      <div className="app-topbar-title">
        <span>{meta.kicker}</span>
        <h1>{meta.label}</h1>
      </div>
      <form className="app-topbar-search" onSubmit={(event) => { event.preventDefault(); onSearch(query.trim()); }}>
        <span aria-hidden="true">⌕</span>
        <input aria-label="Tìm trong ghi chú" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm trong ghi chú…" />
      </form>
      <div className="app-topbar-actions">
        <div className="app-sync-chip" aria-live="polite">
          <span className={`app-status-dot ${online ? "is-online" : "is-offline"}`} aria-hidden="true" />
          <span>{online ? "Đang kết nối" : "Ngoại tuyến"}</span>
        </div>
        <span className="app-topbar-version">{APP_CONFIG.version}</span>
        <button type="button" className="app-topbar-account" onClick={onAccount} aria-label="Mở tài khoản">
          <span aria-hidden="true">♙</span>
          <span className="hidden sm:inline">Tài khoản</span>
        </button>
      </div>
    </header>
  );
}

export default function App() {
  const loadTheme = useThemeStore((state) => state.load);
  const [mode, setMode] = useState<Mode>("notes");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const openRecovery = useCallback(() => setAccountOpen(true), []);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [syncRevision, setSyncRevision] = useState(0);
  const loadProjects = useProjectsStore((state) => state.loadProjects);
  const selectProject = useProjectsStore((state) => state.selectProject);
  const selectChapter = useProjectsStore((state) => state.selectChapter);
  const setSearchQuery = useNotesStore((state) => state.setSearchQuery);

  useEffect(() => {
    void loadTheme();
    const refresh = () => setSyncRevision((value) => value + 1);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("hbc-sync-complete", refresh);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("hbc-sync-complete", refresh);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadTheme]);

  const activeMeta = MODE_TABS.find((tab) => tab.id === mode) ?? MODE_TABS[0];
  const openAccount = () => setAccountOpen(true);
  const navigate = (nextMode: Mode) => {
    setMode(nextMode);
    setMobileMenuOpen(false);
  };
  const searchNotes = (query: string) => {
    void setSearchQuery(query);
    navigate("notes");
  };

  return (
    <div className="app-shell app-shell--figma flex w-screen overflow-hidden">
      <UpdatePrompt />

      <AppRail
        mode={mode}
        setMode={navigate}
        collapsed={railCollapsed}
        setCollapsed={setRailCollapsed}
        online={online}
        onAccount={openAccount}
      />

      <section className="app-workspace">
        <div className="mobile-topbar md:hidden flex items-center gap-2 px-2 py-1.5 border-b shrink-0">
          <button aria-label="Mở menu" className="mobile-icon-button mystic-icon" onClick={() => setMobileMenuOpen(true)}>☰</button>
          <div className="flex-1 text-center min-w-0">
            <div className="mobile-brand">Huyền Bút Các</div>
            <div className="mobile-mode">{activeMeta.label}</div>
          </div>
          <button aria-label="Mở tài khoản" className="mobile-icon-button mystic-icon" onClick={openAccount}>♙</button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div className="relative z-10 h-full"><Sidebar onNavigate={() => setMobileMenuOpen(false)} onOpenNotes={() => navigate("notes")} /></div>
            <button aria-label="Đóng menu" className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        <div className="hidden md:block"><AppTopbar mode={mode} online={online} onAccount={openAccount} onSearch={searchNotes} /></div>

        <div className="app-content flex-1 overflow-hidden">
          {mode === "notes" && <NotesModeView key={`notes-${syncRevision}`} />}
          {mode === "projects" && <ProjectsView key={`projects-${syncRevision}`} focusedSectionId={focusedSectionId} />}
          {mode === "mindmap" && (
            <MindMapView
              onOpenProject={async (target) => {
                setFocusedSectionId(target.sectionId);
                await loadProjects();
                await selectProject(target.projectId);
                selectChapter(target.chapterId);
                navigate("projects");
              }}
            />
          )}
          {mode === "whiteboard" && <WhiteboardView key={`whiteboard-${syncRevision}`} />}
        </div>

        <MusicPlayer />
        <AccountPanel open={accountOpen} onClose={() => setAccountOpen(false)} onRecoveryRequired={openRecovery} />

        <nav className="mobile-bottom-nav md:hidden flex justify-around border-t py-1 shrink-0" style={{ paddingBottom: "max(.25rem, env(safe-area-inset-bottom))" }}>
          {MODE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.id)}
              className={`mobile-nav-item flex flex-col items-center px-3 py-1.5 text-xs ${mode === tab.id ? "is-active" : ""}`}
              aria-current={mode === tab.id ? "page" : undefined}
            >
              <span className="text-lg" aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </section>
    </div>
  );
}
