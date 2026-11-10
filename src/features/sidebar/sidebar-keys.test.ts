// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../../model/index.ts";
import {
  createInitialState,
  type AppState,
  type Command,
  type Dispatch,
} from "../../state/index.ts";
import { renderSidebar } from "./sidebar.view.ts";

const props = (title: string) => ({
  title: [{ text: title }],
  icon: null,
  isFavorite: false,
  isTrashed: false,
});

function mount() {
  const workspace = buildWorkspace([
    { id: "a", props: props("Alpha") },
    { id: "b", props: props("Beta") },
  ]);
  const state: AppState = { ...createInitialState(), workspace };
  const commands: Command[] = [];
  const dispatch: Dispatch = (command) => {
    commands.push(command);
    return { ok: true };
  };
  const container = document.createElement("div");
  document.body.replaceChildren(container);
  render(renderSidebar(state, dispatch), container);
  const rows = [...container.querySelectorAll<HTMLElement>("[role=treeitem]")];
  return { container, commands, rows };
}

function press(target: Element, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

describe("sidebar tree keys", () => {
  it("opens the focused page on Enter", () => {
    const { rows, commands } = mount();

    press(rows[1] ?? document.body, "Enter");

    expect(commands).toEqual([{ type: "ui.setActivePage", pageId: "b" }]);
  });

  it("leaves Enter on a button inside a row to that button", () => {
    const { rows, commands } = mount();
    const button = rows[0]?.querySelector("[aria-haspopup=menu]");

    const event = press(button ?? document.body, "Enter");

    expect(event.defaultPrevented).toBe(false);
    expect(commands).toEqual([]);
  });

  it("opens the page menu of the focused row with Shift+F10", () => {
    const { rows, commands } = mount();

    press(rows[0] ?? document.body, "F10", { shiftKey: true });

    expect(commands).toEqual([
      {
        type: "ui.openOverlay",
        overlay: { kind: "page-menu", anchorId: "tree:a" },
      },
    ]);
  });

  it("moves the focused page down with Alt+ArrowDown", () => {
    const { rows, commands } = mount();

    press(rows[0] ?? document.body, "ArrowDown", { altKey: true });

    expect(commands).toEqual([
      { type: "page.move", pageId: "a", parentId: null, index: 1 },
    ]);
  });

  it("names each row by its page title only", () => {
    const { rows } = mount();

    expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual([
      "Alpha",
      "Beta",
    ]);
  });

  it("keeps the buttons inside rows out of the tab order", () => {
    const { container } = mount();
    const inner = [...container.querySelectorAll("[role=treeitem] button")];

    expect(
      inner.every((button) => button.getAttribute("tabindex") === "-1"),
    ).toBe(true);
  });
});
