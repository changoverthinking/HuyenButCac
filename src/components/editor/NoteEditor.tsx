import { useCallback, useEffect, useRef, useState } from "react";
import { useNotesStore } from "../../stores/notesStore";
import type { Note } from "../../types/entities";
import { RichTextToolbar } from "./RichTextToolbar";
import { sanitizeRichHtml } from "../../features/security/htmlSanitizer";

const AUTOSAVE_DEBOUNCE_MS = 400;

export function NoteEditor({ note }: { note: Note }) {
  const updateNote = useNotesStore((s) => s.updateNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const lockNote = useNotesStore((s) => s.lockNote);
  const closeLockedNote = useNotesStore((s) => s.closeLockedNote);
  const removeNoteLock = useNotesStore((s) => s.removeNoteLock);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInitialized = useRef(false);
  const [title, setTitle] = useState(note.title);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "idle">("saved");
  const saveTimer = useRef<number | null>(null);
  const pendingPatch = useRef<Partial<Pick<Note, "title" | "contentHtml">>>({});
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  const flushSave = useCallback((): Promise<void> => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
    const patch = { ...pendingPatch.current };
    if (Object.keys(patch).length === 0) return saveQueue.current;

    // Xếp hàng tuần tự: save cũ luôn hoàn thành trước save mới, tránh request cũ ghi đè bản gõ mới.
    const task = saveQueue.current.catch(() => undefined).then(async () => {
      await updateNote(note.id, patch);
      // Chỉ xóa đúng giá trị đã lưu; nếu người dùng gõ tiếp trong lúc await thì bản mới vẫn còn pending.
      for (const key of Object.keys(patch) as Array<keyof typeof patch>) {
        if (pendingPatch.current[key] === patch[key]) delete pendingPatch.current[key];
      }
    });
    saveQueue.current = task;
    return task;
  }, [note.id, updateNote]);

  useEffect(() => {
    const flushWhenHidden = () => { if (document.visibilityState === "hidden") void flushSave(); };
    const flushOnPageHide = () => { void flushSave(); };
    document.addEventListener("visibilitychange", flushWhenHidden);
    window.addEventListener("pagehide", flushOnPageHide);
    return () => {
      document.removeEventListener("visibilitychange", flushWhenHidden);
      window.removeEventListener("pagehide", flushOnPageHide);
      void flushSave();
    };
  }, [flushSave]);

  function scheduleSave(patch: Partial<Pick<Note, "title" | "contentHtml">>) {
    setSaveState("saving");
    pendingPatch.current = { ...pendingPatch.current, ...patch };
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await flushSave();
        setSaveState(Object.keys(pendingPatch.current).length === 0 ? "saved" : "saving");
      } catch { setSaveState("idle"); }
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center gap-2 px-4 py-2 border-b flex-wrap"
        style={{ borderColor: "var(--color-border)" }}
      >
        <RichTextToolbar editorRef={editorRef} compact onFormat={() => scheduleSave({ contentHtml: editorRef.current?.innerHTML ?? "" })} />
        {note.locked ? (
          <>
            <button type="button" className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--color-border)" }} onClick={async()=>{await flushSave();await closeLockedNote(note.id);}}>🔒 Khóa lại</button>
            <button type="button" className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--color-border)" }} onClick={async()=>{if(!window.confirm("Bỏ khóa ghi chú? Nội dung sẽ được lưu lại dạng thường trong IndexedDB của workspace hiện tại."))return;await flushSave();await removeNoteLock(note.id);}}>Bỏ khóa</button>
          </>
        ) : (
          <button type="button" className="rounded-lg border px-2 py-1 text-xs" style={{ borderColor: "var(--color-border)" }} onClick={async()=>{
            await flushSave();
            const password=window.prompt("Tạo mật khẩu cho ghi chú (ít nhất 8 ký tự):")??"";
            if(!password)return;
            const confirmPassword=window.prompt("Nhập lại mật khẩu ghi chú:")??"";
            if(password!==confirmPassword){window.alert("Hai mật khẩu chưa giống nhau.");return;}
            try{await lockNote(note.id,password);}catch(error){window.alert((error as Error).message);}
          }}>🔒 Khóa ghi chú</button>
        )}
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
        ref={(node)=>{editorRef.current=node;if(node&&!editorInitialized.current){node.innerHTML=sanitizeRichHtml(note.contentHtml);editorInitialized.current=true;}}}
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
