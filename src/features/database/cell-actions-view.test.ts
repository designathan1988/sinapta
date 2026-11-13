// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { commentCommands, startDiscussion } from "../comments/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { CELL_FILES_OVERLAY } from "./table-cell.view.ts";

function rendered(withDiscussion = false) {
  const app = createDatabaseApp(
    [{ name: "Amount", type: "number" }],
    [["Salary", 3500]],
    { commands: commentCommands },
  );
  const [rowId] = app.rowIds;
  const [amount] = app.propertyIds;
  if (rowId === undefined || amount === undefined) throw new Error("setup");
  if (withDiscussion) {
    app.dispatch(
      startDiscussion.create({
        pageId: rowId,
        blockId: null,
        value: { propertyId: amount, quote: "3500" },
        text: "Gross?",
      }),
    );
  }
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(renderDatabase(app.store.getState(), dispatch), host);
  const cell = host.querySelector(`[data-cell="${rowId}:${amount}"]`);
  const button = (label: string) =>
    cell?.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
  return { host, sent, rowId, amount, cell, button };
}

describe("a value cell's bar", () => {
  it("opens the comment composer on the cell, and nothing else", () => {
    const { sent, rowId, amount, button } = rendered();

    button("Comment on property value")?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: {
          kind: "value-comment-composer",
          anchorId: `${rowId}:${amount}`,
        },
      }),
    ]);
  });

  it("opens the value's discussions once it has one", () => {
    const { sent, button } = rendered(true);

    button("Open discussion")?.click();

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      type: "ui.openOverlay",
      overlay: { kind: "value-discussions" },
    });
  });

  it("is not drawn in the title cell", () => {
    const { host, rowId } = rendered();

    const title = host.querySelector(`[data-cell="${rowId}:title"]`);

    expect(title?.querySelector("[data-cell-actions]")).toBeNull();
  });
});

describe("a button's cell", () => {
  it("has no bar over its button", () => {
    const app = createDatabaseApp([{ name: "Go", type: "button" }], [["A"]]);
    const [rowId] = app.rowIds;
    const [go] = app.propertyIds;
    if (rowId === undefined || go === undefined) throw new Error("setup");
    const host = document.createElement("div");
    document.body.replaceChildren(host);

    render(
      renderDatabase(app.store.getState(), () => ({ ok: true })),
      host,
    );

    const cell = host.querySelector(`[data-cell="${rowId}:${go}"]`);
    expect(cell).not.toBeNull();
    expect(cell?.querySelector("[data-cell-actions]")).toBeNull();
  });
});

describe("a press on a button's cell", () => {
  it("presses the button at once, as Notion's", () => {
    const app = createDatabaseApp([{ name: "Go", type: "button" }], [["A"]]);
    const [rowId] = app.rowIds;
    const [go] = app.propertyIds;
    if (rowId === undefined || go === undefined) throw new Error("setup");
    const sent: Command[] = [];
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderDatabase(app.store.getState(), (command) => {
        sent.push(command);
        return { ok: true };
      }),
      host,
    );

    host
      .querySelector<HTMLElement>(
        `[data-cell="${rowId}:${go}"] [data-action=press]`,
      )
      ?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({ rowId, propertyId: go }),
    );
    expect(sent.map((command) => command.type)).toContain("row.pressButton");
  });
});

describe("a files cell with its popover open", () => {
  it("reads + Add a file or image, as Notion's", () => {
    const app = createDatabaseApp([{ name: "Files", type: "files" }], [["A"]]);
    const [rowId] = app.rowIds;
    const [files] = app.propertyIds;
    if (rowId === undefined || files === undefined) throw new Error("setup");
    const built = app.store.getState();
    const overlay = { kind: CELL_FILES_OVERLAY, anchorId: `${rowId}:${files}` };
    const host = document.createElement("div");
    document.body.replaceChildren(host);

    render(
      renderDatabase({ ...built, ui: { ...built.ui, overlay } }, () => ({
        ok: true,
      })),
      host,
    );

    const cell = host.querySelector(`[data-cell="${rowId}:${files}"]`);
    expect(cell?.textContent).toContain("Add a file or image");
  });
});

describe("a files cell's bar while its popover is open", () => {
  it("is not drawn over + Add a file or image", () => {
    const app = createDatabaseApp([{ name: "Files", type: "files" }], [["A"]]);
    const [rowId] = app.rowIds;
    const [files] = app.propertyIds;
    if (rowId === undefined || files === undefined) throw new Error("setup");
    const built = app.store.getState();
    const overlay = { kind: CELL_FILES_OVERLAY, anchorId: `${rowId}:${files}` };
    const host = document.createElement("div");
    document.body.replaceChildren(host);

    render(
      renderDatabase({ ...built, ui: { ...built.ui, overlay } }, () => ({
        ok: true,
      })),
      host,
    );

    const cell = host.querySelector(`[data-cell="${rowId}:${files}"]`);
    expect(cell?.querySelector("[data-cell-actions]")).toBeNull();
  });
});
