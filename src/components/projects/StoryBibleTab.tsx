import { useEffect, useMemo, useState } from "react";
import { useProjectsStore } from "../../stores/projectsStore";
import { exportContextPackMarkdown } from "../../features/projects/projectsService";
import { STORY_LOCATION_KIND_LABEL } from "../../features/projects/storyBibleService";
import type { StoryLocationKind } from "../../types/entities";
import { Icon } from "../common/Icons";

const LOCATION_KIND_LABEL: Record<StoryLocationKind, string> = STORY_LOCATION_KIND_LABEL;

function FieldInput({
  value,
  placeholder,
  onCommit,
  className = "",
  multiline = false,
}: {
  value: string;
  placeholder: string;
  onCommit: (next: string) => void;
  className?: string;
  multiline?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const commonProps = {
    value: draft,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: () => {
      if (draft !== value) onCommit(draft);
    },
    className: `w-full bg-transparent outline-none text-sm px-2 py-1.5 rounded border ${className}`,
    style: { borderColor: "var(--color-border)", color: "var(--color-text)" },
  };
  if (multiline) return <textarea {...commonProps} rows={2} />;
  return <input {...commonProps} />;
}

function CharactersPanel() {
  const characters = useProjectsStore((s) => s.characters);
  const createCharacter = useProjectsStore((s) => s.createCharacter);
  const updateCharacter = useProjectsStore((s) => s.updateCharacter);
  const deleteCharacter = useProjectsStore((s) => s.deleteCharacter);
  const [name, setName] = useState("");

  return (
    <div>
      <form
        className="story-entry-form flex flex-wrap gap-2 mb-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          await createCharacter(name.trim());
          setName("");
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên nhân vật mới…"
          className="min-w-[12rem] flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
        />
        <button type="submit" className="px-3 py-2 rounded-lg text-sm font-medium icon-label" style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}>
          <Icon name="plus" size={15} /> Nhân vật
        </button>
      </form>

      {characters.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Chưa có nhân vật nào. Thêm nhân vật để AI/bạn không quên ngoại hình, cảnh giới, tính cách khi viết các chương sau.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {characters.map((c) => (
          <div key={c.id} className="codex-card p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <FieldInput value={c.name} placeholder="Tên" onCommit={(v) => updateCharacter(c.id, { name: v })} className="font-semibold" />
              <button
                className="text-xs shrink-0 px-2 py-1"
                style={{ color: "var(--color-error)" }}
                onClick={() => { if (window.confirm(`Xóa nhân vật "${c.name}"?`)) void deleteCharacter(c.id); }}
              >
                Xóa
              </button>
            </div>
            <div className="grid gap-1.5 text-xs">
              <label style={{ color: "var(--color-text-muted)" }}>Biệt hiệu / đạo hiệu
                <FieldInput value={c.aliasNames} placeholder="vd: Vân Nhi, Thanh Y Kiếm Tiên…" onCommit={(v) => updateCharacter(c.id, { aliasNames: v })} />
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <label style={{ color: "var(--color-text-muted)" }}>Vai trò
                  <FieldInput value={c.role} placeholder="chính diện / phản diện…" onCommit={(v) => updateCharacter(c.id, { role: v })} />
                </label>
                <label style={{ color: "var(--color-text-muted)" }}>Cảnh giới hiện tại
                  <FieldInput value={c.realm} placeholder="vd: Trúc Cơ kỳ" onCommit={(v) => updateCharacter(c.id, { realm: v })} />
                </label>
              </div>
              <label style={{ color: "var(--color-text-muted)" }}>Ngoại hình
                <FieldInput value={c.appearance} placeholder="…" onCommit={(v) => updateCharacter(c.id, { appearance: v })} multiline />
              </label>
              <label style={{ color: "var(--color-text-muted)" }}>Tính cách
                <FieldInput value={c.personality} placeholder="…" onCommit={(v) => updateCharacter(c.id, { personality: v })} multiline />
              </label>
              <label style={{ color: "var(--color-text-muted)" }}>Mối quan hệ
                <FieldInput value={c.relationships} placeholder="…" onCommit={(v) => updateCharacter(c.id, { relationships: v })} multiline />
              </label>
              <label style={{ color: "var(--color-text-muted)" }}>Ghi chú
                <FieldInput value={c.notes} placeholder="…" onCommit={(v) => updateCharacter(c.id, { notes: v })} multiline />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorldPanel() {
  const locations = useProjectsStore((s) => s.locations);
  const createLocation = useProjectsStore((s) => s.createLocation);
  const updateLocation = useProjectsStore((s) => s.updateLocation);
  const deleteLocation = useProjectsStore((s) => s.deleteLocation);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<StoryLocationKind>("era");
  const [filter, setFilter] = useState<StoryLocationKind | "all">("all");
  const [query, setQuery] = useState("");
  const filteredLocations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return locations.filter((location) => {
      const matchesKind = filter === "all" || location.kind === filter;
      const matchesQuery = !normalizedQuery
        || location.name.toLocaleLowerCase().includes(normalizedQuery)
        || location.description.toLocaleLowerCase().includes(normalizedQuery);
      return matchesKind && matchesQuery;
    });
  }, [filter, locations, query]);

  return (
    <div>
      <form
        className="story-entry-form flex flex-wrap gap-2 mb-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          await createLocation(name.trim(), kind);
          setName("");
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên bối cảnh / địa danh / cảnh giới / thế lực…"
          className="min-w-[12rem] flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as StoryLocationKind)}
          className="px-2 py-2 rounded-lg border text-sm"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
        >
          {Object.entries(LOCATION_KIND_LABEL).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>
        <button type="submit" className="px-3 py-2 rounded-lg text-sm font-medium icon-label" style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}>
          <Icon name="plus" size={15} /> Thêm
        </button>
      </form>

      {locations.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Chưa có bối cảnh, địa danh, cảnh giới hay thế lực nào. Hãy tách riêng các kỷ nguyên khỏi địa danh để thế giới nhiều thời đại không bị lẫn.
        </p>
      )}

      {locations.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <select
            aria-label="Lọc loại mục thế giới"
            value={filter}
            onChange={(event) => setFilter(event.target.value as StoryLocationKind | "all")}
            className="px-2 py-2 rounded-lg border text-sm"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
          >
            <option value="all">Tất cả loại ({locations.length})</option>
            {Object.entries(LOCATION_KIND_LABEL).map(([key, label]) => (
              <option key={key} value={key}>{label} ({locations.filter((location) => location.kind === key).length})</option>
            ))}
          </select>
          {locations.length > 6 && (
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm trong thế giới…"
              aria-label="Tìm trong các mục thế giới"
              className="min-w-[12rem] flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
            />
          )}
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Hiển thị {filteredLocations.length}/{locations.length}
          </span>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {filteredLocations.map((l) => (
          <div key={l.id} className="codex-card p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <FieldInput value={l.name} placeholder="Tên" onCommit={(v) => updateLocation(l.id, { name: v })} className="font-semibold" />
              </div>
              <select
                aria-label={`Loại của ${l.name}`}
                value={l.kind}
                onChange={(event) => updateLocation(l.id, { kind: event.target.value as StoryLocationKind })}
                className="text-[10px] px-2 py-1 rounded shrink-0 border"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)", color: "var(--color-accent)" }}
              >
                {Object.entries(LOCATION_KIND_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <button
                className="text-xs shrink-0"
                style={{ color: "var(--color-error)" }}
                onClick={() => { if (window.confirm(`Xóa "${l.name}"?`)) void deleteLocation(l.id); }}
              >
                Xóa
              </button>
            </div>
            <FieldInput value={l.description} placeholder="Mô tả…" onCommit={(v) => updateLocation(l.id, { description: v })} multiline />
          </div>
        ))}
      </div>
      {locations.length > 0 && filteredLocations.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Không có mục nào khớp bộ lọc hiện tại.</p>
      )}
    </div>
  );
}

function LorePanel() {
  const loreEntries = useProjectsStore((s) => s.loreEntries);
  const createLoreEntry = useProjectsStore((s) => s.createLoreEntry);
  const updateLoreEntry = useProjectsStore((s) => s.updateLoreEntry);
  const deleteLoreEntry = useProjectsStore((s) => s.deleteLoreEntry);
  const [term, setTerm] = useState("");

  return (
    <div>
      <form
        className="story-entry-form flex flex-wrap gap-2 mb-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!term.trim()) return;
          await createLoreEntry(term.trim());
          setTerm("");
        }}
      >
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Thuật ngữ mới (vd: Kim Đan, Tinh Bàn…)"
          className="min-w-[12rem] flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
        />
        <button type="submit" className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}>
          + Thuật ngữ
        </button>
      </form>

      {loreEntries.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Chưa có thuật ngữ nào. Dùng mục này cho hệ thống tu luyện, vật phẩm, quy tắc đặc biệt của thế giới truyện.
        </p>
      )}

      <div className="grid gap-2">
        {loreEntries.map((l) => (
          <div key={l.id} className="codex-card p-3 flex flex-col gap-3 items-stretch sm:flex-row sm:items-start">
            <div className="w-full sm:w-40 sm:shrink-0">
              <FieldInput value={l.term} placeholder="Thuật ngữ" onCommit={(v) => updateLoreEntry(l.id, { term: v })} className="font-semibold" />
            </div>
            <div className="flex-1">
              <FieldInput value={l.definition} placeholder="Định nghĩa / diễn giải…" onCommit={(v) => updateLoreEntry(l.id, { definition: v })} multiline />
            </div>
            <button
              className="text-xs shrink-0"
              style={{ color: "var(--color-error)" }}
              onClick={() => { if (window.confirm(`Xóa thuật ngữ "${l.term}"?`)) void deleteLoreEntry(l.id); }}
            >
              Xóa
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelinePanel() {
  const timelineEvents = useProjectsStore((s) => s.timelineEvents);
  const chapters = useProjectsStore((s) => s.chapters);
  const createTimelineEvent = useProjectsStore((s) => s.createTimelineEvent);
  const updateTimelineEvent = useProjectsStore((s) => s.updateTimelineEvent);
  const deleteTimelineEvent = useProjectsStore((s) => s.deleteTimelineEvent);
  const [title, setTitle] = useState("");

  return (
    <div>
      <form
        className="story-entry-form flex flex-wrap gap-2 mb-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          await createTimelineEvent(title.trim());
          setTitle("");
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sự kiện mới trong dòng thời gian…"
          className="min-w-[12rem] flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
        />
        <button type="submit" className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--color-accent)", color: "var(--color-bg)" }}>
          + Sự kiện
        </button>
      </form>

      {timelineEvents.length === 0 && (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Chưa có mốc nào. Ghi lại các bước ngoặt lớn để tránh mâu thuẫn thời gian giữa các chương.
        </p>
      )}

      <ol className="relative pl-5">
        {timelineEvents.map((ev, i) => (
          <li key={ev.id} className="codex-card p-3 mb-3 ml-1">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-xs shrink-0" style={{ color: "var(--color-accent)" }}>#{i + 1}</span>
              <div className="flex-1">
                <FieldInput value={ev.title} placeholder="Tên sự kiện" onCommit={(v) => updateTimelineEvent(ev.id, { title: v })} className="font-semibold" />
              </div>
              <button
                className="text-xs shrink-0"
                style={{ color: "var(--color-error)" }}
                onClick={() => { if (window.confirm(`Xóa sự kiện "${ev.title}"?`)) void deleteTimelineEvent(ev.id); }}
              >
                Xóa
              </button>
            </div>
            <FieldInput value={ev.summary} placeholder="Tóm tắt sự kiện…" onCommit={(v) => updateTimelineEvent(ev.id, { summary: v })} multiline />
            <select
              value={ev.chapterId ?? ""}
              onChange={(e) => updateTimelineEvent(ev.id, { chapterId: e.target.value || null })}
              className="mt-1.5 text-xs px-2 py-1 rounded border"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-muted)" }}
            >
              <option value="">— Liên kết chương (tùy chọn) —</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function StoryBibleTab({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const [sub, setSub] = useState<"characters" | "world" | "lore" | "timeline">("characters");

  return (
    <div className="story-bible-view p-4">
      <div className="story-bible-tabs flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="codex-subtabs">
          {[
            { id: "characters", label: "Nhân vật", icon: "user" as const },
            { id: "world", label: "Thế giới", icon: "whiteboard" as const },
            { id: "lore", label: "Từ điển", icon: "scroll" as const },
            { id: "timeline", label: "Dòng thời gian", icon: "clock" as const },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSub(t.id as typeof sub)}
              className={`codex-subtab ${sub === t.id ? "is-active" : ""}`}
            >
              <Icon name={t.icon} size={15} /> {t.label}
            </button>
          ))}
        </div>
        <button
          className="story-export-button text-xs px-3 py-1.5 rounded"
          style={{ background: "var(--color-surface-alt)", color: "var(--color-text)" }}
          onClick={async () => {
            const md = await exportContextPackMarkdown(projectId);
            const blob = new Blob([md], { type: "text/markdown" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${projectTitle}-goi-ngu-canh.md`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          title="Xuất Thư Viện Truyện + tóm tắt chương để dán vào AI, giúp AI không quên mạch truyện"
        >
          <Icon name="export" size={15} /> Xuất gói ngữ cảnh AI
        </button>
      </div>
      <div className="scroll-divider">THƯ VIỆN TRUYỆN</div>
      {sub === "characters" && <CharactersPanel />}
      {sub === "world" && <WorldPanel />}
      {sub === "lore" && <LorePanel />}
      {sub === "timeline" && <TimelinePanel />}
    </div>
  );
}
