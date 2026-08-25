import { useState } from "react";
import { useFoldersStore } from "../../stores/foldersStore";
import { useNotesStore } from "../../stores/notesStore";
import { useThemeStore, THEME_LIST } from "../../stores/themeStore";
import { APP_CONFIG } from "../../app/appConfig";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const folders = useFoldersStore((s) => s.folders);
  const selectedFolderId = useFoldersStore((s) => s.selectedFolderId);
  const selectFolder = useFoldersStore((s) => s.select);
  const createFolder = useFoldersStore((s) => s.create);
  const showActive = useNotesStore((s) => s.showActive);
  const showTrash = useNotesStore((s) => s.showTrash);
  const view = useNotesStore((s) => s.view);
  const [newFolderName, setNewFolderName] = useState("");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);

  const rootFolders = folders.filter((f) => f.parentId === null);

  return (
    <aside
      className="w-64 shrink-0 border-r flex flex-col h-full"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
        <h1 className="text-lg font-bold" style={{ color: "var(--color-accent)" }}>
          {APP_CONFIG.appNameVi}
        </h1>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {APP_CONFIG.version}
        </p>
      </div>

      <nav className="p-2">
        <button
          className="w-full text-left px-3 py-2 rounded-lg mb-1"
          style={{ background: view === "active" && selectedFolderId === null ? "var(--color-surface-alt)" : "transparent" }}
          onClick={() => {
            selectFolder(null);
            void showActive();
            onNavigate?.();
          }}
        >
          Tất cả ghi chú
        </button>
        <button
          className="w-full text-left px-3 py-2 rounded-lg mb-1"
          style={{ color: "var(--color-text-muted)", background: view === "trash" ? "var(--color-surface-alt)" : "transparent" }}
          onClick={() => { void showTrash(); onNavigate?.(); }}
        >
          Thùng rác
        </button>
      </nav>

      <div className="px-3 pt-2 pb-1 text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
        Thư mục
      </div>
      <div className="px-2 overflow-y-auto flex-1">
        {rootFolders.map((f) => (
          <button
            key={f.id}
            className="w-full text-left px-3 py-2 rounded-lg mb-1"
            style={{ background: view === "active" && selectedFolderId === f.id ? "var(--color-surface-alt)" : "transparent" }}
            onClick={() => {
              selectFolder(f.id);
              void showActive(f.id);
              onNavigate?.();
            }}
          >
            📁 {f.name}
          </button>
        ))}
        <form
          className="flex gap-1 px-1 mt-1"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newFolderName.trim()) return;
            await createFolder(newFolderName.trim(), null);
            setNewFolderName("");
          }}
        >
          <input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Thư mục mới…"
            className="flex-1 text-sm bg-transparent border-b outline-none px-1 py-1"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          />
        </form>
      </div>

      <div className="p-2 border-t relative" style={{ borderColor: "var(--color-border)" }}>
        <button
          className="w-full text-left px-3 py-2 rounded-lg text-sm"
          style={{ color: "var(--color-text-muted)" }}
          onClick={() => setShowThemePicker((v) => !v)}
        >
          🎨 Đổi giao diện
        </button>
        {showThemePicker && (
          <div
            className="absolute bottom-full left-2 right-2 mb-1 rounded-lg border p-2 max-h-64 overflow-y-auto"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            {THEME_LIST.map((t) => (
              <button
                key={t.id}
                className="w-full text-left px-2 py-1.5 rounded text-sm mb-0.5"
                style={{
                  background: themeId === t.id ? "var(--color-surface-alt)" : "transparent",
                  color: "var(--color-text)",
                }}
                onClick={() => {
                  setTheme(t.id);
                  setShowThemePicker(false);
                }}
              >
                {themeId === t.id ? "● " : "○ "}
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
