import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Locally, E2E_EMAIL / E2E_PASSWORD come from .env.local; in CI from secrets.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const PORT = 4173;
const isCI = !!process.env.CI;

// End-to-end tests against the production build (vite preview). They read
// the live, public product catalogue from Firestore. The sign-in test uses a
// dedicated test account; payments are covered by component tests instead.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
    // The PWA service worker would cache builds between runs.
    serviceWorkers: "block",
    // SLOWMO=700 pauses that many ms between actions, to watch a test run.
    launchOptions: { slowMo: Number(process.env.SLOWMO) || 0 },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
