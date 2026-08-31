import { useCallback, useEffect, useRef, useState } from "react";
import { useProjectsStore } from "../../stores/projectsStore";
import type { ProjectChapter } from "../../types/entities";
import { RichTextToolbar } from "../editor/RichTextToolbar";
import { sanitizeRichHtml } from "../../features/security/htmlSanitizer";

export function FocusWriter({ chapter, onExit }: { chapter: ProjectChapter; onExit: () => void }) {
  const updateChapter = useProjectsStore((s) => s.updateChapter);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInitialized = useRef(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [sessionStart] = useState(() => Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);
  const [liveWordCount, setLiveWordCount] = useState(chapter.wordCount);
  const saveTimer = useRef<number | null>(null);
  const pendingHtml = useRef(chapter.contentHtml);
  const lastSavedHtml = useRef(chapter.contentHtml);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  const flushSave = useCallback((): Promise<void> => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
    const htmlToSave = pendingHtml.current;
    if (htmlToSave === lastSavedHtml.current) return saveQueue.current;

    const task = saveQueue.current.catch(() => undefined).then(async () => {
      await updateChapter(chapter.id, { contentHtml: htmlToSave });
      // Queue bảo đảm save cũ không thể chạy sau và ghi đè save mới.
      lastSavedHtml.current = htmlToSave;
    });
    saveQueue.current = task;
    return task;
  }, [chapter.id, updateChapter]);

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

  useEffect(() => {
    const t = setInterval(() => setElapsedSec(Math.floor((Date.now() - sessionStart) / 1000)), 1000);
    return () => clearInterval(t);
  }, [sessionStart]);

  function scheduleSave() {
    setSaveState("saving");
    pendingHtml.current = editorRef.current?.innerHTML ?? "";
    setLiveWordCount((editorRef.current?.innerText ?? "").trim().split(/\s+/).filter(Boolean).length);
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await flushSave();
        setSaveState(pendingHtml.current === lastSavedHtml.current ? "saved" : "saving");
      } catch { setSaveState("saving"); }
    }, 400);
  }

  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;
  return (
    <div className="focus-writer fixed inset-0 z-[60] flex flex-col" style={{ background: "var(--color-editor-bg)" }}>
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <button onClick={async () => { try { await flushSave(); setSaveState("saved"); onExit(); } catch { setSaveState("saving"); } }} className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          ← Thoát chế độ tập trung
        </button>
        <div className="text-sm flex gap-4" style={{ color: "var(--color-text-muted)" }}>
          <span>{liveWordCount.toLocaleString("vi-VN")} từ</span>
          <span>
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
          <span>{saveState === "saving" ? "Đang lưu…" : "Đã lưu"}</span>
        </div>
      </div>
      <div className="border-b overflow-x-auto" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <RichTextToolbar editorRef={editorRef} onFormat={scheduleSave} />
      </div>
      {liveWordCount > 20000 && (
        <div className="px-6 py-2 text-xs text-center" style={{ color: "var(--color-warning)", background: "var(--color-surface-alt)" }}>
          Chương này đã vượt 20.000 từ. Nên tách thành chương mới để mở và lưu nhanh hơn; toàn bộ tiểu thuyết vẫn có thể chứa hàng trăm nghìn từ.
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <div
          ref={(node)=>{editorRef.current=node;if(node&&!editorInitialized.current){node.innerHTML=sanitizeRichHtml(chapter.contentHtml);editorInitialized.current=true;}}}
          className="hbc-editor max-w-[68ch] mx-auto py-16 px-6 text-lg leading-relaxed"
          style={{ color: "var(--color-text)" }}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Bắt đầu viết chương này…"
          onInput={scheduleSave}
        />
      </div>
    </div>
  );
}
