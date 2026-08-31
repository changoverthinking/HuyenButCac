import { useState, type ReactNode } from "react";
import { useFoldersStore } from "../../stores/foldersStore";
import { useNotesStore } from "../../stores/notesStore";
import { useThemeStore, THEME_LIST } from "../../stores/themeStore";
import { APP_CONFIG } from "../../app/appConfig";
import type { Folder } from "../../types/entities";

export function Sidebar({ onNavigate, onOpenNotes }: { onNavigate?: () => void; onOpenNotes?:()=>void }) {
  const folders = useFoldersStore((s) => s.folders);
  const selectedFolderId = useFoldersStore((s) => s.selectedFolderId);
  const selectFolder = useFoldersStore((s) => s.select);
  const createFolder = useFoldersStore((s) => s.create);
  const renameFolder = useFoldersStore((s) => s.rename);
  const removeFolder = useFoldersStore((s) => s.remove);
  const showActive = useNotesStore((s) => s.showActive);
  const showTrash = useNotesStore((s) => s.showTrash);
  const view = useNotesStore((s) => s.view);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderMessage, setFolderMessage] = useState("");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);
  const backgroundUrl = useThemeStore((s) => s.backgroundUrl);
  const setCustomBackground = useThemeStore((s) => s.setCustomBackground);
  const clearCustomBackground = useThemeStore((s) => s.clearCustomBackground);

  const childrenOf = (parentId: string | null) => folders
    .filter((folder) => folder.parentId === parentId)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  const openFolder = (folderId: string) => {
    onOpenNotes?.();
    selectFolder(folderId);
    void showActive(folderId);
    onNavigate?.();
  };

  const addChildFolder = async (parent: Folder) => {
    const name = window.prompt(`Tạo thư mục con trong “${parent.name}”:`)?.trim();
    if (!name) return;
    try {
      await createFolder(name, parent.id);
      setFolderMessage(`Đã tạo thư mục con “${name}”.`);
    } catch (error) {
      setFolderMessage((error as Error).message || "Không thể tạo thư mục con.");
    }
  };

  const renderFolder = (folder: Folder, depth = 0): ReactNode => {
    const children = childrenOf(folder.id);
    return (
      <div key={folder.id}>
        <div
          className="flex items-center rounded-lg mb-1"
          style={{
            background: view === "active" && selectedFolderId === folder.id ? "var(--color-surface-alt)" : "transparent",
            paddingLeft: `${Math.min(depth, 5) * 0.65}rem`,
          }}
        >
          <button
            className="flex-1 min-w-0 text-left px-2 py-2 truncate"
            title={folder.name}
            onClick={() => openFolder(folder.id)}
          >
            {depth > 0 ? "└ " : ""}📁 {folder.name}
          </button>
          <button title="Tạo thư mục con" aria-label={`Tạo thư mục con trong ${folder.name}`} className="px-1" onClick={() => void addChildFolder(folder)}>＋</button>
          <button title="Đổi tên thư mục" className="px-1" onClick={async()=>{const name=window.prompt("Tên thư mục:",folder.name)?.trim();if(name)await renameFolder(folder.id,name);}}>✎</button>
          <button title="Xóa thư mục" className="px-2" style={{color:"var(--color-error)"}} onClick={async()=>{if(!window.confirm(`Xóa thư mục “${folder.name}” và các thư mục con? Ghi chú bên trong sẽ được chuyển về Tất cả ghi chú.`))return;await removeFolder(folder.id);await showActive();}}>×</button>
        </div>
        {children.map((child) => renderFolder(child, depth + 1))}
      </div>
    );
  };

  return (
    <aside
      className="mystic-sidebar w-64 shrink-0 border-r flex flex-col h-full"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-3"><span className="brand-sigil small">玄</span><h1 className="text-lg font-bold" style={{ color: "var(--color-accent)" }}>{APP_CONFIG.appNameVi}</h1></div>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {APP_CONFIG.version}
        </p>
      </div>

      <nav className="p-2">
        <button
          className="w-full text-left px-3 py-2 rounded-lg mb-1"
          style={{ background: view === "active" && selectedFolderId === null ? "var(--color-surface-alt)" : "transparent" }}
          onClick={() => {
            onOpenNotes?.();
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
          onClick={() => { onOpenNotes?.(); void showTrash(); onNavigate?.(); }}
        >
          Thùng rác
        </button>
      </nav>

      <div className="px-3 pt-2 pb-1 text-xs uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
        Thư mục
      </div>
      <div className="px-2 overflow-y-auto flex-1">
        {childrenOf(null).map((folder) => renderFolder(folder))}
        <form
          className="flex gap-1 px-1 mt-1"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newFolderName.trim()) return;
            try {
              const name=newFolderName.trim();
              await createFolder(name, null);
              setNewFolderName("");
              setFolderMessage(`Đã tạo “${name}”.`);
            } catch (error) { setFolderMessage((error as Error).message||"Không thể tạo thư mục."); }
          }}
        >
          <input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Thư mục mới…"
            className="min-w-0 flex-1 text-sm bg-transparent border rounded outline-none px-2 py-1.5"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          />
          <button type="submit" disabled={!newFolderName.trim()} aria-label="Tạo thư mục" className="rounded px-2" style={{background:"var(--color-accent)",color:"var(--color-bg)"}}>＋</button>
        </form>
        {folderMessage&&<p className="px-2 pt-1 text-xs" style={{color:"var(--color-text-muted)"}}>{folderMessage}</p>}
      </div>

      <div className="p-2 border-t relative" style={{ borderColor: "var(--color-border)" }}>
        <label className="block w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
          🖼️ Chọn ảnh nền
          <input type="file" accept="image/*" className="hidden" onChange={async(e)=>{const file=e.target.files?.[0];if(!file)return;try{await setCustomBackground(file);}catch(error){window.alert((error as Error).message);}e.target.value="";}} />
        </label>
        {backgroundUrl&&<button className="w-full text-left px-3 py-2 rounded-lg text-sm" style={{color:"var(--color-error)"}} onClick={()=>void clearCustomBackground()}>↩ Dùng lại nền mặc định</button>}
        <button className="w-full text-left px-3 py-2 rounded-lg text-sm" style={{color:"var(--color-text-muted)"}} onClick={()=>{window.dispatchEvent(new CustomEvent("hbc-toggle-music"));onNavigate?.();}}>♫ Tiên Âm Các</button>
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
                  void setTheme(t.id);
                  setShowThemePicker(false);
                }}
              >
                <span className="inline-flex items-center gap-2 w-full">
                  <span>{themeId === t.id ? "●" : "○"}</span>
                  <span className="flex-1">{t.label}</span>
                  <span className="inline-flex -space-x-1">{t.colors.map((color)=><span key={color} className="w-3.5 h-3.5 rounded-full border" style={{background:color,borderColor:"var(--color-border)"}} />)}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
