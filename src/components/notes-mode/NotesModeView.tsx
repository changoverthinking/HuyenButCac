import { useEffect, useState } from "react";
import { useNotesStore } from "../../stores/notesStore";
import { useFoldersStore } from "../../stores/foldersStore";
import { Sidebar } from "../common/Sidebar";
import { NoteList } from "../common/NoteList";
import { NoteEditor } from "../editor/NoteEditor";
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
        event.preventDefault();
        setBusy(true); setMessage("");
        try { await unlockNote(note.id, password); setPassword(""); }
        catch (error) { setMessage((error as Error).message || "Không thể mở ghi chú."); }
        finally { setBusy(false); }
      }}>
        <div className="text-center text-3xl">🔒</div>
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

  useEffect(() => {
    loadFolders();
    loadNotes();
  }, [loadFolders, loadNotes]);

  useEffect(() => {
    if (selectedNoteId) setMobileView("editor");
  }, [selectedNoteId]);

  const selectedNote = view === "active" ? notes.find((n) => n.id === selectedNoteId) ?? null : null;

  async function handleCreateNote() {
    await createNote(selectedFolderId);
    setMobileView("editor");
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="hidden md:block h-full">
        <Sidebar />
      </div>

      <div
        className={`w-full md:w-80 shrink-0 border-r h-full flex flex-col ${
          mobileView === "editor" ? "hidden md:flex" : "flex"
        }`}
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="p-3 border-b flex gap-2" style={{ borderColor: "var(--color-border)" }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm ghi chú…"
            className="flex-1 text-sm px-3 py-2 rounded-lg outline-none border"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
            }}
          />
          <button
            onClick={handleCreateNote}
            disabled={view === "trash"}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
          >
            {view === "trash" ? "Thùng rác" : "+ Tạo"}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NoteList />
        </div>
      </div>

      <div className={`flex-1 h-full ${mobileView === "list" ? "hidden md:block" : "block"}`}>
        {selectedNote ? (
          <div className="h-full flex flex-col">
            <button
              className="md:hidden px-4 py-2 text-sm text-left"
              style={{ color: "var(--color-text-muted)" }}
              onClick={() => setMobileView("list")}
            >
              ← Danh sách
            </button>
            {selectedNote.locked && !isNoteUnlocked(selectedNote.id)
              ? <LockedNoteGate note={selectedNote} />
              : <NoteEditor key={`${selectedNote.id}-${selectedNote.locked ? "unlocked" : "plain"}`} note={selectedNote} />}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center" style={{ color: "var(--color-text-muted)" }}>
            Chọn hoặc tạo một ghi chú để bắt đầu.
          </div>
        )}
      </div>
    </div>
  );
}
