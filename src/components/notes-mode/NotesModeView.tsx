import { useEffect, useState } from "react";
import { useNotesStore } from "../../stores/notesStore";
import { useFoldersStore } from "../../stores/foldersStore";
import { ResponsiveSidebar } from "../common/ResponsiveSidebar";
import { NoteList } from "../common/NoteList";
import { NoteEditor } from "../editor/NoteEditor";
import { Icon } from "../common/Icons";
import { isNoteUnlocked } from "../../features/notes/notesService";
import type { Note } from "../../types/entities";

function LockedNoteGate({ note }: { note: Note }) {
  const unlockNote = useNotesStore((s) => s.unlockNote);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid h-full place-items-center p-6">
      <form className="w-full max-w-sm rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }} onSubmit={async (event) => {
        event.preventDefault(); setBusy(true); setMessage("");
        try { await unlockNote(note.id, password); setPassword(""); }
        catch (error) { setMessage((error as Error).message || "Không thể mở ghi chú."); }
        finally { setBusy(false); }
      }}>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full" style={{ color: "var(--color-accent)", background: "var(--color-surface-alt)" }}><Icon name="lock" size={25} /></div>
        <h2 className="mt-2 text-center text-lg font-semibold">Ghi chú đã khóa</h2>
        <p className="mt-1 text-center text-sm opacity-65">Nội dung đang được mã hóa AES-256-GCM trong IndexedDB. Mật khẩu không được lưu trên thiết bị.</p>
        <input className="mt-4 w-full rounded-lg border px-3 py-2" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)" }} type="password" autoComplete="off" minLength={8} required placeholder="Mật khẩu ghi chú" value={password} onChange={(event) => setPassword(event.target.value)} />
        <button disabled={busy} className="mt-3 w-full rounded-lg px-3 py-2 font-medium" style={{ background: "var(--color-accent)", color: "var(--color-bg)" }} type="submit">{busy ? "Đang mở…" : "Mở khóa ghi chú"}</button>
        {message && <p className="mt-3 text-sm" style={{ color: "var(--color-error)" }}>{message}</p>}
      </form>
    </div>
  );
}

export function NotesModeView() {
  const loadNotes = useNotesStore((s) => s.loadNotes);
  const loadFolders = useFoldersStore((s) => s.load);
  const notes = useNotesStore((s) => s.notes);
  const selectedNoteId = useNotesStore((s) => s.selectedNoteId);
  const createNote = useNotesStore((s) => s.createNote);
  const setSearchQuery = useNotesStore((s) => s.setSearchQuery);
  const searchQuery = useNotesStore((s) => s.searchQuery);
  const selectedFolderId = useFoldersStore((s) => s.selectedFolderId);
  const view = useNotesStore((s) => s.view);
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("hbc-notes-sidebar-collapsed") === "1");
  const [listCollapsed, setListCollapsed] = useState(() => localStorage.getItem("hbc-notes-list-collapsed") === "1");

  useEffect(() => { loadFolders(); loadNotes(); }, [loadFolders, loadNotes]);
  useEffect(() => { if (selectedNoteId) setMobileView("editor"); }, [selectedNoteId]);
  useEffect(() => { localStorage.setItem("hbc-notes-sidebar-collapsed", sidebarCollapsed ? "1" : "0"); }, [sidebarCollapsed]);
  useEffect(() => { localStorage.setItem("hbc-notes-list-collapsed", listCollapsed ? "1" : "0"); }, [listCollapsed]);

  const selectedNote = view === "active" ? notes.find((note) => note.id === selectedNoteId) ?? null : null;
  async function handleCreateNote() { await createNote(selectedFolderId); setMobileView("editor"); }

  return (
    <div className="notes-studio flex h-full w-full overflow-hidden">
      <div className="notes-studio-sidebar hidden md:block h-full"><ResponsiveSidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((value) => !value)} /></div>
      <div className={`notes-studio-list w-full ${listCollapsed ? "md:w-14 notes-mode-list-collapsed" : "md:w-80"} shrink-0 border-r h-full flex flex-col ${mobileView === "editor" ? "hidden md:flex" : "flex"}`} style={{ borderColor: "var(--color-border)" }}>
        <div className="notes-mode-toolbar p-3 border-b" style={{ borderColor: "var(--color-border)" }}>
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm kiếm ghi chú…" className="notes-mode-search flex-1 min-w-0 text-sm px-3 py-2 rounded-lg outline-none border" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }} />
          <button onClick={handleCreateNote} disabled={view === "trash"} className="notes-mode-create px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1" style={{ background: "var(--color-accent)", color: "var(--color-bg)" }} aria-label={view === "trash" ? "Thùng rác" : "Tạo ghi chú"}>
            <Icon name={view === "trash" ? "trash" : "plus"} size={16} /><span className="notes-mode-create-copy">{view === "trash" ? "Thùng rác" : "Tạo"}</span>
          </button>
          <button type="button" className="notes-mode-list-toggle hidden md:grid" onClick={() => setListCollapsed((value) => !value)} aria-label={listCollapsed ? "Mở danh sách ghi chú" : "Thu gọn danh sách ghi chú"} title={listCollapsed ? "Mở danh sách" : "Thu gọn danh sách"}><Icon name={listCollapsed ? "chevron-right" : "chevron-left"} size={16} /></button>
        </div>
        <div className="notes-mode-list-body flex-1 overflow-y-auto"><NoteList /></div>
      </div>

      <div className={`notes-studio-editor flex-1 h-full ${mobileView === "list" ? "hidden md:block" : "block"}`}>
        {selectedNote ? (
          <div className="notes-editor-frame h-full flex flex-col">
            <button className="md:hidden px-4 py-2 text-sm text-left inline-flex items-center gap-1" style={{ color: "var(--color-text-muted)" }} onClick={() => setMobileView("list")}><Icon name="chevron-left" size={15} /> Danh sách</button>
            {selectedNote.locked && !isNoteUnlocked(selectedNote.id) ? <LockedNoteGate note={selectedNote} /> : <NoteEditor key={`${selectedNote.id}-${selectedNote.locked ? "unlocked" : "plain"}`} note={selectedNote} />}
          </div>
        ) : <div className="notes-empty-state h-full flex items-center justify-center"><div className="notes-empty-card"><span className="notes-empty-seal"><Icon name="pencil" size={30} /></span><small>TRÚC GIẢN</small><h2>Trang giấy đang chờ nét bút</h2><p>Chọn một ghi chú ở bên trái, hoặc tạo trang mới để bắt đầu viết.</p><button type="button" onClick={() => void handleCreateNote()}><Icon name="plus" size={17} /> Tạo ghi chú mới</button></div></div>}
      </div>
    </div>
  );
}
