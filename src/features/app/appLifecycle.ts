export type FlushHandler = () => void | Promise<void>;

const flushHandlers = new Set<FlushHandler>();

/**
 * Đăng ký một tác vụ cần hoàn tất trước khi app reload/cập nhật.
 * Hàm trả về cleanup để component gỡ đăng ký khi unmount.
 */
export function registerBeforeReloadFlush(handler: FlushHandler) {
  flushHandlers.add(handler);
  return () => { flushHandlers.delete(handler); };
}

/**
 * Chờ toàn bộ autosave/pending write đang mở hoàn tất trước khi reload.
 * Dùng allSettled để tất cả handler đều được chạy; cuối cùng vẫn báo lỗi tổng hợp
 * nếu có ít nhất một handler thất bại để update không tiếp tục âm thầm.
 */
export async function flushPendingWrites() {
  const handlers = [...flushHandlers];
  if (!handlers.length) return;
  const results = await Promise.allSettled(handlers.map((handler) => Promise.resolve().then(handler)));
  const failed = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (failed) {
    const message = failed.reason instanceof Error ? failed.reason.message : "Có dữ liệu đang lưu chưa hoàn tất.";
    throw new Error(`Không thể cập nhật lúc này: ${message}`);
  }
}

export function pendingFlushHandlerCount() {
  return flushHandlers.size;
}
