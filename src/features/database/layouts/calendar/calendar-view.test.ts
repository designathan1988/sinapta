// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { Command } from "../../../../state/index.ts";
import { createDatabaseApp } from "../../database-builder.ts";
import { renderDatabase } from "../../database.view.ts";
import { setViewType } from "../../view-layout.commands.ts";
import { setCalendarOptions } from "../../calendar-options.commands.ts";

// A calendar of a database with one dated row, in week mode or not.
function rendered(
  options: Parameters<typeof setCalendarOptions.create>[0]["options"],
) {
  const app = createDatabaseApp(
    [{ name: "Due", type: "date" }],
    [["Ship", { start: "2026-11-10", end: "2026-11-12" }]],
  );
  const viewId = app.view().id;
  app.dispatch(setViewType.create({ viewId, viewType: "calendar" }));
  app.dispatch(setCalendarOptions.create({ viewId, options }));
  const built = app.store.getState();
  const state = {
    ...built,
    ui: { ...built.ui, calendarMonth: "2026-11", calendarWeek: "2026-11-08" },
  };
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
  return { host, sent };
}

describe("the calendar's options", () => {
  it("shows one week of seven days, a range on each of its days", () => {
    const { host } = rendered({ mode: "week" });

    const days = [...host.querySelectorAll<HTMLElement>(".calendar__day")];

    expect(days.map((day) => day.dataset.day)).toEqual([
      "2026-11-08",
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
    ]);
    expect(
      days.filter((day) => day.querySelector(".calendar__entry") !== null)
        .length,
    ).toBe(3);
  });

  it("leaves the weekend columns out", () => {
    const { host } = rendered({ mode: "month", showWeekends: false });

    expect(host.querySelectorAll(".calendar__grid th")).toHaveLength(5);
    expect(host.querySelector('[data-day="2026-11-08"]')).toBeNull();
  });

  it("moves by a week in week mode", () => {
    const { host, sent } = rendered({ mode: "week" });

    host.querySelector<HTMLElement>('[aria-label="Next week"]')?.click();

    expect(sent).toEqual([
      expect.objectContaining({ type: "calendar.setWeek", day: "2026-11-15" }),
    ]);
  });
});
