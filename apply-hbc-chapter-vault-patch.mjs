import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = {
  service: path.join(root, 'src/features/projects/projectsService.ts'),
  store: path.join(root, 'src/stores/projectsStore.ts'),
  view: path.join(root, 'src/components/projects/ProjectsView.tsx'),
  account: path.join(root, 'src/components/auth/AccountPanel.tsx'),
  tests: path.join(root, 'src/tests/projectsService.test.ts'),
};

function mustRead(file) {
  if (!fs.existsSync(file)) throw new Error(`Không tìm thấy file: ${path.relative(root, file)}. Hãy chạy script tại thư mục gốc HuyenButCac.`);
  return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

function backup(file, original) {
  const backupFile = `${file}.bak-chapter-vault`;
  if (!fs.existsSync(backupFile)) fs.writeFileSync(backupFile, original, 'utf8');
}

function replaceOnce(text, oldText, newText, label) {
  const index = text.indexOf(oldText);
  if (index < 0) throw new Error(`Không tìm thấy mốc vá: ${label}. Repo có thể đã thay đổi so với bản main 2026-09-03.`);
  if (text.indexOf(oldText, index + oldText.length) >= 0) throw new Error(`Mốc vá không duy nhất: ${label}. Dừng để tránh sửa nhầm.`);
  return text.slice(0, index) + newText + text.slice(index + oldText.length);
}

function replaceRange(text, startMarker, endMarker, replacement, label) {
  const start = text.indexOf(startMarker);
  if (start < 0) throw new Error(`Không tìm thấy mốc bắt đầu: ${label}.`);
  const end = text.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error(`Không tìm thấy mốc kết thúc: ${label}.`);
  return text.slice(0, start) + replacement + text.slice(end);
}

function writePatched(file, original, patched) {
  if (patched === original) {
    console.log(`- Không đổi: ${path.relative(root, file)}`);
    return;
  }
  backup(file, original);
  fs.writeFileSync(file, patched, 'utf8');
  console.log(`✓ Đã vá: ${path.relative(root, file)}`);
}

function patchProjectsService() {
  const file = files.service;
  const original = mustRead(file);
  if (original.includes('export async function moveChapter(')) {
    console.log(`- Đã có moveChapter: ${path.relative(root, file)}`);
    return;
  }
  let text = original;

  text = replaceOnce(
    text,
`  const order = await db.projectChapters
    .filter((c) => c.projectId === params.projectId && c.sectionId === params.sectionId && c.deletedAt === null)
    .count();`,
`  const siblings = await db.projectChapters
    .filter((c) => c.projectId === params.projectId && c.sectionId === params.sectionId && c.deletedAt === null)
    .toArray();
  const order = siblings.reduce((max, chapter) => Math.max(max, chapter.order), -1) + 1;`,
    'createChapter/order',
  );

  const replacement = `function sameChapterSection(chapter: ProjectChapter, sectionId: string | null): boolean {
  return chapter.sectionId === sectionId;
}

function sortChapterGroup(chapters: ProjectChapter[]): ProjectChapter[] {
  return [...chapters].sort((a, b) => a.order - b.order || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

export async function listChapters(projectId: string): Promise<ProjectChapter[]> {
  const chapters = await db.projectChapters.filter((c) => c.projectId === projectId && c.deletedAt === null).toArray();
  return sortChapterGroup(chapters);
}

/**
 * Di chuyển chương tới vị trí mới trong cùng nhóm hoặc sang một Phần khác.
 * Toàn bộ order của nhóm nguồn/đích được chuẩn hóa về 0..n-1 để tránh trùng thứ tự.
 */
export async function moveChapter(id: string, targetSectionId: string | null, targetIndex: number): Promise<void> {
  await db.transaction("rw", db.projectChapters, db.projectSections, async () => {
    const chapter = await db.projectChapters.get(id);
    if (!chapter || chapter.deletedAt !== null) throw new Error("Không tìm thấy chương cần sắp xếp.");

    if (targetSectionId !== null) {
      const targetSection = await db.projectSections.get(targetSectionId);
      if (!targetSection || targetSection.deletedAt !== null || targetSection.projectId !== chapter.projectId) {
        throw new Error("Phần đích không hợp lệ hoặc không thuộc dự án này.");
      }
    }

    const allChapters = await db.projectChapters
      .filter((item) => item.projectId === chapter.projectId && item.deletedAt === null)
      .toArray();
    const sourceSectionId = chapter.sectionId;
    const stamp = now();
    const normalizedIndex = Number.isFinite(targetIndex) ? Math.trunc(targetIndex) : Number.MAX_SAFE_INTEGER;

    if (sourceSectionId === targetSectionId) {
      const group = sortChapterGroup(allChapters.filter((item) => sameChapterSection(item, sourceSectionId) && item.id !== id));
      const insertAt = Math.max(0, Math.min(normalizedIndex, group.length));
      group.splice(insertAt, 0, { ...chapter, sectionId: targetSectionId });
      await db.projectChapters.bulkPut(group.map((item, index) => ({ ...item, order: index, updatedAt: stamp })));
      return;
    }

    const sourceGroup = sortChapterGroup(allChapters.filter((item) => sameChapterSection(item, sourceSectionId) && item.id !== id));
    const targetGroup = sortChapterGroup(allChapters.filter((item) => sameChapterSection(item, targetSectionId) && item.id !== id));
    const insertAt = Math.max(0, Math.min(normalizedIndex, targetGroup.length));
    targetGroup.splice(insertAt, 0, { ...chapter, sectionId: targetSectionId });

    await db.projectChapters.bulkPut([
      ...sourceGroup.map((item, index) => ({ ...item, order: index, updatedAt: stamp })),
      ...targetGroup.map((item, index) => ({ ...item, sectionId: targetSectionId, order: index, updatedAt: stamp })),
    ]);
  });
}

export async function reorderChapter(id: string, newOrder: number): Promise<void> {
  await db.projectChapters.update(id, { order: newOrder, updatedAt: now() });
}

`;

  text = replaceRange(
    text,
    'export async function listChapters(projectId: string): Promise<ProjectChapter[]> {',
    '// ---------- Task (Kanban) ----------',
    replacement,
    'projectsService chapter ordering block',
  );
  writePatched(file, original, text);
}

function patchProjectsStore() {
  const file = files.store;
  const original = mustRead(file);
  if (original.includes('moveChapter: (id: string, targetSectionId: string | null, targetIndex: number)')) {
    console.log(`- Đã có moveChapter store: ${path.relative(root, file)}`);
    return;
  }
  let text = original;
  text = replaceOnce(
    text,
`  updateChapter: (id: string, patch: Parameters<typeof svc.updateChapter>[1]) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;`,
`  updateChapter: (id: string, patch: Parameters<typeof svc.updateChapter>[1]) => Promise<void>;
  moveChapter: (id: string, targetSectionId: string | null, targetIndex: number) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;`,
    'ProjectsState/moveChapter',
  );
  text = replaceOnce(
    text,
`  updateChapter: async (id, patch) => {
    await svc.updateChapter(id, patch);
    const pid = get().selectedProjectId;
    if (pid) set({ chapters: await svc.listChapters(pid) });
  },

  deleteChapter: async (id) => {`,
`  updateChapter: async (id, patch) => {
    await svc.updateChapter(id, patch);
    const pid = get().selectedProjectId;
    if (pid) set({ chapters: await svc.listChapters(pid) });
  },

  moveChapter: async (id, targetSectionId, targetIndex) => {
    const pid = get().selectedProjectId;
    if (!pid) return;
    await svc.moveChapter(id, targetSectionId, targetIndex);
    set({ chapters: await svc.listChapters(pid) });
  },

  deleteChapter: async (id) => {`,
    'projectsStore implementation/moveChapter',
  );
  writePatched(file, original, text);
}

function patchProjectsView() {
  const file = files.view;
  const original = mustRead(file);
  if (original.includes('function ChapterOutlineItem(')) {
    console.log(`- Đã có ChapterOutlineItem: ${path.relative(root, file)}`);
    return;
  }
  let text = original;
  text = replaceOnce(
    text,
    'import type { ProjectKind } from "../../types/entities";',
    'import type { ProjectChapter, ProjectKind, ProjectSection } from "../../types/entities";',
    'ProjectsView type imports',
  );

  const outlineReplacement = `function ChapterOutlineItem({
  chapter,
  siblings,
  sections,
  allChapters,
  sectionId,
}: {
  chapter: ProjectChapter;
  siblings: ProjectChapter[];
  sections: ProjectSection[];
  allChapters: ProjectChapter[];
  sectionId: string | null;
}) {
  const selectChapter = useProjectsStore((s) => s.selectChapter);
  const updateChapter = useProjectsStore((s) => s.updateChapter);
  const moveChapter = useProjectsStore((s) => s.moveChapter);
  const deleteChapter = useProjectsStore((s) => s.deleteChapter);
  const [moving, setMoving] = useState(false);
  const index = siblings.findIndex((item) => item.id === chapter.id);

  const runMove = async (targetSectionId: string | null, targetIndex: number) => {
    setMoving(true);
    try {
      await moveChapter(chapter.id, targetSectionId, targetIndex);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Không thể sắp xếp chương.");
    } finally {
      setMoving(false);
    }
  };

  const renameChapter = async () => {
    const title = window.prompt("Đổi tên chương:", chapter.title)?.trim();
    if (title && title !== chapter.title) await updateChapter(chapter.id, { title });
  };

  return (
    <li className="codex-card mb-1.5">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className="text-[11px] tabular-nums" style={{ color: "var(--color-text-muted)" }}>#{index + 1}</span>
        <button className="min-w-0 flex-1 text-left text-sm" style={{ color: "var(--color-text)" }} onClick={() => selectChapter(chapter.id)}>
          <span className="break-words">{chapter.title}</span> <span style={{ color: "var(--color-text-muted)" }}>· {chapter.wordCount} từ</span>
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-2 pb-2 text-xs">
        <button type="button" disabled={moving} onClick={() => void renameChapter()} style={{ color: "var(--color-accent)" }}>
          Sửa tên
        </button>
        <button
          type="button"
          disabled={moving || index <= 0}
          onClick={() => void runMove(sectionId, index - 1)}
          title="Đưa chương lên một vị trí"
          style={{ opacity: moving || index <= 0 ? 0.4 : 1 }}
        >
          ↑ Lên
        </button>
        <button
          type="button"
          disabled={moving || index < 0 || index >= siblings.length - 1}
          onClick={() => void runMove(sectionId, index + 1)}
          title="Đưa chương xuống một vị trí"
          style={{ opacity: moving || index < 0 || index >= siblings.length - 1 ? 0.4 : 1 }}
        >
          ↓ Xuống
        </button>
        <label className="flex min-w-0 items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
          <span>Chuyển:</span>
          <select
            value={sectionId ?? "__root__"}
            disabled={moving}
            aria-label={'Chuyển vị trí cho ' + chapter.title}
            className="max-w-[13rem] rounded border px-1.5 py-1 text-xs"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)", color: "var(--color-text)" }}
            onChange={(event) => {
              const targetSectionId = event.target.value === "__root__" ? null : event.target.value;
              if (targetSectionId === sectionId) return;
              const targetIndex = allChapters.filter((item) => item.sectionId === targetSectionId && item.id !== chapter.id).length;
              void runMove(targetSectionId, targetIndex);
            }}
          >
            <option value="__root__">Ngoài Phần</option>
            {sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
          </select>
        </label>
        <button
          type="button"
          disabled={moving}
          className="ml-auto"
          style={{ color: "var(--color-error)" }}
          onClick={() => {
            if (window.confirm('Xóa chương “' + chapter.title + '”?')) void deleteChapter(chapter.id);
          }}
        >
          Xóa
        </button>
      </div>
      <ChapterSynopsis chapterId={chapter.id} synopsis={chapter.synopsis} />
    </li>
  );
}

function OutlineTab({focusedSectionId}:{focusedSectionId:string|null}) {
  const sections = useProjectsStore((s) => s.sections);
  const chapters = useProjectsStore((s) => s.chapters);
  const createSection = useProjectsStore((s) => s.createSection);
  const renameSection = useProjectsStore((s) => s.renameSection);
  const deleteSection = useProjectsStore((s) => s.deleteSection);
  const createChapter = useProjectsStore((s) => s.createChapter);
  const [sectionTitle, setSectionTitle] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");

  const rootChapters = chapters.filter((c) => c.sectionId === null);

  return (
    <div className="p-4">
      <div className="mb-3 rounded-lg border px-3 py-2 text-xs" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-alt)", color: "var(--color-text-muted)" }}>
        Có thể tạo chương phác thảo trước rồi chỉnh lại sau. Dùng <b>Sửa tên</b>, <b>Lên/Xuống</b> hoặc <b>Chuyển</b> để sắp xếp dàn ý mà không làm mất nội dung chương.
      </div>

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
        {rootChapters.map((chapter) => (
          <ChapterOutlineItem
            key={chapter.id}
            chapter={chapter}
            siblings={rootChapters}
            sections={sections}
            allChapters={chapters}
            sectionId={null}
          />
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

      {sections.map((s) => {
        const sectionChapters = chapters.filter((chapter) => chapter.sectionId === s.id);
        return (
        <div key={s.id} id={"project-section-" + s.id} className="mb-3 rounded-lg p-2" style={{outline:focusedSectionId===s.id?"2px solid var(--color-focus)":"none"}}>
          <div className="flex items-center gap-2 mb-1">
            <div className="min-w-0 flex-1 truncate text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
              📖 {s.title}
            </div>
            <button
              type="button"
              className="shrink-0 text-xs"
              style={{ color: "var(--color-text-muted)" }}
              onClick={() => {
                const title = window.prompt("Đổi tên phần:", s.title)?.trim();
                if (title && title !== s.title) void renameSection(s.id, title);
              }}
            >
              Đổi tên
            </button>
            <button
              type="button"
              className="shrink-0 text-xs"
              style={{ color: "var(--color-error)" }}
              title="Các chương trong phần sẽ được chuyển ra cấp dự án, không bị xóa."
              onClick={() => {
                if (window.confirm('Xóa phần “' + s.title + '”? Các chương bên trong sẽ được giữ lại và chuyển ra ngoài phần.')) {
                  void deleteSection(s.id);
                }
              }}
            >
              Xóa phần
            </button>
          </div>
          <ul className="pl-4">
            {sectionChapters.map((chapter) => (
              <ChapterOutlineItem
                key={chapter.id}
                chapter={chapter}
                siblings={sectionChapters}
                sections={sections}
                allChapters={chapters}
                sectionId={s.id}
              />
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
        );
      })}
    </div>
  );
}

`;


  text = replaceRange(
    text,
    'function OutlineTab({focusedSectionId}:{focusedSectionId:string|null}) {',
    'function WordGoalBar(',
    outlineReplacement,
    'ProjectsView OutlineTab',
  );
  writePatched(file, original, text);
}

function patchAccountPanel() {
  const file = files.account;
  const original = mustRead(file);
  if (original.includes('type VaultResetNotice =')) {
    console.log(`- Đã có VaultResetNotice: ${path.relative(root, file)}`);
    return;
  }
  let text = original;

  text = replaceOnce(
    text,
    'type AccountTab = "profile" | "security" | "sync";',
    'type AccountTab = "profile" | "security" | "sync";\ntype VaultResetNotice = { tone: "success" | "error"; text: string };',
    'AccountPanel/VaultResetNotice type',
  );

  text = replaceOnce(
    text,
`  const [resettingVault, setResettingVault] = useState(false);
  const [confirmVaultReset, setConfirmVaultReset] = useState(false);`,
`  const [resettingVault, setResettingVault] = useState(false);
  const [confirmVaultReset, setConfirmVaultReset] = useState(false);
  const [vaultResetNotice, setVaultResetNotice] = useState<VaultResetNotice | null>(null);`,
    'AccountPanel/vaultResetNotice state',
  );

  const runSyncReplacement = `  async function runSync(activeSession = session): Promise<boolean> {
    if (!activeSession) return false;
    if (getActiveWorkspaceUserId() !== activeSession.user.id) { setStatus("idle"); return false; }
    if (!isVaultUnlocked(activeSession.user.id)) { setStatus("idle"); return false; }
    setStatus("syncing");
    try {
      await syncNow(activeSession.user);
      setStatus("synced");
      setLastSync(getLastSync(activeSession.user.id));
      return true;
    } catch (error) {
      setStatus(navigator.onLine ? "error" : "offline");
      setMessage(error instanceof Error ? error.message : "Đồng bộ thất bại");
      return false;
    }
  }

`;
  text = replaceRange(
    text,
    '  async function runSync(activeSession = session) {',
    '  useEffect(() => {',
    runSyncReplacement,
    'AccountPanel/runSync',
  );

  text = replaceOnce(
    text,
`    setBusy(true); setMessage("");
    try {
      if (vaultState === "setup") await setupVault(session.user, vaultPassphrase);`,
`    setBusy(true); setMessage(""); setVaultResetNotice(null);
    try {
      if (vaultState === "setup") await setupVault(session.user, vaultPassphrase);`,
    'AccountPanel/submitVault clear reset notice',
  );

  const resetReplacement = `  async function submitVaultReset(event: React.FormEvent) {
    event.preventDefault();
    if (!session) return;
    const showResetError = (text: string) => {
      setMessage("");
      setVaultResetNotice({ tone: "error", text });
    };
    if (vaultPassphrase.length < 12) { showResetError("Mật khẩu Kho mới cần ít nhất 12 ký tự."); return; }
    if (vaultPassphrase !== vaultConfirm) { showResetError("Hai mật khẩu Kho mới chưa giống nhau."); return; }
    if (!confirmVaultReset) { showResetError("Hãy xác nhận rằng bạn hiểu dữ liệu đám mây mã hóa bằng mật khẩu cũ sẽ bị thay thế."); return; }
    setBusy(true); setMessage(""); setVaultResetNotice(null);
    try {
      await resetVault(session.user, vaultPassphrase);
      setVaultState("unlocked"); setResettingVault(false); setConfirmVaultReset(false);
      setVaultPassphrase(""); setVaultConfirm("");
      setVaultResetNotice({ tone: "success", text: "Đã đặt lại Kho bảo mật thành công. Đang kiểm tra đồng bộ dữ liệu…" });
      const synced = await runSync(session);
      setVaultResetNotice({
        tone: "success",
        text: synced
          ? "Đã đặt lại Kho bảo mật thành công và đã đồng bộ dữ liệu bằng mật khẩu mới."
          : "Đã đặt lại Kho bảo mật thành công. Dữ liệu trên thiết bị vẫn được giữ; đồng bộ chưa hoàn tất, hãy kiểm tra tab Đồng bộ.",
      });
    } catch (error) {
      showResetError(error instanceof Error ? error.message : "Không thể đặt lại Kho bảo mật");
    } finally { setBusy(false); }
  }

`;
  text = replaceRange(
    text,
    '  async function submitVaultReset(event: React.FormEvent) {',
    '  async function submit(event: React.FormEvent) {',
    resetReplacement,
    'AccountPanel/submitVaultReset',
  );

  text = replaceOnce(
    text,
`          <div className="rounded-xl p-3" style={{background:"var(--color-surface-alt)"}}>
            <div className="font-semibold">🔐 {vaultState === "setup" ? "Tạo Kho bảo mật" : vaultState === "locked" ? "Mở Kho bảo mật" : vaultState === "unlocked" ? "Kho bảo mật đang mở" : "Đang kiểm tra Kho…"}</div>
            <p className="mt-1 text-sm opacity-75">{vaultState === "setup" ? "Tạo mật khẩu riêng để mã hóa dữ liệu trước khi đồng bộ." : vaultState === "unlocked" ? "Dữ liệu có thể được mã hóa và đồng bộ an toàn." : "Nhập mật khẩu Kho đã tạo trên thiết bị đầu tiên."}</p>
          </div>`,
`          <div className="rounded-xl p-3" style={{background:"var(--color-surface-alt)"}}>
            <div className="font-semibold">🔐 {vaultState === "setup" ? "Tạo Kho bảo mật" : vaultState === "locked" ? "Mở Kho bảo mật" : vaultState === "unlocked" ? "Kho bảo mật đang mở" : "Đang kiểm tra Kho…"}</div>
            <p className="mt-1 text-sm opacity-75">{vaultState === "setup" ? "Tạo mật khẩu riêng để mã hóa dữ liệu trước khi đồng bộ." : vaultState === "unlocked" ? "Dữ liệu có thể được mã hóa và đồng bộ an toàn." : "Nhập mật khẩu Kho đã tạo trên thiết bị đầu tiên."}</p>
          </div>
          {vaultResetNotice && <div
            role={vaultResetNotice.tone === "error" ? "alert" : "status"}
            aria-live="polite"
            className="rounded-xl border p-3 text-sm"
            style={{
              borderColor: vaultResetNotice.tone === "success" ? "var(--color-accent)" : "var(--color-error)",
              background: "var(--color-surface-alt)",
            }}
          >
            <div className="font-semibold">{vaultResetNotice.tone === "success" ? "✓ Đặt lại Kho thành công" : "Không thể đặt lại Kho"}</div>
            <p className="mt-1 opacity-80">{vaultResetNotice.text}</p>
          </div>}`,
    'AccountPanel/security reset status banner',
  );

  text = replaceOnce(
    text,
`onClick={()=>{setResettingVault(false);setVaultPassphrase("");setVaultConfirm("");setConfirmVaultReset(false);setMessage("");}}>Quay lại mở Kho</button>`,
`onClick={()=>{setResettingVault(false);setVaultPassphrase("");setVaultConfirm("");setConfirmVaultReset(false);setVaultResetNotice(null);setMessage("");}}>Quay lại mở Kho</button>`,
    'AccountPanel/reset back button',
  );

  text = replaceOnce(
    text,
`{vaultState === "locked" && !resettingVault && <button className="text-sm underline" onClick={()=>{setResettingVault(true);setVaultPassphrase("");setVaultConfirm("");setMessage("");}}>Quên mật khẩu Kho?</button>}`,
`{vaultState === "locked" && !resettingVault && <button className="text-sm underline" onClick={()=>{setResettingVault(true);setVaultPassphrase("");setVaultConfirm("");setVaultResetNotice(null);setMessage("");}}>Quên mật khẩu Kho?</button>}`,
    'AccountPanel/forgot vault button',
  );

  text = replaceOnce(
    text,
`{vaultState === "unlocked" && <button className="w-full rounded-xl border px-4 py-2" style={{borderColor:"var(--color-border)"}} onClick={()=>{lockVault(session.user.id);setVaultState("locked");setStatus("idle");}}>🔒 Khóa Kho ngay</button>}`,
`{vaultState === "unlocked" && <button className="w-full rounded-xl border px-4 py-2" style={{borderColor:"var(--color-border)"}} onClick={()=>{lockVault(session.user.id);setVaultState("locked");setStatus("idle");setVaultResetNotice(null);}}>🔒 Khóa Kho ngay</button>}`,
    'AccountPanel/lock vault button',
  );

  writePatched(file, original, text);
}

function patchProjectsTests() {
  const file = files.tests;
  const original = mustRead(file);
  if (original.includes('di chuyển chương giữa vị trí và Phần')) {
    console.log(`- Đã có test moveChapter: ${path.relative(root, file)}`);
    return;
  }
  let text = original;
  text = replaceOnce(
    text,
    '  reorderChapter,\n',
    '  reorderChapter,\n  moveChapter,\n',
    'projectsService.test import moveChapter',
  );

  const marker = '  it("xóa chương (soft delete) không còn xuất hiện trong danh sách", async () => {';
  const testBlock = `  it("di chuyển chương giữa vị trí và Phần sẽ chuẩn hóa order", async () => {
    const project = await createProject({ title: "Dàn ý linh hoạt", kind: "novel" });
    const c1 = await createChapter({ projectId: project.id, sectionId: null, title: "A" });
    await createChapter({ projectId: project.id, sectionId: null, title: "B" });
    const c3 = await createChapter({ projectId: project.id, sectionId: null, title: "C" });

    await moveChapter(c3.id, null, 0);
    let chapters = await listChapters(project.id);
    let root = chapters.filter((item) => item.sectionId === null);
    expect(root.map((item) => item.title)).toEqual(["C", "A", "B"]);
    expect(root.map((item) => item.order)).toEqual([0, 1, 2]);

    const section = await createSection(project.id, "Quyển 1");
    await moveChapter(c1.id, section.id, 0);
    chapters = await listChapters(project.id);
    root = chapters.filter((item) => item.sectionId === null);
    const inSection = chapters.filter((item) => item.sectionId === section.id);
    expect(root.map((item) => item.title)).toEqual(["C", "B"]);
    expect(root.map((item) => item.order)).toEqual([0, 1]);
    expect(inSection.map((item) => item.title)).toEqual(["A"]);
    expect(inSection.map((item) => item.order)).toEqual([0]);
  });

`;
  const idx = text.indexOf(marker);
  if (idx < 0) throw new Error('Không tìm thấy mốc thêm test moveChapter.');
  text = text.slice(0, idx) + testBlock + text.slice(idx);
  writePatched(file, original, text);
}

try {
  patchProjectsService();
  patchProjectsStore();
  patchProjectsView();
  patchAccountPanel();
  patchProjectsTests();
  console.log('\nHoàn tất bản vá. Tiếp theo chạy:');
  console.log('  npm test');
  console.log('  npm run build');
  console.log('\nCác file gốc đã được sao lưu với đuôi .bak-chapter-vault.');
} catch (error) {
  console.error('\nLỖI:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
