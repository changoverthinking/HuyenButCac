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

describe("Tiên Âm Các — giao diện trong Cài đặt", () => {
  it("không còn player nổi và hiển thị thư viện nhạc dạng nhúng", async () => {
    await renderPlayer();
    expect(container.querySelector(".music-player")).toBeNull();
    expect(container.querySelector(".music-settings-section")).not.toBeNull();
    expect(container.textContent).toContain("Tiên Âm Các");
    expect(container.querySelector('input[type="file"][multiple]')).not.toBeNull();
  });

  it("có đầy đủ điều khiển phát, bài trước/sau, tua, lặp, ngẫu nhiên và âm lượng", async () => {
    await renderPlayer();
    expect(container.querySelector('button[aria-label="Phát"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Bài trước"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Bài tiếp theo"]')).not.toBeNull();
    expect(container.querySelector('input[aria-label="Tua bài hát"]')).not.toBeNull();
    expect(container.querySelector('input[aria-label="Âm lượng"]')).not.toBeNull();
    expect(container.textContent).toContain("Ngẫu nhiên");
    expect(container.textContent).toContain("Không lặp");
  });
});
