// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  createInitialState,
  type AppState,
  type Command,
  type ConnectedApp,
} from "../../state/index.ts";
import { renderThirdPartyApps } from "./third-party.view.ts";

function joined(apps: readonly ConnectedApp[] = []): AppState {
  const state = createInitialState();
  const sync = { ...state.persistence.sync, workspaceId: "w1", apps };
  return { ...state, persistence: { ...state.persistence, sync } };
}

function rendered(state: AppState) {
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderThirdPartyApps(state, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const row = (app: string) =>
    host.querySelector<HTMLElement>(`[data-app="${app}"]`);
  return { host, sent, row };
}

describe("Connect apps", () => {
  it("lists Notion's apps, each saying what connecting it does here", () => {
    const { host } = rendered(joined());

    const names = [...host.querySelectorAll("[data-app]")].map((row) =>
      row.getAttribute("data-app"),
    );

    expect(names).toEqual([
      "gmail",
      "google-calendar",
      "slack",
      "outlook",
      "icloud",
      "asana",
      "github",
      "jira",
      "figma",
      "google-drive",
    ]);
    expect(host.textContent).toContain(
      "Post the workspace's notices, such as mentions, to a channel.",
    );
  });

  it("connects a links app with one press", () => {
    const { sent, row } = rendered(joined());

    row("github")?.querySelector("button")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        request: { kind: "connect-app", app: "github" },
      }),
    ]);
  });

  it("asks Slack for its channel's webhook address", () => {
    const { sent, row } = rendered(joined());
    const form = row("slack")?.querySelector("form");
    const field = form?.querySelector("input");
    if (form == null || field == null) throw new Error("no address form");

    field.value = " https://hooks.slack.com/services/T/B/x ";
    form.dispatchEvent(new SubmitEvent("submit", { cancelable: true }));

    expect(sent).toEqual([
      expect.objectContaining({
        request: {
          kind: "connect-app",
          app: "slack",
          address: "https://hooks.slack.com/services/T/B/x",
        },
      }),
    ]);
  });

  it("shows a connected app with its address's host, and disconnects it", () => {
    const { sent, row } = rendered(
      joined([{ app: "slack", host: "hooks.slack.com" }]),
    );

    expect(row("slack")?.textContent).toContain("Connected · hooks.slack.com");
    row("slack")?.querySelector("button")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        request: { kind: "disconnect-app", app: "slack" },
      }),
    ]);
  });

  it("asks to sign in when no server holds the workspace", () => {
    const { host } = rendered(createInitialState());

    expect(host.textContent).toContain("Sign in to a Pagecraft server");
    expect(host.querySelector("[data-app]")).toBeNull();
  });
});
