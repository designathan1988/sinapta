import { describe, expect, it } from "vitest";
import { calendarDays, monthOf, shiftMonth } from "./calendar.ts";

describe("calendarDays", () => {
  it("gives six weeks from the Sunday on or before the first", () => {
    const days = calendarDays("2026-11");

    expect(days).toHaveLength(42);
    expect(days[0]).toEqual({ day: "2026-11-01", isInMonth: true });
    expect(days[29]).toEqual({ day: "2026-11-30", isInMonth: true });
    expect(days[30]).toEqual({ day: "2026-12-01", isInMonth: false });
  });

  it("starts with the last days of the month before", () => {
    const days = calendarDays("2026-02");

    expect(days[0]).toEqual({ day: "2026-02-01", isInMonth: true });
    expect(calendarDays("2026-10")[0]).toEqual({
      day: "2026-09-27",
      isInMonth: false,
    });
  });
});

describe("months", () => {
  it("names a day's month and moves across years", () => {
    expect(monthOf("2026-11-11")).toBe("2026-11");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});
