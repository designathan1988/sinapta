// What the service worker keeps and how it answers, as plain functions:
// the worker itself only wires them to the browser's events.

const CACHE_PREFIX = "pagecraft-";
const WORKER_FILE = "/service-worker.js";

// Each build fills a cache of its own; the old one goes once the new
// build takes over.
export function cacheNameOf(build: string): string {
  return `${CACHE_PREFIX}${build}`;
}

// The app shell, then the build's files, from their comma-separated list.
export function filesToKeep(files: string): string[] {
  const built = files
    .split(",")
    .filter((file) => file !== "")
    .map((file) => `/${file}`);
  return ["/", ...built];
}

export function oldCaches(names: readonly string[], current: string): string[] {
  return names.filter(
    (name) => name.startsWith(CACHE_PREFIX) && name !== current,
  );
}

export interface RequestFacts {
  readonly url: string;
  readonly mode: string;
  readonly method: string;
}

// A page of the app opens from the app shell; the app's own files come
// from the cache first; anything else goes to the network as usual.
export function servingOf(
  request: RequestFacts,
  origin: string,
): "shell" | "file" | "network" {
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== origin) return "network";
  if (request.mode === "navigate") return "shell";
  return url.pathname === WORKER_FILE ? "network" : "file";
}
