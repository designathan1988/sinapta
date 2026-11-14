// A server on an in-memory database for tests: a clock that can move, the
// log kept, and requests made as a browser would.
import type { ApiContext } from "./api.ts";
import { openDatabase } from "./database.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import { matchRoute } from "./route-match.ts";
import { ROUTES } from "./routes.ts";
import { TEST_PASSWORD_COST } from "./secrets.ts";
import { SESSION_COOKIE } from "./sessions.ts";
import { createEventHub } from "./workspace-events.ts";

export interface TestServer {
  readonly context: ApiContext;
  readonly logged: string[];
  readonly call: (
    key: string,
    body?: unknown,
    cookie?: string,
  ) => Promise<ApiResponse>;
}

function requestOf(key: string, body: unknown, cookie?: string): ApiRequest {
  const [method = "GET", target = "/"] = key.split(" ");
  const url = new URL(target, "http://pagecraft.test");
  const token = cookie?.split(";")[0]?.split("=")[1];
  return {
    method,
    path: url.pathname,
    query: url.searchParams,
    cookies: new Map(token === undefined ? [] : [[SESSION_COOKIE, token]]),
    sameOrigin: true,
    body,
    params: {},
  };
}

export function createTestServer(clock = { now: Date.UTC(2026, 10, 14) }) {
  const logged: string[] = [];
  const context: ApiContext = {
    db: openDatabase(":memory:"),
    now: () => clock.now,
    log: (line) => logged.push(line),
    secure: false,
    events: createEventHub(),
    passwordCost: TEST_PASSWORD_COST,
  };
  const call: TestServer["call"] = async (key, body, cookie) => {
    const request = requestOf(key, body, cookie);
    const match = matchRoute(ROUTES, request.method, request.path);
    if (match === undefined) throw new Error(`no route ${key}`);
    return match.route({ ...request, params: match.params }, context);
  };
  return { context, logged, call } satisfies TestServer;
}
