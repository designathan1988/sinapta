// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command, OpenOverlay } from "../../state/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { renderDatabase } from "./database.view.ts";
import { CELL_DATE_OVERLAY } from "./table-cell.view.ts";

function rendered(panel?: string, child?: string) {
  const app = createDatabaseApp(
    [{ name: "Due", type: "date" }],
    [["A", { start: "2026-11-10" }]],
  );
  const [due] = app.propertyIds;
  const rowId = app.rowIds[0];
  if (due === undefined || rowId === undefined) throw new Error("setup");
  const overlay: OpenOverlay = {
    kind: CELL_DATE_OVERLAY,
    anchorId: `${rowId}:${due}`,
    ...(panel !== undefined && { panel }),
    ...(child !== undefined && { children: [{ anchorId: child }] }),
  };
  const built = app.store.getState();
  const state = { ...built, ui: { ...built.ui, overlay } };
  const sent: Command[] = [];
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase(state, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  return { host, sent, rowId, due };
}

describe("a date cell's calendar", () => {
  it("opens on the date's month and chooses a day", () => {
    const { host, sent, rowId, due } = rendered();

    host.querySelector<HTMLElement>('[data-day="2026-11-14"]')?.click();

    expect(host.querySelector(".date-picker__month")?.textContent).toBe(
      "Nov 2026",
    );
    expect(sent).toEqual([
      expect.objectContaining({
        type: "row.setValue",
        rowId,
        propertyId: due,
        value: { start: "2026-11-14" },
      }),
    ]);
  });

  it("shows the month the arrows moved to, and moves on", () => {
    const { host, sent } = rendered("month:2027-01");

    host.querySelector<HTMLElement>('[aria-label="Next month"]')?.click();

    expect(host.querySelector(".date-picker__month")?.textContent).toBe(
      "Jan 2027",
    );
    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.openOverlayPanel",
        panel: "month:2027-02",
      }),
    ]);
  });

  it("sets the property's date format from its Date format list", () => {
    const { host, sent } = rendered();
    const row = [...host.querySelectorAll<HTMLElement>(".menu__item")].find(
      (item) => item.textContent.includes("Date format"),
    );

    expect(row?.getAttribute("aria-haspopup")).toBe("menu");
    row?.click();

    expect(sent).toEqual([
      expect.objectContaining({ type: "ui.openChildOverlay" }),
    ]);
  });

  it("writes the chosen date format into the property", () => {
    const { host, sent, due } = rendered(undefined, "date-format");
    const full = [
      ...host.querySelectorAll<HTMLElement>("[role=menuitemradio]"),
    ].find((item) => item.textContent.includes("Full date"));

    full?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "property.setConfig",
        propertyId: due,
        config: { dateFormat: "full", timeFormat: "12-hour" },
      }),
    );
  });
});
