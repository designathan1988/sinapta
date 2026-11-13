import { describe, expect, it } from "vitest";
import { toPropertyId } from "../../database-builder.ts";
import { propertyType } from "../../property-registry.ts";
import type { FilterContext } from "../../property-definition.ts";
import type { Filter } from "../../../../model/index.ts";

const property = { id: toPropertyId("p-due"), name: "Due", type: "date" };
const date = propertyType("date");

interface Case {
  readonly operator?: string;
  readonly today?: string;
  readonly weekStartsOn?: 0 | 1;
  readonly dateEnd?: "start" | "end";
}

// 2026-11-13 is a Friday.
function passes(value: unknown, operand: string, setup: Case = {}): boolean {
  const id = setup.operator ?? "relative";
  const operator = date.filterOperators.find((item) => item.id === id);
  if (operator === undefined) throw new Error(`no ${id} operator`);
  const filter: Filter = {
    propertyId: property.id,
    operator: id,
    value: operand,
    ...(setup.dateEnd !== undefined && { dateEnd: setup.dateEnd }),
  };
  const context: FilterContext = {
    property,
    today: setup.today ?? "2026-11-13",
    weekStartsOn: setup.weekStartsOn ?? 0,
    filter,
  };
  return operator.test(date.read(value), operand, context);
}

describe("a date filter relative to today", () => {
  it("is the filter a date condition starts with, on this week", () => {
    const relative = date.filterOperators.find(
      (item) => item.id === date.defaultFilter,
    );
    expect(relative?.label).toBe("Is relative to today");
    expect(relative?.defaultOperand).toBe("this:week");
    expect(relative?.describe?.("this:week")).toBe("This week");
  });

  it("keeps this week and drops a day eight days ago", () => {
    expect(passes({ start: "2026-11-13" }, "this:week")).toBe(true);
    expect(passes({ start: "2026-11-08" }, "this:week")).toBe(true);
    expect(passes({ start: "2026-11-05" }, "this:week")).toBe(false);
  });

  it("starts this week on the week's first day, Sunday or Monday", () => {
    expect(passes({ start: "2026-11-08" }, "this:week")).toBe(true);
    const monday = { weekStartsOn: 1 } as const;
    expect(passes({ start: "2026-11-08" }, "this:week", monday)).toBe(false);
    expect(passes({ start: "2026-11-15" }, "this:week", monday)).toBe(true);
  });

  it("keeps yesterday in the past week, and not tomorrow", () => {
    expect(passes({ start: "2026-11-12" }, "past:week")).toBe(true);
    expect(passes({ start: "2026-11-14" }, "past:week")).toBe(false);
  });

  it("reaches across a year's end for the next month", () => {
    const today = "2026-12-20";
    expect(passes({ start: "2027-01-15" }, "next:month", { today })).toBe(true);
    expect(passes({ start: "2027-01-21" }, "next:month", { today })).toBe(
      false,
    );
    expect(passes({ start: "2026-12-01" }, "this:month", { today })).toBe(true);
    expect(passes({ start: "2026-01-01" }, "this:year", { today })).toBe(true);
  });

  it("tests a range's end when the condition says so", () => {
    const range = { start: "2026-11-01", end: "2026-11-12" };
    expect(passes(range, "this:week")).toBe(false);
    expect(passes(range, "this:week", { dateEnd: "end" })).toBe(true);
    expect(
      passes(range, "2026-11-12", { operator: "is", dateEnd: "end" }),
    ).toBe(true);
  });

  it("lets every row through an operand it cannot read", () => {
    expect(passes({ start: "1999-01-01" }, "soon:week")).toBe(true);
  });

  it("keeps an empty date only for Is empty", () => {
    expect(passes(undefined, "this:week")).toBe(false);
    expect(passes(undefined, "", { operator: "is-empty" })).toBe(true);
    expect(passes(undefined, "", { operator: "is-not-empty" })).toBe(false);
  });

  it("offers Notion's conditions, on or before and on or after among them", () => {
    const offered = date.filterOperators.filter((item) => !item.isRetired);
    expect(offered.map((item) => item.label)).toEqual([
      "Is",
      "Is before",
      "Is after",
      "Is on or before",
      "Is on or after",
      "Is between",
      "Is relative to today",
      "Is empty",
      "Is not empty",
    ]);
  });

  it("keeps the days between two days, both included, in either order", () => {
    const between = { operator: "between" } as const;
    expect(
      passes({ start: "2026-11-10" }, "2026-11-10..2026-11-12", between),
    ).toBe(true);
    expect(
      passes({ start: "2026-11-12" }, "2026-11-12..2026-11-10", between),
    ).toBe(true);
    expect(
      passes({ start: "2026-11-13" }, "2026-11-10..2026-11-12", between),
    ).toBe(false);
    expect(passes({ start: "1999-01-01" }, "2026-11-10..", between)).toBe(true);
  });
});
