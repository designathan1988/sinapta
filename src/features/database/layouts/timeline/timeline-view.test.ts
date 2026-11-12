// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../../../state/index.ts";
import { createDatabaseApp } from "../../database-builder.ts";
import { renderDatabase } from "../../database.view.ts";
import { setTimelineOptions } from "../../timeline-options.commands.ts";
import { setViewType } from "../../view-layout.commands.ts";

// A timeline of two dated rows and one without a date.
function rendered(showTable = true) {
  const app = createDatabaseApp(
    [{ name: "When", type: "date" }],
    [
      ["Plan", { start: "2026-11-10", end: "2026-11-12" }],
      ["Ship", { start: "2026-11-20" }],
      ["Someday"],
    ],
  );
  const viewId = app.view().id;
  app.dispatch(setViewType.create({ viewId, viewType: "timeline" }));
  app.dispatch(setTimelineOptions.create({ viewId, options: { showTable } }));
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
  const bar = (title: string) => {
    const found = [
      ...host.querySelectorAll<HTMLElement>(".timeline__bar"),
    ].find((item) => item.textContent.trim() === title);
    if (found === undefined) throw new Error(`no ${title} bar`);
    return found;
  };
  const press = (title: string, key: string, shiftKey = false) => {
    bar(title).dispatchEvent(
      new KeyboardEvent("keydown", {
        key,
        altKey: true,
        shiftKey,
        bubbles: true,
      }),
    );
  };
  return { host, sent, bar, press, when: app.propertyIds[0] };
}

describe("the timeline", () => {
  it("draws a bar for each dated row, as long as its days", () => {
    const { bar } = rendered();

    expect(bar("Plan").style.getPropertyValue("--span")).toBe("3");
    expect(bar("Ship").style.getPropertyValue("--span")).toBe("1");
    expect(Number(bar("Ship").style.getPropertyValue("--offset"))).toBe(
      Number(bar("Plan").style.getPropertyValue("--offset")) + 10,
    );
  });

  it("moves a bar with Alt and an arrow, and stretches it with Shift too", () => {
    const { sent, press, when } = rendered();

    press("Plan", "ArrowRight");
    press("Plan", "ArrowRight", true);

    expect(sent).toEqual([
      expect.objectContaining({
        type: "row.setValue",
        propertyId: when,
        value: { start: "2026-11-11", end: "2026-11-13" },
      }),
      expect.objectContaining({
        type: "row.setValue",
        value: { start: "2026-11-10", end: "2026-11-13" },
      }),
    ]);
  });

  it("lists the rows without a date apart, and the table beside when shown", () => {
    const shown = rendered();
    const hidden = rendered(false);

    expect(
      shown.host.querySelector(".timeline__undated")?.textContent,
    ).toContain("Someday");
    expect(
      shown.host.querySelectorAll(".timeline__table [data-row-id]"),
    ).toHaveLength(2);
    expect(hidden.host.querySelector(".timeline__table")).toBeNull();
  });

  it("lists the table's rows as items, each a button that opens it", () => {
    const { host } = rendered();

    const items = host.querySelectorAll(".timeline__table [role=listitem]");
    expect(items).toHaveLength(2);
    items.forEach((item) => {
      expect(item.querySelector("button[data-row-id]")).not.toBeNull();
      expect(item.querySelector("button")?.hasAttribute("role")).toBe(false);
    });
    expect(host.querySelector(".timeline__undated h2")).not.toBeNull();
  });
});
