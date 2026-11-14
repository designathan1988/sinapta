// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  createInitialState,
  type AppState,
  type Command,
} from "../../state/index.ts";
import { renderAccount } from "./settings-people.view.ts";

const ADA = { id: "u1", email: "ada@pagecraft.test", name: "Ada", photo: null };

function signedIn(): AppState {
  const state = createInitialState();
  const account = { ...state.persistence.account, user: ADA };
  return { ...state, persistence: { ...state.persistence, account } };
}

function rendered(state: AppState) {
  const sent: Command[] = [];
  const host = document.createElement("div");
  render(
    renderAccount(state, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  return { host, sent };
}

describe("Settings › My account", () => {
  it("shows the preferred name and the email, and renames on change", () => {
    const { host, sent } = rendered(signedIn());
    const field = host.querySelector<HTMLInputElement>(
      "#settings-account-name",
    );

    expect(field?.value).toBe("Ada");
    expect(host.textContent).toContain("ada@pagecraft.test");
    if (field === null) throw new Error("no name field");
    field.value = "  Ada Lovelace ";
    field.dispatchEvent(new Event("change"));

    expect(sent).toEqual([
      expect.objectContaining({
        type: "sync.request",
        request: { kind: "profile", name: "Ada Lovelace" },
      }),
    ]);
  });

  it("sends nothing for an empty or unchanged name", () => {
    const { host, sent } = rendered(signedIn());
    const field = host.querySelector<HTMLInputElement>(
      "#settings-account-name",
    );
    if (field === null) throw new Error("no name field");

    field.value = "   ";
    field.dispatchEvent(new Event("change"));
    field.value = "Ada";
    field.dispatchEvent(new Event("change"));

    expect(sent).toEqual([]);
  });

  it("lists the passkeys, adds one with this device, and removes one", () => {
    const state = signedIn();
    const passkeys = [
      { id: "k1", createdAt: Date.UTC(2026, 10, 14, 12) },
      { id: "k2", createdAt: Date.UTC(2026, 10, 14, 13) },
    ];
    const account = { ...state.persistence.account, passkeys };
    const { host, sent } = rendered({
      ...state,
      persistence: { ...state.persistence, account },
    });
    const buttons = [...host.querySelectorAll<HTMLButtonElement>("button")];
    const named = (text: string) =>
      buttons.filter((button) => button.textContent.includes(text));

    named("Add a passkey")[0]?.click();
    named("Remove")[1]?.click();

    expect(host.textContent).toContain("Passkey 2");
    expect(host.textContent).toContain("Added Nov 14, 2026");
    expect(sent).toEqual([
      expect.objectContaining({ request: { kind: "passkey-add" } }),
      expect.objectContaining({
        request: { kind: "remove-passkey", id: "k2" },
      }),
    ]);
  });
});
