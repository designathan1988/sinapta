// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "../../database-builder.ts";
import { renderDatabase } from "../../database.view.ts";
import type { Command } from "../../../../state/index.ts";
import { setListOptions } from "../../list-options.commands.ts";
import { createView } from "../../view.commands.ts";

// A database of two rows, shown as a list, its titles edited in place
// when asked.
function rendered(editTitle = false) {
  const app = createDatabaseApp([], [["Write"], ["Ship"]]);
  app.dispatch(
    createView.create({
      databaseId: app.databaseId,
      name: "List",
      viewType: "list",
    }),
  );
  if (editTitle) {
    const viewId = app.database().props.viewIds.at(-1);
    if (viewId !== undefined)
      app.dispatch(setListOptions.create({ viewId, options: { editTitle } }));
  }
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
  return Object.assign(host, { sent });
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

  it("renames a row from its title field with Directly edit page name", () => {
    const host = rendered(true);
    const field = host.querySelector<HTMLInputElement>(".list__title-field");

    if (field !== null) field.value = "Write more";
    field?.dispatchEvent(new Event("change", { bubbles: true }));

    expect(host.sent).toContainEqual(
      expect.objectContaining({ type: "page.rename", title: "Write more" }),
    );
    expect(
      host.querySelector(".list__row[data-edit] .button")?.textContent,
    ).toContain("Open");
  });

  it("puts the name back on Escape", () => {
    const host = rendered(true);
    const field = host.querySelector<HTMLInputElement>(".list__title-field");

    if (field !== null) field.value = "Oops";
    field?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(field?.value).toBe("Write");
  });
});
