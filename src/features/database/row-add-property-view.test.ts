// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OpenOverlay } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import {
  ROW_ADD_PROPERTY_OVERLAY,
  renderRowProperties,
} from "./row-properties.view.ts";

// A row's page, its "Add a property" menu open when asked.
function mount(isOpen = false) {
  const app = createDatabaseApp([{ name: "Due", type: "date" }], [["A"]]);
  const rowId = app.rowIds[0];
  if (rowId === undefined) throw new Error("setup");
  const overlay: OpenOverlay | null = isOpen
    ? { kind: ROW_ADD_PROPERTY_OVERLAY, anchorId: rowId }
    : null;
  const built = app.store.getState();
  const state = { ...built, ui: { ...built.ui, activePageId: rowId, overlay } };
  const sent: Command[] = [];
  const container = document.createElement("div");
  document.body.replaceChildren(container);
  render(
    renderRowProperties(state, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    container,
  );
  return { app, container, sent, rowId };
}

describe("a row page's Add a property, as Notion's", () => {
  it("opens the property types from under the properties", () => {
    const { container, sent, rowId } = mount();
    const add = [...container.querySelectorAll("button")].find(
      (button) => button.textContent.trim() === "Add a property",
    );

    add?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: ROW_ADD_PROPERTY_OVERLAY, anchorId: rowId },
      }),
    ]);
  });

  it("adds a property of the chosen type to the row's database", () => {
    const { app, container, sent } = mount(true);
    const number = [
      ...container.querySelectorAll<HTMLElement>(".menu [data-index]"),
    ].find((row) => row.textContent.trim() === "Number");

    number?.click();

    expect(sent.at(-1)).toMatchObject({
      type: "property.add",
      databaseId: app.databaseId,
      propertyType: "number",
    });
  });
});
