import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";

/**
 * vite-plugin-pwa cung cấp `virtual:pwa-register/react` khi build/dev thông qua
 * VitePWA plugin. Vitest không nạp plugin PWA nên module ảo này không tồn tại.
 * Mock tối thiểu ở tầng transform để các test component có thể import phần
 * Cập nhật an toàn mà không khởi tạo Service Worker thật trong jsdom.
 */
function virtualPwaRegisterMock(): Plugin {
  const publicId = "virtual:pwa-register/react";
  const resolvedId = `\0${publicId}`;

  return {
    name: "hbc-vitest-virtual-pwa-register",
    enforce: "pre",
    resolveId(id) {
      return id === publicId ? resolvedId : null;
    },
    load(id) {
      if (id !== resolvedId) return null;
      return `
        export function useRegisterSW() {
          return {
            needRefresh: [false, function () {}],
            offlineReady: [false, function () {}],
            updateServiceWorker: async function () {},
          };
        }
      `;
    },
  };
}

export default defineConfig({
  plugins: [virtualPwaRegisterMock(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    globals: true,
  },
});
