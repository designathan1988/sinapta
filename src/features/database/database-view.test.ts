// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";

function rendered() {
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
  render(renderDatabase(app.store.getState(), dispatch), host);
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
