import { describe, expect, it } from "vitest";
import { presetName } from "./template-cadence.ts";

// The value beside "Duplicate every…" in a template's menu: the preset's
// own name, as Notion's ("Semana", or "Desativar" when off).
describe("presetName", () => {
  it("names a template without a cadence Off", () => {
    expect(presetName(undefined)).toBe("Off");
  });

  it("names a cadence by its preset", () => {
    expect(presetName({ every: "week" })).toBe("Week");
    expect(presetName({ every: "week", interval: 2 })).toBe("2 Weeks");
    expect(presetName({ every: "month", interval: 6 })).toBe("6 Months");
    expect(presetName({ every: "week", weekdays: [0, 1, 2, 3, 4] })).toBe(
      "Weekday",
    );
  });

  it("names any other cadence by its interval and unit", () => {
    expect(presetName({ every: "day", interval: 3 })).toBe("3 days");
  });
});
