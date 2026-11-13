import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { buildTokens } from "./scripts/build-tokens.ts";
import { FRAME_HOSTS } from "./src/blocks/embed/embed-hosts.ts";

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

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  // Image blocks show pictures from web addresses, and files kept in the
  // asset store from blob addresses; media and frames will too.
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  // Stored PDFs, and embeds from the allowed hosts only.
  `frame-src blob: ${FRAME_HOSTS.join(" ")}`,
  "object-src 'none'",
  // The service worker and the install manifest come from the app.
  "worker-src 'self'",
  "manifest-src 'self'",
  "base-uri 'none'",
].join("; ");

// The policy is added to the built page only: the dev server injects
// style elements for hot reload, which the policy forbids.
function contentSecurityPolicyPlugin(): Plugin {
  return {
    name: "pagecraft-content-security-policy",
    apply: "build",
    transformIndexHtml: () => [
      {
        tag: "meta",
        attrs: {
          "http-equiv": "Content-Security-Policy",
          content: CONTENT_SECURITY_POLICY,
        },
        injectTo: "head-prepend",
      },
    ],
  };
}

const WORKER_ENTRY = "service-worker";

// The files copied as they are from public/, with their contents, which
// the worker keeps too and whose changes make a new version.
function publicFiles(): { names: string[]; contents: Buffer[] } {
  const names = readdirSync("public").sort();
  return {
    names,
    contents: names.map((name) => readFileSync(resolve("public", name))),
  };
}

// Writes into the service worker the files of this build and a version
// that changes with any of them, so that the browser finds a new worker
// whenever the app changes.
function serviceWorkerPlugin(): Plugin {
  return {
    name: "pagecraft-service-worker",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const worker = Object.values(bundle).find(
        (item) => item.type === "chunk" && item.name === WORKER_ENTRY,
      );
      if (worker?.type !== "chunk") return;
      const kept = publicFiles();
      const files = Object.keys(bundle)
        .filter((name) => name !== worker.fileName && !name.endsWith(".map"))
        .concat(kept.names)
        .sort();
      const hash = createHash("sha256").update(files.join(","));
      for (const content of kept.contents) hash.update(content);
      worker.code = worker.code
        .replace("__PAGECRAFT_BUILD__", hash.digest("hex").slice(0, 12))
        .replace("__PAGECRAFT_FILES__", files.join(","));
    },
  };
}

export default defineConfig({
  plugins: [
    tokensPlugin(),
    contentSecurityPolicyPlugin(),
    serviceWorkerPlugin(),
  ],
  build: {
    target: "baseline-widely-available",
    sourcemap: true,
    assetsInlineLimit: 0,
    rolldownOptions: {
      input: {
        main: resolve("index.html"),
        [WORKER_ENTRY]: resolve("src/app/service-worker.ts"),
      },
      output: {
        // The worker keeps one address across versions; the browser
        // compares its bytes to find a new one.
        entryFileNames: (chunk) =>
          chunk.name === WORKER_ENTRY
            ? `${WORKER_ENTRY}.js`
            : "assets/[name]-[hash].js",
      },
    },
  },
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    setupFiles: ["src/dom-test-setup.ts"],
    environment: "node",
    // A VM context per worker and a fresh window per file: building 140
    // happy-dom environments one per file was half the run (10.2–11.0 s
    // in "threads" against 7.3–7.8 s here, 8.0–8.2 s in "vmForks", on 24
    // cores beside another project's servers, 2026-11-13).
    pool: "vmThreads",
    // Two workers for every three cores: 7.3 s, against 8.2 s at 100 %.
    maxWorkers: "66%",
    css: false,
    restoreMocks: true,
    unstubGlobals: true,
  },
});
