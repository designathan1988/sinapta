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
  it("opens the keyboard shortcuts from the help button in the corner", () => {
    const sent: Command[] = [];
    const dispatch: Dispatch = (command) => {
      sent.push(command);
      return { ok: true };
    };
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(renderShell(createInitialState(), dispatch), host);

    host.querySelector<HTMLButtonElement>(".app__help button")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "shortcut-help" },
      }),
    ]);
  });

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
