import { useEffect, useState } from "react";
import { useThemeStore } from "./stores/themeStore";
import { UpdatePrompt } from "./components/common/UpdatePrompt";
import { NotesModeView } from "./components/notes-mode/NotesModeView";
import { ProjectsView } from "./components/projects/ProjectsView";
import { MindMapView } from "./components/mind-map/MindMapView";
import { WhiteboardView } from "./components/whiteboard/WhiteboardView";
import { MusicPlayer } from "./components/music/MusicPlayer";

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

  useEffect(() => {
    loadTheme();
  }, []);

  return (
    <div className="app-shell flex flex-col h-screen w-screen overflow-hidden">
      <UpdatePrompt />

      {/* Tab desktop */}
      <div
        className="hidden md:flex items-center gap-1 px-4 py-2 border-b"
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
      </div>

      <div className="flex-1 overflow-hidden">
        {mode === "notes" && <NotesModeView />}
        {mode === "projects" && <ProjectsView />}
        {mode === "mindmap" && <MindMapView />}
        {mode === "whiteboard" && <WhiteboardView />}
      </div>

      <MusicPlayer />

      {/* Bottom nav mobile (mục 7) */}
      <nav
        className="md:hidden flex justify-around border-t py-1"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", paddingBottom: "max(.25rem, env(safe-area-inset-bottom))" }}
      >
        {MODE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id)}
            className="flex flex-col items-center px-3 py-1.5 text-xs"
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
