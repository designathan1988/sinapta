import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "../../database-builder.ts";
import { selectTableModel } from "../../table-model.selectors.ts";
import { selectTimeline } from "./timeline.selectors.ts";

// Two dated rows and one without a date.
function model() {
  const app = createDatabaseApp(
    [{ name: "When", type: "date" }],
    [
      ["Plan", { start: "2026-11-10", end: "2026-11-12" }],
      ["Ship", { start: "2026-11-20" }],
      ["Someday"],
    ],
  );
  const built = selectTableModel(app.store.getState(), app.databaseId);
  if (built === undefined) throw new Error("no model");
  return built;
}

describe("selectTimeline", () => {
  it("places each bar by its days from the start, a week before today", () => {
    const timeline = selectTimeline(model(), {
      zoom: "day",
      today: "2026-11-11",
    });

    expect(timeline?.start).toBe("2026-11-04");
    expect(
      timeline?.bars.map((bar) => [bar.title, bar.offset, bar.span]),
    ).toEqual([
      ["Plan", 6, 3],
      ["Ship", 16, 1],
    ]);
  });

  it("starts a month zoom on the first of a month and labels months", () => {
    const timeline = selectTimeline(model(), {
      zoom: "month",
      today: "2026-11-11",
    });

    expect(timeline?.start).toBe("2026-10-01");
    expect(timeline?.units.slice(0, 2)).toEqual([
      { label: "Oct 2026", offset: 0, span: 31 },
      { label: "Nov 2026", offset: 31, span: 30 },
    ]);
    expect(timeline?.bars[0]?.offset).toBe(40);
  });

  it("lists the rows without a date apart", () => {
    const timeline = selectTimeline(model(), {
      zoom: "week",
      today: "2026-11-11",
    });

    expect(timeline?.undated.map((row) => row.title)).toEqual(["Someday"]);
    expect(timeline?.today).toBeGreaterThan(0);
  });
});
