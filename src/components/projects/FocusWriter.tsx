import { useEffect, useRef, useState } from "react";
import { useProjectsStore } from "../../stores/projectsStore";
import type { ProjectChapter } from "../../types/entities";

export function FocusWriter({ chapter, onExit }: { chapter: ProjectChapter; onExit: () => void }) {
  const updateChapter = useProjectsStore((s) => s.updateChapter);
  const editorRef = useRef<HTMLDivElement>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [sessionStart] = useState(() => Date.now());
  const [elapsedSec, setElapsedSec] = useState(0);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = chapter.contentHtml;
  }, [chapter.id]);

  useEffect(() => {
    const t = setInterval(() => setElapsedSec(Math.floor((Date.now() - sessionStart) / 1000)), 1000);
    return () => clearInterval(t);
  }, [sessionStart]);

  function scheduleSave() {
    setSaveState("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      await updateChapter(chapter.id, { contentHtml: editorRef.current?.innerHTML ?? "" });
      setSaveState("saved");
    }, 400);
  }

  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: "var(--color-editor-bg)" }}>
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <button onClick={onExit} className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          ← Thoát chế độ tập trung
        </button>
        <div className="text-sm flex gap-4" style={{ color: "var(--color-text-muted)" }}>
          <span>{chapter.wordCount} từ</span>
          <span>
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
          <span>{saveState === "saving" ? "Đang lưu…" : "Đã lưu"}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div
          ref={editorRef}
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
