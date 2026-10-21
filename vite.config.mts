/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    VitePWA({
      // Keep CRA's service worker filename so browsers that installed the old
      // worker pick up this one as an update instead of serving a stale cache.
      filename: "service-worker.js",
      registerType: "autoUpdate",
      injectRegister: "script-defer",
      // public/manifest.json is served as-is.
      manifest: false,
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && url.pathname.endsWith(".png"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 50 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
    // Playwright specs live in e2e/ and run separately.
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}", "netlify/functions/**/*.ts"],
      exclude: [
        "**/__tests__/**",
        "src/test/**",
        "src/setupTests.ts",
        "src/vite-env.d.ts",
        "src/main.tsx",
      ],
      reporter: ["text-summary", "html", "json-summary"],
      // Floors just under current coverage, so it can only go up. Wiring
      // (App routing, store setup, Firebase wrappers) is covered by e2e.
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 78,
        lines: 80,
        // Money and state: hold these higher.
        "netlify/functions/*.ts": { statements: 90, lines: 90 },
        "src/features/**": { statements: 90, lines: 90 },
      },
    },
  },
});
