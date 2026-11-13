import { describe, expect, it } from "vitest";
import { setCalendarView } from "../../state/index.ts";
import { selectUpcoming } from "../sidebar/index.ts";
import { createDatabaseApp } from "./database-builder.ts";

describe("the sidebar's Calendar tab", () => {
  it("lists a managed view's pages from today on, soonest first", () => {
    const app = createDatabaseApp(
      [{ name: "Due", type: "date" }],
      [
        ["Later", { start: "2026-12-01" }],
        ["Past", { start: "2026-11-01" }],
        ["Soon", { start: "2026-11-20" }],
      ],
      { commands: [setCalendarView] },
    );
    app.dispatch(
      setCalendarView.create({ viewId: app.view().id, isShown: true }),
    );

    const upcoming = selectUpcoming(app.store.getState(), "2026-11-13");

    expect(upcoming.map((item) => [item.title, item.day])).toEqual([
      ["Soon", "2026-11-20"],
      ["Later", "2026-12-01"],
    ]);
  });
});
