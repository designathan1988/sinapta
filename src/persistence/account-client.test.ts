import { describe, expect, it } from "vitest";
import {
  accountCommands,
  createAppStore,
  createCommandRegistry,
  createDispatcher,
  createInitialState,
  requestAccount,
  type AccountRequest,
  type AppStore,
} from "../state/index.ts";
import { startAccount, type Fetch } from "./account-client.ts";

interface Call {
  readonly path: string;
  readonly body: unknown;
}

// A server that answers each path with a status and a body.
function fakeServer(answers: Record<string, readonly [number, unknown?]>): {
  send: Fetch;
  calls: Call[];
} {
  const calls: Call[] = [];
  const send: Fetch = (input, init) => {
    const path = typeof input === "string" ? input : "";
    const body: unknown =
      typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    calls.push({ path, body });
    const [status, reply] = answers[path] ?? [404];
    const text = reply === undefined ? "" : JSON.stringify(reply);
    return Promise.resolve(
      new Response(status === 204 ? null : text, { status }),
    );
  };
  return { send, calls };
}

function setup(send: Fetch): {
  store: AppStore;
  start: Promise<void>;
  ask: (r: AccountRequest) => Promise<void>;
} {
  const store = createAppStore(createInitialState());
  const dispatch = createDispatcher({
    store,
    registry: createCommandRegistry(accountCommands),
  });
  const start = startAccount({ store, dispatch, send });
  // Asks, and settles when the answer is in the store.
  const ask = (request: AccountRequest) =>
    new Promise<void>((resolve) => {
      const stop = store.subscribe((state) => {
        if (state.persistence.account.request !== null) return;
        stop();
        resolve();
      });
      dispatch(requestAccount.create({ request }));
    });
  return { store, start, ask };
}

const ADA = { id: "u1", email: "ada@pagecraft.test", name: "Ada", photo: null };

describe("the account client", () => {
  it("shows the sign-in screen when no one is signed in", async () => {
    const { send } = fakeServer({
      "/api/account/me": [401, { error: "signed-out" }],
    });
    const { store, start } = setup(send);
    await start;

    expect(store.getState().persistence.account.status).toBe("signed-out");
  });

  it("stays on the browser's copy when no server answers", async () => {
    const { store, start } = setup(() =>
      Promise.reject(new TypeError("offline")),
    );
    await start;

    expect(store.getState().persistence.account.status).toBe("local");
  });

  it("asks for a password for an address that has one", async () => {
    const { send } = fakeServer({
      "/api/account/me": [401],
      "/api/account/lookup": [200, { exists: true, hasPassword: true }],
    });
    const { store, start, ask } = setup(send);
    await start;

    await ask({ kind: "lookup", email: "ada@pagecraft.test" });

    expect(store.getState().persistence.account).toMatchObject({
      step: "password",
      email: "ada@pagecraft.test",
    });
  });

  it("asks a new address for its profile", async () => {
    const { send } = fakeServer({
      "/api/account/me": [401],
      "/api/account/lookup": [200, { exists: false, hasPassword: false }],
    });
    const { store, start, ask } = setup(send);
    await start;

    await ask({ kind: "lookup", email: "new@pagecraft.test" });

    expect(store.getState().persistence.account.step).toBe("profile");
  });

  it("sends a code to an account without a password", async () => {
    const { send, calls } = fakeServer({
      "/api/account/me": [401],
      "/api/account/lookup": [200, { exists: true, hasPassword: false }],
      "/api/account/code": [204],
    });
    const { store, start, ask } = setup(send);
    await start;

    await ask({ kind: "lookup", email: "bia@pagecraft.test" });

    expect(store.getState().persistence.account.step).toBe("code");
    expect(calls.map((call) => call.path)).toContain("/api/account/code");
  });

  it("signs in, and says so when the password is wrong", async () => {
    const wrong = fakeServer({
      "/api/account/me": [401],
      "/api/account/sign-in": [401],
    });
    const right = fakeServer({
      "/api/account/me": [401],
      "/api/account/sign-in": [200, { user: ADA }],
    });
    const failing = setup(wrong.send);
    const passing = setup(right.send);
    await Promise.all([failing.start, passing.start]);
    const request: AccountRequest = {
      kind: "sign-in",
      email: ADA.email,
      password: "x",
    };

    await failing.ask(request);
    await passing.ask(request);

    expect(failing.store.getState().persistence.account.error).toBe(
      "wrong-password",
    );
    expect(passing.store.getState().persistence.account).toMatchObject({
      status: "signed-in",
      user: ADA,
    });
  });

  it("logs out, ending the session on the server", async () => {
    const { send, calls } = fakeServer({
      "/api/account/me": [200, { user: ADA }],
      "/api/account/sign-out": [204],
    });
    const { store, start, ask } = setup(send);
    await start;
    const before = store.getState().persistence.account.status;

    await ask({ kind: "sign-out" });

    expect(before).toBe("signed-in");
    expect(calls.map((call) => call.path)).toContain("/api/account/sign-out");
    expect(store.getState().persistence.account).toMatchObject({
      status: "signed-out",
      user: null,
    });
  });
});
