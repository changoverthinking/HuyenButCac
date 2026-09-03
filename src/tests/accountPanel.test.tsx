import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AccountPanel } from "../components/auth/AccountPanel";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let root: Root | null = null;
let container: HTMLDivElement;

beforeEach(() => {
  localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  if (root) act(() => root?.unmount());
  root = null;
  container.remove();
  document.body.querySelectorAll(".account-modal-backdrop").forEach((node) => node.remove());
});

async function renderPanel() {
  root = createRoot(container);
  await act(async () => {
    root?.render(<AccountPanel open onClose={() => undefined} />);
  });
}

function getAccountDialog(): HTMLElement {
  const dialog = document.body.querySelector<HTMLElement>(
    '[role="dialog"][aria-label="Tàng Thư Mật Cảnh"]',
  );
  if (!dialog) throw new Error("AccountPanel portal chưa được render vào document.body");
  return dialog;
}

describe("AccountPanel login UX", () => {
  it("ẩn/hiện mật khẩu mà không thay đổi giá trị", async () => {
    await renderPanel();
    const dialog = getAccountDialog();
    const password = dialog.querySelector<HTMLInputElement>('input[name="password"]');
    const toggle = dialog.querySelector<HTMLButtonElement>('button[aria-label="Hiện mật khẩu"]');

    expect(password).not.toBeNull();
    expect(toggle).not.toBeNull();

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      valueSetter?.call(password, "mat-khau-an-toan");
      password?.dispatchEvent(new Event("input", { bubbles: true }));
    });

    await act(async () => {
      toggle?.click();
    });

    expect(password?.type).toBe("text");
    expect(password?.value).toBe("mat-khau-an-toan");
  });

  it("điền sẵn email đã ghi nhớ", async () => {
    localStorage.setItem("hbc-remembered-email", "user@example.com");
    await renderPanel();
    const dialog = getAccountDialog();

    expect(
      dialog.querySelector<HTMLInputElement>('input[name="email"]')?.value,
    ).toBe("user@example.com");
    expect(
      dialog.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked,
    ).toBe(true);
  });
});
