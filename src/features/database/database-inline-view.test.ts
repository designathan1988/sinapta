// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, Dispatch } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderInlineDatabase } from "./database-inline.view.ts";

function rendered() {
  const app = createDatabaseApp([{ name: "Due", type: "date" }], [["Write"]]);
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderInlineDatabase(app.store.getState(), dispatch, app.databaseId),
    host,
  );
  return { app, host, sent };
}

describe("renderInlineDatabase", () => {
  it("renames the database from the title above its views", () => {
    const { app, host, sent } = rendered();
    const title = host.querySelector<HTMLInputElement>(
      ".database__inline-title",
    );
    if (title === null) throw new Error("no title");

    title.value = "Reading list";
    title.dispatchEvent(new Event("change", { bubbles: true }));

    expect(sent).toEqual([
      expect.objectContaining({
        type: "page.rename",
        pageId: app.databaseId,
        title: "Reading list",
      }),
    ]);
  });

  it("opens as a full page", () => {
    const { app, host, sent } = rendered();

    host
      .querySelector<HTMLButtonElement>(".database__inline-open button")
      ?.click();

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.setActivePage",
        pageId: app.databaseId,
      }),
    ]);
  });

  it("opens its own filters, tied to this database", () => {
    const { app, host, sent } = rendered();
    const filter = [...host.querySelectorAll("button")].find(
      (button) => button.getAttribute("aria-label") === "Filter",
    );

    filter?.click();

    expect(sent[0]).toMatchObject({
      overlay: { kind: "filters", anchorId: app.databaseId },
    });
  });
});
