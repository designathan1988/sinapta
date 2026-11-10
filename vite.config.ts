import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    target: "baseline-widely-available",
    sourcemap: true,
    assetsInlineLimit: 0,
  },
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    environment: "node",
    pool: "threads",
    isolate: false,
    css: false,
    restoreMocks: true,
    unstubGlobals: true,
  },
});
