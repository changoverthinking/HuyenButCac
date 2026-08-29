import { useEffect, useState } from "react";
import { useThemeStore } from "./stores/themeStore";
import { UpdatePrompt } from "./components/common/UpdatePrompt";
import { NotesModeView } from "./components/notes-mode/NotesModeView";
import { ProjectsView } from "./components/projects/ProjectsView";
import { MindMapView } from "./components/mind-map/MindMapView";
import { WhiteboardView } from "./components/whiteboard/WhiteboardView";
import { MusicPlayer } from "./components/music/MusicPlayer";
import { Sidebar } from "./components/common/Sidebar";
import { AppSidebar } from "./components/common/AppSidebar";
import { useProjectsStore } from "./stores/projectsStore";
import { AccountPanel } from "./components/auth/AccountPanel";

type Mode = "notes" | "projects" | "mindmap" | "whiteboard";

const MODE_TABS: { id: Mode; label: string; icon: string; ready: boolean }[] = [
  { id: "notes", label: "Ghi chú", icon: "✦", ready: true },
  { id: "projects", label: "Dự án", icon: "冊", ready: true },
  { id: "mindmap", label: "Sơ đồ", icon: "⌘", ready: true },
  { id: "whiteboard", label: "Bảng trắng", icon: "◇", ready: true },
];

export default function App() {
  const loadTheme = useThemeStore((s) => s.load);
  const [mode, setMode] = useState<Mode>("notes");
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
  const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
  const [focusedSectionId,setFocusedSectionId]=useState<string|null>(null);
  const [accountOpen,setAccountOpen]=useState(false);
  const [syncRevision,setSyncRevision]=useState(0);
  const loadProjects=useProjectsStore(s=>s.loadProjects);
  const selectProject=useProjectsStore(s=>s.selectProject);
  const selectChapter=useProjectsStore(s=>s.selectChapter);

  useEffect(() => {
    loadTheme();
    const refresh=()=>setSyncRevision(value=>value+1);
    window.addEventListener("hbc-sync-complete",refresh);
    return ()=>window.removeEventListener("hbc-sync-complete",refresh);
  }, [loadTheme]);

  return (
    <div className="app-shell flex md:flex-row flex-col w-screen overflow-hidden">
      <UpdatePrompt />

      {/* Sidebar điều hướng cấp ứng dụng — chỉ desktop (md+). Thay cho thanh tab ngang cũ. */}
      <AppSidebar
        items={MODE_TABS}
        activeId={mode}
        onSelect={(id) => setMode(id as Mode)}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="mobile-topbar md:hidden flex items-center gap-2 px-2 py-1.5 border-b shrink-0">
          <button aria-label="Mở menu" className="mobile-icon-button mystic-icon" onClick={()=>setMobileMenuOpen(true)}>☰</button>
          <div className="flex-1 text-center min-w-0"><div className="mobile-brand">Huyền Bút Các</div><div className="mobile-mode">{MODE_TABS.find(item=>item.id===mode)?.label}</div></div>
          <button aria-label="Mở tài khoản" className="mobile-icon-button mystic-icon" onClick={()=>setAccountOpen(true)}>♙</button>
        </div>
        {mobileMenuOpen&&<div className="md:hidden fixed inset-0 z-50 flex"><div className="relative z-10 h-full"><Sidebar onNavigate={()=>setMobileMenuOpen(false)} onOpenNotes={()=>setMode("notes")}/></div><button aria-label="Đóng menu" className="absolute inset-0 bg-black/50" onClick={()=>setMobileMenuOpen(false)}/></div>}

        {/* Topbar desktop: trạng thái + tài khoản (điều hướng đã chuyển sang AppSidebar bên trái) */}
        <div className="desktop-topbar hidden md:flex items-center gap-3 px-5 py-2.5 border-b shrink-0">
          <div style={{ fontFamily: "var(--font-display)", fontSize: 13, color: "var(--color-text-muted)", letterSpacing: ".04em" }}>
            {MODE_TABS.find(item=>item.id===mode)?.label}
          </div>
          <button className="account-pill ml-auto px-3 py-1.5 rounded-lg text-sm" onClick={()=>setAccountOpen(true)}><span className="status-jade"/> Tài khoản</button>
        </div>

        <div className="app-content flex-1 overflow-hidden">
          {mode === "notes" && <NotesModeView key={`notes-${syncRevision}`} />}
          {mode === "projects" && <ProjectsView key={`projects-${syncRevision}`} focusedSectionId={focusedSectionId} />}
          {/* MindMapView tự reload theo hbc-sync-complete để giữ đúng sơ đồ đang mở. */}
          {mode === "mindmap" && <MindMapView onOpenProject={async target=>{setFocusedSectionId(target.sectionId);await loadProjects();await selectProject(target.projectId);selectChapter(target.chapterId);setMode("projects");}} />}
          {mode === "whiteboard" && <WhiteboardView key={`whiteboard-${syncRevision}`} />}
        </div>

        <MusicPlayer />
        <AccountPanel open={accountOpen} onClose={()=>setAccountOpen(false)} />

        {/* Bottom nav mobile (mục 7) */}
        <nav
          className="mobile-bottom-nav md:hidden flex justify-around border-t py-1 shrink-0"
          style={{ paddingBottom: "max(.25rem, env(safe-area-inset-bottom))" }}
        >
          {MODE_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`mobile-nav-item flex flex-col items-center px-3 py-1.5 text-xs ${mode===t.id?"is-active":""}`}
              aria-current={mode===t.id?"page":undefined}
            >
              <span className="text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
