import { useNotesStore } from "../../stores/notesStore";
import type { Note } from "../../types/entities";

function excerpt(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  const text = div.textContent ?? "";
  return text.slice(0, 80);
}

function NoteRow({ note, active, onClick }: { note: Note; active: boolean; onClick: () => void }) {
  const updateNote = useNotesStore((s) => s.updateNote);
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors"
      style={{
        background: active ? "var(--color-surface-alt)" : "transparent",
        border: `1px solid ${active ? "var(--color-accent)" : "transparent"}`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium truncate" style={{ color: "var(--color-text)" }}>
          {note.pinned ? "📌 " : ""}
          {note.title || "(Không tiêu đề)"}
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            updateNote(note.id, { favorite: !note.favorite });
          }}
          style={{ color: note.favorite ? "var(--color-warning)" : "var(--color-text-muted)" }}
        >
          {note.favorite ? "★" : "☆"}
        </span>
      </div>
      <div className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
        {excerpt(note.contentHtml) || "Chưa có nội dung"}
      </div>
    </button>
  );
}

export function NoteList() {
  const notes = useNotesStore((s) => s.notes);
  const searchQuery = useNotesStore((s) => s.searchQuery);
  const searchResults = useNotesStore((s) => s.searchResults);
  const selectedNoteId = useNotesStore((s) => s.selectedNoteId);
  const selectNote = useNotesStore((s) => s.selectNote);
  const trashedNotes = useNotesStore((s) => s.trashedNotes);
  const restoreNote = useNotesStore((s) => s.restoreNote);
  const hardDeleteNote = useNotesStore((s) => s.hardDeleteNote);
  const view = useNotesStore((s) => s.view);

  if (view === "trash") {
    if (trashedNotes.length === 0) {
      return <div className="p-4 text-sm" style={{ color: "var(--color-text-muted)" }}>Thùng rác đang trống.</div>;
    }
    return (
      <div className="p-2 overflow-y-auto">
        {trashedNotes.map((note) => (
          <div key={note.id} className="p-3 rounded-lg mb-2 border" style={{ borderColor: "var(--color-border)" }}>
            <div className="font-medium truncate">{note.title || "(Không tiêu đề)"}</div>
            <div className="text-xs truncate mb-2" style={{ color: "var(--color-text-muted)" }}>{excerpt(note.contentHtml) || "Chưa có nội dung"}</div>
            <div className="flex gap-3 text-sm">
              <button style={{ color: "var(--color-accent)" }} onClick={() => void restoreNote(note.id)}>Khôi phục</button>
              <button style={{ color: "var(--color-error)" }} onClick={() => { if (window.confirm("Xóa vĩnh viễn ghi chú này?")) void hardDeleteNote(note.id); }}>Xóa vĩnh viễn</button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const items = searchQuery.trim() ? searchResults : notes;

  if (items.length === 0) {
    return (
      <div className="p-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
        {searchQuery.trim() ? "Không tìm thấy ghi chú nào." : "Chưa có ghi chú. Nhấn “Tạo ghi chú” để bắt đầu."}
      </div>
    );
  }

  return (
    <div className="p-2 overflow-y-auto">
      {items.map((n) => (
        <NoteRow key={n.id} note={n} active={n.id === selectedNoteId} onClick={() => selectNote(n.id)} />
      ))}
    </div>
  );
}
