import { useEffect, useState } from "react";
import { useThemeStore } from "./stores/themeStore";
import { UpdatePrompt } from "./components/common/UpdatePrompt";
import { NotesModeView } from "./components/notes-mode/NotesModeView";
import { ProjectsView } from "./components/projects/ProjectsView";
import { MindMapView } from "./components/mind-map/MindMapView";
import { WhiteboardView } from "./components/whiteboard/WhiteboardView";
import { MusicPlayer } from "./components/music/MusicPlayer";
import { Sidebar } from "./components/common/Sidebar";
import { useProjectsStore } from "./stores/projectsStore";
import { AccountPanel } from "./components/auth/AccountPanel";

type Mode = "notes" | "projects" | "mindmap" | "whiteboard";

const MODE_TABS: { id: Mode; label: string; icon: string; ready: boolean }[] = [
  { id: "notes", label: "Ghi chú", icon: "📝", ready: true },
  { id: "projects", label: "Dự án", icon: "📚", ready: true },
  { id: "mindmap", label: "Sơ đồ", icon: "🕸️", ready: true },
  { id: "whiteboard", label: "Bảng trắng", icon: "🖼️", ready: true },
];

export default function App() {
  const loadTheme = useThemeStore((s) => s.load);
  const [mode, setMode] = useState<Mode>("notes");
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
  const [focusedSectionId,setFocusedSectionId]=useState<string|null>(null);
  const [accountOpen,setAccountOpen]=useState(false);
  const loadProjects=useProjectsStore(s=>s.loadProjects);
  const selectProject=useProjectsStore(s=>s.selectProject);
  const selectChapter=useProjectsStore(s=>s.selectChapter);

  useEffect(() => {
    loadTheme();
  }, []);

  return (
    <div className="app-shell flex flex-col w-screen overflow-hidden">
      <UpdatePrompt />

      <div className="md:hidden flex items-center gap-2 px-2 py-1.5 border-b shrink-0" style={{borderColor:"var(--color-border)",background:"var(--color-surface)"}}>
        <button aria-label="Mở menu" className="mobile-icon-button" onClick={()=>setMobileMenuOpen(true)}>☰</button>
        <div className="flex-1 text-center font-semibold">{MODE_TABS.find(item=>item.id===mode)?.label}</div>
        <button aria-label="Mở tài khoản" className="mobile-icon-button" onClick={()=>setAccountOpen(true)}>♙</button>
      </div>
      {mobileMenuOpen&&<div className="md:hidden fixed inset-0 z-50 flex"><div className="relative z-10 h-full"><Sidebar onNavigate={()=>setMobileMenuOpen(false)} onOpenNotes={()=>setMode("notes")}/></div><button aria-label="Đóng menu" className="absolute inset-0 bg-black/50" onClick={()=>setMobileMenuOpen(false)}/></div>}

      {/* Tab desktop */}
      <div
        className="desktop-mode-tabs hidden md:flex items-center gap-1 px-4 py-2 border-b"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        {MODE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
            style={{
              background: mode === t.id ? "var(--color-surface-alt)" : "transparent",
              color: mode === t.id ? "var(--color-accent)" : "var(--color-text-muted)",
            }}
          >
            <span>{t.icon}</span>
            {t.label}
            {!t.ready && <span className="text-[10px] opacity-60">(sắp có)</span>}
          </button>
        ))}
        <button className="ml-auto px-3 py-1.5 rounded-lg text-sm" style={{background:"var(--color-surface-alt)"}} onClick={()=>setAccountOpen(true)}>♙ Tài khoản</button>
      </div>

      <div className="flex-1 overflow-hidden">
        {mode === "notes" && <NotesModeView />}
        {mode === "projects" && <ProjectsView focusedSectionId={focusedSectionId} />}
        {mode === "mindmap" && <MindMapView onOpenProject={async target=>{setFocusedSectionId(target.sectionId);await loadProjects();await selectProject(target.projectId);selectChapter(target.chapterId);setMode("projects");}} />}
        {mode === "whiteboard" && <WhiteboardView />}
      </div>

      <MusicPlayer />
      <AccountPanel open={accountOpen} onClose={()=>setAccountOpen(false)} />

      {/* Bottom nav mobile (mục 7) */}
      <nav
        className="mobile-bottom-nav md:hidden flex justify-around border-t py-1 shrink-0"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", paddingBottom: "max(.25rem, env(safe-area-inset-bottom))" }}
      >
        {MODE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className="mobile-nav-item flex flex-col items-center px-3 py-1.5 text-xs"
            style={{ color: mode === t.id ? "var(--color-accent)" : "var(--color-text-muted)" }}
          >
            <span className="text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
