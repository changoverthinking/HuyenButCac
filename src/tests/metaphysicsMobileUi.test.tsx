import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HuyenHocPanel } from "../components/metaphysics/HuyenHocPanel";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | null = null;
let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  container.remove();
});

async function openTuVi() {
  await act(async () => {
    root?.render(<HuyenHocPanel />);
  });
  const tab = [...container.querySelectorAll<HTMLButtonElement>("button")]
    .find((button) => button.textContent?.includes("Tử Vi"));
  expect(tab).not.toBeUndefined();
  await act(async () => {
    tab?.click();
  });
}

describe("Tử Vi mobile input stability", () => {
  it("giữ nguyên form khi date input tạm rỗng thay vì unmount toàn module", async () => {
    await openTuVi();
    const dateInput = container.querySelector<HTMLInputElement>('input[type="date"]');
    expect(dateInput).not.toBeNull();

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(dateInput, "");
      dateInput?.dispatchEvent(new Event("input", { bubbles: true }));
      dateInput?.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(container.querySelector<HTMLInputElement>('input[type="date"]')).not.toBeNull();
    expect(container.textContent).toContain("Ngày giờ sinh chưa hợp lệ");
  });
});
