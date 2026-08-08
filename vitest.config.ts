import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./__tests__/setup.ts",
    // Playwright owns `e2e/`. Without this, Vitest tries to collect those specs
    // and fails on the `@playwright/test` fixtures it cannot provide.
    exclude: ["node_modules/**", "dist/**", ".next/**", "e2e/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      // `server-only` throws unless it is resolved under React's `react-server`
      // condition, which only Next.js applies. Server modules are exercised
      // directly in tests, so the guard is stubbed out here. It still does its
      // job in the real build, where a client import of these modules fails.
      "server-only": path.resolve(__dirname, "./__tests__/stubs/server-only.ts"),
    },
  },
});
