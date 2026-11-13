// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OpenOverlay } from "../../../state/index.ts";
import { createDatabaseApp } from "../database-builder.ts";
import { renderDatabase } from "../database.view.ts";
import { setGroupOptions, setViewGroupBy } from "../group.commands.ts";
import { VIEW_SETTINGS_OVERLAY } from "./index.ts";

// A table grouped by Owner (text) or Points (number), its settings open
// on a panel.
function rendered(by: "Owner" | "Points", panel: string, interval = false) {
  const app = createDatabaseApp(
    [
      { name: "Owner", type: "text" },
      { name: "Points", type: "number" },
    ],
    [],
  );
  const viewId = app.view().id;
  const propertyId = app.propertyIds[by === "Owner" ? 0 : 1];
  if (propertyId === undefined) throw new Error("setup");
  app.dispatch(setViewGroupBy.create({ viewId, propertyId }));
  if (interval) {
    const options = { numberBy: { kind: "interval", size: 5 } } as const;
    app.dispatch(setGroupOptions.create({ viewId, options }));
  }
  const built = app.store.getState();
  const overlay: OpenOverlay = {
    kind: VIEW_SETTINGS_OVERLAY,
    anchorId: app.databaseId,
    panel,
  };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase({ ...built, ui: { ...built.ui, overlay } }, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  const row = (label: string) =>
    [...host.querySelectorAll<HTMLElement>(".menu [data-index]")].find(
      (item) =>
        item.querySelector(".menu__label")?.textContent.trim() === label,
    );
  return { host, sent, row, viewId };
}

describe("the group panel's Text by and Number by", () => {
  it("shows Text by with its value for a text property", () => {
    const { row } = rendered("Owner", "group");

    expect(row("Text by")?.querySelector(".menu__value")?.textContent).toBe(
      "Exact",
    );
    expect(row("Number by")).toBeUndefined();
  });

  it("groups text by its first letter when Alphabetical is chosen", () => {
    const { row, sent, viewId } = rendered("Owner", "group-text");

    row("Alphabetical")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "view.setGroupOptions",
        viewId,
        options: { textBy: "alphabetical" },
      }),
    );
  });

  it("groups numbers by intervals of a hundred, as Notion's, when Interval is chosen", () => {
    const { row, sent } = rendered("Points", "group-number");

    row("Interval")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({
        options: { numberBy: { kind: "interval", size: 100 } },
      }),
    );
  });

  it("takes an interval's size from its field", () => {
    const { host, sent } = rendered("Points", "group-number", true);
    const field = host.querySelector<HTMLInputElement>("[data-interval=size]");

    if (field !== null) field.value = "25";
    field?.dispatchEvent(new Event("change", { bubbles: true }));

    expect(sent).toContainEqual(
      expect.objectContaining({
        options: { numberBy: { kind: "interval", size: 25 } },
      }),
    );
  });
});
