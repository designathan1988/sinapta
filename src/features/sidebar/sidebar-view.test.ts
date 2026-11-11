// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../../model/index.ts";
import {
  createInitialState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import { renderSidebar } from "./sidebar.view.ts";

function rendered() {
  const props = { title: [], icon: null, isFavorite: false, isTrashed: false };
  const state = {
    ...createInitialState(),
    workspace: buildWorkspace([{ id: "page", props }]),
  };
  const commands: Command[] = [];
  const dispatch: Dispatch = (command) => {
    commands.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  render(renderSidebar(state, dispatch), host);
  return { host, commands };
}

function button(host: HTMLElement, label: string): HTMLElement | undefined {
  return [...host.querySelectorAll<HTMLElement>("button")].find(
    (element) => element.textContent.trim() === label,
  );
}

describe("renderSidebar", () => {
  it("shows a page glyph for a page without an icon", () => {
    const icon = rendered().host.querySelector(".sidebar__row .sidebar__icon");

    expect(icon?.querySelector("svg")).not.toBeNull();
  });

  it("opens the command palette from the Search item", () => {
    const { host, commands } = rendered();

    button(host, "Search")?.click();

    expect(commands).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "command-palette" },
      }),
    ]);
  });

  it("titles the page tree as a section for screen readers", () => {
    const headings = [...rendered().host.querySelectorAll("h2")].map((h) =>
      h.textContent.trim(),
    );

    expect(headings).toContain("Private");
  });
});
