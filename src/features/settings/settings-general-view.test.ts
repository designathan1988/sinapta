// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  createInitialState,
  type AppState,
  type Command,
} from "../../state/index.ts";
import { renderDangerZone } from "./settings-general.view.ts";

const OPEN = { id: "w1", name: "Acme", icon: null, role: "owner", members: 2 };

function show(state: AppState, role = "owner") {
  const sent: Command[] = [];
  const root = document.createElement("div");
  render(
    renderDangerZone(
      state,
      (command) => {
        sent.push(command);
        return { ok: true as const };
      },
      { ...OPEN, role },
    ),
    root,
  );
  return { root, sent };
}

function withFlags(flags: string[]): AppState {
  const initial = createInitialState();
  const overlay = { kind: "settings", flags };
  return { ...initial, ui: { ...initial.ui, overlay } };
}

describe("Settings › General", () => {
  it("shows the name's letter as the icon and opens the emoji picker", () => {
    const { root, sent } = show(withFlags([]));

    expect(root.querySelector(".settings__icon")?.textContent.trim()).toBe("A");
    root.querySelector<HTMLButtonElement>(".settings__icon")?.click();
    expect(sent[0]).toMatchObject({
      type: "ui.openOverlay",
      overlay: { flags: ["workspace-icon"] },
    });
  });

  it("asks the owner to type the name before deleting the workspace", () => {
    const { root, sent } = show(withFlags(["workspace-danger"]));
    const field = root.querySelector<HTMLInputElement>(
      ".settings__confirm input",
    );

    expect(field?.getAttribute("pattern")).toBe("Acme");
    root
      .querySelector("form")
      ?.dispatchEvent(new Event("submit", { cancelable: true }));
    expect(sent[0]).toMatchObject({
      type: "sync.request",
      request: { kind: "delete-workspace", name: "Acme" },
    });
  });

  it("lets a member leave the workspace", () => {
    const { root, sent } = show(withFlags([]), "member");
    const leave = [...root.querySelectorAll("button")].find(
      (button) => button.textContent.trim() === "Leave workspace",
    );

    leave?.click();
    expect(sent[0]).toMatchObject({ request: { kind: "leave-workspace" } });
  });
});

describe("Delete entire workspace", () => {
  it("opens the name field when pressed", () => {
    const { root, sent } = show(withFlags([]));
    const start = [...root.querySelectorAll("button")].find(
      (button) => button.textContent.trim() === "Delete entire workspace",
    );

    start?.click();
    expect(sent[0]).toMatchObject({ overlay: { flags: ["workspace-danger"] } });
  });
});
