import { beforeEach, describe, expect, it } from "vitest";
import { createTestServer, type TestServer } from "./test-context.ts";

let logged: string[];
let clock: { now: number };
let call: TestServer["call"];

beforeEach(() => {
  clock = { now: Date.UTC(2026, 10, 14) };
  const server = createTestServer(clock);
  logged = server.logged;
  call = server.call;
});

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
    clock.now += 11 * 60_000;

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

  it("changes the profile's name, only for the person signed in", async () => {
    const signUp = await call("POST /api/account/sign-up", ANA);
    const cookie = signUp.cookies?.[0];

    const renamed = await call(
      "POST /api/account/profile",
      { name: "  Ana Lima " },
      cookie,
    );
    const me = await call("GET /api/account/me", undefined, cookie);
    const anonymous = await call("POST /api/account/profile", { name: "X" });

    expect(renamed.body).toMatchObject({ user: { name: "Ana Lima" } });
    expect(me.body).toMatchObject({ user: { name: "Ana Lima" } });
    expect(anonymous.status).toBe(401);
  });

  // The route refuses it; server/api.ts answers the refusal with 400.
  it("refuses an empty name", async () => {
    const signUp = await call("POST /api/account/sign-up", ANA);

    const empty = call(
      "POST /api/account/profile",
      { name: "   " },
      signUp.cookies?.[0],
    );

    await expect(empty).rejects.toMatchObject({ name: "ValiError" });
  });
});
