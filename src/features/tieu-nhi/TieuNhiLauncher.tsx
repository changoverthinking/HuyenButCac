import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SYSTEM_PROMPT = `Bạn là Tiểu Nhị, trợ lý AI của Huyền Bút Các.
- Mặc định trả lời bằng tiếng Việt, rõ ràng, ngắn gọn và đúng trọng tâm.
- Hỗ trợ viết truyện, xây dựng nhân vật, lập dàn ý, tóm tắt, giải thích, brainstorm và xử lý nội dung người dùng cung cấp.
- Không được giả vờ rằng bạn đã đọc Tàng Thư, ghi chú, dự án hoặc dữ liệu ứng dụng nếu nội dung đó chưa được cung cấp trong cuộc trò chuyện.
- Không được khẳng định đã sửa, xóa, lưu hay điều khiển Huyền Bút Các; phiên bản này chưa được cấp công cụ thao tác dữ liệu.
- Nếu thiếu dữ liệu cần thiết, nói ngắn gọn điều gì còn thiếu.`;

const SUGGESTIONS = [
  "Lập dàn ý cho một chương truyện",
  "Tóm tắt đoạn văn tôi sắp dán",
  "Gợi ý tên và tính cách nhân vật",
];

const PUTER_SCRIPT_ID = "hbc-puter-js";
const PUTER_SCRIPT_URL = "https://js.puter.com/v2/";

type ChatRole = "user" | "assistant";
type ChatMessage = { id: string; role: ChatRole; content: string };
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

type PuterChunk = {
  type?: string;
  text?: string;
  message?: string;
};

type PuterChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type PuterClient = {
  ai: {
    chat: (
      messages: PuterChatMessage[],
      options: { stream: true; max_tokens: number; temperature: number },
    ) => Promise<AsyncIterable<PuterChunk>>;
  };
};

type PuterWindow = Window & { puter?: PuterClient };

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function loadPuter(): Promise<PuterClient> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Tiểu Nhị Online chỉ hoạt động trong trình duyệt."));
  }

  const puterWindow = window as PuterWindow;
  if (puterWindow.puter) return Promise.resolve(puterWindow.puter);

  return new Promise((resolve, reject) => {
    const finish = () => {
      if (puterWindow.puter) resolve(puterWindow.puter);
      else reject(new Error("Không tải được dịch vụ Tiểu Nhị Online."));
    };

    const existing = document.getElementById(PUTER_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("Không tải được Puter.js.")), { once: true });
      window.setTimeout(() => {
        if (!puterWindow.puter) reject(new Error("Kết nối Tiểu Nhị Online quá thời gian chờ."));
      }, 15_000);
      return;
    }

    const script = document.createElement("script");
    script.id = PUTER_SCRIPT_ID;
    script.src = PUTER_SCRIPT_URL;
    script.async = true;
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => reject(new Error("Không tải được Puter.js.")), { once: true });
    document.head.appendChild(script);

    window.setTimeout(() => {
      if (!puterWindow.puter) reject(new Error("Kết nối Tiểu Nhị Online quá thời gian chờ."));
    }, 15_000);
  });
}

export function TieuNhiLauncher() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AiMode>(null);
  const [status, setStatus] = useState<AiStatus>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingText, setLoadingText] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [tps, setTps] = useState<number | null>(null);
  const [numTokens, setNumTokens] = useState<number | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const pendingLoadRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const generationRef = useRef(0);

  const hasWebGpuApi = useMemo(() => typeof navigator !== "undefined" && "gpu" in navigator, []);

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
      case "initiate":
        setStatus("loading");
        break;
      case "progress":
        if (typeof payload.progress === "number") setProgress(Math.max(0, Math.min(100, payload.progress)));
        break;
      case "ready":
        setStatus("ready");
        setLoadingText("");
        setProgress(100);
        setError("");
        break;
      case "start":
        setStatus("generating");
        setMessages((current) => [...current, { id: makeId("assistant"), role: "assistant", content: "" }]);
        break;
      case "update":
        if (typeof payload.tps === "number") setTps(payload.tps);
        if (typeof payload.numTokens === "number") setNumTokens(payload.numTokens);
        if (payload.output) {
          setMessages((current) => {
            const next = [...current];
            const last = next[next.length - 1];
            if (last?.role === "assistant") next[next.length - 1] = { ...last, content: last.content + payload.output };
            return next;
          });
        }
        break;
      case "complete":
        setStatus("ready");
        break;
      case "error":
        setStatus("error");
        setError(payload.data ?? "Tiểu Nhị gặp lỗi khi khởi tạo AI.");
        break;
      default:
        break;
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
    setMode("local");
    setError("");
    setProgress(0);
    setStatus("checking");

    if (!hasWebGpuApi) {
      setStatus("unsupported");
      setError("Trình duyệt này không cung cấp WebGPU. Trên iPhone/iPad, AI local cần iOS/iPadOS 26 trở lên. Bạn vẫn có thể dùng Tiểu Nhị Online.");
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
    setMode("online");
    setError("");
    setProgress(0);
    setLoadingText("Đang kết nối Tiểu Nhị Online…");
    setStatus("loading");

    try {
      await loadPuter();
      setLoadingText("");
      setStatus("ready");
    } catch (onlineError) {
      setStatus("error");
      setError(errorMessage(onlineError, "Không thể kết nối Tiểu Nhị Online."));
    }
  }, []);

  const sendOnline = useCallback(async (context: PuterChatMessage[]) => {
    const generationId = ++generationRef.current;
    setMessages((current) => [...current, { id: makeId("assistant"), role: "assistant", content: "" }]);

    try {
      const puter = await loadPuter();
      const response = await puter.ai.chat(
        [{ role: "system", content: SYSTEM_PROMPT }, ...context],
        { stream: true, max_tokens: 512, temperature: 0.7 },
      );

      for await (const part of response) {
        if (generationRef.current !== generationId) return;
        if (part.type === "error") throw new Error(part.message ?? "Dịch vụ AI trả về lỗi.");

        if (part.type === "text" && part.text) {
          setMessages((current) => {
            const next = [...current];
            const last = next[next.length - 1];
            if (last?.role === "assistant") next[next.length - 1] = { ...last, content: last.content + part.text };
            return next;
          });
        }
      }

      if (generationRef.current === generationId) setStatus("ready");
    } catch (onlineError) {
      if (generationRef.current !== generationId) return;
      const message = errorMessage(onlineError, "Không thể kết nối dịch vụ AI.");
      setMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        if (last?.role === "assistant") {
          next[next.length - 1] = {
            ...last,
            content: `Tiểu Nhị Online chưa trả lời được: ${message}`,
          };
        }
        return next;
      });
      setStatus("ready");
    }
  }, []);

  const sendMessage = useCallback((raw: string) => {
    const content = raw.trim();
    if (!content || status !== "ready" || !mode) return;

    const userMessage: ChatMessage = { id: makeId("user"), role: "user", content };
    const nextUiMessages = [...messages, userMessage].slice(-30);
    const context: PuterChatMessage[] = nextUiMessages.slice(-10).map(({ role, content: messageContent }) => ({
      role,
      content: messageContent,
    }));

    setMessages(nextUiMessages);
    setInput("");
    setTps(null);
    setNumTokens(null);
    setStatus("generating");

    if (mode === "online") {
      void sendOnline(context);
      return;
    }

    ensureWorker().postMessage({
      type: "generate",
      data: { messages: [{ role: "system", content: SYSTEM_PROMPT }, ...context] },
    });
  }, [ensureWorker, messages, mode, sendOnline, status]);

  const stopGeneration = useCallback(() => {
    generationRef.current += 1;
    if (mode === "local") workerRef.current?.postMessage({ type: "interrupt" });
    setStatus("ready");
  }, [mode]);

  const clearConversation = useCallback(() => {
    if (status === "generating") stopGeneration();
    setMessages([]);
    setInput("");
    setTps(null);
    setNumTokens(null);
  }, [status, stopGeneration]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  useEffect(() => () => workerRef.current?.terminate(), []);

  // Đưa Tiểu Nhị vào thanh điều hướng của Huyền Bút Các thay vì dùng nút nổi.
  // Desktop: nằm sát mục Tàng Thư Mật Cảnh/Tài khoản ở chân app rail.
  // Mobile: nút “Nhị” nằm ngay cạnh nút tài khoản trên thanh đầu trang.
  useEffect(() => {
    if (typeof document === "undefined") return;

    const created: HTMLButtonElement[] = [];

    const installDockButtons = () => {
      const accountRail = document.querySelector<HTMLButtonElement>(".app-rail-account:not([data-tieu-nhi-rail])");
      if (accountRail) {
        accountRail.setAttribute("aria-label", "Mở Tàng Thư Mật Cảnh");
        const accountCopy = accountRail.querySelector<HTMLElement>(".app-rail-nav-copy");
        if (accountCopy && accountCopy.dataset.tieuNhiRenamed !== "true") {
          accountCopy.innerHTML = "<span>Tàng Thư Mật Cảnh</span><small>TÀI KHOẢN · BẢO MẬT</small>";
          accountCopy.dataset.tieuNhiRenamed = "true";
        }
      }

      if (accountRail && !document.querySelector("[data-tieu-nhi-rail]")) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "app-rail-account tieu-nhi-nav-entry";
        button.dataset.tieuNhiRail = "true";
        button.setAttribute("aria-label", "Mở Tiểu Nhị");
        button.title = "Tiểu Nhị · Trợ lý AI";
        button.innerHTML = `<span class="app-rail-account-icon" aria-hidden="true"><span style="font-family:serif;font-weight:800;font-size:.82rem">Nhị</span></span><span class="app-rail-nav-copy"><span>Tiểu Nhị</span><small>TRỢ LÝ AI</small></span>`;
        button.addEventListener("click", () => setOpen(true));
        accountRail.parentElement?.insertBefore(button, accountRail);
        created.push(button);
      }

      const mobileAccount = document.querySelector<HTMLButtonElement>(".mobile-topbar button[aria-label='Mở tài khoản']");
      if (mobileAccount && !document.querySelector("[data-tieu-nhi-mobile]")) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mobile-icon-button mystic-icon tieu-nhi-mobile-tab";
        button.dataset.tieuNhiMobile = "true";
        button.setAttribute("aria-label", "Mở Tiểu Nhị");
        button.title = "Tiểu Nhị";
        button.textContent = "Nhị";
        button.style.fontFamily = "serif";
        button.style.fontWeight = "800";
        button.addEventListener("click", () => setOpen(true));
        mobileAccount.parentElement?.insertBefore(button, mobileAccount);
        created.push(button);
      }
    };

    installDockButtons();
    const observer = new MutationObserver(installDockButtons);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      created.forEach((button) => button.remove());
    };
  }, []);

  useEffect(() => {
    if (open || mode !== "local" || status !== "ready" || typeof window === "undefined" || window.matchMedia("(min-width: 768px)").matches) return;
    const timer = window.setTimeout(resetAi, 90_000);
    return () => window.clearTimeout(timer);
  }, [mode, open, resetAi, status]);

  const closePanel = () => {
    if (status === "generating") stopGeneration();
    setOpen(false);
  };

  const ready = status === "ready";
  const generating = status === "generating";
  const modeLabel = mode === "local"
    ? "Qwen3 0.6B · local bằng WebGPU"
    : mode === "online"
      ? "Tiểu Nhị Online · tối ưu cho điện thoại"
      : "Local khi hỗ trợ · Online khi cần";

  return (
    <>
      {open && <button type="button" className="tieu-nhi-backdrop" aria-label="Đóng Tiểu Nhị" onClick={closePanel} />}
      {open && (
        <section className="tieu-nhi-panel" role="dialog" aria-modal="true" aria-label="Tiểu Nhị - trợ lý AI">
          <header className="tieu-nhi-header">
            <div className="tieu-nhi-title">
              <span className="tieu-nhi-avatar" aria-hidden="true">Nhị</span>
              <div><strong>Tiểu Nhị</strong><small>{modeLabel}</small></div>
            </div>
            <div className="tieu-nhi-header-actions">
              {mode === "local" && (ready || generating) && <button type="button" onClick={resetAi} title="Giải phóng AI khỏi RAM">Giải phóng RAM</button>}
              <button type="button" className="tieu-nhi-icon-button" onClick={closePanel} aria-label="Đóng Tiểu Nhị">×</button>
            </div>
          </header>

          <div className="tieu-nhi-body">
            {status === "idle" && (
              <div className="tieu-nhi-welcome">
                <div className="tieu-nhi-seal">Nhị</div>
                <h2>Khai mở Tiểu Nhị</h2>
                <p>Tiểu Nhị tự thích nghi theo thiết bị: máy có WebGPU có thể chạy Qwen3 local; iPhone hoặc trình duyệt không hỗ trợ có thể dùng chế độ Online nhẹ hơn.</p>

                {hasWebGpuApi ? (
                  <>
                    <div className="tieu-nhi-notice">
                      <strong>AI local: riêng tư hơn, lần đầu tải khoảng 570 MB.</strong>
                      <span>Model chỉ tải khi bạn chủ động bật và được chạy trong Web Worker.</span>
                    </div>
                    <div className="tieu-nhi-error-actions">
                      <button type="button" className="tieu-nhi-primary" onClick={loadLocalModel}>Dùng AI local</button>
                      <button type="button" onClick={() => void enableOnline()}>Dùng Online</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="tieu-nhi-notice">
                      <strong>Thiết bị này chưa có WebGPU.</strong>
                      <span>Trên iPhone/iPad, AI local cần iOS/iPadOS 26+. Bạn có thể dùng Online ngay mà không tải model 570 MB.</span>
                    </div>
                    <button type="button" className="tieu-nhi-primary" onClick={() => void enableOnline()}>Dùng Tiểu Nhị Online</button>
                  </>
                )}

                <small>Online dùng Puter.js và không nhúng API key vào GitHub. Puter có thể yêu cầu đăng nhập; nội dung chat sẽ được gửi tới dịch vụ AI bên ngoài và hạn mức/chi phí phụ thuộc tài khoản người dùng.</small>
              </div>
            )}

            {(status === "checking" || status === "loading") && (
              <div className="tieu-nhi-loading" aria-live="polite">
                <div className="tieu-nhi-spinner" aria-hidden="true" />
                <strong>{status === "checking" ? "Đang kiểm tra WebGPU…" : loadingText || "Đang tải Tiểu Nhị…"}</strong>
                {mode === "local" && <div className="tieu-nhi-progress"><span style={{ width: `${progress}%` }} /></div>}
                <small>
                  {mode === "local"
                    ? progress > 0 ? `${Math.round(progress)}%` : "Lần đầu có thể mất một lúc tùy tốc độ mạng."
                    : "Không tải model AI xuống điện thoại."}
                </small>
              </div>
            )}

            {(status === "unsupported" || status === "error") && (
              <div className="tieu-nhi-error">
                <strong>{status === "unsupported" ? "AI local chưa dùng được trên thiết bị này" : "Không thể khởi tạo Tiểu Nhị"}</strong>
                <p>{error}</p>
                <div className="tieu-nhi-error-actions">
                  <button type="button" onClick={resetAi}>Quay lại</button>
                  {mode !== "online" && <button type="button" className="tieu-nhi-primary" onClick={() => void enableOnline()}>Dùng Online</button>}
                  {mode === "online" && <button type="button" className="tieu-nhi-primary" onClick={() => void enableOnline()}>Thử Online lại</button>}
                </div>
              </div>
            )}

            {(ready || generating) && (
              <div className="tieu-nhi-chat">
                <div className="tieu-nhi-messages">
                  {messages.length === 0 ? (
                    <div className="tieu-nhi-empty">
                      <p>
                        {mode === "online"
                          ? "Tiểu Nhị Online đã sẵn sàng. Tin nhắn sẽ được gửi qua Puter tới dịch vụ AI bên ngoài; lần sử dụng đầu có thể yêu cầu đăng nhập."
                          : "Tiểu Nhị local đã sẵn sàng. Nội dung được suy luận trên thiết bị; bản này chưa tự ý đọc hay sửa dữ liệu Tàng Thư."}
                      </p>
                      <div className="tieu-nhi-suggestions">
                        {SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)}>{suggestion}</button>)}
                      </div>
                    </div>
                  ) : messages.map((message) => (
                    <article key={message.id} className={`tieu-nhi-message is-${message.role}`}>
                      <small>{message.role === "user" ? "Bạn" : "Tiểu Nhị"}</small>
                      <div>{message.content || (generating && message.role === "assistant" ? "…" : "")}</div>
                    </article>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="tieu-nhi-chat-meta">
                  <button type="button" onClick={clearConversation} disabled={messages.length === 0}>Xóa đoạn chat</button>
                  {mode === "online" && <span>ONLINE · PUTER</span>}
                  {mode === "local" && tps !== null && numTokens !== null && <span>{tps.toFixed(1)} token/s · {numTokens} token</span>}
                </div>
              </div>
            )}
          </div>

          {(ready || generating) && (
            <footer className="tieu-nhi-composer">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && ready && input.trim()) {
                    event.preventDefault();
                    sendMessage(input);
                  }
                }}
                rows={2}
                maxLength={6000}
                disabled={generating}
                placeholder={generating ? "Tiểu Nhị đang trả lời…" : "Hỏi Tiểu Nhị…"}
                aria-label="Tin nhắn gửi Tiểu Nhị"
              />
              {generating ? (
                <button type="button" className="tieu-nhi-stop" onClick={stopGeneration}>Dừng</button>
              ) : (
                <button type="button" className="tieu-nhi-send" onClick={() => sendMessage(input)} disabled={!input.trim()}>Gửi</button>
              )}
            </footer>
          )}
        </section>
      )}
    </>
  );
}
