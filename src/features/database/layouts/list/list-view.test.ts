// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "../../database-builder.ts";
import { renderDatabase } from "../../database.view.ts";
import { createView } from "../../view.commands.ts";

// A database of two rows, shown as a list.
function rendered() {
  const app = createDatabaseApp([], [["Write"], ["Ship"]]);
  app.dispatch(
    createView.create({
      databaseId: app.databaseId,
      name: "List",
      viewType: "list",
    }),
  );
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase(app.store.getState(), () => ({ ok: true })),
    host,
  );
  return host;
}

describe("the list layout", () => {
  it("has one New page, under its rows, as Notion's", () => {
    const host = rendered();

    const adds = [...host.querySelectorAll("button")].filter(
      (button) => button.textContent.trim() === "New page",
    );

    expect(adds).toHaveLength(1);
  });

  it("shows each row's page icon before its title", () => {
    const host = rendered();

    const rows = [...host.querySelectorAll(".list__row")];

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.querySelector(".list__icon .icon"))).toBe(
      true,
    );
  });
});
