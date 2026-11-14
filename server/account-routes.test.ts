import { beforeEach, describe, expect, it } from "vitest";
import type { ApiContext } from "./api.ts";
import { openDatabase } from "./database.ts";
import type { ApiRequest, ApiResponse } from "./http-exchange.ts";
import { ROUTES } from "./routes.ts";
import { SESSION_COOKIE } from "./sessions.ts";

let context: ApiContext;
let logged: string[];
let clock: number;

beforeEach(() => {
  logged = [];
  clock = Date.UTC(2026, 10, 14);
  context = {
    db: openDatabase(":memory:"),
    now: () => clock,
    log: (line) => logged.push(line),
    secure: false,
  };
});

async function call(
  key: string,
  body?: unknown,
  cookie?: string,
): Promise<ApiResponse> {
  const [method = "GET", path = "/"] = key.split(" ");
  const token = cookie?.split(";")[0]?.split("=")[1];
  const request: ApiRequest = {
    method,
    path,
    query: new URLSearchParams(),
    cookies: new Map(token === undefined ? [] : [[SESSION_COOKIE, token]]),
    sameOrigin: true,
    body,
  };
  const route = ROUTES[key];
  if (route === undefined) throw new Error(`no route ${key}`);
  return route(request, context);
}

const ANA = {
  email: "Ana@Example.com ",
  password: "correct horse",
  name: "Ana",
};

describe("accounts", () => {
  it("signs up, then knows the user from the session's cookie", async () => {
    const signUp = await call("POST /api/account/sign-up", ANA);
    const me = await call(
      "GET /api/account/me",
      undefined,
      signUp.cookies?.[0],
    );

    expect(signUp.status).toBe(201);
    expect(signUp.cookies?.[0]).toMatch(/HttpOnly; SameSite=Lax/);
    expect(me.body).toMatchObject({
      user: { email: "ana@example.com", name: "Ana" },
    });
  });

  it("signs in with the password and refuses a wrong one", async () => {
    await call("POST /api/account/sign-up", ANA);

    const wrong = await call("POST /api/account/sign-in", {
      email: ANA.email,
      password: "nope",
    });
    const right = await call("POST /api/account/sign-in", {
      email: ANA.email,
      password: ANA.password,
    });

    expect(wrong.status).toBe(401);
    expect(right.status).toBe(200);
  });

  it("refuses a second account on the same address", async () => {
    await call("POST /api/account/sign-up", ANA);

    const again = await call("POST /api/account/sign-up", ANA);

    expect(again.status).toBe(409);
  });

  it("signs in with the code it printed, once, and makes the account", async () => {
    await call("POST /api/account/code", { email: "bia@example.com" });
    const code = /(\d{6})$/.exec(logged[0] ?? "")?.[1] ?? "";

    const first = await call("POST /api/account/code/verify", {
      email: "bia@example.com",
      code,
    });
    const reused = await call("POST /api/account/code/verify", {
      email: "bia@example.com",
      code,
    });

    expect(first.body).toMatchObject({ user: { name: "bia" } });
    expect(reused.status).toBe(401);
  });

  it("refuses a code after ten minutes", async () => {
    await call("POST /api/account/code", { email: "bia@example.com" });
    const code = /(\d{6})$/.exec(logged[0] ?? "")?.[1] ?? "";
    clock += 11 * 60_000;

    const late = await call("POST /api/account/code/verify", {
      email: "bia@example.com",
      code,
    });

    expect(late.status).toBe(401);
  });

  it("ends the session on sign-out", async () => {
    const signUp = await call("POST /api/account/sign-up", ANA);
    const cookie = signUp.cookies?.[0];

    await call("POST /api/account/sign-out", undefined, cookie);
    const me = await call("GET /api/account/me", undefined, cookie);

    expect(me.status).toBe(401);
  });

  it("tells whether an address has an account with a password", async () => {
    await call("POST /api/account/sign-up", ANA);

    const known = await call("POST /api/account/lookup", {
      email: "ana@example.com",
    });
    const unknown = await call("POST /api/account/lookup", {
      email: "zed@example.com",
    });

    expect(known.body).toEqual({ exists: true, hasPassword: true });
    expect(unknown.body).toEqual({ exists: false, hasPassword: false });
  });
});
