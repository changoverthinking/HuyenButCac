export type FlushHandler = () => void | Promise<void>;

const flushHandlers = new Set<FlushHandler>();
const pendingWrites = new Set<Promise<unknown>>();
const FLUSH_TIMEOUT_MS = 20_000;

/**
 * Đăng ký một tác vụ cần hoàn tất trước khi app reload/cập nhật.
 * Hàm trả về cleanup để component gỡ đăng ký khi unmount.
 */
export function registerBeforeReloadFlush(handler: FlushHandler) {
  flushHandlers.add(handler);
  return () => { flushHandlers.delete(handler); };
}

/**
 * Đưa một Promise ghi nền (IndexedDB/Dexie) vào hàng đợi an toàn.
 * Hàm vẫn trả về chính Promise ban đầu để caller có thể await/catch như trước.
 */
export function trackPendingWrite<T>(operation: Promise<T>): Promise<T> {
  const tracked = Promise.resolve(operation);
  pendingWrites.add(tracked);
  // Gắn cả nhánh reject để Promise fire-and-forget không tạo unhandled rejection,
  // trong khi caller await `tracked` vẫn nhận lỗi gốc.
  void tracked.then(
    () => pendingWrites.delete(tracked),
    () => pendingWrites.delete(tracked),
  );
  return tracked;
}

function withTimeout<T>(operation: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = globalThis.setTimeout(() => reject(new Error("Hết thời gian chờ dữ liệu đang lưu. Hãy thử lại sau vài giây.")), ms);
    operation.then(
      (value) => { globalThis.clearTimeout(timer); resolve(value); },
      (error) => { globalThis.clearTimeout(timer); reject(error); },
    );
  });
}

async function flushRound() {
  const handlers = [...flushHandlers];
  const writes = [...pendingWrites];
  const results = await Promise.allSettled([
    ...handlers.map((handler) => Promise.resolve().then(handler)),
    ...writes,
  ]);
  const failed = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (failed) {
    const message = failed.reason instanceof Error ? failed.reason.message : "Có dữ liệu đang lưu chưa hoàn tất.";
    throw new Error(`Không thể cập nhật lúc này: ${message}`);
  }
}

/**
 * Chờ toàn bộ autosave/pending write đang mở hoàn tất trước khi reload.
 * Lặp thêm vòng nếu flush handler vừa tạo ra một IndexedDB write mới.
 */
export async function flushPendingWrites() {
  const run = async () => {
    for (let pass = 0; pass < 6; pass += 1) {
      await flushRound();
      // Nhường một microtask để `.finally`/Dexie queue cập nhật pendingWrites.
      await Promise.resolve();
      if (pendingWrites.size === 0) return;
    }
    if (pendingWrites.size > 0) throw new Error("Vẫn còn dữ liệu đang lưu. Hãy thử cập nhật lại sau vài giây.");
  };
  await withTimeout(run(), FLUSH_TIMEOUT_MS);
}

/**
 * Chuẩn bị reload/update: blur ô đang nhập để onBlur tạo write trước, rồi flush tất cả.
 */
export async function prepareForReload() {
  if (typeof document !== "undefined") {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) active.blur();
  }
  await Promise.resolve();
  await flushPendingWrites();
}

export function pendingFlushHandlerCount() {
  return flushHandlers.size;
}

export function pendingWriteCount() {
  return pendingWrites.size;
}
