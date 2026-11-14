// The app's service worker, built as an entry of its own. It keeps the app
// shell and every file of its build in a cache named by the build, answers
// from that cache first so the app opens without a network, and takes
// over from an older version only when the page asks. The build writes
// its version and file list in place of the two markers below.
import {
  cacheNameOf,
  filesToKeep,
  oldCaches,
  servingOf,
} from "./offline-cache.ts";
import { isPushScope, listenForPush } from "./service-worker-push.ts";

const BUILD = "__PAGECRAFT_BUILD__";
const FILES = "__PAGECRAFT_FILES__";
const CACHE = cacheNameOf(BUILD);
const SHELL = "/";

// The worker's events, which the page's type library does not describe.
interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

interface FetchEvent extends ExtendableEvent {
  readonly request: Request;
  respondWith(response: Promise<Response>): void;
}

interface WorkerScope {
  readonly location: { readonly origin: string };
  readonly clients: { claim(): Promise<void> };
  skipWaiting(): Promise<void>;
  addEventListener(
    type: "install" | "activate",
    listener: (event: ExtendableEvent) => void,
  ): void;
  addEventListener(type: "fetch", listener: (event: FetchEvent) => void): void;
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<unknown>) => void,
  ): void;
}

function isWorkerScope(scope: unknown): scope is WorkerScope {
  return (
    typeof scope === "object" &&
    scope !== null &&
    "skipWaiting" in scope &&
    "clients" in scope
  );
}

function isSkipWaiting(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    data.type === "skip-waiting"
  );
}

async function keepFiles(): Promise<void> {
  const cache = await caches.open(CACHE);
  await cache.addAll(filesToKeep(FILES));
}

async function dropOldCaches(scope: WorkerScope): Promise<void> {
  const names = await caches.keys();
  await Promise.all(oldCaches(names, CACHE).map((name) => caches.delete(name)));
  await scope.clients.claim();
}

// The kept answer, or the network's, kept for next time.
async function fromCache(request: Request, key: string): Promise<Response> {
  const kept = await caches.match(key, { cacheName: CACHE });
  if (kept !== undefined) return kept;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(key, response.clone());
  }
  return response;
}

function start(scope: WorkerScope): void {
  scope.addEventListener("install", (event) => {
    event.waitUntil(keepFiles());
  });
  scope.addEventListener("activate", (event) => {
    event.waitUntil(dropOldCaches(scope));
  });
  scope.addEventListener("fetch", (event) => {
    const { request } = event;
    const serving = servingOf(request, scope.location.origin);
    if (serving === "network") return;
    event.respondWith(
      fromCache(request, serving === "shell" ? SHELL : request.url),
    );
  });
  scope.addEventListener("message", (event) => {
    if (isSkipWaiting(event.data)) void scope.skipWaiting();
  });
}

const scope: unknown = globalThis;
if (isWorkerScope(scope)) start(scope);
if (isPushScope(scope)) listenForPush(scope);
