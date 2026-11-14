// The server's request handler: finds the route for a request under /api,
// refuses cross-site changes, and turns failures into answers.
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Database } from "./database.ts";
import type { PushSender } from "./push.ts";
import { matchRoute } from "./route-match.ts";
import type { EventHub } from "./workspace-events.ts";
import {
  readRequest,
  writeResponse,
  type ApiRequest,
  type ApiResponse,
} from "./http-exchange.ts";

export interface ApiContext {
  readonly db: Database;
  readonly now: () => number;
  readonly log: (line: string) => void;
  // Cookies carry Secure when the server is reached over HTTPS.
  readonly secure: boolean;
  // The clients listening to each workspace.
  readonly events: EventHub;
  // scrypt's cost for new password hashes.
  readonly passwordCost: number;
  // Sends Web Push notices; none, and no notice leaves the server.
  readonly push?: PushSender;
}

export type Route = (
  request: ApiRequest,
  context: ApiContext,
) => ApiResponse | Promise<ApiResponse>;

export type RouteTable = Readonly<Record<string, Route>>;

const SAFE_METHODS = new Set(["GET", "HEAD"]);

export function answer(status: number, body?: unknown): ApiResponse {
  return body === undefined ? { status } : { status, body };
}

function failure(error: unknown, context: ApiContext): ApiResponse {
  if (error instanceof SyntaxError) return answer(400, { error: "bad-json" });
  if (error instanceof RangeError) return answer(413, { error: "too-large" });
  if (error instanceof Error && error.name === "ValiError") {
    return answer(400, { error: "bad-request" });
  }
  context.log(`api error: ${String(error)}`);
  return answer(500, { error: "server" });
}

async function route(
  routes: RouteTable,
  request: ApiRequest,
  context: ApiContext,
): Promise<ApiResponse> {
  const match = matchRoute(routes, request.method, request.path);
  if (match === undefined) return answer(404, { error: "not-found" });
  // The public API is called by programs with a secret, not by a page.
  const isPublicApi = request.path.startsWith("/v1/");
  if (
    !SAFE_METHODS.has(request.method) &&
    !request.sameOrigin &&
    !isPublicApi
  ) {
    return answer(403, { error: "cross-origin" });
  }
  return match.route({ ...request, params: match.params }, context);
}

// Answers requests under /api and the public API's /v1, and reports
// whether it did, so that a dev
// server or a file server can take the others.
export function createApi(
  routes: RouteTable,
  context: ApiContext,
): (request: IncomingMessage, response: ServerResponse) => Promise<boolean> {
  return async (incoming, response) => {
    const url = incoming.url ?? "";
    if (!url.startsWith("/api/") && !url.startsWith("/v1/")) return false;
    let result: ApiResponse;
    try {
      result = await route(routes, await readRequest(incoming), context);
    } catch (error) {
      result = failure(error, context);
    }
    writeResponse(response, result);
    return true;
  };
}
