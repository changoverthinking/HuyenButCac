import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../database/db";
import { createMindMap, listMindMaps } from "../features/mind-map/mindMapService";
import { MindMapView } from "../components/mind-map/MindMapView";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | null = null;
let container: HTMLDivElement;

beforeEach(async () => {
  localStorage.clear();
  await db.delete();
  await db.open();
  await createMindMap("Sơ đồ thử nghiệm");
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  vi.restoreAllMocks();
  if (root) act(() => root?.unmount());
  root = null;
  container.remove();
});

async function renderMindMap() {
  root = createRoot(container);
  await act(async () => {
    root?.render(<MindMapView onOpenProject={() => undefined} />);
  });
}

describe("MindMapView — nút Ô tự do trên toolbar", () => {
  it("đổi icon, ẩn và khôi phục nút nhanh", async () => {
    await renderMindMap();

    expect(container.querySelector('button[aria-label="Tạo ô tự do"]')).not.toBeNull();
    expect(container.querySelector(".canvas-add-fab")).toBeNull();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[aria-label="Tùy chỉnh nút tạo ô tự do"]')?.click();
    });
    expect(container.querySelector('button[aria-label="Dùng icon Tâm điểm"]')).not.toBeNull();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[aria-label="Dùng icon Tâm điểm"]')?.click();
    });
    expect(localStorage.getItem("hbc-mindmap-free-node-action-icon")).toBe("target");
    expect(container.querySelector<HTMLButtonElement>('button[aria-label="Tạo ô tự do"]')?.querySelector("circle")).not.toBeNull();

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[aria-label="Ẩn icon tạo ô tự do"]')?.click();
    });
    expect(container.querySelector('button[aria-label="Tạo ô tự do"]')).toBeNull();
    expect(container.querySelector('button[aria-label="Khôi phục nút tạo ô tự do"]')).not.toBeNull();
    expect(localStorage.getItem("hbc-mindmap-free-node-action-visible")).toBe("hidden");

    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[aria-label="Khôi phục nút tạo ô tự do"]')?.click();
    });
    expect(container.querySelector('button[aria-label="Tạo ô tự do"]')).not.toBeNull();
    expect(localStorage.getItem("hbc-mindmap-free-node-action-visible")).toBeNull();
  });
});

describe("MindMapView — xóa sơ đồ cuối", () => {
  it("không tự tạo lại sơ đồ sau khi xóa sơ đồ cuối cùng", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await renderMindMap();

    const deleteButton = container.querySelector<HTMLButtonElement>('button[aria-label="Xóa sơ đồ"]');
    expect(deleteButton).not.toBeNull();

    await act(async () => {
      deleteButton?.click();

      const deadline = Date.now() + 1000;
      while ((await listMindMaps()).length !== 0 && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 5));
      }

      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(await listMindMaps()).toHaveLength(0);
    expect(container.textContent).toContain("Chưa có sơ đồ");
  });
});
