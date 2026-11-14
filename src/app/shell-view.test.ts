// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  createInitialState,
  type AppState,
  type Command,
  type Dispatch,
} from "../state/index.ts";
import { renderShell } from "./shell.view.ts";

function rendered(state: AppState = createInitialState()) {
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderShell(state, dispatch), host);
  return { host, sent };
}

// A narrow window with its sidebar drawer open.
function withDrawer(): AppState {
  const state = createInitialState();
  return { ...state, ui: { ...state.ui, isNarrow: true, isDrawerOpen: true } };
}

describe("renderShell", () => {
  it("keeps help and settings in the sidebar, not on the page, as Notion", () => {
    const { host } = rendered();
    const main = host.querySelector(".app__main");
    const labels = [...(main?.querySelectorAll("button") ?? [])].map(
      (item) => item.getAttribute("aria-label") ?? "",
    );

    expect(labels).not.toContain("Settings");
    expect(labels).not.toContain("Help and keyboard shortcuts");
    expect(host.querySelector(".app__sidebar .sidebar__footer")).not.toBeNull();
  });

  it("says nothing once saved: the page says when it was edited", () => {
    const state = createInitialState();
    const persistence = { ...state.persistence, status: "saved" as const };

    const { host } = rendered({ ...state, persistence });

    expect(host.querySelector(".app__save-status")?.textContent.trim()).toBe(
      "",
    );
  });

  it.each([
    ["syncing", "Syncing…"],
    ["offline", "Offline"],
  ] as const)(
    "says %s while the server has not taken the changes",
    (connection, words) => {
      const state = createInitialState();
      const sync = { ...state.persistence.sync, connection };
      const persistence = {
        ...state.persistence,
        status: "saved" as const,
        sync,
      };

      const { host } = rendered({ ...state, persistence });

      expect(host.querySelector(".app__save-status")?.textContent.trim()).toBe(
        words,
      );
    },
  );

  it("keeps the focus in an open drawer: all else is inert", async () => {
    const { host } = rendered(withDrawer());
    await Promise.resolve();

    const app = host.querySelector(".app");
    const outside = [...(app?.children ?? [])].filter(
      (child) => !child.matches(".app__sidebar, .app__scrim"),
    );
    expect(outside.length).toBeGreaterThan(0);
    outside.forEach((child) => {
      expect(child.hasAttribute("inert")).toBe(true);
    });
    expect(
      host.querySelector(".app__sidebar")?.contains(document.activeElement),
    ).toBe(true);
  });

  it("closes the drawer from its scrim and on Escape", () => {
    const { host, sent } = rendered(withDrawer());

    host.querySelector<HTMLElement>(".app__scrim")?.click();
    host
      .querySelector(".app__sidebar")
      ?.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );

    expect(sent.map((command) => command.type)).toEqual([
      "ui.toggleSidebar",
      "ui.toggleSidebar",
    ]);
  });

  it("shows no sidebar and an open button on a narrow window", () => {
    const state = createInitialState();
    const { host } = rendered({
      ...state,
      ui: { ...state.ui, isNarrow: true },
    });

    expect(host.querySelector(".app__sidebar")).toBeNull();
    expect(host.querySelector(".app__main")?.hasAttribute("inert")).toBe(false);
    expect(host.querySelector("[data-sidebar-open]")).not.toBeNull();
  });
});
