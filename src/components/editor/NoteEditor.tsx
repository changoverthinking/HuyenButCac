import { useEffect, useRef, useState } from "react";
import { useNotesStore } from "../../stores/notesStore";
import type { Note } from "../../types/entities";
import { RichTextToolbar } from "./RichTextToolbar";

const AUTOSAVE_DEBOUNCE_MS = 400;

export function NoteEditor({ note }: { note: Note }) {
  const updateNote = useNotesStore((s) => s.updateNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(note.title);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "idle">("saved");
  const saveTimer = useRef<number | null>(null);
  const pendingPatch = useRef<Partial<Pick<Note, "title" | "contentHtml">>>({});
  const noteIdRef = useRef(note.id);

  const flushSave = async () => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
    const patch = pendingPatch.current;
    pendingPatch.current = {};
    if (Object.keys(patch).length === 0) return;
    await updateNote(noteIdRef.current, patch);
  };

  // Nạp nội dung khi đổi ghi chú được chọn
  useEffect(() => {
    noteIdRef.current = note.id;
    setTitle(note.title);
    if (editorRef.current) {
      editorRef.current.innerHTML = note.contentHtml;
    }
    setSaveState("saved");
  }, [note.id]);

  useEffect(() => () => {
    void flushSave();
  }, []);

  function scheduleSave(patch: Partial<Pick<Note, "title" | "contentHtml">>) {
    setSaveState("saving");
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      await flushSave();
      setSaveState("saved");
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center gap-2 px-4 py-2 border-b flex-wrap"
        style={{ borderColor: "var(--color-border)" }}
      >
        <RichTextToolbar editorRef={editorRef} compact onFormat={() => scheduleSave({ contentHtml: editorRef.current?.innerHTML ?? "" })} />
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
