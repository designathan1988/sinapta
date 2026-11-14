// Commands of the sign-in screen and the account. They change only the
// persistence slice: an account is not workspace data and has no undo.
import type {
  AccountAnswer,
  AccountRequest,
  AccountState,
  AccountStep,
} from "./account-state.ts";
import type { AppState } from "./app-state.ts";
import {
  defineCommand,
  type CommandEffect,
  type NoPayload,
} from "./command-registry.ts";

function withAccount(
  state: AppState,
  change: Partial<AccountState>,
): CommandEffect {
  const account = { ...state.persistence.account, ...change };
  return { persistence: { ...state.persistence, account } };
}

function emailOf(request: AccountRequest, current: string): string {
  return "email" in request ? request.email : current;
}

// Asks the server something; the persistence layer sends it.
export const requestAccount = defineCommand<{ request: AccountRequest }>({
  type: "account.request",
  handle: (state, { request }) =>
    withAccount(state, {
      request,
      requestCount: state.persistence.account.requestCount + 1,
      email: emailOf(request, state.persistence.account.email),
      error: null,
      provider: null,
    }),
});

function answered(answer: AccountAnswer): Partial<AccountState> {
  switch (answer.kind) {
    case "user":
      return { status: "signed-in", user: answer.user, step: "email" };
    case "signed-out":
      return { status: "signed-out", user: null, step: "email" };
    case "offline":
      return { status: "local", user: null };
    case "step":
      return { step: answer.step };
    case "error":
      return { error: answer.error };
  }
}

// Records what the server answered.
export const answerAccount = defineCommand<{ answer: AccountAnswer }>({
  type: "account.answer",
  handle: (state, { answer }) =>
    withAccount(state, { ...answered(answer), request: null }),
});

// Goes back to a step, as "Use a different email" or "Continue with login
// code" do.
export const setAccountStep = defineCommand<{ step: AccountStep }>({
  type: "account.setStep",
  handle: (state, { step }) => withAccount(state, { step, error: null }),
});

// A sign-in this server cannot offer, as Google or SSO: the screen says so.
export const chooseProvider = defineCommand<{ provider: string }>({
  type: "account.chooseProvider",
  handle: (state, { provider }) =>
    withAccount(state, { provider, error: "not-connected" }),
});

// Shows the sign-in screen while the server is asked who is signed in.
export const checkAccount = defineCommand<NoPayload>({
  type: "account.check",
  handle: (state) => withAccount(state, { status: "checking" }),
});

export const accountCommands = [
  requestAccount,
  answerAccount,
  setAccountStep,
  chooseProvider,
  checkAccount,
];
