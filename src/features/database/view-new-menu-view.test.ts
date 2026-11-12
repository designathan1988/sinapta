// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { NEW_VIEW_OVERLAY } from "./view-layout.view.ts";

// The database with its "New view" menu open.
function openMenu() {
  const app = createDatabaseApp([], [["Row"]]);
  const built = app.store.getState();
  const overlay = { kind: NEW_VIEW_OVERLAY, anchorId: app.databaseId };
  const state = { ...built, ui: { ...built.ui, activeCell: null, overlay } };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase(state, () => ({ ok: true })),
    host,
  );
  return [...host.querySelectorAll(".menu [data-index]")];
}

describe("the New view menu", () => {
  it("shows each layout with its own icon, as Notion's", () => {
    const icons = openMenu().map((row) =>
      row.querySelector(".icon")?.getAttribute("data-icon"),
    );

    expect(icons).toEqual([
      "table",
      "board",
      "timeline",
      "calendar",
      "list",
      "gallery",
      "chart",
      "feed",
      "form",
    ]);
  });
});
