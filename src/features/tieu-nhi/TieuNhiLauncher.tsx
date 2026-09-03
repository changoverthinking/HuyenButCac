import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { listLibraryBooks } from "../library/libraryService";
import { AppearanceIcon, AppearanceLayer } from "../../components/common/AdjustedImage";
import { Icon } from "../../components/common/Icons";
import { useNotesStore } from "../../stores/notesStore";
import { useProjectsStore } from "../../stores/projectsStore";
import {
  clearTieuNhiMessages,
  describeTieuNhiAction,
  executeTieuNhiWriteAction,
  forgetTieuNhiMemory,
  getTieuNhiSetting,
  indexAttachment,
  indexLibraryPdf,
  listTieuNhiIndexes,
  listTieuNhiMemories,
  listWorkspaceOverview,
  loadTieuNhiMessages,
  makeWriteAction,
  readNoteByTitle,
  readProjectByTitle,
  removeTieuNhiIndex,
  saveTieuNhiMessage,
  searchAttachmentContext,
  searchWorkspaceContext,
  setTieuNhiSetting,
  type TieuNhiIndexMeta,
  type TieuNhiMemory,
  type TieuNhiScope,
  type TieuNhiStoredMessage,
  type TieuNhiWriteAction,
} from "./tieuNhiDataService";
import "./tieu-nhi.css";

const PUTER_SCRIPT_ID = "hbc-puter-js";
const PUTER_SCRIPT_URL = "https://js.puter.com/v2/";
const DEFAULT_ONLINE_MODEL = "gpt-5-nano";

const BASE_SYSTEM_PROMPT = `Bạn là Tiểu Nhị, trợ lý AI quản gia của Huyền Bút Các.
- Mặc định trả lời tiếng Việt, rõ ràng, chính xác, đúng trọng tâm.
- Bạn hỗ trợ viết truyện, xây dựng nhân vật/thế giới, dàn ý, tóm tắt, phân tích, brainstorm, ghi chú, dự án và Tàng Thư.
- Chỉ nói rằng đã đọc dữ liệu khi dữ liệu thực sự được công cụ cung cấp.
- Dữ liệu ghi chú khóa chỉ có thể đọc khi người dùng đã mở khóa trong ứng dụng.
- Công cụ ghi dữ liệu chỉ TẠO ĐỀ XUẤT; người dùng phải bấm xác nhận trong giao diện. Không được nói thao tác đã hoàn tất trước khi có kết quả xác nhận.
- Khi dữ liệu Tàng Thư PDF chưa được lập chỉ mục, nói rõ người dùng cần mở Thiết lập Tiểu Nhị và bấm “Lập chỉ mục”.
- Không tự xóa dữ liệu. Xóa ghi chú/chương luôn là xóa mềm và vẫn phải có xác nhận.`;

const SUGGESTIONS = [
  "Tìm các ghi chú liên quan đến ý tưởng tôi đang viết",
  "Tóm tắt mạch truyện và các nhân vật quan trọng trong dự án",
  "Tạo một ghi chú từ câu trả lời tiếp theo của bạn",
  "Tìm trong Tàng Thư những đoạn liên quan đến chủ đề tôi hỏi",
];

type ChatRole = "user" | "assistant";
type ChatMessage = { id: string; role: ChatRole; content: string; createdAt?: number; mode?: "local" | "online" };
type AiMode = "local" | "online" | null;
type AiStatus = "idle" | "checking" | "loading" | "ready" | "generating" | "unsupported" | "error";
type WorkerEventData = {
  status?: string;
  data?: string;
  output?: string;
  progress?: number;
  numTokens?: number;
  tps?: number;
};

type PuterToolCall = {
  id: string;
  type?: "function";
  function: { name: string; arguments: string };
};

type PuterChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: PuterToolCall[];
  tool_call_id?: string;
};

type PuterResponse = {
  message?: {
    role?: string;
    content?: string | null;
    tool_calls?: PuterToolCall[];
  };
  finish_reason?: string;
};

type PuterClient = {
  ai: {
    chat: (...args: any[]) => Promise<any>;
    img2txt?: (...args: any[]) => Promise<any>;
  };
};

type PuterWindow = Window & { puter?: PuterClient };

type PermissionState = {
  scopes: TieuNhiScope[];
  shareWorkspaceWithOnline: boolean;
};

const DEFAULT_PERMISSIONS: PermissionState = {
  scopes: ["notes", "projects", "library", "memory"],
  shareWorkspaceWithOnline: false,
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function parseJsonArguments(value: string) {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function stringArg(args: Record<string, unknown>, key: string, fallback = "") {
  const value = args[key];
  return typeof value === "string" ? value.trim() : fallback;
}


function modeArg(args: Record<string, unknown>, key: string): "append" | "replace" {
  return args[key] === "append" ? "append" : "replace";
}

function projectKindArg(args: Record<string, unknown>): "software" | "game" | "construction" | "novel" | "generic" {
  const kind = args.kind;
  return kind === "software" || kind === "game" || kind === "construction" || kind === "novel" ? kind : "generic";
}

function safeJson(value: unknown, max = 30_000) {
  const text = JSON.stringify(value, null, 2);
  return text.length > max ? `${text.slice(0, max)}\n…[đã rút gọn]` : text;
}

function buildTools() {
  const object = (properties: Record<string, unknown>, required: string[] = []) => ({ type: "object", properties, required, additionalProperties: false });
  const string = (description: string, extra: Record<string, unknown> = {}) => ({ type: "string", description, ...extra });
  return [
    {
      type: "function",
      function: {
        name: "search_workspace",
        description: "Tìm đoạn liên quan trong ghi chú, dự án/Story Bible, Tàng Thư đã lập chỉ mục và memory của Tiểu Nhị. Dùng trước khi trả lời câu hỏi dựa trên dữ liệu người dùng.",
        parameters: object({ query: string("Từ khóa hoặc câu hỏi cần tìm") }, ["query"]),
        strict: true,
      },
    },
    {
      type: "function",
      function: {
        name: "list_workspace",
        description: "Liệt kê tổng quan tiêu đề ghi chú, dự án, sách/PDF và memory mà người dùng đã cho phép.",
        parameters: object({}),
        strict: true,
      },
    },
    {
      type: "function",
      function: {
        name: "read_note",
        description: "Đọc một ghi chú theo tiêu đề. Ghi chú đang khóa chỉ đọc được nếu người dùng đã mở khóa trong app.",
        parameters: object({ title: string("Tiêu đề ghi chú") }, ["title"]),
        strict: true,
      },
    },
    {
      type: "function",
      function: {
        name: "read_project",
        description: "Đọc dự án theo tên, gồm mô tả, phần, chương, synopsis và nội dung chương.",
        parameters: object({ title: string("Tên dự án") }, ["title"]),
        strict: true,
      },
    },
    {
      type: "function",
      function: {
        name: "propose_create_note",
        description: "Đề xuất tạo ghi chú. Chỉ tạo đề xuất chờ người dùng xác nhận, không tự ghi dữ liệu.",
        parameters: object({ title: string("Tiêu đề ghi chú"), content: string("Nội dung ghi chú, có thể rỗng") }, ["title", "content"]),
        strict: true,
      },
    },
    {
      type: "function",
      function: {
        name: "propose_update_note",
        description: "Đề xuất thêm hoặc ghi đè nội dung một ghi chú. Luôn chờ xác nhận.",
        parameters: object({ noteTitle: string("Tiêu đề ghi chú"), content: string("Nội dung mới"), mode: string("append để nối thêm, replace để thay toàn bộ", { enum: ["append", "replace"] }) }, ["noteTitle", "content", "mode"]),
        strict: true,
      },
    },
    {
      type: "function",
      function: {
        name: "propose_delete_note",
        description: "Đề xuất chuyển ghi chú vào thùng rác (soft delete). Chỉ dùng khi người dùng yêu cầu xóa rõ ràng.",
        parameters: object({ noteTitle: string("Tiêu đề ghi chú") }, ["noteTitle"]),
        strict: true,
      },
    },
    {
      type: "function",
      function: {
        name: "propose_create_project",
        description: "Đề xuất tạo dự án mới.",
        parameters: object({ title: string("Tên dự án"), kind: string("Loại dự án", { enum: ["software", "game", "construction", "novel", "generic"] }), description: string("Mô tả, có thể rỗng") }, ["title", "kind", "description"]),
        strict: true,
      },
    },
    {
      type: "function",
      function: {
        name: "propose_create_chapter",
        description: "Đề xuất tạo chương mới trong một dự án.",
        parameters: object({ projectTitle: string("Tên dự án"), title: string("Tên chương"), content: string("Nội dung chương, có thể rỗng"), synopsis: string("Tóm tắt chương, có thể rỗng") }, ["projectTitle", "title", "content", "synopsis"]),
        strict: true,
      },
    },
    {
      type: "function",
      function: {
        name: "propose_update_chapter",
        description: "Đề xuất viết thêm hoặc thay nội dung một chương. Luôn chờ xác nhận.",
        parameters: object({ projectTitle: string("Tên dự án"), chapterTitle: string("Tên chương"), content: string("Nội dung"), mode: string("append hoặc replace", { enum: ["append", "replace"] }), synopsis: string("Synopsis mới nếu cần, có thể rỗng") }, ["projectTitle", "chapterTitle", "content", "mode", "synopsis"]),
        strict: true,
      },
    },
    {
      type: "function",
      function: {
        name: "propose_delete_chapter",
        description: "Đề xuất xóa mềm một chương. Chỉ dùng khi người dùng yêu cầu xóa rõ ràng.",
        parameters: object({ projectTitle: string("Tên dự án"), chapterTitle: string("Tên chương") }, ["projectTitle", "chapterTitle"]),
        strict: true,
      },
    },
    {
      type: "function",
      function: {
        name: "propose_remember",
        description: "Đề xuất lưu một sở thích/quy ước người dùng vào memory lâu dài của Tiểu Nhị.",
        parameters: object({ label: string("Nhãn ngắn"), value: string("Điều cần ghi nhớ") }, ["label", "value"]),
        strict: true,
      },
    },
  ];
}

function loadPuter(): Promise<PuterClient> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Tiểu Nhị Online chỉ hoạt động trong trình duyệt."));
  }
  const puterWindow = window as PuterWindow;
  if (puterWindow.puter) return Promise.resolve(puterWindow.puter);
  return new Promise((resolve, reject) => {
    const finish = () => puterWindow.puter ? resolve(puterWindow.puter) : reject(new Error("Không tải được dịch vụ Tiểu Nhị Online."));
    const existing = document.getElementById(PUTER_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("Không tải được Puter.js.")), { once: true });
      window.setTimeout(() => { if (!puterWindow.puter) reject(new Error("Kết nối Tiểu Nhị Online quá thời gian chờ.")); }, 15_000);
      return;
    }
    const script = document.createElement("script");
    script.id = PUTER_SCRIPT_ID;
    script.src = PUTER_SCRIPT_URL;
    script.async = true;
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => reject(new Error("Không tải được Puter.js.")), { once: true });
    document.head.appendChild(script);
    window.setTimeout(() => { if (!puterWindow.puter) reject(new Error("Kết nối Tiểu Nhị Online quá thời gian chờ.")); }, 15_000);
  });
}

function localWriteRequest(raw: string, lastAssistant: string): TieuNhiWriteAction | null {
  const text = raw.trim();
  const command = text.match(/^\/(note|project|chapter|remember)\s+(.+)$/i);
  if (command) {
    const [, kind, body] = command;
    const parts = body.split("|").map((part) => part.trim());
    if (kind.toLowerCase() === "note") return makeWriteAction({ type: "create_note", title: parts[0] || "Ghi chú từ Tiểu Nhị", content: parts.slice(1).join(" | ") });
    if (kind.toLowerCase() === "project") return makeWriteAction({ type: "create_project", title: parts[0] || "Dự án mới", kind: "generic", description: parts.slice(1).join(" | ") });
    if (kind.toLowerCase() === "chapter") return makeWriteAction({ type: "create_chapter", projectTitle: parts[0] || "", title: parts[1] || "Chương mới", content: parts.slice(2).join(" | "), synopsis: "" });
    if (kind.toLowerCase() === "remember") return makeWriteAction({ type: "remember", label: parts[0] || "Ghi nhớ", value: parts.slice(1).join(" | ") || parts[0] || "" });
  }
  const saveReply = text.match(/^lưu\s+(?:câu trả lời|nội dung)\s+này\s+vào\s+ghi chú\s+["“]?(.+?)["”]?$/i);
  if (saveReply && lastAssistant) return makeWriteAction({ type: "create_note", title: saveReply[1].trim(), content: lastAssistant });
  const createNote = text.match(/^tạo\s+ghi chú\s+["“]?(.+?)["”]?$/i);
  if (createNote) return makeWriteAction({ type: "create_note", title: createNote[1].trim(), content: "" });
  const createProjectMatch = text.match(/^tạo\s+(?:một\s+)?dự án\s+["“]?(.+?)["”]?$/i);
  if (createProjectMatch) return makeWriteAction({ type: "create_project", title: createProjectMatch[1].trim(), kind: "generic", description: "" });
  const remember = text.match(/^nhớ\s+rằng\s+(.+)$/i);
  if (remember) return makeWriteAction({ type: "remember", label: "Người dùng", value: remember[1].trim() });
  return null;
}

function contextToPrompt(hits: Awaited<ReturnType<typeof searchWorkspaceContext>>) {
  if (!hits.length) return "";
  return `\n\nDỮ LIỆU HUYỀN BÚT CÁC ĐƯỢC TRUY XUẤT CHO CÂU HỎI NÀY:\n${hits.map((hit, index) => `[#${index + 1} · ${hit.source}] ${hit.title}\n${hit.text}`).join("\n\n")}`;
}

export function TieuNhiLauncher({
  open: controlledOpen,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setLauncherOpen = useCallback((nextOpen: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [controlledOpen, onOpenChange]);

  const [mode, setMode] = useState<AiMode>(null);
  const [status, setStatus] = useState<AiStatus>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingText, setLoadingText] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [tps, setTps] = useState<number | null>(null);
  const [numTokens, setNumTokens] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [permissions, setPermissions] = useState<PermissionState>(DEFAULT_PERMISSIONS);
  const [onlineModel, setOnlineModel] = useState(DEFAULT_ONLINE_MODEL);
  const [pendingActions, setPendingActions] = useState<TieuNhiWriteAction[]>([]);
  const [memories, setMemories] = useState<TieuNhiMemory[]>([]);
  const [indexes, setIndexes] = useState<TieuNhiIndexMeta[]>([]);
  const [libraryBooks, setLibraryBooks] = useState<Awaited<ReturnType<typeof listLibraryBooks>>>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [indexingLabel, setIndexingLabel] = useState("");
  const [indexingProgress, setIndexingProgress] = useState(0);

  const selectedNoteId = useNotesStore((state) => state.selectedNoteId);
  const notesInUi = useNotesStore((state) => state.notes);
  const selectedProjectId = useProjectsStore((state) => state.selectedProjectId);
  const selectedChapterId = useProjectsStore((state) => state.selectedChapterId);
  const projectsInUi = useProjectsStore((state) => state.projects);
  const chaptersInUi = useProjectsStore((state) => state.chapters);
  const activeUiContext = useMemo(() => {
    const note = notesInUi.find((item) => item.id === selectedNoteId);
    const project = projectsInUi.find((item) => item.id === selectedProjectId);
    const chapter = chaptersInUi.find((item) => item.id === selectedChapterId);
    const parts = [
      note ? `Ghi chú đang mở: “${note.title}”${note.locked ? " (đang khóa/hoặc cần phiên mở khóa để đọc nội dung)" : ""}` : "",
      project ? `Dự án đang chọn: “${project.title}”` : "",
      chapter ? `Chương đang mở: “${chapter.title}”` : "",
    ].filter(Boolean);
    return parts.length ? `\nNGỮ CẢNH GIAO DIỆN HIỆN TẠI:\n- ${parts.join("\n- ")}` : "";
  }, [chaptersInUi, notesInUi, projectsInUi, selectedChapterId, selectedNoteId, selectedProjectId]);

  const workerRef = useRef<Worker | null>(null);
  const pendingLoadRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const generationRef = useRef(0);
  const activeAssistantIdRef = useRef<string | null>(null);
  const localAssistantBufferRef = useRef("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stateLoadRef = useRef(0);

  const hasWebGpuApi = useMemo(() => typeof navigator !== "undefined" && "gpu" in navigator, []);

  const refreshAiData = useCallback(async () => {
    const [savedMessages, savedPermissions, savedModel, savedMemories, savedIndexes, books] = await Promise.all([
      loadTieuNhiMessages(50),
      getTieuNhiSetting<PermissionState>("permissions", DEFAULT_PERMISSIONS),
      getTieuNhiSetting<string>("online-model", DEFAULT_ONLINE_MODEL),
      listTieuNhiMemories(),
      listTieuNhiIndexes(),
      listLibraryBooks(),
    ]);
    setMessages(savedMessages.map((item: TieuNhiStoredMessage) => ({ id: item.id, role: item.role, content: item.content, createdAt: item.createdAt, mode: item.mode })));
    setPermissions({
      scopes: Array.isArray(savedPermissions?.scopes) ? savedPermissions.scopes.filter((scope): scope is TieuNhiScope => ["notes", "projects", "library", "memory"].includes(scope)) : DEFAULT_PERMISSIONS.scopes,
      shareWorkspaceWithOnline: Boolean(savedPermissions?.shareWorkspaceWithOnline),
    });
    setOnlineModel(savedModel || DEFAULT_ONLINE_MODEL);
    setMemories(savedMemories);
    setIndexes(savedIndexes);
    setLibraryBooks(books);
  }, []);

  useEffect(() => {
    if (!open) return;
    const ticket = ++stateLoadRef.current;
    void refreshAiData().catch((loadError) => {
      if (ticket === stateLoadRef.current) setError(errorMessage(loadError, "Không đọc được dữ liệu Tiểu Nhị."));
    });
  }, [open, refreshAiData]);

  useEffect(() => {
    const onWorkspaceChanged = () => {
      generationRef.current += 1;
      workerRef.current?.terminate();
      workerRef.current = null;
      setMode(null);
      setStatus("idle");
      setPendingActions([]);
      setAttachments([]);
      if (open) void refreshAiData();
    };
    window.addEventListener("hbc-workspace-changed", onWorkspaceChanged);
    return () => window.removeEventListener("hbc-workspace-changed", onWorkspaceChanged);
  }, [open, refreshAiData]);

  const persistPermissions = useCallback((next: PermissionState) => {
    setPermissions(next);
    void setTieuNhiSetting("permissions", next);
  }, []);

  const toggleScope = useCallback((scope: TieuNhiScope) => {
    const scopes = permissions.scopes.includes(scope)
      ? permissions.scopes.filter((item) => item !== scope)
      : [...permissions.scopes, scope];
    persistPermissions({ ...permissions, scopes });
  }, [permissions, persistPermissions]);

  const appendAssistant = useCallback((content: string, persist = true) => {
    const message: ChatMessage = { id: makeId("assistant"), role: "assistant", content, createdAt: Date.now(), mode: mode ?? undefined };
    setMessages((current) => [...current, message].slice(-80));
    if (persist && mode) void saveTieuNhiMessage({ ...message, mode, role: "assistant", content });
    return message;
  }, [mode]);

  const resetAi = useCallback(() => {
    generationRef.current += 1;
    workerRef.current?.terminate();
    workerRef.current = null;
    pendingLoadRef.current = false;
    setMode(null);
    setStatus("idle");
    setLoadingText("");
    setProgress(0);
    setError("");
    setTps(null);
    setNumTokens(null);
  }, []);

  const onWorkerMessage = useCallback((event: MessageEvent<WorkerEventData>) => {
    const payload = event.data;
    switch (payload.status) {
      case "compatible":
        if (pendingLoadRef.current) {
          pendingLoadRef.current = false;
          setStatus("loading");
          workerRef.current?.postMessage({ type: "load" });
        }
        break;
      case "unsupported":
        pendingLoadRef.current = false;
        setStatus("unsupported");
        setError(payload.data ?? "Thiết bị chưa hỗ trợ WebGPU.");
        break;
      case "loading":
        setStatus("loading");
        setLoadingText(payload.data ?? "Đang tải Tiểu Nhị…");
        break;
      case "initiate": setStatus("loading"); break;
      case "progress":
        if (typeof payload.progress === "number") setProgress(Math.max(0, Math.min(100, payload.progress)));
        break;
      case "ready":
        setStatus("ready"); setLoadingText(""); setProgress(100); setError("");
        break;
      case "start": {
  setStatus("generating");

  const id = makeId("assistant");
  activeAssistantIdRef.current = id;
  localAssistantBufferRef.current = "";

  const assistantMessage: ChatMessage = {
    id,
    role: "assistant",
    content: "",
    createdAt: Date.now(),
    mode: "local",
  };

  setMessages((current) =>
    [...current, assistantMessage].slice(-80)
  );

  break;
}
      case "update":
        if (typeof payload.tps === "number") setTps(payload.tps);
        if (typeof payload.numTokens === "number") setNumTokens(payload.numTokens);
        if (payload.output) {
          localAssistantBufferRef.current += payload.output;
          const targetId = activeAssistantIdRef.current;
          setMessages((current) => current.map((item) => item.id === targetId ? { ...item, content: item.content + payload.output } : item));
        }
        break;
      case "complete": {
        setStatus("ready");
        const content = localAssistantBufferRef.current.trim();
        const id = activeAssistantIdRef.current;
        if (content && id) void saveTieuNhiMessage({ id, role: "assistant", content, mode: "local" });
        activeAssistantIdRef.current = null;
        localAssistantBufferRef.current = "";
        break;
      }
      case "error":
        setStatus("error"); setError(payload.data ?? "Tiểu Nhị gặp lỗi khi khởi tạo AI.");
        break;
      default: break;
    }
  }, []);

  const ensureWorker = useCallback(() => {
    if (workerRef.current) return workerRef.current;
    const worker = new Worker(new URL("./tieuNhi.worker.js", import.meta.url), { type: "module" });
    worker.addEventListener("message", onWorkerMessage);
    worker.addEventListener("error", () => {
      setStatus("error");
      setError("Worker AI đã dừng bất thường. Hãy giải phóng RAM rồi thử lại.");
    });
    workerRef.current = worker;
    return worker;
  }, [onWorkerMessage]);

  const loadLocalModel = useCallback(() => {
    generationRef.current += 1;
    workerRef.current?.terminate();
    workerRef.current = null;
    pendingLoadRef.current = false;
    setMode("local"); setError(""); setProgress(0); setStatus("checking");
    if (!hasWebGpuApi) {
      setStatus("unsupported");
      setError("Trình duyệt này không cung cấp WebGPU. Bạn vẫn có thể dùng Tiểu Nhị Online.");
      return;
    }
    pendingLoadRef.current = true;
    ensureWorker().postMessage({ type: "check" });
  }, [ensureWorker, hasWebGpuApi]);

  const enableOnline = useCallback(async () => {
    generationRef.current += 1;
    workerRef.current?.terminate();
    workerRef.current = null;
    pendingLoadRef.current = false;
    setMode("online"); setError(""); setProgress(0); setLoadingText("Đang kết nối Tiểu Nhị Online…"); setStatus("loading");
    try {
      await loadPuter();
      setLoadingText(""); setStatus("ready");
    } catch (onlineError) {
      setStatus("error"); setError(errorMessage(onlineError, "Không thể kết nối Tiểu Nhị Online."));
    }
  }, []);

  const queueAction = useCallback((action: TieuNhiWriteAction) => {
    setPendingActions((current) => current.some((item) => item.id === action.id) ? current : [...current, action]);
    return `Đã tạo đề xuất “${describeTieuNhiAction(action)}”. Đang chờ người dùng xác nhận trong giao diện; chưa ghi dữ liệu.`;
  }, []);

  const executeTool = useCallback(async (name: string, args: Record<string, unknown>) => {
    const readAllowed = permissions.shareWorkspaceWithOnline;
    const denied = "Người dùng chưa bật quyền ‘Cho Tiểu Nhị Online dùng dữ liệu Huyền Bút Các’. Hãy yêu cầu họ bật trong Thiết lập Tiểu Nhị nếu muốn dùng dữ liệu app.";
    if (name === "search_workspace") {
      if (!readAllowed) return denied;
      const query = stringArg(args, "query");
      const hits = await searchWorkspaceContext(query, permissions.scopes, 10);
      if (!hits.length) {
        const overview = await listWorkspaceOverview(permissions.scopes);
        return `Không tìm thấy đoạn phù hợp. Tổng quan nguồn dữ liệu hiện có:\n${safeJson(overview, 12_000)}\nNếu PDF có trong Tàng Thư nhưng indexedForAi=false, cần lập chỉ mục trước.`;
      }
      return safeJson(hits);
    }
    if (name === "list_workspace") {
      if (!readAllowed) return denied;
      return safeJson(await listWorkspaceOverview(permissions.scopes));
    }
    if (name === "read_note") {
      if (!readAllowed || !permissions.scopes.includes("notes")) return denied;
      return safeJson(await readNoteByTitle(stringArg(args, "title")));
    }
    if (name === "read_project") {
      if (!readAllowed || !permissions.scopes.includes("projects")) return denied;
      return safeJson(await readProjectByTitle(stringArg(args, "title")));
    }
    if (name === "propose_create_note") return queueAction(makeWriteAction({ type: "create_note", title: stringArg(args, "title", "Ghi chú mới"), content: stringArg(args, "content") }));
    if (name === "propose_update_note") return queueAction(makeWriteAction({ type: "update_note", noteTitle: stringArg(args, "noteTitle"), content: stringArg(args, "content"), mode: modeArg(args, "mode") }));
    if (name === "propose_delete_note") return queueAction(makeWriteAction({ type: "delete_note", noteTitle: stringArg(args, "noteTitle") }));
    if (name === "propose_create_project") return queueAction(makeWriteAction({ type: "create_project", title: stringArg(args, "title", "Dự án mới"), kind: projectKindArg(args), description: stringArg(args, "description") }));
    if (name === "propose_create_chapter") return queueAction(makeWriteAction({ type: "create_chapter", projectTitle: stringArg(args, "projectTitle"), title: stringArg(args, "title", "Chương mới"), content: stringArg(args, "content"), synopsis: stringArg(args, "synopsis") }));
    if (name === "propose_update_chapter") return queueAction(makeWriteAction({ type: "update_chapter", projectTitle: stringArg(args, "projectTitle"), chapterTitle: stringArg(args, "chapterTitle"), content: stringArg(args, "content"), mode: modeArg(args, "mode"), synopsis: stringArg(args, "synopsis") }));
    if (name === "propose_delete_chapter") return queueAction(makeWriteAction({ type: "delete_chapter", projectTitle: stringArg(args, "projectTitle"), chapterTitle: stringArg(args, "chapterTitle") }));
    if (name === "propose_remember") return queueAction(makeWriteAction({ type: "remember", label: stringArg(args, "label", "Ghi nhớ"), value: stringArg(args, "value") }));
    return `Công cụ “${name}” không được hỗ trợ.`;
  }, [permissions, queueAction]);

  const sendOnlineWithTools = useCallback(async (context: PuterChatMessage[]) => {
    const puter = await loadPuter();
    const sharedUiContext = permissions.shareWorkspaceWithOnline ? activeUiContext : "";
    const toolMessages: PuterChatMessage[] = [{ role: "system", content: `${BASE_SYSTEM_PROMPT}${sharedUiContext}` }, ...context];
    const tools = buildTools();
    for (let iteration = 0; iteration < 6; iteration += 1) {
      const response = await puter.ai.chat(toolMessages, {
        model: onlineModel || DEFAULT_ONLINE_MODEL,
        normalize: true,
        tools,
        stream: false,
        max_tokens: 1400,
        temperature: 0.55,
      }) as PuterResponse;
      const assistant = response?.message;
      const toolCalls = assistant?.tool_calls ?? [];
      if (!toolCalls.length) return assistant?.content?.trim() || "Tôi đã xử lý yêu cầu nhưng dịch vụ không trả về nội dung văn bản.";
      toolMessages.push({ role: "assistant", content: assistant?.content ?? null, tool_calls: toolCalls });
      for (const call of toolCalls) {
        let result: string;
        try {
          result = await executeTool(call.function.name, parseJsonArguments(call.function.arguments));
        } catch (toolError) {
          result = `Lỗi công cụ: ${errorMessage(toolError, "Không thực hiện được yêu cầu.")}`;
        }
        toolMessages.push({ role: "tool", tool_call_id: call.id, content: result });
      }
    }
    return "Yêu cầu cần quá nhiều bước công cụ trong một lượt. Hãy chia yêu cầu thành phần nhỏ hơn.";
  }, [activeUiContext, executeTool, onlineModel, permissions.shareWorkspaceWithOnline]);

  const sendOnlineVision = useCallback(async (prompt: string, image: File) => {
    const puter = await loadPuter();
    const contextHits = permissions.shareWorkspaceWithOnline ? await searchWorkspaceContext(prompt, permissions.scopes, 6) : [];
    const sharedUiContext = permissions.shareWorkspaceWithOnline ? activeUiContext : "";
    const fullPrompt = `${BASE_SYSTEM_PROMPT}${sharedUiContext}${contextToPrompt(contextHits)}\n\nYÊU CẦU NGƯỜI DÙNG:\n${prompt}`;
    const response = await puter.ai.chat(fullPrompt, image, false, {
      model: onlineModel || DEFAULT_ONLINE_MODEL,
      normalize: true,
      max_tokens: 1400,
      temperature: 0.55,
    }) as PuterResponse;
    return response?.message?.content?.trim() || "Không nhận được mô tả ảnh từ dịch vụ AI.";
  }, [activeUiContext, onlineModel, permissions]);

  const sendMessage = useCallback(async (raw: string) => {
    const content = raw.trim();
    if (!content || status !== "ready" || !mode) return;
    const userMessage: ChatMessage = { id: makeId("user"), role: "user", content, createdAt: Date.now(), mode };
    const nextUiMessages = [...messages, userMessage].slice(-80);
    setMessages(nextUiMessages);
    setInput(""); setTps(null); setNumTokens(null); setStatus("generating"); setError("");
    void saveTieuNhiMessage({ ...userMessage, mode, role: "user", content });

    const lastAssistant = [...messages].reverse().find((item) => item.role === "assistant")?.content ?? "";
    if (mode === "local") {
      const action = localWriteRequest(content, lastAssistant);
      if (action) {
        queueAction(action);
        appendAssistant(`Tôi đã chuẩn bị thao tác: ${describeTieuNhiAction(action)}. Hãy bấm “Xác nhận” để ghi dữ liệu.`, true);
        setStatus("ready");
        return;
      }
      if (attachments.some((file) => file.type.startsWith("image/"))) {
        appendAssistant("AI Local hiện là model văn bản nên không đọc ảnh. Hãy chuyển sang Online để phân tích ảnh.", true);
        setStatus("ready");
        return;
      }
    }

    try {
      const documentFiles = attachments.filter((file) => !file.type.startsWith("image/"));
      const explicitAttachmentIds: string[] = [];
      for (const file of documentFiles) {
        setIndexingLabel(`Đang đọc ${file.name}`);
        setIndexingProgress(0);
        const indexed = await indexAttachment(file, (done, total) => setIndexingProgress(total ? Math.round((done / total) * 100) : 0));
        explicitAttachmentIds.push(indexed.sourceId);
      }
      const explicitAttachmentHits = await searchAttachmentContext(content, explicitAttachmentIds, 8);
      if (documentFiles.length) {
        setIndexes(await listTieuNhiIndexes());
        setIndexingLabel(""); setIndexingProgress(0);
      }

      if (mode === "online") {
        const image = attachments.find((file) => file.type.startsWith("image/"));
        const onlineHistory = permissions.shareWorkspaceWithOnline ? nextUiMessages : nextUiMessages.filter((item) => item.mode === "online");
        const recentContext: PuterChatMessage[] = onlineHistory.slice(-12).map((item) => ({ role: item.role, content: item.content }));
        if (explicitAttachmentHits.length) {
          const lastUser = [...recentContext].reverse().find((item) => item.role === "user");
          if (lastUser && typeof lastUser.content === "string") lastUser.content += contextToPrompt(explicitAttachmentHits);
        }
        const answer = image ? await sendOnlineVision(`${content}${contextToPrompt(explicitAttachmentHits)}`, image) : await sendOnlineWithTools(recentContext);
        appendAssistant(answer, true);
        setAttachments([]);
        setStatus("ready");
        return;
      }

      const hits = await searchWorkspaceContext(content, permissions.scopes, 7);
      const activeTitles = [
        notesInUi.find((item) => item.id === selectedNoteId)?.title,
        projectsInUi.find((item) => item.id === selectedProjectId)?.title,
        chaptersInUi.find((item) => item.id === selectedChapterId)?.title,
      ].filter((value): value is string => Boolean(value));
      const activeHits = activeTitles.length ? await searchWorkspaceContext(activeTitles.join(" "), permissions.scopes, 6) : [];
      const uniqueHits = new Map<string, (typeof hits)[number]>();
      for (const hit of [...explicitAttachmentHits, ...activeHits, ...hits]) uniqueHits.set(`${hit.source}:${hit.sourceId}:${hit.title}`, hit);
      const combinedHits = [...uniqueHits.values()].slice(0, 10);
      const recentContext = nextUiMessages.slice(-8).map(({ role, content: messageContent }) => ({ role, content: messageContent }));
      const systemPrompt = `${BASE_SYSTEM_PROMPT}${activeUiContext}\n- Bạn đang chạy Local, không có function calling. Chỉ dùng dữ liệu truy xuất bên dưới và không giả vờ đã ghi dữ liệu.${contextToPrompt(combinedHits)}`;
      ensureWorker().postMessage({
        type: "generate",
        data: { messages: [{ role: "system", content: systemPrompt }, ...recentContext] },
      });
      setAttachments([]);
    } catch (sendError) {
      setIndexingLabel(""); setIndexingProgress(0);
      appendAssistant(`Tiểu Nhị chưa xử lý được yêu cầu: ${errorMessage(sendError, "Lỗi không xác định.")}`, true);
      setStatus("ready");
    }
  }, [activeUiContext, appendAssistant, attachments, chaptersInUi, ensureWorker, messages, mode, notesInUi, permissions.scopes, permissions.shareWorkspaceWithOnline, projectsInUi, queueAction, selectedChapterId, selectedNoteId, selectedProjectId, sendOnlineVision, sendOnlineWithTools, status]);

  const stopGeneration = useCallback(() => {
    generationRef.current += 1;
    if (mode === "local") {
      workerRef.current?.postMessage({ type: "interrupt" });
      const partial = localAssistantBufferRef.current.trim();
      const id = activeAssistantIdRef.current;
      if (partial && id) void saveTieuNhiMessage({ id, role: "assistant", content: partial, mode: "local" });
      activeAssistantIdRef.current = null;
      localAssistantBufferRef.current = "";
    }
    setStatus("ready");
  }, [mode]);

  const clearConversation = useCallback(async () => {
    if (status === "generating") stopGeneration();
    await clearTieuNhiMessages();
    setMessages([]); setInput(""); setTps(null); setNumTokens(null); setPendingActions([]);
  }, [status, stopGeneration]);

  const confirmAction = useCallback(async (action: TieuNhiWriteAction) => {
    try {
      setStatus("generating");
      const result = await executeTieuNhiWriteAction(action);
      setPendingActions((current) => current.filter((item) => item.id !== action.id));
      appendAssistant(`✓ ${result}`, true);
      const notesState = useNotesStore.getState();
      await notesState.loadNotes(notesState.activeFolderId);
      const projectsState = useProjectsStore.getState();
      await projectsState.loadProjects();
      if (projectsState.selectedProjectId) await projectsState.selectProject(projectsState.selectedProjectId);
      setMemories(await listTieuNhiMemories());
      setLibraryBooks(await listLibraryBooks());
    } catch (actionError) {
      appendAssistant(`Không thực hiện được thao tác: ${errorMessage(actionError, "Lỗi không xác định.")}`, true);
    } finally {
      setStatus("ready");
    }
  }, [appendAssistant]);

  const indexBook = useCallback(async (bookId: string, title: string) => {
    try {
      setIndexingLabel(`Đang lập chỉ mục “${title}”`); setIndexingProgress(0);
      const count = await indexLibraryPdf(bookId, (done, total) => setIndexingProgress(total ? Math.round((done / total) * 100) : 0));
      setIndexes(await listTieuNhiIndexes());
      appendAssistant(`Đã lập chỉ mục “${title}” thành ${count} đoạn để tìm kiếm/RAG.`, true);
    } catch (indexError) {
      setError(errorMessage(indexError, "Không thể lập chỉ mục PDF."));
    } finally {
      setIndexingLabel(""); setIndexingProgress(0);
    }
  }, [appendAssistant]);

  const removeMemory = useCallback(async (id: string) => {
    await forgetTieuNhiMemory(id);
    setMemories(await listTieuNhiMemories());
  }, []);

  const removeIndex = useCallback(async (item: TieuNhiIndexMeta) => {
    await removeTieuNhiIndex(item.sourceType, item.sourceId);
    setIndexes(await listTieuNhiIndexes());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pendingActions]);

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    if (open || mode !== "local" || status !== "ready" || typeof window === "undefined" || window.matchMedia("(min-width: 768px)").matches) return;
    const timer = window.setTimeout(resetAi, 90_000);
    return () => window.clearTimeout(timer);
  }, [mode, open, resetAi, status]);

  const closePanel = () => {
    if (status === "generating") stopGeneration();
    setLauncherOpen(false);
  };

  const ready = status === "ready";
  const generating = status === "generating";
  const modeLabel = mode === "local"
    ? "Qwen3 0.6B · Local WebGPU + RAG"
    : mode === "online"
      ? `${onlineModel || DEFAULT_ONLINE_MODEL} · Tool calling`
      : "Local riêng tư · Online mạnh hơn";

  return (
    <>
      {open && <button type="button" className="tieu-nhi-backdrop" aria-label="Đóng Tiểu Nhị" onClick={closePanel} />}
      {open && (
        <section className="tieu-nhi-panel" role="dialog" aria-modal="true" aria-label="Tiểu Nhị — trợ lý AI">
          <AppearanceLayer target="tieu-nhi" />
          <header className="tieu-nhi-header">
            <div className="tieu-nhi-title">
              <span className="tieu-nhi-avatar" aria-hidden="true"><AppearanceIcon target="tieu-nhi-avatar" className="tieu-nhi-custom-avatar" fallback={<Icon name="spark" size={18} />} /></span>
              <div><strong>Tiểu Nhị</strong><small>{modeLabel}</small></div>
            </div>
            <div className="tieu-nhi-header-actions">
              <button type="button" onClick={() => setSettingsOpen((value) => !value)}>{settingsOpen ? "Chat" : "Thiết lập"}</button>
              {mode && <button type="button" onClick={resetAi}>Đổi AI</button>}
              <button type="button" className="tieu-nhi-icon-button" onClick={closePanel} aria-label="Đóng">×</button>
            </div>
          </header>

          <div className="tieu-nhi-body">
            {settingsOpen ? (
              <div className="tieu-nhi-settings">
                <section>
                  <h3>Quyền đọc dữ liệu</h3>
                  <p>Local dùng dữ liệu trên thiết bị. Online chỉ được gửi dữ liệu ứng dụng ra dịch vụ AI khi bạn bật quyền riêng bên dưới.</p>
                  <div className="tieu-nhi-toggle-grid">
                    {(["notes", "projects", "library", "memory"] as TieuNhiScope[]).map((scope) => (
                      <label key={scope}><input type="checkbox" checked={permissions.scopes.includes(scope)} onChange={() => toggleScope(scope)} /><span>{scope === "notes" ? "Ghi chú" : scope === "projects" ? "Dự án + Story Bible" : scope === "library" ? "Tàng Thư đã lập chỉ mục" : "Memory Tiểu Nhị"}</span></label>
                    ))}
                  </div>
                  <label className="tieu-nhi-online-consent"><input type="checkbox" checked={permissions.shareWorkspaceWithOnline} onChange={(event) => persistPermissions({ ...permissions, shareWorkspaceWithOnline: event.target.checked })} /><span><strong>Cho Tiểu Nhị Online dùng dữ liệu Huyền Bút Các</strong><small>Khi bật, các đoạn liên quan có thể được gửi tới dịch vụ AI bên ngoài để trả lời. Ghi chú khóa vẫn không đọc được nếu chưa mở khóa.</small></span></label>
                </section>

                <section>
                  <h3>Model Online</h3>
                  <label className="tieu-nhi-field"><span>Model Puter</span><input value={onlineModel} onChange={(event) => setOnlineModel(event.target.value)} onBlur={() => void setTieuNhiSetting("online-model", onlineModel || DEFAULT_ONLINE_MODEL)} placeholder={DEFAULT_ONLINE_MODEL} /></label>
                  <small className="tieu-nhi-help">Để mặc định nếu không cần chọn model riêng. Puter có thể yêu cầu đăng nhập/hạn mức theo tài khoản.</small>
                </section>

                <section>
                  <h3>Tàng Thư PDF → RAG</h3>
                  <p>Lập chỉ mục chỉ trích xuất chữ và chia đoạn; model AI không tải cùng ứng dụng. PDF scan không có lớp chữ cần OCR/Online.</p>
                  <div className="tieu-nhi-resource-list">
                    {libraryBooks.filter((book) => book.kind === "pdf").length === 0 && <small>Chưa có PDF trong Tàng Thư.</small>}
                    {libraryBooks.filter((book) => book.kind === "pdf").map((book) => {
                      const indexed = indexes.some((item) => item.sourceType === "library-pdf" && item.sourceId === book.id);
                      return <div key={book.id}><span><strong>{book.title}</strong><small>{indexed ? "Đã lập chỉ mục" : "Chưa lập chỉ mục"}</small></span><button type="button" disabled={Boolean(indexingLabel)} onClick={() => void indexBook(book.id, book.title)}>{indexed ? "Lập lại" : "Lập chỉ mục"}</button></div>;
                    })}
                  </div>
                </section>

                <section>
                  <h3>Tài liệu đã đọc</h3>
                  <div className="tieu-nhi-resource-list">
                    {indexes.length === 0 && <small>Chưa có tài liệu được lập chỉ mục.</small>}
                    {indexes.map((item) => <div key={item.id}><span><strong>{item.title}</strong><small>{item.chunkCount} đoạn · {item.sourceType === "library-pdf" ? "Tàng Thư" : "Tệp đính kèm"}</small></span><button type="button" onClick={() => void removeIndex(item)}>Gỡ</button></div>)}
                  </div>
                </section>

                <section>
                  <h3>Memory lâu dài</h3>
                  <div className="tieu-nhi-resource-list">
                    {memories.length === 0 && <small>Chưa có memory. Có thể nói “Nhớ rằng…” hoặc dùng /remember Nhãn | Nội dung ở Local.</small>}
                    {memories.map((item) => <div key={item.id}><span><strong>{item.label}</strong><small>{item.value}</small></span><button type="button" onClick={() => void removeMemory(item.id)}>Quên</button></div>)}
                  </div>
                </section>
              </div>
            ) : status === "idle" ? (
              <div className="tieu-nhi-welcome">
                <div className="tieu-nhi-seal" aria-hidden="true">AI</div>
                <h2>Tiểu Nhị quản gia</h2>
                <p>Đọc Ghi chú, Dự án, Story Bible, Tàng Thư đã lập chỉ mục; nhớ hội thoại; phân tích tài liệu; và đề xuất thao tác ghi dữ liệu có xác nhận.</p>
                <div className="tieu-nhi-mode-grid">
                  <button type="button" onClick={loadLocalModel}><strong>Local</strong><span>Riêng tư · WebGPU · Qwen3 0.6B</span><small>Không gửi nội dung cho AI ngoài thiết bị.</small></button>
                  <button type="button" onClick={() => void enableOnline()}><strong>Online</strong><span>Tool calling · ảnh · model mạnh</span><small>Không nhúng API key. Quyền đọc dữ liệu app mặc định tắt cho Online.</small></button>
                </div>
                <small>Model Local chỉ tải khi bạn chọn. Trên mobile worker sẽ tự giải phóng sau khi đóng.</small>
              </div>
            ) : status === "checking" || status === "loading" ? (
              <div className="tieu-nhi-loading">
                <div className="tieu-nhi-spinner" />
                <strong>{loadingText || (status === "checking" ? "Đang kiểm tra WebGPU…" : "Đang khởi tạo Tiểu Nhị…")}</strong>
                {progress > 0 && <><div className="tieu-nhi-progress"><span style={{ width: `${progress}%` }} /></div><small>{Math.round(progress)}%</small></>}
              </div>
            ) : status === "unsupported" || status === "error" ? (
              <div className="tieu-nhi-error">
                <strong>{status === "unsupported" ? "AI Local chưa tương thích" : "Tiểu Nhị gặp lỗi"}</strong>
                <p>{error}</p>
                <div className="tieu-nhi-error-actions"><button type="button" onClick={resetAi}>Quay lại</button><button type="button" className="tieu-nhi-primary" onClick={() => void enableOnline()}>Dùng Online</button></div>
              </div>
            ) : (
              <div className="tieu-nhi-chat">
                <div className="tieu-nhi-scope-strip">
                  <span>{mode === "online" && !permissions.shareWorkspaceWithOnline ? "Online chưa được đọc dữ liệu app" : `Nguồn: ${permissions.scopes.length ? permissions.scopes.join(" · ") : "không có"}`}</span>
                  <button type="button" onClick={() => setSettingsOpen(true)}>Quyền & RAG</button>
                </div>
                <div className="tieu-nhi-messages">
                  {messages.length === 0 ? (
                    <div className="tieu-nhi-empty"><p>Bạn có thể hỏi trực tiếp về dữ liệu Huyền Bút Các. Online sẽ dùng tool calling; Local tự truy xuất RAG trước khi trả lời.</p><div className="tieu-nhi-suggestions">{SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => setInput(suggestion)}>{suggestion}</button>)}</div><small>Local lệnh nhanh: /note Tên | Nội dung · /project Tên · /chapter Dự án | Chương | Nội dung · /remember Nhãn | Nội dung</small></div>
                  ) : messages.map((message) => (
                    <article key={message.id} className={`tieu-nhi-message ${message.role === "user" ? "is-user" : "is-assistant"}`}><small>{message.role === "user" ? "Bạn" : "Tiểu Nhị"}</small><div>{message.content || (generating && message.role === "assistant" ? "…" : "")}</div></article>
                  ))}
                  {pendingActions.map((action) => (
                    <div className="tieu-nhi-action-card" key={action.id}><div><strong>Chờ xác nhận</strong><span>{describeTieuNhiAction(action)}</span></div><div><button type="button" disabled={generating} onClick={() => setPendingActions((current) => current.filter((item) => item.id !== action.id))}>Hủy</button><button type="button" className="tieu-nhi-primary" disabled={generating} onClick={() => void confirmAction(action)}>Xác nhận</button></div></div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {(indexingLabel || indexingProgress > 0) && <div className="tieu-nhi-indexing"><span>{indexingLabel}</span><div className="tieu-nhi-progress"><span style={{ width: `${indexingProgress}%` }} /></div></div>}

                <div className="tieu-nhi-attachments">
                  {attachments.map((file, index) => <span key={`${file.name}-${file.lastModified}`}><b>{file.type.startsWith("image/") ? "Ảnh" : "Tệp"}</b> {file.name}<button type="button" aria-label={`Bỏ ${file.name}`} onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button></span>)}
                </div>

                <div className="tieu-nhi-chat-meta"><span>{mode === "local" && tps !== null ? `${tps.toFixed(1)} tok/s${numTokens ? ` · ${numTokens} token` : ""}` : mode === "online" ? `Online · ${onlineModel}` : "Sẵn sàng"}</span><button type="button" onClick={() => void clearConversation()} disabled={generating || messages.length === 0}>Xóa hội thoại</button></div>
                <footer className="tieu-nhi-composer">
                  <input ref={fileInputRef} className="tieu-nhi-file-input" type="file" multiple accept="image/*,.pdf,.docx,.epub,.txt,.md,.markdown,.csv,.json,.xml,.html,.htm" onChange={(event) => { const files = Array.from(event.target.files ?? []).slice(0, 4); setAttachments((current) => [...current, ...files].slice(0, 4)); event.currentTarget.value = ""; }} />
                  <button type="button" className="tieu-nhi-attach" onClick={() => fileInputRef.current?.click()} disabled={generating} aria-label="Đính kèm tệp">＋</button>
                  <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && ready && input.trim()) { event.preventDefault(); void sendMessage(input); } }} placeholder="Hỏi Tiểu Nhị hoặc yêu cầu thao tác…" disabled={generating} />
                  {generating ? <button type="button" className="tieu-nhi-stop" onClick={stopGeneration}>Dừng</button> : <button type="button" className="tieu-nhi-send" onClick={() => void sendMessage(input)} disabled={!ready || !input.trim()}>Gửi</button>}
                </footer>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
