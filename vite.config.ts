import { relative } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { buildTokens } from "./scripts/build-tokens.ts";

function isTokenFile(file: string): boolean {
  const path = relative(process.cwd(), file).replaceAll("\\", "/");
  return /^tokens\/.+\.json$/.test(path);
}

async function rebuildTokens(report: (message: string) => void): Promise<void> {
  const result = await buildTokens();
  if (result.ok) return;
  for (const error of result.errors) {
    report(`tokens: ${error.path}: ${error.message}`);
  }
}

// Regenerates the token stylesheet at startup and when a token file changes.
function tokensPlugin(): Plugin {
  return {
    name: "pagecraft-tokens",
    async buildStart() {
      const isBuild = this.environment.config.command === "build";
      await rebuildTokens((message) => {
        // A bad token file fails a build but must not stop a watcher.
        if (isBuild) this.error(message);
        else this.warn(message);
      });
    },
    configureServer(server) {
      server.watcher.add("tokens");
      const onChange = (file: string): void => {
        if (!isTokenFile(file)) return;
        void rebuildTokens((message) => {
          server.config.logger.error(message);
        });
      };
      server.watcher.on("add", onChange).on("change", onChange);
    },
  };
}

export default defineConfig({
  plugins: [tokensPlugin()],
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
