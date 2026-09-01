import { useState } from "react";
import { useProjectsStore } from "../../stores/projectsStore";
import type { ProjectTaskStatus } from "../../types/entities";

const COLUMNS: { status: ProjectTaskStatus; label: string }[] = [
  { status: "todo", label: "TODO" },
  { status: "doing", label: "Đang làm" },
  { status: "review", label: "Kiểm tra" },
  { status: "done", label: "Hoàn thành" },
  { status: "blocked", label: "Bị chặn" },
];

export function KanbanBoard() {
  const tasks = useProjectsStore((s) => s.tasks);
  const createTask = useProjectsStore((s) => s.createTask);
  const updateTaskStatus = useProjectsStore((s) => s.updateTaskStatus);
  const deleteTask = useProjectsStore((s) => s.deleteTask);
  const [newTitle, setNewTitle] = useState("");

  return (
    <div className="flex flex-col h-full">
      <form
        className="flex gap-2 p-3 border-b"
        style={{ borderColor: "var(--color-border)" }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!newTitle.trim()) return;
          await createTask(newTitle.trim());
          setNewTitle("");
        }}
      >
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Thêm nhiệm vụ mới…"
          className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
        />
        <button
          type="submit"
          className="px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
        >
          + Thêm
        </button>
      </form>

      <div className="flex-1 flex gap-3 p-3 overflow-x-auto">
        {COLUMNS.map((col) => (
          <div
            key={col.status}
            className="min-w-[220px] w-60 shrink-0 rounded-lg border p-2 flex flex-col"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          >
            <div className="text-xs font-semibold uppercase mb-2 px-1" style={{ color: "var(--color-text-muted)" }}>
              {col.label} ({tasks.filter((t) => t.status === col.status).length})
            </div>
            <div className="flex-1 space-y-1.5 overflow-y-auto">
              {tasks
                .filter((t) => t.status === col.status)
                .map((t) => (
                  <div
                    key={t.id}
                    className="rounded-md px-2 py-2 text-sm"
                    style={{ background: "var(--color-surface-alt)", color: "var(--color-text)" }}
                  >
                    <div className="mb-1.5">{t.title}</div>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={t.status}
                        onChange={(e) => void updateTaskStatus(t.id, e.target.value as ProjectTaskStatus)}
                        className="min-w-0 flex-1 text-xs rounded px-1 py-1 border"
                        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.status} value={c.status}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        aria-label={`Xóa nhiệm vụ ${t.title}`}
                        title="Xóa nhiệm vụ"
                        className="shrink-0 rounded px-2 py-1 text-xs"
                        style={{ color: "var(--color-error)", background: "var(--color-surface)" }}
                        onClick={() => {
                          if (window.confirm(`Xóa nhiệm vụ “${t.title}”?`)) void deleteTask(t.id);
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
