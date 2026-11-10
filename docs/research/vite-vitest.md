# Vite and Vitest

## Version checked

2026-11-10, Node 22.23.4. `vite@8.3.7` (Rolldown + Lightning CSS), `vitest@5.1.0` (needs Node >= 22.12, Vite >= 6.4 as a peer), `happy-dom@21.0.4`, `jsdom` latest. All snippets were run in a scratch project on a 4-core machine.

## Findings

One `vite.config.ts` serves Vite and Vitest (`defineConfig` from `vitest/config`). No framework plugin is needed; `index.html` at the root with `<script type="module" src="/src/app/main.ts">` is the entry.

```ts
import { relative } from "node:path";
import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";
import { buildTokens } from "./scripts/build-tokens.ts";

function tokensPlugin(): Plugin {
  const isTokenFile = (file: string): boolean =>
    /^tokens\/.+\.json$/.test(relative(process.cwd(), file).replaceAll("\\", "/"));
  return {
    name: "pagecraft-tokens",
    async buildStart() {
      await buildTokens(); // dev start and production build
    },
    configureServer(server) {
      server.watcher.add("tokens"); // outside the module graph, so watch explicitly
      const rebuild = (file: string): void => {
        if (isTokenFile(file)) void buildTokens().catch((error: unknown) => server.config.logger.error(String(error)));
      };
      server.watcher.on("add", rebuild).on("change", rebuild).on("unlink", rebuild);
    },
  };
}

const CONTENT_SECURITY_POLICY =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; object-src 'none'; base-uri 'none'";

function contentSecurityPolicyPlugin(): Plugin {
  return {
    name: "pagecraft-content-security-policy",
    apply: "build",
    transformIndexHtml: () => [
      { tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: CONTENT_SECURITY_POLICY }, injectTo: "head-prepend" },
    ],
  };
}

export default defineConfig({
  plugins: [tokensPlugin(), contentSecurityPolicyPlugin()],
  build: { target: "baseline-widely-available", sourcemap: true, assetsInlineLimit: 0 },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    pool: "threads",
    isolate: false,
    css: false,
    restoreMocks: true,
    unstubGlobals: true,
  },
});
```

- **Tokens plugin, verified:** editing `tokens/base.tokens.json` logged a rebuild and then `hmr update /src/styles/index.css` in the same second. No manual reload message is needed because the generated CSS is in the module graph. Importing `buildTokens` (instead of spawning a process) also makes Vite restart when the script itself changes.
- **CSP, verified:** the built `index.html` contains only `<script type="module" crossorigin src="/assets/...js">` and a `<link rel="stylesheet">`; zero inline scripts or styles. Build took 0.5 s wall.
- **Per-file DOM environment:** `// @vitest-environment happy-dom` as the first line of a view test works in Vitest 5; files without it run in Node (`typeof document === "undefined"` asserted). `projects` is unnecessary for two environments.
- **Fake timers:** `vi.useFakeTimers()` in `beforeEach`, `vi.useRealTimers()` in `afterEach`, `vi.advanceTimersByTime(ms)`, `vi.setSystemTime(date)`. Vitest 5 also fakes `Temporal`; `clearMocks` now defaults to `true`.
- **Speed, measured on 202 files (150 Node, 50 DOM, 4 cores):** `threads` + `isolate: false` 1.8 s; `forks` + `isolate: false` 5.1 s; default (`forks`, isolated) 11.8 s; `threads` isolated 12.3 s. Only the first meets the 10 s budget with headroom.
- **happy-dom vs jsdom:** a single DOM file costs about 0.30 s (happy-dom) vs 0.50 s (jsdom); the same 202-file suite with jsdom took 6.9 s vs 1.8 s. Use happy-dom.
- **Watch mode:** `vitest` without a TTY (background shell, CI) runs once and exits. Use `vitest --watch` explicitly; a rerun after an edit took 42 ms.

## Pitfalls

- `isolate: false` shares module state between test files in a worker. Tests must build their own store through a factory and never import a module-level singleton; no test may leave globals patched (`restoreMocks`, `unstubGlobals` help).
- In dev, Vite injects CSS through `<style>` tags, which `style-src 'self'` blocks. That is why the CSP meta tag is added at build time only. Verify the policy with `vite preview`.
- `style-src 'self'` also blocks inline `style="..."` attributes written by templates; see `security-csp.md` for the allowed ways to set dynamic styles.
- Lightning CSS lowers `light-dark()` to a `--lightningcss-light/dark` variable fallback for the default targets (chrome111, firefox114, safari16.4). It still honours `data-theme`; set `build.cssTarget` (for example `["chrome123", "firefox120", "safari17.5"]`) to keep the native function. Both outputs were checked. This automatic fallback makes the hand-written `@supports` fallback in `web-dark-mode.md` optional.
- Vitest 5 no longer searches parent directories for config, and nested `vi.mock` calls throw.

## Decision it supports

ADR for build and test tooling: single `vite.config.ts`, in-process tokens plugin, build-only CSP meta tag, Vitest `threads` + `isolate: false`, happy-dom via per-file comment, `test:watch` = `vitest --watch`.

## Sources

- https://vite.dev/guide/api-plugin and https://vite.dev/config/build-options
- https://vitest.dev/guide/migration and https://vitest.dev/guide/improving-performance
- https://vitest.dev/guide/environment and https://vitest.dev/guide/mocking/timers
- https://github.com/capricorn86/happy-dom
