// A server on an in-memory database for tests: a clock that can move, the
// log kept, and requests made as a browser would.
import type { ApiContext, Outside } from "./api.ts";
import type { PaymentProcessor } from "./payments.ts";
import type { IdentityWeb } from "./oidc-config.ts";
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
  // The Web Push notices sent: the endpoint and the notice.
  readonly pushed: { endpoint: string; payload: string }[];
  // What was posted to connected apps' addresses.
  readonly posted: { url: string; body: unknown }[];
  // The text each address answers with, for a calendar or a provider.
  readonly pages: Map<string, string>;
  // What each address answers a posted form with, as a token endpoint.
  readonly forms: Map<
    string,
    (fields: Readonly<Record<string, string>>) => string | undefined
  >;
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
    cookies: new Map(
      token === undefined || cookie?.startsWith("Bearer ") === true
        ? []
        : [[SESSION_COOKIE, token]],
    ),
    sameOrigin: true,
    host: "pagecraft.test",
    ...(cookie?.startsWith("Bearer ") === true && {
      bearer: cookie.slice("Bearer ".length),
    }),
    body,
    params: {},
  };
}

// The web as tests see it: pages and forms they set, posts they read.
function testWeb() {
  const posted: TestServer["posted"] = [];
  const pages = new Map<string, string>();
  const forms: TestServer["forms"] = new Map();
  const identity: IdentityWeb = {
    getText: (url) => Promise.resolve(pages.get(url.href)),
    postForm: (url, fields) => Promise.resolve(forms.get(url.href)?.(fields)),
  };
  const outside: Outside = {
    getText: (url) => Promise.resolve(pages.get(url.href)),
    postJson: (url, body) => {
      posted.push({ url: url.href, body });
      return Promise.resolve();
    },
  };
  return { posted, pages, forms, identity, outside };
}

export function createTestServer(
  clock = { now: Date.UTC(2026, 10, 14) },
  payments?: PaymentProcessor,
) {
  const logged: string[] = [];
  const pushed: TestServer["pushed"] = [];
  const { posted, pages, forms, identity, outside } = testWeb();
  const context: ApiContext = {
    db: openDatabase(":memory:"),
    now: () => clock.now,
    log: (line) => logged.push(line),
    secure: false,
    events: createEventHub(),
    passwordCost: TEST_PASSWORD_COST,
    push: (subscription, payload) => {
      pushed.push({ endpoint: subscription.endpoint, payload });
      return Promise.resolve();
    },
    identity,
    outside,
    ...(payments !== undefined && { payments }),
  };
  const call: TestServer["call"] = async (key, body, cookie) => {
    const request = requestOf(key, body, cookie);
    const match = matchRoute(ROUTES, request.method, request.path);
    if (match === undefined) throw new Error(`no route ${key}`);
    return match.route({ ...request, params: match.params }, context);
  };
  return {
    context,
    logged,
    pushed,
    posted,
    pages,
    forms,
    call,
  } satisfies TestServer;
}
