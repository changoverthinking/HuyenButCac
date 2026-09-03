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
        description: "Ghi chú, viết dự án, sơ đồ tư duy, bảng trắng và Lịch Vạn Niên phong cách tu tiên",
        theme_color: "#0b1418",
        background_color: "#0b1418",
        display: "standalone",
        orientation: "any",
        start_url: `/${APP_CONFIG.repository}/`,
        scope: `/${APP_CONFIG.repository}/`,
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          { name: "Lịch hôm nay", short_name: "Hôm nay", description: "Mở Lịch Vạn Niên tại ngày hôm nay", url: `/${APP_CONFIG.repository}/?mode=calendar&calendar=today`, icons: [{ src: "icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
          { name: "Đặt lịch mới", short_name: "Đặt lịch", description: "Tạo nhanh ghi chú và lịch hẹn", url: `/${APP_CONFIG.repository}/?mode=calendar&calendar=new`, icons: [{ src: "icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        importScripts: ["push-sw.js"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/pdfjs-dist@/i,
            handler: "CacheFirst",
            options: {
              cacheName: "hbc-pdf-runtime-v1",
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/jszip@/i,
            handler: "CacheFirst",
            options: {
              cacheName: "hbc-document-runtime-v1",
              expiration: { maxEntries: 6, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/@huggingface\/transformers@/i,
            handler: "CacheFirst",
            options: {
              cacheName: "hbc-ai-runtime-v1",
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
