import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "../../database-builder.ts";
import { selectTableModel } from "../../table-model.selectors.ts";
import { setViewType } from "../../view-layout.commands.ts";
import {
  addDays,
  monthOf,
  selectCalendarEntries,
  selectMonthWeeks,
  shiftMonth,
} from "./calendar.selectors.ts";
import { setCalendarMonth } from "./calendar.commands.ts";

describe("calendar dates", () => {
  it("adds days across month and year ends", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2026-11-10", 7)).toBe("2026-11-17");
  });

  it("names the month of a day and moves between months", () => {
    expect(monthOf("2026-11-10")).toBe("2026-11");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("lays a month out in whole weeks from Sunday", () => {
    const weeks = selectMonthWeeks("2026-11");

    expect(weeks).toHaveLength(5);
    expect(weeks[0]?.[0]).toBe("2026-11-01");
    expect(weeks.at(-1)?.at(-1)).toBe("2026-12-05");
  });
});

describe("selectCalendarEntries", () => {
  it("groups the view's rows by the day of the date property", () => {
    const app = createDatabaseApp(
      [{ name: "Due", type: "date" }],
      [["A", "2026-11-10"], ["B", "2026-11-10"], ["C"], ["D", "2026-11-11"]],
    );
    app.dispatch(
      setViewType.create({ viewId: app.view().id, viewType: "calendar" }),
    );
    const model = selectTableModel(app.store.getState(), app.databaseId);
    if (model === undefined) throw new Error("no model");

    const entries = selectCalendarEntries(model);

    expect(entries?.byDay.get("2026-11-10")?.map((row) => row.title)).toEqual([
      "A",
      "B",
    ]);
    expect(entries?.byDay.get("2026-11-11")?.map((row) => row.title)).toEqual([
      "D",
    ]);
  });
});

describe("calendar.setMonth", () => {
  it("shows another month, and the current one again with null", () => {
    const app = createDatabaseApp([], []);

    app.dispatch(setCalendarMonth.create({ month: "2027-02" }));
    expect(app.store.getState().ui.calendarMonth).toBe("2027-02");

    app.dispatch(setCalendarMonth.create({ month: null }));
    expect(app.store.getState().ui.calendarMonth).toBeNull();
  });
});
