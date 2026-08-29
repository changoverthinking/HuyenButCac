import { useEffect, useState } from "react";
import { useNotesStore } from "../../stores/notesStore";
import { useFoldersStore } from "../../stores/foldersStore";
import { Sidebar } from "../common/Sidebar";
import { NoteList } from "../common/NoteList";
import { NoteEditor } from "../editor/NoteEditor";
import { Icon } from "../common/Icons";

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
    <div className="notes-mode-view flex h-full w-full overflow-hidden">
      <div className="hidden md:block h-full notes-folder-sidebar">
        <Sidebar />
      </div>

      <div
        className={`notes-index-panel w-full md:w-80 shrink-0 border-r h-full flex flex-col ${
          mobileView === "editor" ? "hidden md:flex" : "flex"
        }`}
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="notes-index-heading">
          <div>
            <span className="section-eyebrow">TÂM THỨC · LƯU TRỮ</span>
            <h2>Ngọc giản của ta</h2>
          </div>
          <span className="notes-index-count">{notes.length.toLocaleString("vi-VN")} bản ghi</span>
        </div>
        <div className="notes-list-toolbar p-3 border-b flex gap-2" style={{ borderColor: "var(--color-border)" }}>
          <label className="notes-search-field flex-1">
            <Icon name="search" size={16} />
            <input
              aria-label="Tìm kiếm ghi chú"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm trong ngọc giản…"
            />
          </label>
          <button
            onClick={handleCreateNote}
            disabled={view === "trash"}
            className="note-create-button"
            aria-label={view === "trash" ? "Không thể tạo ghi chú trong thùng rác" : "Tạo ghi chú mới"}
          >
            <Icon name="plus" size={18} />
            <span className="hidden sm:inline">Tạo</span>
          </button>
        </div>
        <div className="notes-list-meta">
          <span>{view === "trash" ? "THÙNG RÁC" : selectedFolderId ? "THƯ MỤC ĐANG CHỌN" : "TẤT CẢ GHI CHÚ"}</span>
          <span className="notes-list-line" aria-hidden="true" />
          <span>{searchQuery.trim() ? "ĐANG LỌC" : "MỚI NHẤT"}</span>
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
              <span className="icon-label"><Icon name="chevron-left" size={15} /> Danh sách</span>
            </button>
            <NoteEditor key={selectedNote.id} note={selectedNote} />
          </div>
        ) : (
          <div className="empty-editor-state">
            <span className="empty-editor-seal" aria-hidden="true"><Icon name="scroll" size={30} /></span>
            <span className="section-eyebrow">MỞ MỘT TRANG MỚI</span>
            <h2>Chọn một ngọc giản</h2>
            <p>Hoặc tạo ghi chú mới để bắt đầu ghi lại ý niệm đang trôi qua.</p>
            <span className="empty-editor-rule" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
}
