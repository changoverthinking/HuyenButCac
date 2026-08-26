import { useEffect, useState } from "react";
import { useNotesStore } from "../../stores/notesStore";
import { useFoldersStore } from "../../stores/foldersStore";
import { Sidebar } from "../common/Sidebar";
import { NoteList } from "../common/NoteList";
import { NoteEditor } from "../editor/NoteEditor";

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
  }, []);

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
            <NoteEditor key={selectedNote.id} note={selectedNote} />
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
