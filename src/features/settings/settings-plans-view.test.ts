// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { PlanId } from "../../model/index.ts";
import {
  createInitialState,
  type AppState,
  type Command,
} from "../../state/index.ts";
import { renderPlans } from "./settings-plans.view.ts";

function onPlan(plan: PlanId, role = "owner"): AppState {
  const state = createInitialState();
  const workspace = {
    id: "w1",
    name: "Ada's",
    icon: null,
    role,
    members: 1,
    plan,
  };
  const sync = {
    ...state.persistence.sync,
    workspaces: [workspace],
    workspaceId: "w1",
  };
  return { ...state, persistence: { ...state.persistence, sync } };
}

function rendered(state: AppState) {
  const sent: Command[] = [];
  const host = document.createElement("div");
  render(
    renderPlans(state, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const cards = [
    ...host.querySelectorAll<HTMLElement>(".settings-plans__card"),
  ];
  const buttonOf = (name: string) =>
    cards
      .find((card) => card.querySelector("h4")?.textContent === name)
      ?.querySelector("button");
  return { host, sent, cards, buttonOf };
}

describe("Settings › Plans", () => {
  it("shows Notion's four plans with their limits, the workspace's own current", () => {
    const { cards, buttonOf } = rendered(onPlan("free"));

    expect(cards.map((card) => card.querySelector("h4")?.textContent)).toEqual([
      "Free",
      "Plus",
      "Business",
      "Enterprise",
    ]);
    expect(cards[0]?.textContent).toContain("Files up to 5 MB");
    expect(cards[0]?.textContent).toContain("7 days of page history");
    expect(cards[3]?.textContent).toContain("All of page history");
    expect(buttonOf("Free")?.textContent.trim()).toBe("Current plan");
    expect(buttonOf("Free")?.disabled).toBe(true);
    expect(buttonOf("Plus")?.textContent.trim()).toBe("Upgrade");
  });

  it("changes the plan at once, at no cost, upward or downward", () => {
    const { sent, buttonOf } = rendered(onPlan("business"));

    buttonOf("Plus")?.click();
    buttonOf("Enterprise")?.click();

    expect(buttonOf("Plus")?.textContent.trim()).toBe("Downgrade");
    expect(sent).toEqual([
      expect.objectContaining({ request: { kind: "plan", plan: "plus" } }),
      expect.objectContaining({
        request: { kind: "plan", plan: "enterprise" },
      }),
    ]);
  });

  it("lets only the workspace's owners change it", () => {
    const { host, buttonOf } = rendered(onPlan("free", "member"));

    expect(buttonOf("Plus")?.disabled).toBe(true);
    expect(host.textContent).toContain("Only the workspace's owners");
  });

  it("asks to sign in when no server holds the workspace", () => {
    const { host } = rendered(createInitialState());

    expect(host.textContent).toContain("Sign in to a Pagecraft server");
  });
});
