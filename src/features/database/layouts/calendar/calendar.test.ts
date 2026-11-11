import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "../../database-builder.ts";
import { selectTableModel } from "../../table-model.selectors.ts";
import { setViewType } from "../../view-layout.commands.ts";
import {
  addDays,
  monthOf,
  selectCalendarEntries,
  selectMonthWeeks,
  selectShownDays,
  selectWeekDays,
  shiftDateValue,
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
    const day = (start: string) => ({ start });
    const app = createDatabaseApp(
      [{ name: "Due", type: "date" }],
      [
        ["A", day("2026-11-10")],
        ["B", day("2026-11-10")],
        ["C"],
        ["D", day("2026-11-11")],
        ["E", { start: "2026-11-11", end: "2026-11-13" }],
      ],
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
      "E",
    ]);
    expect(entries?.byDay.get("2026-11-13")?.map((row) => row.title)).toEqual([
      "E",
    ]);
  });
});

describe("shiftDateValue", () => {
  it("moves a range by whole days and keeps its time", () => {
    const range = { start: "2026-11-11", end: "2026-11-13", time: "09:00" };

    expect(shiftDateValue(range, "2026-11-12", "2026-11-15")).toEqual({
      start: "2026-11-14",
      end: "2026-11-16",
      time: "09:00",
    });
  });

  it("starts an empty date on the day it lands", () => {
    expect(shiftDateValue(undefined, "2026-11-12", "2026-11-15")).toEqual({
      start: "2026-11-15",
    });
  });
});

describe("calendar options", () => {
  it("starts weeks on Monday when asked", () => {
    expect(selectMonthWeeks("2026-11", 1)[0]?.[0]).toBe("2026-10-26");
    expect(selectWeekDays("2026-11-11", 0)).toEqual([
      "2026-11-08",
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
    ]);
    expect(selectWeekDays("2026-11-11", 1)[0]).toBe("2026-11-09");
  });

  it("leaves Saturdays and Sundays out when weekends are hidden", () => {
    const week = selectWeekDays("2026-11-11", 0);

    expect(selectShownDays(week, false)).toEqual([
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
    ]);
    expect(selectShownDays(week, true)).toEqual(week);
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
