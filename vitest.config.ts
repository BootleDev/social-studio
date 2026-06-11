import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Pure unit tests only (no DOM) — node environment keeps the dependency
    // surface minimal (no jsdom needed). Same setup as ad-dashboard /
    // social-dashboard (WEBDEV-210).
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
