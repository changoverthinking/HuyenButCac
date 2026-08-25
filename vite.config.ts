import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { APP_CONFIG } from "./src/app/appConfig.ts";

export default defineConfig({
  base: `/${APP_CONFIG.repository}/`,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.svg"],
      manifest: {
        id: APP_CONFIG.appId,
        name: APP_CONFIG.appNameVi,
        short_name: APP_CONFIG.appNameVi,
        description: "Ghi chú, viết dự án, sơ đồ tư duy và bảng trắng phong cách tu tiên",
        theme_color: "#0b1418",
        background_color: "#0b1418",
        display: "standalone",
        orientation: "portrait",
        start_url: `/${APP_CONFIG.repository}/`,
        scope: `/${APP_CONFIG.repository}/`,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
      },
    }),
  ],
});
