// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  createInitialState,
  type AccountState,
  type AppState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import { renderSignIn } from "./sign-in.view.ts";

function stateWith(account: Partial<AccountState>): AppState {
  const state = createInitialState();
  return {
    ...state,
    persistence: {
      ...state.persistence,
      account: {
        ...state.persistence.account,
        status: "signed-out",
        ...account,
      },
    },
  };
}

function rendered(state: AppState) {
  const commands: Command[] = [];
  const dispatch: Dispatch = (command) => {
    commands.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.append(host);
  render(renderSignIn(state, dispatch), host);
  return { host, commands };
}

function submit(host: HTMLElement): void {
  host
    .querySelector("form")
    ?.dispatchEvent(new Event("submit", { cancelable: true }));
}

describe("the sign-in screen", () => {
  it("asks the server about the address typed, as Notion's Continue", () => {
    const { host, commands } = rendered(stateWith({}));
    const email = host.querySelector<HTMLInputElement>("#sign-in-email");
    if (email !== null) email.value = "ada@pagecraft.test";

    submit(host);

    expect(commands).toEqual([
      {
        type: "account.request",
        request: { kind: "lookup", email: "ada@pagecraft.test" },
      },
    ]);
  });

  it("offers Notion's other ways in, and names one this server lacks", () => {
    const { host, commands } = rendered(stateWith({}));
    const tiles = [...host.querySelectorAll(".sign-in__provider")];

    host.querySelector<HTMLButtonElement>(".sign-in__provider")?.click();

    expect(tiles.map((tile) => tile.textContent.trim().slice(1))).toEqual([
      "Google",
      "ChatGPT",
      "Apple",
      "Microsoft",
      "Passkey",
      "SSO",
    ]);
    expect(commands[0]).toEqual({
      type: "account.chooseProvider",
      provider: "Google",
    });
  });

  it("signs in with a passkey on this server", () => {
    const { host, commands } = rendered(stateWith({}));
    const passkey = [
      ...host.querySelectorAll<HTMLButtonElement>(".sign-in__provider"),
    ].find((tile) => tile.textContent.includes("Passkey"));

    passkey?.click();

    expect(commands).toEqual([
      expect.objectContaining({
        type: "account.request",
        request: { kind: "passkey-sign-in" },
      }),
    ]);
  });

  it("goes to a provider this server is set up with", () => {
    const { host, commands } = rendered(stateWith({ providers: ["google"] }));

    host.querySelector<HTMLButtonElement>(".sign-in__provider")?.click();

    expect(commands).toEqual([
      expect.objectContaining({
        request: { kind: "provider-sign-in", provider: "google" },
      }),
    ]);
  });

  it("says a provider's sign-in did not work", () => {
    const { host } = rendered(
      stateWith({ error: "provider-failed", provider: "google" }),
    );

    expect(host.querySelector(".sign-in__error")?.textContent).toBe(
      "Google sign-in did not work. Please try again.",
    );
  });

  it("signs in with the password on the password step", () => {
    const { host, commands } = rendered(
      stateWith({ step: "password", email: "ada@pagecraft.test" }),
    );
    const password = host.querySelector<HTMLInputElement>("#sign-in-password");
    if (password !== null) password.value = "analytical";

    submit(host);

    expect(commands[0]).toEqual({
      type: "account.request",
      request: {
        kind: "sign-in",
        email: "ada@pagecraft.test",
        password: "analytical",
      },
    });
  });

  it("shows why a sign-in failed", () => {
    const { host } = rendered(
      stateWith({ step: "password", error: "wrong-password" }),
    );

    expect(host.querySelector("[role=alert]")?.textContent).toContain(
      "Incorrect password",
    );
  });
});
