import { describe, expect, it } from "vitest";
import { toPropertyId } from "../../database-builder.ts";
import { propertyType } from "../../property-registry.ts";
import { formatDateValue, readDateValue } from "./date-value.ts";

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

describe("formatDateValue", () => {
  it("writes a day in the property's date format", () => {
    const day = { start: "2026-11-10" };

    expect(formatDateValue(day)).toBe("Nov 10, 2026");
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

    expect(formatDateValue(range)).toBe("Nov 10, 2026 9:05 PM → Nov 12, 2026");
    expect(
      formatDateValue(range, {
        dateFormat: "month-day-year",
        timeFormat: "24-hour",
      }),
    ).toBe("11/10/2026 21:05 → 11/12/2026");
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
