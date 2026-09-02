import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SYSTEM_PROMPT = `Bạn là Tiểu Nhị, trợ lý AI cục bộ của Huyền Bút Các.
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

type ChatRole = "user" | "assistant";
type ChatMessage = { id: string; role: ChatRole; content: string };
type AiStatus = "idle" | "checking" | "loading" | "ready" | "generating" | "unsupported" | "error";
type WorkerEventData = {
  status?: string;
  data?: string;
  output?: string;
  progress?: number;
  numTokens?: number;
  tps?: number;
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function TieuNhiLauncher() {
  const [open, setOpen] = useState(false);
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

  const hasWebGpuApi = useMemo(() => typeof navigator !== "undefined" && "gpu" in navigator, []);

  const shutdownWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    pendingLoadRef.current = false;
    setStatus("idle");
    setLoadingText("");
    setProgress(0);
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

  const loadModel = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    pendingLoadRef.current = false;
    setError("");
    setProgress(0);
    setStatus("checking");
    if (!hasWebGpuApi) {
      setStatus("unsupported");
      setError("Thiết bị hoặc trình duyệt này chưa có WebGPU. Tiểu Nhị local không được bật để tránh chạy quá chậm và nóng máy.");
      return;
    }
    pendingLoadRef.current = true;
    ensureWorker().postMessage({ type: "check" });
  }, [ensureWorker, hasWebGpuApi]);

  const sendMessage = useCallback((raw: string) => {
    const content = raw.trim();
    if (!content || status !== "ready") return;
    const userMessage: ChatMessage = { id: makeId("user"), role: "user", content };
    const nextUiMessages = [...messages, userMessage].slice(-30);
    const context = nextUiMessages.slice(-10).map(({ role, content: messageContent }) => ({ role, content: messageContent }));
    setMessages(nextUiMessages);
    setInput("");
    setTps(null);
    setNumTokens(null);
    setStatus("generating");
    ensureWorker().postMessage({
      type: "generate",
      data: { messages: [{ role: "system", content: SYSTEM_PROMPT }, ...context] },
    });
  }, [ensureWorker, messages, status]);

  const stopGeneration = useCallback(() => {
    workerRef.current?.postMessage({ type: "interrupt" });
  }, []);

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

  useEffect(() => {
    if (open || status !== "ready" || typeof window === "undefined" || window.matchMedia("(min-width: 768px)").matches) return;
    const timer = window.setTimeout(shutdownWorker, 90_000);
    return () => window.clearTimeout(timer);
  }, [open, shutdownWorker, status]);

  const closePanel = () => {
    if (status === "generating") stopGeneration();
    setOpen(false);
  };

  const ready = status === "ready";
  const generating = status === "generating";

  return (
    <>
      {open && <button type="button" className="tieu-nhi-backdrop" aria-label="Đóng Tiểu Nhị" onClick={closePanel} />}
      {!open && (
        <button type="button" className="tieu-nhi-fab" onClick={() => setOpen(true)} aria-label="Mở Tiểu Nhị" title="Tiểu Nhị · AI cục bộ">
          <span className="tieu-nhi-fab-mark" aria-hidden="true">Nhị</span>
          <span className="tieu-nhi-fab-copy"><strong>Tiểu Nhị</strong><small>AI LOCAL</small></span>
        </button>
      )}

      {open && (
        <section className="tieu-nhi-panel" role="dialog" aria-modal="true" aria-label="Tiểu Nhị - trợ lý AI">
          <header className="tieu-nhi-header">
            <div className="tieu-nhi-title">
              <span className="tieu-nhi-avatar" aria-hidden="true">Nhị</span>
              <div><strong>Tiểu Nhị</strong><small>Qwen3 0.6B · chạy cục bộ bằng WebGPU</small></div>
            </div>
            <div className="tieu-nhi-header-actions">
              {(ready || generating) && <button type="button" onClick={shutdownWorker} title="Giải phóng AI khỏi RAM">Giải phóng RAM</button>}
              <button type="button" className="tieu-nhi-icon-button" onClick={closePanel} aria-label="Đóng Tiểu Nhị">×</button>
            </div>
          </header>

          <div className="tieu-nhi-body">
            {status === "idle" && (
              <div className="tieu-nhi-welcome">
                <div className="tieu-nhi-seal">Nhị</div>
                <h2>Khai mở Tiểu Nhị</h2>
                <p>Tiểu Nhị dùng Qwen3-0.6B chạy trực tiếp trên thiết bị. Model chỉ tải khi bạn chủ động bật AI, không làm nặng Huyền Bút Các lúc khởi động.</p>
                <div className="tieu-nhi-notice"><strong>Lần đầu cần tải khoảng 570 MB.</strong><span>Nội dung trò chuyện được suy luận trên thiết bị, không gửi tới máy chủ AI.</span></div>
                <button type="button" className="tieu-nhi-primary" onClick={loadModel}>Khai mở Tiểu Nhị</button>
                <small>Khuyến nghị Wi‑Fi và thiết bị có WebGPU. Trên điện thoại, Tiểu Nhị tự giải phóng RAM sau 90 giây khi đóng.</small>
              </div>
            )}

            {(status === "checking" || status === "loading") && (
              <div className="tieu-nhi-loading" aria-live="polite">
                <div className="tieu-nhi-spinner" aria-hidden="true" />
                <strong>{status === "checking" ? "Đang kiểm tra WebGPU…" : loadingText || "Đang tải Tiểu Nhị…"}</strong>
                <div className="tieu-nhi-progress"><span style={{ width: `${progress}%` }} /></div>
                <small>{progress > 0 ? `${Math.round(progress)}%` : "Lần đầu có thể mất một lúc tùy tốc độ mạng."}</small>
              </div>
            )}

            {(status === "unsupported" || status === "error") && (
              <div className="tieu-nhi-error">
                <strong>{status === "unsupported" ? "Thiết bị chưa phù hợp" : "Không thể khởi tạo Tiểu Nhị"}</strong>
                <p>{error}</p>
                <div className="tieu-nhi-error-actions">
                  <button type="button" onClick={shutdownWorker}>Đóng AI local</button>
                  {status === "error" && <button type="button" className="tieu-nhi-primary" onClick={loadModel}>Thử lại</button>}
                </div>
              </div>
            )}

            {(ready || generating) && (
              <div className="tieu-nhi-chat">
                <div className="tieu-nhi-messages">
                  {messages.length === 0 ? (
                    <div className="tieu-nhi-empty">
                      <p>Tiểu Nhị đã sẵn sàng. Bản đầu tập trung vào trò chuyện, viết và phân tích nội dung; chưa tự ý đọc hay sửa dữ liệu Tàng Thư.</p>
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
                  {tps !== null && numTokens !== null && <span>{tps.toFixed(1)} token/s · {numTokens} token</span>}
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
