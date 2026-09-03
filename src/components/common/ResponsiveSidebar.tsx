import { useState, type ReactNode } from "react";
import { useFoldersStore } from "../../stores/foldersStore";
import { useNotesStore } from "../../stores/notesStore";
import { APP_CONFIG } from "../../app/appConfig";
import type { Folder } from "../../types/entities";
import { AppearanceLayer } from "./AdjustedImage";
import { Icon } from "./Icons";

export function ResponsiveSidebar({
  onNavigate,
  onOpenNotes,
  collapsed = false,
  onToggleCollapse,
}: {
  onNavigate?: () => void;
  onOpenNotes?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
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
          className="responsive-sidebar-folder"
          style={{
            background: view === "active" && selectedFolderId === folder.id ? "var(--color-surface-alt)" : "transparent",
            paddingLeft: `${Math.min(depth, 5) * 0.65}rem`,
          }}
        >
          <button className="responsive-sidebar-folder-name" title={folder.name} onClick={() => openFolder(folder.id)}>
            <Icon name="folder" size={15} /><span>{folder.name}</span>
          </button>
          <button title="Tạo thư mục con" aria-label={`Tạo thư mục con trong ${folder.name}`} onClick={() => void addChildFolder(folder)}><Icon name="folder-plus" size={14} /></button>
          <button title="Đổi tên thư mục" aria-label={`Đổi tên ${folder.name}`} onClick={async () => { const name = window.prompt("Tên thư mục:", folder.name)?.trim(); if (name) await renameFolder(folder.id, name); }}><Icon name="pencil" size={14} /></button>
          <button title="Xóa thư mục" aria-label={`Xóa ${folder.name}`} className="danger" onClick={async () => { if (!window.confirm(`Xóa thư mục “${folder.name}” và các thư mục con? Ghi chú bên trong sẽ được chuyển về Tất cả ghi chú.`)) return; await removeFolder(folder.id); await showActive(); }}><Icon name="trash" size={14} /></button>
        </div>
        {children.map((child) => renderFolder(child, depth + 1))}
      </div>
    );
  };

  return (
    <aside className={`responsive-sidebar mystic-sidebar ${collapsed ? "is-collapsed" : ""}`} style={{ borderColor: "var(--color-border)", background: "color-mix(in srgb,var(--color-surface) 90%,transparent)" }}>
      <AppearanceLayer target="tools" />
      <div className="responsive-sidebar-brand">
        <span className="responsive-sidebar-sigil"><Icon name="seal" size={22} /></span>
        {!collapsed && <div><h1>{APP_CONFIG.appNameVi}</h1><p>{APP_CONFIG.version}</p></div>}
      </div>

      <nav className="responsive-sidebar-primary">
        <button
          className={view === "active" && selectedFolderId === null ? "is-active" : ""}
          title="Tất cả ghi chú"
          onClick={() => { onOpenNotes?.(); selectFolder(null); void showActive(); onNavigate?.(); }}
        >
          <Icon name="notes" size={18} />{!collapsed && <span>Tất cả ghi chú</span>}
        </button>
        <button className={view === "trash" ? "is-active" : ""} title="Thùng rác" onClick={() => { onOpenNotes?.(); void showTrash(); onNavigate?.(); }}>
          <Icon name="trash" size={18} />{!collapsed && <span>Thùng rác</span>}
        </button>
      </nav>

      {!collapsed && (
        <>
          <div className="responsive-sidebar-section-title">Thư mục</div>
          <div className="responsive-sidebar-folders">
            {childrenOf(null).map((folder) => renderFolder(folder))}
            <form className="responsive-sidebar-new-folder" onSubmit={async (event) => {
              event.preventDefault(); if (!newFolderName.trim()) return;
              try { const name = newFolderName.trim(); await createFolder(name, null); setNewFolderName(""); setFolderMessage(`Đã tạo “${name}”.`); }
              catch (error) { setFolderMessage((error as Error).message || "Không thể tạo thư mục."); }
            }}>
              <input value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} placeholder="Thư mục mới…" />
              <button type="submit" disabled={!newFolderName.trim()} aria-label="Tạo thư mục"><Icon name="plus" size={16} /></button>
            </form>
            {folderMessage && <p className="responsive-sidebar-message">{folderMessage}</p>}
          </div>
        </>
      )}

      <div className="responsive-sidebar-footer">
        {!collapsed && <button className="responsive-sidebar-tool" onClick={() => { window.dispatchEvent(new CustomEvent("hbc-toggle-music")); onNavigate?.(); }}><Icon name="music" size={17} /><span>Tiên Âm Các</span></button>}
        {onToggleCollapse && (
          <button type="button" className="responsive-sidebar-collapse" onClick={onToggleCollapse} aria-label={collapsed ? "Mở rộng thanh công cụ" : "Thu gọn thanh công cụ"} title={collapsed ? "Mở rộng" : "Thu gọn"}>
            <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={17} />{!collapsed && <span>Thu gọn công cụ</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
