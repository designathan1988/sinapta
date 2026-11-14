// `npm run serve`: the built app and its API on one port, without Vite.
// The port is PORT, or 5199.
import { webPushSender } from "./push.ts";
import { webOutside } from "./outside.ts";
import { webIdentity } from "./oidc-config.ts";
import { registeredProcessor } from "./stripe.ts";
import { readFile } from "node:fs/promises";
import { createServer, type ServerResponse } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { createApi } from "./api.ts";
import { openDatabase } from "./database.ts";
import { ROUTES } from "./routes.ts";
import { PASSWORD_COST } from "./secrets.ts";
import { DATABASE_FILE } from "./vite-plugin.ts";
import { createEventHub } from "./workspace-events.ts";

const DIST = resolve("dist");
const TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

// A file of the build, or the page itself for any address the app routes.
async function sendFile(path: string, response: ServerResponse): Promise<void> {
  const safe = normalize(path).replace(/^([/\\])+/, "");
  const file = join(DIST, safe);
  const inside = file.startsWith(DIST) && extname(file) !== "";
  const target = inside ? file : join(DIST, "index.html");
  try {
    const body = await readFile(target);
    response.setHeader(
      "Content-Type",
      TYPES[extname(target)] ?? "application/octet-stream",
    );
    response.end(body);
  } catch {
    response.setHeader("Content-Type", TYPES[".html"] ?? "text/html");
    response.end(await readFile(join(DIST, "index.html")));
  }
}

const db = openDatabase(DATABASE_FILE);
const api = createApi(ROUTES, {
  db,
  now: Date.now,
  log: (line) => {
    console.log(line);
  },
  secure: false,
  events: createEventHub(),
  passwordCost: PASSWORD_COST,
  push: webPushSender,
  outside: webOutside,
  identity: webIdentity,
  payments: registeredProcessor(),
});
const port = Number(process.env.PORT ?? "5199");

createServer((request, response) => {
  void api(request, response).then(async (done) => {
    if (done) return;
    const path = new URL(request.url ?? "/", "http://pagecraft.local").pathname;
    await sendFile(decodeURIComponent(path), response);
  });
}).listen(port, "127.0.0.1", () => {
  console.log(`Pagecraft on http://127.0.0.1:${String(port)}`);
});
