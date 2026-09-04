import { describe, expect, it, vi } from "vitest";
import { flushPendingWrites, pendingFlushHandlerCount, registerBeforeReloadFlush } from "../features/app/appLifecycle";

describe("appLifecycle", () => {
  it("chờ tất cả autosave đã đăng ký trước reload", async () => {
    const order: string[] = [];
    const cleanupA = registerBeforeReloadFlush(async () => { await Promise.resolve(); order.push("a"); });
    const cleanupB = registerBeforeReloadFlush(() => { order.push("b"); });
    expect(pendingFlushHandlerCount()).toBeGreaterThanOrEqual(2);
    await flushPendingWrites();
    expect(order.sort()).toEqual(["a", "b"]);
    cleanupA(); cleanupB();
  });

  it("không cho update âm thầm nếu autosave thất bại", async () => {
    const cleanup = registerBeforeReloadFlush(vi.fn(async () => { throw new Error("save failed"); }));
    await expect(flushPendingWrites()).rejects.toThrow("save failed");
    cleanup();
  });
});
