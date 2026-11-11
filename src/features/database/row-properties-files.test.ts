// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { selectPage } from "../../blocks/page/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderRowProperties } from "./row-properties.view.ts";

describe("files on the row's page", () => {
  it("adds a linked file to the row and nothing else", () => {
    const app = createDatabaseApp([{ name: "Files", type: "files" }], [["A"]]);
    const rowId = app.rowIds[0];
    const propertyId = app.propertyIds[0];
    if (rowId === undefined || propertyId === undefined)
      throw new Error("setup");
    const state = app.store.getState();
    const container = document.createElement("div");
    document.body.replaceChildren(container);
    render(
      renderRowProperties(
        { ...state, ui: { ...state.ui, activePageId: rowId } },
        app.dispatch,
      ),
      container,
    );
    const link =
      container.querySelector<HTMLInputElement>('[data-part="link"]');
    if (link === null) throw new Error("no link field");

    link.value = "https://example.com/brief.pdf";
    link.dispatchEvent(new Event("change", { bubbles: true }));

    const values = selectPage(app.store.getState(), rowId)?.props.values;
    expect(values?.[propertyId]).toEqual([
      { name: "brief.pdf", url: "https://example.com/brief.pdf" },
    ]);
  });
});
