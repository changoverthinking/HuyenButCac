import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Icon } from "../common/Icons";
import { useProjectsStore } from "../../stores/projectsStore";
import type { Project } from "../../types/entities";
import {
  createLibraryBook,
  deleteLibraryBook,
  importPdfBook,
  listLibraryBooks,
  listLibraryProjectMeta,
  pinLibraryReadingPage,
  saveLibraryReadingPosition,
  setLibraryProjectCover,
  updateLibraryBookCover,
  updateLibraryBookInfo,
  type LibraryBook,
  type LibraryProjectMeta,
} from "../../features/library/libraryService";
import "./LibraryView.css";

type AddMode = "pdf" | "book" | "novel" | null;
type FilterMode = "all" | "pdf" | "written";

function CoverImage({ blob, title, fallback }: { blob?: Blob | null; title: string; fallback?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) { setUrl(null); return; }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);

  if (url) return <img className="library-cover-image" src={url} alt={`Bìa ${title}`} />;
  return (
    <div className="library-cover-fallback" aria-label={`Chưa có bìa cho ${title}`}>
      <Icon name="book" size={34} />
      <span>{fallback || title.slice(0, 2).toUpperCase()}</span>
    </div>
  );
}

function AddBookDialog({
  mode,
  onClose,
  onSaved,
}: {
  mode: Exclude<AddMode, null>;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      if (mode === "pdf") {
        if (!pdfFile) throw new Error("Hãy chọn tệp PDF cần thêm.");
        await importPdfBook({ file: pdfFile, title, author, description, coverFile });
      } else {
        await createLibraryBook({ title, author, description, kind: mode, coverFile });
      }
      await onSaved();
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể lưu sách.");
    } finally {
      setBusy(false);
    }
  };

  const label = mode === "pdf" ? "Thêm PDF" : mode === "novel" ? "Tạo tiểu thuyết" : "Tạo sách";
  return (
    <div className="library-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="library-modal" onSubmit={submit}>
        <div className="library-modal-heading">
          <div><small>TÀNG THƯ</small><h2>{label}</h2></div>
          <button type="button" className="library-icon-button" onClick={onClose} aria-label="Đóng"><Icon name="close" /></button>
        </div>

        {mode === "pdf" && (
          <label className="library-file-drop">
            <Icon name="scroll" size={28} />
            <span>{pdfFile ? pdfFile.name : "Chọn tệp PDF (tối đa 150 MB)"}</span>
            <input type="file" accept="application/pdf,.pdf" onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setPdfFile(file);
              if (file && !title) setTitle(file.name.replace(/\.pdf$/i, ""));
            }} />
          </label>
        )}

        <label className="library-field"><span>Tên sách / tác phẩm</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tên tác phẩm" required={mode !== "pdf"} /></label>
        <label className="library-field"><span>Tác giả</span><input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Không bắt buộc" /></label>
        <label className="library-field"><span>Mô tả</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Tóm tắt, thể loại, ghi chú…" /></label>
        <label className="library-file-inline">
          <Icon name="image" size={18} />
          <span>{coverFile ? `Bìa: ${coverFile.name}` : "Chọn ảnh bìa (không bắt buộc)"}</span>
          <input type="file" accept="image/*" onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)} />
        </label>
        {message && <p className="library-error">{message}</p>}
        <div className="library-modal-actions">
          <button type="button" className="library-button secondary" onClick={onClose}>Hủy</button>
          <button type="submit" className="library-button primary" disabled={busy}>{busy ? "Đang lưu…" : label}</button>
        </div>
      </form>
    </div>
  );
}

function PdfReader({ book, onClose, onChanged }: { book: LibraryBook; onClose: () => void; onChanged: () => Promise<void> }) {
  const [page, setPage] = useState(Math.max(1, book.pinnedPage ?? book.lastPage ?? 1));
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const pageRef = useRef(page);
  pageRef.current = page;

  useEffect(() => {
    if (!book.pdfBlob) return;
    const next = URL.createObjectURL(book.pdfBlob);
    setPdfUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [book.pdfBlob]);

  useEffect(() => {
    const id = window.setTimeout(() => { void saveLibraryReadingPosition(book.id, pageRef.current); }, 250);
    return () => window.clearTimeout(id);
  }, [book.id, page]);

  const go = (nextPage: number) => setPage(Math.max(1, Math.floor(nextPage || 1)));
  const pin = async () => {
    const next = book.pinnedPage === page ? null : page;
    await pinLibraryReadingPage(book.id, next);
    setMessage(next ? `Đã ghim trang ${page}.` : "Đã bỏ ghim trang đọc.");
    await onChanged();
  };
  const openExternal = () => {
    if (!pdfUrl) return;
    window.open(`${pdfUrl}#page=${page}&view=FitH`, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="library-reader" aria-label={`Đọc ${book.title}`}>
      <header className="library-reader-toolbar">
        <button type="button" className="library-icon-button" onClick={onClose} aria-label="Quay lại Tàng Thư"><Icon name="chevron-left" /></button>
        <div className="library-reader-title"><strong>{book.title}</strong><small>{book.pdfFileName || "PDF"}</small></div>
        <div className="library-reader-page-controls">
          <button type="button" className="library-icon-button" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Trang trước"><Icon name="previous" /></button>
          <label>Trang <input type="number" min={1} value={page} onChange={(event) => go(Number(event.target.value))} /></label>
          <button type="button" className="library-icon-button" onClick={() => go(page + 1)} aria-label="Trang sau"><Icon name="next" /></button>
        </div>
        <button type="button" className={`library-button compact ${book.pinnedPage === page ? "primary" : "secondary"}`} onClick={() => void pin()}><Icon name="pin" size={16} /> {book.pinnedPage === page ? "Bỏ ghim" : "Ghim trang"}</button>
        <button type="button" className="library-icon-button" onClick={openExternal} aria-label="Mở PDF toàn màn hình"><Icon name="export" /></button>
      </header>
      {message && <div className="library-reader-message">{message}</div>}
      <div className="library-reader-stage">
        {pdfUrl ? (
          <iframe key={`${book.id}-${page}`} title={`PDF ${book.title}`} src={`${pdfUrl}#page=${page}&view=FitH&toolbar=1`} className="library-pdf-frame" />
        ) : (
          <div className="library-empty"><Icon name="scroll" size={34} /><p>Không thể tạo phiên đọc PDF.</p></div>
        )}
      </div>
    </section>
  );
}

function ProjectCard({ project, meta, onOpenProject, onCoverChanged }: {
  project: Project;
  meta?: LibraryProjectMeta;
  onOpenProject: (projectId: string) => void | Promise<void>;
  onCoverChanged: () => Promise<void>;
}) {
  return (
    <article className="library-card">
      <div className="library-cover" style={{ "--project-cover": project.coverColor } as CSSProperties}>
        <CoverImage blob={meta?.coverBlob} title={project.title} fallback="TRUYỆN" />
        <span className="library-badge">Đang viết</span>
      </div>
      <div className="library-card-body">
        <h3>{project.title}</h3>
        <p>{project.description || "Tác phẩm được tổng hợp tự động từ Dự án viết truyện."}</p>
        <div className="library-card-actions">
          <button type="button" className="library-button secondary compact" onClick={() => void onOpenProject(project.id)}><Icon name="pencil" size={16} /> Mở bản thảo</button>
          <label className="library-icon-button" title="Đổi ảnh bìa" aria-label="Đổi ảnh bìa">
            <Icon name="image" size={17} />
            <input type="file" accept="image/*" onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try { await setLibraryProjectCover(project.id, file); await onCoverChanged(); }
              catch (error) { window.alert(error instanceof Error ? error.message : "Không thể lưu bìa."); }
              event.target.value = "";
            }} />
          </label>
        </div>
      </div>
    </article>
  );
}

function StoredBookCard({ book, onOpen, onChanged }: { book: LibraryBook; onOpen: () => void; onChanged: () => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author);
  const [description, setDescription] = useState(book.description);

  const saveInfo = async () => {
    try { await updateLibraryBookInfo(book.id, { title, author, description }); setEditing(false); await onChanged(); }
    catch (error) { window.alert(error instanceof Error ? error.message : "Không thể cập nhật."); }
  };

  return (
    <article className="library-card">
      <button type="button" className="library-cover library-cover-button" onClick={book.pdfBlob ? onOpen : undefined} disabled={!book.pdfBlob}>
        <CoverImage blob={book.coverBlob} title={book.title} fallback={book.kind === "pdf" ? "PDF" : book.kind === "novel" ? "TRUYỆN" : "SÁCH"} />
        <span className="library-badge">{book.kind === "pdf" ? "PDF" : book.kind === "novel" ? "Tiểu thuyết" : "Sách"}</span>
        {book.pinnedPage && <span className="library-page-pin"><Icon name="pin" size={14} /> {book.pinnedPage}</span>}
      </button>
      <div className="library-card-body">
        {editing ? (
          <div className="library-card-edit">
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
            <input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Tác giả" />
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
          </div>
        ) : (
          <><h3>{book.title}</h3><small>{book.author || "Chưa ghi tác giả"}</small><p>{book.description || (book.pdfBlob ? `Lần đọc gần nhất: trang ${book.lastPage || 1}` : "Sách lưu trong Tàng Thư.")}</p></>
        )}
        <div className="library-card-actions">
          {book.pdfBlob && !editing && <button type="button" className="library-button primary compact" onClick={onOpen}><Icon name="book" size={16} /> Đọc</button>}
          {editing ? <button type="button" className="library-button secondary compact" onClick={() => void saveInfo()}><Icon name="check" size={16} /> Lưu</button> : <button type="button" className="library-icon-button" onClick={() => setEditing(true)} aria-label="Sửa thông tin"><Icon name="pencil" size={16} /></button>}
          <label className="library-icon-button" title="Đổi ảnh bìa" aria-label="Đổi ảnh bìa"><Icon name="image" size={16} /><input type="file" accept="image/*" onChange={async (event) => {
            const file = event.target.files?.[0]; if (!file) return;
            try { await updateLibraryBookCover(book.id, file); await onChanged(); } catch (error) { window.alert(error instanceof Error ? error.message : "Không thể lưu bìa."); }
            event.target.value = "";
          }} /></label>
          <button type="button" className="library-icon-button danger" aria-label="Xóa khỏi Tàng Thư" onClick={async () => {
            if (!window.confirm(`Xóa “${book.title}” khỏi Tàng Thư?`)) return;
            await deleteLibraryBook(book.id); await onChanged();
          }}><Icon name="trash" size={16} /></button>
        </div>
      </div>
    </article>
  );
}

export function LibraryView({ onOpenProject }: { onOpenProject: (projectId: string) => void | Promise<void> }) {
  const projects = useProjectsStore((state) => state.projects);
  const loadProjects = useProjectsStore((state) => state.loadProjects);
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [projectMeta, setProjectMeta] = useState<LibraryProjectMeta[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [readerBookId, setReaderBookId] = useState<string | null>(null);
  const [toolsCollapsed, setToolsCollapsed] = useState(false);
  const [message, setMessage] = useState("");

  const reload = async () => {
    try {
      const [nextBooks, nextMeta] = await Promise.all([listLibraryBooks(), listLibraryProjectMeta()]);
      setBooks(nextBooks); setProjectMeta(nextMeta); setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tải Tàng Thư.");
    }
  };

  useEffect(() => { void loadProjects(); void reload(); }, [loadProjects]);

  const writtenProjects = useMemo(() => projects.filter((project) => project.kind === "novel" && !project.archived && !project.deletedAt), [projects]);
  const normalized = query.trim().toLocaleLowerCase("vi");
  const filteredBooks = books.filter((book) => {
    if (filter === "written" && book.kind === "pdf") return false;
    if (filter === "pdf" && book.kind !== "pdf") return false;
    return !normalized || `${book.title} ${book.author} ${book.description}`.toLocaleLowerCase("vi").includes(normalized);
  });
  const filteredProjects = writtenProjects.filter((project) => {
    if (filter === "pdf") return false;
    return !normalized || `${project.title} ${project.description}`.toLocaleLowerCase("vi").includes(normalized);
  });
  const readerBook = readerBookId ? books.find((book) => book.id === readerBookId) ?? null : null;

  if (readerBook?.pdfBlob) return <PdfReader book={readerBook} onClose={() => setReaderBookId(null)} onChanged={reload} />;

  return (
    <section className="library-view">
      <div className={`library-tools ${toolsCollapsed ? "is-collapsed" : ""}`}>
        <div className="library-tools-main">
          <div className="library-intro"><span className="library-intro-icon"><Icon name="book" size={24} /></span><div><small>VẠN QUYỂN TÀNG THƯ</small><h2>Tàng Thư</h2><p>Sách, PDF và toàn bộ tiểu thuyết đang viết trong một thư viện.</p></div></div>
          <button type="button" className="library-icon-button library-tools-toggle" onClick={() => setToolsCollapsed((value) => !value)} aria-label={toolsCollapsed ? "Mở công cụ Tàng Thư" : "Thu gọn công cụ Tàng Thư"}><Icon name={toolsCollapsed ? "chevron-down" : "chevron-right"} /></button>
        </div>
        {!toolsCollapsed && (
          <div className="library-tools-panel">
            <label className="library-search"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm sách, tác giả, tiểu thuyết…" /></label>
            <div className="library-filter-group" role="group" aria-label="Lọc Tàng Thư">
              <button type="button" className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>Tất cả</button>
              <button type="button" className={filter === "pdf" ? "is-active" : ""} onClick={() => setFilter("pdf")}>PDF</button>
              <button type="button" className={filter === "written" ? "is-active" : ""} onClick={() => setFilter("written")}>Đang viết</button>
            </div>
            <div className="library-add-group">
              <button type="button" className="library-button primary" onClick={() => setAddMode("pdf")}><Icon name="plus" size={16} /> Thêm PDF</button>
              <button type="button" className="library-button secondary" onClick={() => setAddMode("book")}><Icon name="book" size={16} /> Thêm sách</button>
              <button type="button" className="library-button secondary" onClick={() => setAddMode("novel")}><Icon name="pencil" size={16} /> Tạo tiểu thuyết</button>
            </div>
          </div>
        )}
      </div>

      {message && <div className="library-notice">{message}</div>}
      <div className="library-summary"><strong>{filteredBooks.length + filteredProjects.length}</strong><span>mục trong Tàng Thư</span><small>PDF được lưu cục bộ theo tài khoản và có thể mở lại ở trang đã ghim.</small></div>

      <div className="library-grid">
        {filteredProjects.map((project) => <ProjectCard key={`project-${project.id}`} project={project} meta={projectMeta.find((item) => item.projectId === project.id)} onOpenProject={onOpenProject} onCoverChanged={reload} />)}
        {filteredBooks.map((book) => <StoredBookCard key={book.id} book={book} onOpen={() => setReaderBookId(book.id)} onChanged={reload} />)}
      </div>

      {filteredBooks.length + filteredProjects.length === 0 && (
        <div className="library-empty"><Icon name="book" size={40} /><h3>Tàng Thư đang trống</h3><p>Thêm PDF, tạo sách hoặc bắt đầu một Dự án loại “novel”; tác phẩm sẽ tự xuất hiện ở đây.</p><button type="button" className="library-button primary" onClick={() => setAddMode("pdf")}><Icon name="plus" size={16} /> Thêm PDF đầu tiên</button></div>
      )}

      {addMode && <AddBookDialog mode={addMode} onClose={() => setAddMode(null)} onSaved={reload} />}
    </section>
  );
}
