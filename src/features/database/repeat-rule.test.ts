import { describe, expect, it } from "vitest";
import { firstOnOrAfter, nextOccurrence } from "./repeat-rule.ts";

// 2026-11-13 is a Friday; 2026-11-16 a Monday.
describe("nextOccurrence", () => {
  it.each([
    ["2026-11-11", { every: "day" }, "2026-11-12"],
    ["2026-11-11", { every: "day", interval: 3 }, "2026-11-14"],
    ["2026-11-11", { every: "week" }, "2026-11-18"],
    ["2026-01-31", { every: "month" }, "2026-02-28"],
    ["2026-01-31", { every: "month", interval: 3 }, "2026-04-30"],
    ["2026-12-15", { every: "month" }, "2027-01-15"],
    ["2028-02-29", { every: "year" }, "2029-02-28"],
  ] as const)("goes from %s, %o, on to %s", (day, rule, next) => {
    expect(nextOccurrence(day, rule)).toBe(next);
  });

  it("keeps to the weekdays of a week, Monday to Friday", () => {
    const weekdays = { every: "week", weekdays: [0, 1, 2, 3, 4] } as const;

    expect(nextOccurrence("2026-11-13", weekdays)).toBe("2026-11-16");
    expect(nextOccurrence("2026-11-16", weekdays)).toBe("2026-11-17");
  });

  it("skips the weeks between, every 2 weeks from its start", () => {
    const rule = {
      every: "week",
      interval: 2,
      weekdays: [0],
      start: "2026-11-16",
    } as const;

    expect(nextOccurrence("2026-11-16", rule)).toBe("2026-11-30");
  });
});

describe("firstOnOrAfter", () => {
  it("is the start for days, and the first weekday from it for weeks", () => {
    expect(firstOnOrAfter("2026-11-14", { every: "day" })).toBe("2026-11-14");
    expect(firstOnOrAfter("2026-11-14", { every: "week", weekdays: [0] })).toBe(
      "2026-11-16",
    );
  });
});
