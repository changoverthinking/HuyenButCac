import { useEffect, useState } from "react";
import { useProjectsStore } from "../../stores/projectsStore";
import { exportProjectMarkdown } from "../../features/projects/projectsService";
import type { ProjectKind } from "../../types/entities";
import { FocusWriter } from "./FocusWriter";
import { KanbanBoard } from "./KanbanBoard";

const KIND_LABEL: Record<ProjectKind, string> = {
  software: "Phần mềm",
  game: "Game",
  construction: "Công trình",
  generic: "Chung",
};

function ProjectPicker() {
  const projects = useProjectsStore((s) => s.projects);
  const loadProjects = useProjectsStore((s) => s.loadProjects);
  const createProject = useProjectsStore((s) => s.createProject);
  const selectProject = useProjectsStore((s) => s.selectProject);
  const deleteProject = useProjectsStore((s) => s.deleteProject);
  const updateProject = useProjectsStore((s) => s.updateProject);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ProjectKind>("software");

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--color-text)" }}>
        Dự án của bạn
      </h2>

      <form
        className="flex gap-2 mb-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          await createProject(title.trim(), kind);
          setTitle("");
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tên dự án mới…"
          className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as ProjectKind)}
          className="px-2 py-2 rounded-lg border text-sm"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
        >
          {Object.entries(KIND_LABEL).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
        >
          Tạo
        </button>
      </form>

      <div className="grid gap-2">
        {projects.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Chưa có dự án nào. Tạo dự án đầu tiên ở trên.
          </p>
        )}
        {projects.map((p) => (
          <div key={p.id} className="flex items-center gap-2 p-3 rounded-lg border" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            <button onClick={() => selectProject(p.id)} className="text-left flex-1 min-w-0">
              <div className="font-medium truncate" style={{ color: "var(--color-text)" }}>{p.title}</div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{KIND_LABEL[p.kind]} · {p.status}</div>
            </button>
            <button className="text-xs" onClick={async()=>{const title=window.prompt("Đổi tên dự án:",p.title)?.trim();if(title)await updateProject(p.id,{title});}}>Đổi tên</button>
            <button className="text-xs" style={{color:"var(--color-error)"}} onClick={()=>{if(window.confirm(`Xóa dự án “${p.title}” và toàn bộ chương?`))void deleteProject(p.id);}}>Xóa</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OutlineTab() {
  const sections = useProjectsStore((s) => s.sections);
  const chapters = useProjectsStore((s) => s.chapters);
  const createSection = useProjectsStore((s) => s.createSection);
  const createChapter = useProjectsStore((s) => s.createChapter);
  const selectChapter = useProjectsStore((s) => s.selectChapter);
  const deleteChapter = useProjectsStore((s) => s.deleteChapter);
  const [sectionTitle, setSectionTitle] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");

  const rootChapters = chapters.filter((c) => c.sectionId === null);

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-3">
        <input
          value={chapterTitle}
          onChange={(e) => setChapterTitle(e.target.value)}
          placeholder="Tên chương mới (không thuộc phần)…"
          className="flex-1 px-2 py-1.5 rounded border text-sm"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
        />
        <button
          onClick={async () => {
            if (!chapterTitle.trim()) return;
            await createChapter(chapterTitle.trim(), null);
            setChapterTitle("");
          }}
          className="px-3 py-1.5 rounded text-sm"
          style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
        >
          + Chương
        </button>
      </div>

      <ul className="mb-4">
        {rootChapters.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-2 py-1.5 rounded hover:opacity-90"
            style={{ background: "var(--color-surface)" }}>
            <button className="text-left flex-1 text-sm" style={{ color: "var(--color-text)" }} onClick={() => selectChapter(c.id)}>
              {c.title} <span style={{ color: "var(--color-text-muted)" }}>· {c.wordCount} từ</span>
            </button>
            <button onClick={() => { if(window.confirm(`Xóa chương “${c.title}”?`)) void deleteChapter(c.id); }} className="text-xs" style={{ color: "var(--color-error)" }}>
              Xóa
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 mb-3">
        <input
          value={sectionTitle}
          onChange={(e) => setSectionTitle(e.target.value)}
          placeholder="Tên phần mới…"
          className="flex-1 px-2 py-1.5 rounded border text-sm"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
        />
        <button
          onClick={async () => {
            if (!sectionTitle.trim()) return;
            await createSection(sectionTitle.trim());
            setSectionTitle("");
          }}
          className="px-3 py-1.5 rounded text-sm"
          style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}
        >
          + Phần
        </button>
      </div>

      {sections.map((s) => (
        <div key={s.id} className="mb-3">
          <div className="text-sm font-semibold mb-1" style={{ color: "var(--color-accent)" }}>
            📖 {s.title}
          </div>
          <ul className="pl-4">
            {chapters
              .filter((c) => c.sectionId === s.id)
              .map((c) => (
                <li key={c.id} className="flex items-center justify-between px-2 py-1.5 rounded"
                  style={{ background: "var(--color-surface)" }}>
                  <button className="text-left flex-1 text-sm" style={{ color: "var(--color-text)" }} onClick={() => selectChapter(c.id)}>
                    {c.title} <span style={{ color: "var(--color-text-muted)" }}>· {c.wordCount} từ</span>
                  </button>
                  <button onClick={() => { if(window.confirm(`Xóa chương “${c.title}”?`)) void deleteChapter(c.id); }} className="text-xs" style={{ color: "var(--color-error)" }}>
                    Xóa
                  </button>
                </li>
              ))}
          </ul>
          <button
            onClick={async () => {
              const t = prompt("Tên chương mới trong phần này:");
              if (t?.trim()) await createChapter(t.trim(), s.id);
            }}
            className="text-xs ml-4 mt-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            + Thêm chương vào phần
          </button>
        </div>
      ))}
    </div>
  );
}

export function ProjectsView() {
  const selectedProjectId = useProjectsStore((s) => s.selectedProjectId);
  const selectProject = useProjectsStore((s) => s.selectProject);
  const selectedChapterId = useProjectsStore((s) => s.selectedChapterId);
  const chapters = useProjectsStore((s) => s.chapters);
  const projects = useProjectsStore((s) => s.projects);
  const selectChapter = useProjectsStore((s) => s.selectChapter);
  const [tab, setTab] = useState<"outline" | "kanban" | "milestones">("outline");

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);

  if (!selectedProjectId) return <ProjectPicker />;

  if (selectedChapter) {
    return <FocusWriter chapter={selectedChapter} onExit={() => selectChapter(null)} />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <button onClick={() => selectProject(null)} className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          ← Danh sách dự án
        </button>
        <h2 className="font-semibold" style={{ color: "var(--color-text)" }}>
          {selectedProject?.title}
        </h2>
        <button
          onClick={async () => {
            const md = await exportProjectMarkdown(selectedProjectId);
            const blob = new Blob([md], { type: "text/markdown" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${selectedProject?.title ?? "du-an"}.md`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="text-sm px-3 py-1.5 rounded"
          style={{ background: "var(--color-surface-alt)", color: "var(--color-text)" }}
        >
          Xuất Markdown
        </button>
      </div>

      <div className="flex gap-1 px-4 pt-2 border-b" style={{ borderColor: "var(--color-border)" }}>
        {[
          { id: "outline", label: "Dàn ý" },
          { id: "kanban", label: "Kanban" },
          { id: "milestones", label: "Milestone" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className="px-3 py-2 text-sm rounded-t-lg"
            style={{
              background: tab === t.id ? "var(--color-surface)" : "transparent",
              color: tab === t.id ? "var(--color-accent)" : "var(--color-text-muted)",
              borderBottom: tab === t.id ? "2px solid var(--color-accent)" : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "outline" && <OutlineTab />}
        {tab === "kanban" && <KanbanBoard />}
        {tab === "milestones" && <MilestonesTab />}
      </div>
    </div>
  );
}

function MilestonesTab() {
  const milestones = useProjectsStore((s) => s.milestones);
  const createMilestone = useProjectsStore((s) => s.createMilestone);
  const toggleMilestone = useProjectsStore((s) => s.toggleMilestone);
  const [title, setTitle] = useState("");

  return (
    <div className="p-4">
      <form
        className="flex gap-2 mb-3"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          await createMilestone(title.trim(), null);
          setTitle("");
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Milestone mới…"
          className="flex-1 px-2 py-1.5 rounded border text-sm"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
        />
        <button type="submit" className="px-3 py-1.5 rounded text-sm" style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}>
          + Thêm
        </button>
      </form>
      <ul>
        {milestones.map((m) => (
          <li key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded mb-1" style={{ background: "var(--color-surface)" }}>
            <input type="checkbox" checked={m.done} onChange={(e) => toggleMilestone(m.id, e.target.checked)} />
            <span
              style={{
                color: m.done ? "var(--color-text-muted)" : "var(--color-text)",
                textDecoration: m.done ? "line-through" : "none",
              }}
            >
              {m.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
