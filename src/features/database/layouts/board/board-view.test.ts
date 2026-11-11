// @vitest-environment happy-dom
import { render } from "lit-html";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type {
  Command,
  Dispatch,
  OpenOverlay,
} from "../../../../state/index.ts";
import { setCardOptions } from "../../card.commands.ts";
import { createDatabaseApp } from "../../database-builder.ts";
import { renderDatabase } from "../../database.view.ts";
import { toggleGroupHidden } from "../../group.commands.ts";
import { setViewType } from "../../view-layout.commands.ts";
import {
  boardColumnAnchor,
  BOARD_COLUMN_OVERLAY,
} from "./board-column-menu.view.ts";

// happy-dom has no Popover API; the menu only needs to be shown.
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "showPopover", {
    value: () => undefined,
    configurable: true,
  });
});

afterAll(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "showPopover");
});

const STAGE = {
  name: "Stage",
  type: "select",
  options: [
    { id: "todo", name: "Todo", color: "gray" },
    { id: "done", name: "Done", color: "green" },
  ],
};

interface Setup {
  readonly hidden?: string;
  readonly menuFor?: string;
}

function rendered(setup: Setup = {}) {
  const app = createDatabaseApp(
    [STAGE],
    [
      ["a", "todo"],
      ["b", "todo"],
      ["c", "done"],
    ],
  );
  const viewId = app.view().id;
  app.dispatch(setViewType.create({ viewId, viewType: "board" }));
  app.dispatch(
    setCardOptions.create({ viewId, options: { cardSize: "small" } }),
  );
  if (setup.hidden !== undefined) {
    app.dispatch(toggleGroupHidden.create({ viewId, key: setup.hidden }));
  }
  const built = app.store.getState();
  const overlay: OpenOverlay | null =
    setup.menuFor === undefined
      ? null
      : {
          kind: BOARD_COLUMN_OVERLAY,
          anchorId: boardColumnAnchor(app.databaseId, setup.menuFor),
        };
  const state = { ...built, ui: { ...built.ui, overlay, activeCell: null } };
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderDatabase(state, dispatch), host);
  const rowId = (index: number) => {
    const id = app.rowIds[index];
    if (id === undefined) throw new Error("no row");
    return id;
  };
  const card = (index: number) =>
    host.querySelector(`.row-card[data-row-id="${rowId(index)}"]`);
  return { host, sent, rowId, card };
}

function press(target: Element | null, init: KeyboardEventInit): void {
  target?.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, ...init }),
  );
}

function item(host: HTMLElement, label: string): HTMLElement {
  const found = [...host.querySelectorAll<HTMLElement>("[role=menuitem]")].find(
    (element) => element.textContent.trim() === label,
  );
  if (found === undefined) throw new Error(`no ${label} item`);
  return found;
}

describe("a board", () => {
  it("moves a card down and up within its column with Alt", () => {
    const { sent, rowId, card } = rendered();

    press(card(0), { key: "ArrowDown", altKey: true });
    press(card(1), { key: "ArrowUp", altKey: true });

    expect(sent).toEqual([
      expect.objectContaining({
        type: "board.moveCard",
        rowId: rowId(0),
        beforeRowId: rowId(2),
        change: null,
      }),
      expect.objectContaining({
        type: "board.moveCard",
        rowId: rowId(1),
        beforeRowId: rowId(0),
        change: null,
      }),
    ]);
  });

  it("moves a column and hides it from its menu", () => {
    const { host, sent } = rendered({ menuFor: "todo" });

    item(host, "Move right").click();
    item(host, "Hide").click();

    // Each choice also closes the menu.
    const changes = sent.filter((command) => command.type.startsWith("view."));
    expect(changes).toEqual([
      expect.objectContaining({
        type: "view.setGroupOrder",
        order: ["", "done", "todo"],
      }),
      expect.objectContaining({ type: "view.toggleGroupHidden", key: "todo" }),
    ]);
  });

  it("lists hidden columns apart and shows one again", () => {
    const { host, sent } = rendered({ hidden: "done" });

    const columns = [...host.querySelectorAll(".board__column")].map((column) =>
      column.getAttribute("aria-label"),
    );
    const hidden = host.querySelector(".board__hidden button");
    hidden?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(columns).toEqual(["No Stage", "Todo"]);
    expect(hidden?.textContent).toContain("Done");
    expect(sent).toEqual([
      expect.objectContaining({ type: "view.toggleGroupHidden", key: "done" }),
    ]);
  });

  it("sizes its cards and tints its columns as the view says", () => {
    const { host } = rendered();

    const board = host.querySelector(".board");

    expect(board?.getAttribute("data-size")).toBe("small");
    expect(board?.hasAttribute("data-colored")).toBe(true);
  });
});
