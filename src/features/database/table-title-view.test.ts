// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";

// The title cell's icon, the row given an icon or not.
function rowIcon(icon: string | null): Element {
  const app = createDatabaseApp([], [["Rent"]]);
  const rowId = app.rowIds[0];
  const built = app.store.getState();
  const row = rowId === undefined ? undefined : built.workspace.blocks[rowId];
  if (rowId === undefined || row === undefined) throw new Error("setup");
  const blocks = {
    ...built.workspace.blocks,
    [rowId]: { ...row, props: { ...row.props, icon } },
  };
  // A new row's title is being edited; the row is read here.
  const ui = { ...built.ui, activeCell: null };
  const state = { ...built, ui, workspace: { ...built.workspace, blocks } };
  const host = document.createElement("div");
  render(
    renderDatabase(state, () => ({ ok: true })),
    host,
  );
  const found = host.querySelector('[data-type="title"] .database__row-icon');
  if (found === null) throw new Error("no row icon");
  return found;
}

describe("a table's title cell", () => {
  it("shows the row's icon before its title, as Notion's", () => {
    expect(rowIcon("🏠").textContent.trim()).toBe("🏠");
  });

  it("shows a page's icon for a row without one", () => {
    expect(rowIcon(null).querySelector(".icon")).not.toBeNull();
  });
});
