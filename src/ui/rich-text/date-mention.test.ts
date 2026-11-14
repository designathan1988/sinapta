import { describe, expect, it } from "vitest";
import { nearDayLabel } from "./date-mention.ts";

describe("nearDayLabel", () => {
  it.each([
    ["2026-11-14", "Today"],
    ["2026-11-15", "Tomorrow"],
    ["2026-11-13", "Yesterday"],
    ["2026-11-16", undefined],
    ["2025-11-14", undefined],
  ])("reads %s, seen on 2026-11-14, as %s", (day, words) => {
    expect(nearDayLabel(day, "2026-11-14")).toBe(words);
  });

  it("counts across a month's end", () => {
    expect(nearDayLabel("2026-12-01", "2026-11-30")).toBe("Tomorrow");
  });
});
