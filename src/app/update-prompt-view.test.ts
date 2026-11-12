// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  createInitialState,
  type AppState,
  type Command,
} from "../state/index.ts";
import { COPY } from "../ui/copy.ts";
import { renderUpdatePrompt } from "./update-prompt.view.ts";

function rendered(update: AppState["ui"]["update"]) {
  const state = createInitialState();
  const sent: Command[] = [];
  const host = document.createElement("div");
  render(
    renderUpdatePrompt({ ...state, ui: { ...state.ui, update } }, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const button = (label: string) =>
    [...host.querySelectorAll("button")].find(
      (item) => item.textContent.trim() === label,
    );
  return { host, sent, button };
}

describe("the update prompt", () => {
  it("shows nothing while there is no new version", () => {
    expect(rendered("none").host.textContent.trim()).toBe("");
  });

  it("offers to reload into a new version, or to wait", () => {
    const { host, sent, button } = rendered("ready");

    expect(host.textContent).toContain(COPY.shell.updateReady);
    button(COPY.shell.updateReload)?.click();
    button(COPY.shell.updateLater)?.click();

    expect(sent.map((command) => command.type)).toEqual([
      "app.applyUpdate",
      "app.dismissUpdate",
    ]);
  });

  it("says so while the new version takes over", () => {
    const { host, button } = rendered("applying");

    expect(host.textContent).toContain(COPY.shell.updating);
    expect(button(COPY.shell.updateReload)).toBeUndefined();
  });
});
