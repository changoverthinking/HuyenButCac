import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../database/db";
import { MusicPlayer } from "../components/music/MusicPlayer";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | null = null;
let container: HTMLDivElement;
const nativeLoad = HTMLMediaElement.prototype.load;

beforeEach(async () => {
  localStorage.clear();
  await db.delete();
  await db.open();
  Object.defineProperty(HTMLMediaElement.prototype, "load", {
    configurable: true,
    value: () => undefined,
  });
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  container.remove();
  Object.defineProperty(HTMLMediaElement.prototype, "load", {
    configurable: true,
    value: nativeLoad,
  });
});

async function renderPlayer() {
  root = createRoot(container);
  await act(async () => {
    root?.render(<MusicPlayer />);
  });
}

describe("MusicPlayer — mở và đóng Tiên Âm Các", () => {
  it("không còn nút nhạc nổi; vẫn mở từ menu và đóng bằng nút desktop", async () => {
    await renderPlayer();

    // Theo yêu cầu UI mới, nút nổi "Mở Tiên Âm Các" đã bị loại bỏ hoàn toàn.
    expect(container.querySelector('button[aria-label="Mở Tiên Âm Các"]')).toBeNull();
    expect(container.querySelector('button[aria-label="Đóng Tiên Âm Các"]')).toBeNull();

    // Sidebar/menu phát sự kiện này để mở Tiên Âm Các.
    await act(async () => {
      window.dispatchEvent(new CustomEvent("hbc-toggle-music"));
    });
    expect(container.querySelector('button[aria-label="Đóng Tiên Âm Các"]')).not.toBeNull();

    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('button[aria-label="Đóng Tiên Âm Các"]')
        ?.click();
    });

    expect(container.querySelector('button[aria-label="Đóng Tiên Âm Các"]')).toBeNull();
    expect(container.querySelector('button[aria-label="Mở Tiên Âm Các"]')).toBeNull();
  });

  it("đồng bộ với nút Tiên Âm Các ở sidebar và phím Escape", async () => {
    await renderPlayer();

    await act(async () => {
      window.dispatchEvent(new CustomEvent("hbc-toggle-music"));
    });
    expect(container.querySelector('button[aria-label="Đóng Tiên Âm Các"]')).not.toBeNull();

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });

    expect(container.querySelector('button[aria-label="Đóng Tiên Âm Các"]')).toBeNull();
    expect(container.querySelector('button[aria-label="Mở Tiên Âm Các"]')).toBeNull();
  });
});
