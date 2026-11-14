// Asks the server the questions the sign-in screen puts in the store, and
// records the answers (ADR-0013). A server that does not answer leaves the
// app on the browser's copy, as before there was one.
import * as account from "./account.schema.ts";
import { askPasskey, type PasskeyRequest } from "./passkey-client.ts";
import {
  answerAccount,
  checkAccount,
  type AccountAnswer,
  type AccountRequest,
  type AppStore,
  type Dispatch,
} from "../state/index.ts";

export type Fetch = typeof fetch;

interface Reply {
  readonly status: number;
  readonly body: unknown;
}

async function post(send: Fetch, path: string, body?: unknown): Promise<Reply> {
  const response = await send(path, {
    method: body === undefined && path.endsWith("/me") ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  return { status: response.status, body: account.parseReply(text) };
}

function userAnswer(reply: Reply): AccountAnswer {
  const user = account.readUser(reply.body);
  return user === undefined
    ? { kind: "error", error: "network" }
    : { kind: "user", user };
}

async function lookup(send: Fetch, email: string): Promise<AccountAnswer> {
  const reply = await post(send, "/api/account/lookup", { email });
  const found = account.readLookup(reply.body);
  if (found === undefined) return { kind: "error", error: "network" };
  if (found.hasPassword) return { kind: "step", step: "password" };
  if (!found.exists) return { kind: "step", step: "profile" };
  await post(send, "/api/account/code", { email });
  return { kind: "step", step: "code" };
}

const REFUSALS: Readonly<Record<number, AccountAnswer>> = {
  401: { kind: "error", error: "wrong-password" },
  409: { kind: "error", error: "email-taken" },
  429: { kind: "error", error: "too-many-tries" },
};

const PASSKEY_KINDS = new Set([
  "passkey-sign-in",
  "passkey-add",
  "passkeys",
  "remove-passkey",
]);

function isPasskeyRequest(request: AccountRequest): request is PasskeyRequest {
  return PASSKEY_KINDS.has(request.kind);
}

type ProviderRequest = Extract<AccountRequest, { kind: "provider-sign-in" }>;

// Another company's sign-in: the browser goes to it and comes back signed in.
function goToProvider(request: ProviderRequest): Promise<AccountAnswer> {
  window.location.assign(`/api/account/oidc/${request.provider}/start`);
  return Promise.resolve({ kind: "step", step: "email" });
}

// Each request to where it is answered.
function answerOf(
  send: Fetch,
  request: AccountRequest,
): Promise<AccountAnswer> {
  if (isPasskeyRequest(request)) return askPasskey(send, request);
  if (request.kind === "provider-sign-in") return goToProvider(request);
  return ask(send, request);
}

async function ask(
  send: Fetch,
  request: Exclude<AccountRequest, PasskeyRequest | ProviderRequest>,
): Promise<AccountAnswer> {
  switch (request.kind) {
    case "lookup":
      return lookup(send, request.email);
    case "send-code":
      await post(send, "/api/account/code", { email: request.email });
      return { kind: "step", step: "code" };
    case "sign-out":
      await post(send, "/api/account/sign-out", {});
      return { kind: "signed-out" };

    case "verify-code": {
      const reply = await post(send, "/api/account/code/verify", request);
      if (reply.status === 401) return { kind: "error", error: "wrong-code" };
      return userAnswer(reply);
    }
    case "sign-in":
    case "sign-up": {
      const { kind, ...body } = request;
      const reply = await post(send, `/api/account/${kind}`, body);
      return REFUSALS[reply.status] ?? userAnswer(reply);
    }
  }
}

// Who is signed in, asked once at start before the first paint.
export async function startAccount(options: {
  readonly store: AppStore;
  readonly dispatch: Dispatch;
  readonly send?: Fetch;
}): Promise<void> {
  const { store, dispatch, send = fetch } = options;
  dispatch(checkAccount.create({}));
  let asked = store.getState().persistence.account.requestCount;
  store.subscribe((state) => {
    const { request, requestCount } = state.persistence.account;
    if (request === null || requestCount === asked) return;
    asked = requestCount;
    void answerOf(send, request).then(
      (answer) => {
        dispatch(answerAccount.create({ answer }));
        if (answer.kind === "signed-out") void showProviders(send, dispatch);
      },
      // A request that never reached the server: the connection is down.
      () =>
        dispatch(
          answerAccount.create({ answer: { kind: "error", error: "offline" } }),
        ),
    );
  });
  const answer = await whoIsSignedIn(send);
  dispatch(answerAccount.create({ answer }));
  await afterCheck(answer, send, dispatch);
}

// After the first answer: the sign-in screen's providers and a failed
// provider's sign-in, or the signed-in account's passkeys.
async function afterCheck(
  answer: AccountAnswer,
  send: Fetch,
  dispatch: Dispatch,
): Promise<void> {
  if (answer.kind === "signed-out") {
    await showProviders(send, dispatch);
    const failed = failedProvider();
    if (failed !== undefined) {
      dispatch(
        answerAccount.create({
          answer: { kind: "provider-failed", provider: failed },
        }),
      );
    }
  }
  // The account's passkeys, for My account, known before start settles.
  if (answer.kind === "user") {
    const passkeys = await askPasskey(send, { kind: "passkeys" });
    dispatch(answerAccount.create({ answer: passkeys }));
  }
}

// The sign-in screen's other companies, asked whenever it shows.
async function showProviders(send: Fetch, dispatch: Dispatch): Promise<void> {
  dispatch(answerAccount.create({ answer: await providersOf(send) }));
}

// The other companies this server signs in with.
async function providersOf(send: Fetch): Promise<AccountAnswer> {
  const response = await send("/api/account/providers", {
    credentials: "same-origin",
  });
  const providers = account.readProviders(
    account.parseReply(await response.text()),
  );
  return { kind: "providers", providers: providers ?? [] };
}

// A provider's sign-in that came back failed (?signin-error=google): read
// once, and taken out of the address.
function failedProvider(): string | undefined {
  if (!("location" in globalThis)) return undefined;
  const url = new URL(window.location.href);
  const provider = url.searchParams.get("signin-error");
  if (provider === null) return undefined;
  url.searchParams.delete("signin-error");
  window.history.replaceState(null, "", url.href);
  return provider;
}

async function whoIsSignedIn(send: Fetch): Promise<AccountAnswer> {
  try {
    const reply = await post(send, "/api/account/me");
    if (reply.status === 401) return { kind: "signed-out" };
    return reply.status === 200 ? userAnswer(reply) : { kind: "offline" };
  } catch {
    return { kind: "offline" };
  }
}
