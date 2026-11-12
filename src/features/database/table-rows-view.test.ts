// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { selectRows } from "./row-bulk.commands.ts";
import { BULK_EDIT_OVERLAY } from "./table-bulk-edit.view.ts";
import { setFrozenCount, toggleWrapped } from "./table-layout.commands.ts";
import { sortByProperty } from "./view.commands.ts";

interface Setup {
  readonly ticked?: readonly number[];
  readonly sorted?: boolean;
  readonly active?: number;
}

function rendered(setup: Setup = {}) {
  const app = createDatabaseApp(
    [{ name: "Notes", type: "text" }],
    [
      ["a", "1"],
      ["b", "2"],
      ["c", "3"],
    ],
  );
  const viewId = app.view().id;
  const [notes] = app.propertyIds;
  if (notes === undefined) throw new Error("no property");
  const rowId = (index: number) => {
    const id = app.rowIds[index];
    if (id === undefined) throw new Error("no row");
    return id;
  };
  const rowIds = (setup.ticked ?? []).map(rowId);
  app.dispatch(selectRows.create({ rowIds }));
  if (setup.sorted === true) {
    app.dispatch(
      sortByProperty.create({
        viewId,
        propertyId: notes,
        direction: "ascending",
        keepOthers: false,
      }),
    );
  }
  app.dispatch(setFrozenCount.create({ viewId, count: 1 }));
  app.dispatch(toggleWrapped.create({ viewId, propertyId: notes }));
  const built = app.store.getState();
  const activeCell =
    setup.active === undefined
      ? null
      : { rowId: rowId(setup.active), propertyId: notes, isEditing: false };
  const state = { ...built, ui: { ...built.ui, activeCell } };
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderDatabase(state, dispatch), host);
  return { app, host, sent, rowId, notes };
}

function checks(host: HTMLElement): HTMLInputElement[] {
  return [
    ...host.querySelectorAll<HTMLInputElement>("tbody .database__row-check"),
  ];
}

function button(host: HTMLElement, label: string): HTMLButtonElement {
  const found = [...host.querySelectorAll("button")].find(
    (item) =>
      item.textContent.trim() === label ||
      item.getAttribute("aria-label") === label,
  );
  if (found === undefined) throw new Error(`no ${label} button`);
  return found;
}

function key(target: Element | null, init: KeyboardEventInit): void {
  target?.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, ...init }),
  );
}

describe("selecting rows in a table", () => {
  it("ticks a row, and a range with Shift", () => {
    const { host, sent, rowId } = rendered({ ticked: [0] });

    checks(host)[2]?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, shiftKey: true }),
    );

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.selectRows",
        rowIds: [rowId(0), rowId(1), rowId(2)],
      }),
    ]);
  });

  it("acts on the ticked rows from a bar above the table", () => {
    const { host, sent, rowId } = rendered({ ticked: [0, 2] });

    expect(host.querySelector(".database__bulk")?.textContent).toContain(
      "2 selected",
    );
    button(host, "Delete").click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "row.deleteMany",
        rowIds: [rowId(0), rowId(2)],
      }),
    ]);
  });

  it("gives the ticked rows a button per property, as Notion's bar", () => {
    const { host, sent, notes } = rendered({ ticked: [0] });
    const bar = host.querySelector<HTMLElement>(".database__bulk");
    if (bar === null) throw new Error("no bar");

    button(bar, "Notes").click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: BULK_EDIT_OVERLAY, anchorId: notes },
      }),
    ]);
  });

  it("fills the first ticked row's value down with Ctrl+D", () => {
    const { host, sent, rowId, notes } = rendered({
      ticked: [0, 1],
      active: 0,
    });

    key(host.querySelector("[data-active]"), { key: "d", ctrlKey: true });

    expect(sent).toEqual([
      expect.objectContaining({
        type: "row.setValueMany",
        rowIds: [rowId(1)],
        propertyId: notes,
        value: "1",
      }),
    ]);
  });

  it("moves a row with Alt+Shift and an arrow, and drags it by its handle", () => {
    const { host, sent, rowId } = rendered({ active: 0 });

    key(host.querySelector("[data-active]"), {
      key: "ArrowDown",
      altKey: true,
      shiftKey: true,
    });

    expect(sent).toEqual([
      expect.objectContaining({
        type: "row.move",
        rowId: rowId(0),
        beforeRowId: rowId(2),
      }),
    ]);
    expect(host.querySelectorAll("tbody .database__row-handle")).toHaveLength(
      3,
    );
  });

  it("does not reorder rows by hand while the view is sorted", () => {
    const { host, sent } = rendered({ sorted: true, active: 0 });

    key(host.querySelector("[data-active]"), {
      key: "ArrowDown",
      altKey: true,
      shiftKey: true,
    });

    expect(sent).toEqual([]);
    expect(host.querySelectorAll("tbody .database__row-handle")).toHaveLength(
      0,
    );
  });

  it("marks frozen and wrapped columns", () => {
    const { host, notes } = rendered();

    const title = host.querySelector('tbody td[data-type="title"]');
    const note = host.querySelector(`tbody td[data-cell$="${notes}"]`);

    expect(title?.hasAttribute("data-frozen")).toBe(true);
    expect(note?.hasAttribute("data-frozen")).toBe(false);
    expect(note?.hasAttribute("data-wrapped")).toBe(true);
  });
});
