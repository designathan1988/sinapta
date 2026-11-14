// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  createInitialState,
  type AccountState,
  type Command,
} from "../../state/index.ts";
import { renderSignIn } from "./sign-in.view.ts";

function rendered(account: Partial<AccountState>) {
  const state = createInitialState();
  const signedOut = {
    ...state,
    persistence: {
      ...state.persistence,
      account: {
        ...state.persistence.account,
        status: "signed-out" as const,
        ...account,
      },
    },
  };
  const commands: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderSignIn(signedOut, (command) => {
      commands.push(command);
      return { ok: true };
    }),
    host,
  );
  return { host, commands };
}

describe("the sign-in screen's own checks, as Notion's", () => {
  it("says in its own words that an address is not valid", () => {
    const { host, commands } = rendered({});
    const email = host.querySelector<HTMLInputElement>("#sign-in-email");
    if (email !== null) email.value = "abc";

    host
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { cancelable: true }));

    expect(host.querySelector("form")?.noValidate).toBe(true);
    expect(commands).toEqual([
      expect.objectContaining({
        type: "account.answer",
        answer: { kind: "error", error: "invalid-email" },
      }),
    ]);
  });

  it("shows what went wrong right under the step's button", () => {
    const { host } = rendered({
      step: "password",
      email: "ada@pagecraft.test",
      error: "wrong-password",
    });

    const error = host.querySelector(".sign-in__error");

    expect(error?.closest("form")).not.toBeNull();
    expect(error?.previousElementSibling?.className).toBe("sign-in__continue");
  });

  it("lets the other ways in wait while a passkey is asked, and says so", () => {
    const { host } = rendered({ request: { kind: "passkey-sign-in" } });

    const providers = [
      ...host.querySelectorAll<HTMLButtonElement>(".sign-in__provider"),
    ];

    expect(providers.every((button) => button.disabled)).toBe(true);
    expect(host.textContent).toContain("Waiting for your passkey");
  });

  it("takes a new person to the address field from Sign up", () => {
    const { host } = rendered({});
    const signUp = [...host.querySelectorAll("button")].find(
      (button) => button.textContent.trim() === "Sign up",
    );
    const before = document.activeElement;
    if (before instanceof HTMLElement) before.blur();

    signUp?.click();

    expect(document.activeElement?.id).toBe("sign-in-email");
  });
});
