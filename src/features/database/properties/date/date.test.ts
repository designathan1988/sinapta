import { describe, expect, it } from "vitest";
import { toPropertyId } from "../../database-builder.ts";
import { propertyType } from "../../property-registry.ts";
import {
  formatDateValue,
  formatFilterDate,
  readDateValue,
  reminderDay,
} from "./date-value.ts";
import { readDateConfig } from "./date.schema.ts";

const property = { id: toPropertyId("due"), name: "Due", type: "date" };
const date = propertyType("date");

function within(value: unknown, operand: string, today = "2026-11-11") {
  const operator = date.filterOperators.find((item) => item.id === "within");
  if (operator === undefined) throw new Error("no within operator");
  return operator.test(value, operand, { property, today });
}

describe("readDateValue", () => {
  it("reads a day, a range and a time", () => {
    expect(readDateValue({ start: "2026-11-10" })).toEqual({
      start: "2026-11-10",
    });
    expect(
      readDateValue({ start: "2026-11-10", end: "2026-11-12", time: "09:30" }),
    ).toEqual({ start: "2026-11-10", end: "2026-11-12", time: "09:30" });
  });

  it("refuses a range that ends before it starts, and old strings", () => {
    expect(
      readDateValue({ start: "2026-11-10", end: "2026-11-01" }),
    ).toBeUndefined();
    expect(readDateValue("2026-11-10")).toBeUndefined();
    expect(readDateValue({ start: "2026-02-30" })).toBeUndefined();
    expect(
      readDateValue({ start: "2026-11-10", time: "25:00" }),
    ).toBeUndefined();
  });
});

describe("a date's reminder", () => {
  it("is kept when it is one of the choices, and dropped when not", () => {
    expect(readDateValue({ start: "2026-11-10", remind: "1-day" })).toEqual({
      start: "2026-11-10",
      remind: "1-day",
    });
    expect(readDateValue({ start: "2026-11-10", remind: "never" })).toEqual({
      start: "2026-11-10",
    });
  });

  it("falls due on the day it names before the date", () => {
    const due = (remind: string) =>
      reminderDay(
        readDateValue({ start: "2026-11-10", remind }) ?? {
          start: "2026-11-10",
        },
      );

    expect(due("day-of")).toBe("2026-11-10");
    expect(due("1-day")).toBe("2026-11-09");
    expect(due("2-days")).toBe("2026-11-08");
    expect(due("1-week")).toBe("2026-11-03");
    expect(reminderDay({ start: "2026-11-10" })).toBeUndefined();
  });
});

describe("formatDateValue", () => {
  it("writes a day in the property's date format, Full date first, as Notion's", () => {
    const day = { start: "2026-11-10" };

    // Notion's formats (n74-relative-code): "ll" read as Luxon's DDD.
    expect(formatDateValue(day)).toBe("November 10, 2026");
    expect(
      formatDateValue(day, { dateFormat: "full", timeFormat: "12-hour" }),
    ).toBe("November 10, 2026");
    expect(
      formatDateValue(day, {
        dateFormat: "day-month-year",
        timeFormat: "12-hour",
      }),
    ).toBe("10/11/2026");
    expect(
      formatDateValue(day, {
        dateFormat: "year-month-day",
        timeFormat: "12-hour",
      }),
    ).toBe("2026/11/10");
  });

  it("writes a range with an arrow and a time in the time format", () => {
    const range = { start: "2026-11-10", end: "2026-11-12", time: "21:05" };

    expect(formatDateValue(range)).toBe(
      "November 10, 2026 9:05 PM → November 12, 2026",
    );
    expect(
      formatDateValue(range, {
        dateFormat: "month-day-year",
        timeFormat: "24-hour",
      }),
    ).toBe("11/10/2026 21:05 → 11/12/2026");
  });
});

describe("Notion's Short date and Relative", () => {
  const TODAY = "2026-11-13";
  const as = (start: string, dateFormat: "short" | "relative") =>
    formatDateValue({ start }, { dateFormat, timeFormat: "12-hour" }, TODAY);

  it("writes a short date as the month and day, the year left out", () => {
    // n73-relative-dates: "nov. 13" for 2025 too, "dez. 25".
    expect(as("2026-11-10", "short")).toBe("Nov 10");
    expect(as("2025-11-13", "short")).toBe("Nov 13");
  });

  it.each([
    ["2026-11-13", "Today"],
    ["2026-11-14", "Tomorrow"],
    ["2026-11-12", "Yesterday"],
    ["2026-11-16", "Next Monday"],
    ["2026-11-10", "Tuesday"],
    ["2026-11-06", "Last Friday"],
    ["2026-11-25", "November 25, 2026"],
    ["2025-11-13", "November 13, 2025"],
  ])("writes %s, seen from Friday 2026-11-13, as %s", (start, words) => {
    expect(as(start, "relative")).toBe(words);
  });
});

describe("Notion's Hidden time format", () => {
  it("leaves the time out of a date that has one", () => {
    const value = { start: "2026-11-10", time: "21:05" };

    expect(
      formatDateValue(value, { dateFormat: "full", timeFormat: "hidden" }),
    ).toBe("November 10, 2026");
  });
});

describe("a date's config", () => {
  it("reads the old medium format as Full date, as Notion reads its old one", () => {
    expect(
      readDateConfig({ dateFormat: "medium", timeFormat: "24-hour" }),
    ).toEqual({ dateFormat: "full", timeFormat: "24-hour" });
  });
});

describe("formatFilterDate", () => {
  it("writes the days of a filter as the filter's fields do", () => {
    expect(formatFilterDate({ start: "2026-11-10", end: "2026-11-14" })).toBe(
      "Nov 10, 2026 → Nov 14, 2026",
    );
  });
});

describe("the date property", () => {
  it("parses a typed day as a range that starts that day", () => {
    expect(date.parse("2026-11-10")).toEqual({ start: "2026-11-10" });
    expect(
      date.format({ start: "2026-11-10", end: "2026-11-12" }, property),
    ).toBe("2026-11-10");
  });

  it("sorts by the first day", () => {
    expect(
      date.compare(
        { start: "2026-11-10" },
        { start: "2026-11-09", end: "2026-12-01" },
      ),
    ).toBeGreaterThan(0);
  });

  it("filters dates within the past week", () => {
    expect(within({ start: "2026-11-05" }, "past-week")).toBe(true);
    expect(within({ start: "2026-11-11" }, "past-week")).toBe(true);
    expect(within({ start: "2026-11-01" }, "past-week")).toBe(false);
    expect(within({ start: "2026-11-12" }, "past-week")).toBe(false);
    expect(
      within({ start: "2026-10-01", end: "2026-11-06" }, "past-week"),
    ).toBe(true);
    expect(within(undefined, "past-week")).toBe(false);
  });

  it("filters dates within the next month", () => {
    expect(within({ start: "2026-12-10" }, "next-month")).toBe(true);
    expect(within({ start: "2026-12-12" }, "next-month")).toBe(false);
    expect(within({ start: "2026-11-15" }, "next-month", "")).toBe(false);
  });

  it("keeps day comparisons on the first day", () => {
    const before = date.filterOperators.find((item) => item.id === "before");

    expect(before?.test({ start: "2026-01-01" }, "2026-06-01")).toBe(true);
  });
});
