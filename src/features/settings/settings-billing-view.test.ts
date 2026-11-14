// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  createInitialState,
  NO_BILLING,
  type AppState,
  type BillingState,
  type Command,
} from "../../state/index.ts";
import { renderBilling } from "./settings-billing.view.ts";

function owner(billing: BillingState | null, role = "owner"): AppState {
  const state = createInitialState();
  const workspace = {
    id: "w1",
    name: "Ada's",
    icon: null,
    role,
    members: 2,
    plan: "free" as const,
  };
  const sync = {
    ...state.persistence.sync,
    workspaces: [workspace],
    workspaceId: "w1",
    billing,
  };
  return { ...state, persistence: { ...state.persistence, sync } };
}

function rendered(state: AppState) {
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderBilling(state, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  return { host, sent };
}

describe("Settings › Billing", () => {
  it("sends a typed card once, as its month and full year", () => {
    const { host, sent } = rendered(owner(NO_BILLING));
    const set = (name: string, value: string) => {
      const input = host.querySelector<HTMLInputElement>(`input[name=${name}]`);
      if (input) input.value = value;
    };
    set("number", "4242 4242 4242 4242");
    set("expiry", "12/30");
    set("cvc", "123");
    set("name", "Ada");

    host
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { cancelable: true }));

    expect(sent).toEqual([
      expect.objectContaining({
        request: {
          kind: "add-card",
          card: {
            number: "4242 4242 4242 4242",
            expMonth: 12,
            expYear: 2030,
            cvc: "123",
            name: "Ada",
          },
        },
      }),
    ]);
    expect(
      host.querySelector<HTMLInputElement>("input[name=number]")?.value,
    ).toBe("");
  });

  it("shows the card kept and the invoices, and why the last try failed", () => {
    const { host } = rendered(
      owner({
        card: {
          brand: "visa",
          last4: "4242",
          expMonth: 12,
          expYear: 2030,
          name: "Ada",
        },
        invoices: [
          {
            id: "in_1",
            plan: "plus",
            seats: 2,
            amountCents: 2400,
            currency: "usd",
            status: "paid",
            last4: "4242",
            createdAt: "2026-11-14T10:00:00.000Z",
          },
        ],
        error: "card-declined",
        wanted: null,
      }),
    );

    expect(host.textContent).toContain("VISA •••• 4242");
    expect(host.textContent).toContain("Plus, 2 members");
    expect(host.textContent).toContain("$24.00");
    expect(host.querySelector("[role=alert]")?.textContent).toContain(
      "declined",
    );
    expect(host.querySelector("form")).toBeNull();
  });

  it("is for owners only", () => {
    const { host } = rendered(owner(NO_BILLING, "member"));

    expect(host.textContent).toContain("Only the workspace's owners");
    expect(host.querySelector("form")).toBeNull();
  });
});
