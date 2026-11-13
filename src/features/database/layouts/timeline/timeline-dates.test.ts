import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "../../database-builder.ts";
import { selectTableModel } from "../../table-model.selectors.ts";
import { setTimelineOptions } from "../../timeline-options.commands.ts";
import { barChanges } from "./timeline-bar.ts";
import { selectTimeline } from "./timeline.selectors.ts";

describe("a timeline with separate start and end dates", () => {
  it("spans each bar from its start property to its end property", () => {
    const app = createDatabaseApp(
      [
        { name: "Start", type: "date" },
        { name: "End", type: "date" },
      ],
      [["Plan", { start: "2026-11-10" }, { start: "2026-11-13" }]],
    );
    const [start, end] = app.propertyIds;
    if (start === undefined || end === undefined) throw new Error("setup");
    const viewId = app.view().id;
    const options = {
      datePropertyId: start,
      separateDates: true,
      endDatePropertyId: end,
    };
    app.dispatch(setTimelineOptions.create({ viewId, options }));
    const model = selectTableModel(app.store.getState(), app.databaseId);
    if (model === undefined) throw new Error("no model");

    const timeline = selectTimeline(model, {
      zoom: "day",
      today: "2026-11-11",
    });

    expect(timeline?.bars.map((bar) => [bar.start, bar.end, bar.span])).toEqual(
      [["2026-11-10", "2026-11-13", 4]],
    );
  });

  it("moves both dates, and stretches only the end, never before the start", () => {
    const values = { s: { start: "2026-11-10" }, e: { start: "2026-11-13" } };
    const dates = { startId: "s", endId: "e" };

    expect(barChanges(values, dates, { days: 2, stretch: false })).toEqual([
      { propertyId: "s", value: { start: "2026-11-12" } },
      { propertyId: "e", value: { start: "2026-11-15" } },
    ]);
    expect(barChanges(values, dates, { days: -1, stretch: true })).toEqual([
      { propertyId: "e", value: { start: "2026-11-12" } },
    ]);
    expect(barChanges(values, dates, { days: -5, stretch: true })).toEqual([]);
  });
});
