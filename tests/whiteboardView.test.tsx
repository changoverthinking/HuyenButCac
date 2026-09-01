import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../database/db";
import { createWhiteboard, listWhiteboards } from "../features/whiteboard/whiteboardService";
import { WhiteboardView } from "../components/whiteboard/WhiteboardView";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | null = null;
let container: HTMLDivElement;

beforeEach(async () => {
  localStorage.clear();
  await db.delete();
  await db.open();
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  vi.restoreAllMocks();
  if (root) act(() => root?.unmount());
  root = null;
  container.remove();
});

async function renderView() {
  root = createRoot(container);
  await act(async () => {
    root?.render(<WhiteboardView />);
    await Promise.resolve();
  });
}

async function waitFor(predicate: () => boolean, timeoutMs = 1000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate() && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

describe("WhiteboardView — xóa và tạo lại bảng", () => {
  it("không tự tạo bảng khi database chưa có bảng nào", async () => {
    await renderView();
    expect(await listWhiteboards()).toHaveLength(0);
    expect(container.textContent).toContain("Chưa có bảng trắng");
  });

  it("xóa bảng cuối rồi có thể tạo bảng mới ngay từ trạng thái trống", async () => {
    await createWhiteboard("Bảng cuối");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await renderView();

    const deleteButton = container.querySelector<HTMLButtonElement>('button[aria-label="Xóa bảng"]');
    expect(deleteButton).not.toBeNull();

    await act(async () => {
      deleteButton?.click();
      await waitFor(() => container.textContent?.includes("Chưa có bảng trắng") === true);
    });

    expect(await listWhiteboards()).toHaveLength(0);

    const createButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Tạo bảng trắng từ trạng thái trống"]',
    );
    expect(createButton).not.toBeNull();

    await act(async () => {
      createButton?.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      createButton?.click();
      await waitFor(() => (
        container.querySelector<HTMLSelectElement>('select[aria-label="Chọn bảng trắng"]')?.value ?? ""
      ) !== "");
    });

    const boards = await listWhiteboards();
    expect(boards).toHaveLength(1);
    expect(container.querySelector<HTMLSelectElement>('select[aria-label="Chọn bảng trắng"]')?.value).toBe(boards[0].id);
    expect(container.textContent).not.toContain("Bảng cuối cùng đã được xóa");
  });
});
