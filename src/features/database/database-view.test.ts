// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { VIEW_SORTS_OVERLAY } from "./view-settings/index.ts";

// The database, with an overlay of its own open when one is named.
function rendered(open?: string) {
  const app = createDatabaseApp(
    [
      { name: "Due", type: "date" },
      { name: "Done", type: "checkbox" },
    ],
    [["Write"]],
  );
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  const built = app.store.getState();
  const overlay =
    open === undefined ? null : { kind: open, anchorId: app.databaseId };
  const state = { ...built, ui: { ...built.ui, overlay } };
  render(renderDatabase(state, dispatch), host);
  const button = (label: string) => {
    const found = [...host.querySelectorAll("button")].find(
      (item) =>
        item.getAttribute("aria-label") === label ||
        item.textContent.trim() === label,
    );
    if (found === undefined) throw new Error(`no ${label} button`);
    return found;
  };
  return { app, host, sent, button };
}

describe("renderDatabase", () => {
  it("adds a row and opens it with the New button", () => {
    const { app, sent, button } = rendered();

    button("New").click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "row.add",
        databaseId: app.databaseId,
        opensPage: true,
      }),
    ]);
  });

  it("opens the filters and the view settings from icon buttons", () => {
    const { sent, button } = rendered();

    button("Filter").click();
    button("View settings").click();

    expect(sent.map((command) => command.type)).toEqual([
      "ui.openOverlay",
      "ui.openOverlay",
    ]);
    expect(sent[1]).toMatchObject({ overlay: { kind: "view-settings" } });
  });

  it("opens the view's sorts from the Sort button, as Notion's", () => {
    const { sent, button } = rendered();

    button("Sort").click();

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      type: "ui.openOverlay",
      overlay: { kind: VIEW_SORTS_OVERLAY },
    });
  });

  it("lists the properties to sort by while the view has no sort", () => {
    const { host } = rendered(VIEW_SORTS_OVERLAY);

    const rows = [...host.querySelectorAll(".menu [data-index]")].map((row) =>
      row.textContent.trim(),
    );

    expect(rows).toEqual(["Name", "Due", "Done"]);
  });

  it("marks each column and each view with its type's icon", () => {
    const { host } = rendered();

    const headers = [...host.querySelectorAll("th[data-property-id]")];
    expect(
      headers.map((header) =>
        header.querySelector("[data-icon]")?.getAttribute("data-icon"),
      ),
    ).toEqual(["title", "calendar", "checkbox"]);
    expect(
      host
        .querySelector(".database__tab [data-icon]")
        ?.getAttribute("data-icon"),
    ).toBe("table");
  });

  it("adds a row under the table's last row", () => {
    const { app, sent, host } = rendered();
    const add = host.querySelector<HTMLButtonElement>(".database__add-row");

    add?.click();

    expect(sent).toEqual([
      expect.objectContaining({ type: "row.add", databaseId: app.databaseId }),
    ]);
    expect(sent[0]).not.toMatchObject({ opensPage: true });
  });
});
