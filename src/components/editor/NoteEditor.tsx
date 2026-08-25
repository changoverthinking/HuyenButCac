import { useEffect, useRef, useState } from "react";
import { useNotesStore } from "../../stores/notesStore";
import type { Note } from "../../types/entities";

const AUTOSAVE_DEBOUNCE_MS = 400;

function EditorToolbarButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // giữ selection khi bấm toolbar
      onClick={onClick}
      className="px-2 py-1 rounded text-sm border"
      style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
    >
      {label}
    </button>
  );
}

export function NoteEditor({ note }: { note: Note }) {
  const updateNote = useNotesStore((s) => s.updateNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(note.title);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "idle">("saved");
  const saveTimer = useRef<number | null>(null);

  // Nạp nội dung khi đổi ghi chú được chọn
  useEffect(() => {
    setTitle(note.title);
    if (editorRef.current) {
      editorRef.current.innerHTML = note.contentHtml;
    }
    setSaveState("saved");
  }, [note.id]);

  function scheduleSave(patch: Partial<Pick<Note, "title" | "contentHtml">>) {
    setSaveState("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      await updateNote(note.id, patch);
      setSaveState("saved");
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  function exec(command: string) {
    document.execCommand(command);
    editorRef.current?.focus();
    scheduleSave({ contentHtml: editorRef.current?.innerHTML ?? "" });
  }

  function formatBlock(tag: string) {
    document.execCommand("formatBlock", false, tag);
    editorRef.current?.focus();
    scheduleSave({ contentHtml: editorRef.current?.innerHTML ?? "" });
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center gap-2 px-4 py-2 border-b flex-wrap"
        style={{ borderColor: "var(--color-border)" }}
      >
        <EditorToolbarButton label="H1" onClick={() => formatBlock("H1")} />
        <EditorToolbarButton label="H2" onClick={() => formatBlock("H2")} />
        <EditorToolbarButton label="B" onClick={() => exec("bold")} />
        <EditorToolbarButton label="I" onClick={() => exec("italic")} />
        <EditorToolbarButton label="U" onClick={() => exec("underline")} />
        <EditorToolbarButton label="• List" onClick={() => exec("insertUnorderedList")} />
        <EditorToolbarButton label="1. List" onClick={() => exec("insertOrderedList")} />
        <EditorToolbarButton label="❝ Quote" onClick={() => formatBlock("BLOCKQUOTE")} />
        <span
          className="ml-auto text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          {saveState === "saving" ? "Đang lưu…" : "Đã lưu"}
        </span>
      </div>

      <div className="px-6 pt-4">
        <input
          className="w-full bg-transparent text-2xl font-semibold outline-none"
          style={{ color: "var(--color-text)" }}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            scheduleSave({ title: e.target.value });
          }}
          placeholder="Tiêu đề ghi chú"
        />
      </div>

      <div
        ref={editorRef}
        className="hbc-editor flex-1 px-6 py-4 overflow-y-auto max-w-[70ch]"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Bắt đầu viết…"
        onInput={() => scheduleSave({ contentHtml: editorRef.current?.innerHTML ?? "" })}
      />

      <div className="px-6 py-2 border-t" style={{ borderColor: "var(--color-border)" }}>
        <button
          type="button"
          className="text-sm"
          style={{ color: "var(--color-error)" }}
          onClick={() => deleteNote(note.id)}
        >
          Chuyển vào thùng rác
        </button>
      </div>
    </div>
  );
}
