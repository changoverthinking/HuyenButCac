import { useCallback, useEffect, useRef, useState } from "react";
import { useNotesStore } from "../../stores/notesStore";
import type { Note } from "../../types/entities";
import { RichTextToolbar } from "./RichTextToolbar";

const AUTOSAVE_DEBOUNCE_MS = 400;

export function NoteEditor({ note }: { note: Note }) {
  const updateNote = useNotesStore((s) => s.updateNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInitialized = useRef(false);
  const [title, setTitle] = useState(note.title);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "idle">("saved");
  const saveTimer = useRef<number | null>(null);
  const pendingPatch = useRef<Partial<Pick<Note, "title" | "contentHtml">>>({});

  const flushSave = useCallback(async () => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
    const patch = pendingPatch.current;
    pendingPatch.current = {};
    if (Object.keys(patch).length === 0) return;
    await updateNote(note.id, patch);
  }, [note.id, updateNote]);

  useEffect(() => () => {
    void flushSave();
  }, [flushSave]);

  function scheduleSave(patch: Partial<Pick<Note, "title" | "contentHtml">>) {
    setSaveState("saving");
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try { await flushSave(); setSaveState("saved"); }
      catch { setSaveState("idle"); }
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
          {saveState === "saving" ? "Đang lưu…" : saveState === "idle" ? "Lưu chưa thành công" : "Đã lưu"}
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
        ref={(node)=>{editorRef.current=node;if(node&&!editorInitialized.current){node.innerHTML=note.contentHtml;editorInitialized.current=true;}}}
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
