// Mounts the API inside Vite's dev and preview servers, so one process on
// one port serves the app and its server (ADR-0013).
import { resolve } from "node:path";
import type { Connect, Plugin } from "vite";
import { createApi } from "./api.ts";
import { openDatabase } from "./database.ts";
import { ROUTES } from "./routes.ts";
import { PASSWORD_COST } from "./secrets.ts";
import { createEventHub } from "./workspace-events.ts";

export const DATABASE_FILE = resolve(".data/pagecraft.sqlite");

function apiMiddleware(log: (line: string) => void): {
  handle: Connect.NextHandleFunction;
  close: () => void;
} {
  const db = openDatabase(DATABASE_FILE);
  const api = createApi(ROUTES, {
    db,
    now: Date.now,
    log,
    secure: false,
    events: createEventHub(),
    passwordCost: PASSWORD_COST,
  });
  return {
    handle: (request, response, next) => {
      api(request, response).then(
        (done) => {
          if (!done) next();
        },
        (error: unknown) => {
          next(error);
        },
      );
    },
    close: () => {
      db.close();
    },
  };
}

export function apiPlugin(): Plugin {
  return {
    name: "pagecraft-api",
    configureServer(server) {
      // Vitest builds a Vite server too; tests open their own databases.
      if (process.env.VITEST !== undefined) return;
      const api = apiMiddleware((line) => {
        server.config.logger.info(line);
      });
      server.middlewares.use(api.handle);
      server.httpServer?.once("close", api.close);
    },
    configurePreviewServer(server) {
      const api = apiMiddleware((line) => {
        server.config.logger.info(line);
      });
      server.middlewares.use(api.handle);
      server.httpServer.once("close", api.close);
    },
  };
}
