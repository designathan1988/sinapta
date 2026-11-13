// The three date ranges built in Notion's test workspace on 2026-11-13
// (n63-ranges) and the rows Notion kept by their start or end date.
import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "./database-builder.ts";
import { selectTableModel } from "./table-model.selectors.ts";
import { setViewFilter } from "./view.commands.ts";

const TODAY = "2026-11-13";

describe("the 2026-11-13 ranges, as Notion filtered them", () => {
  it.each([
    ["this:week", "start", "R2"],
    ["this:week", "end", "R1"],
    ["next:week", "start", "R3"],
    ["next:week", "end", "R1, R2"],
  ] as const)(
    "keeps for %s by the %s date the range rows Notion kept",
    (operand, dateEnd, rows) => {
      const app = createDatabaseApp(
        [{ name: "Date", type: "date" }],
        [
          ["R1", { start: "2026-11-01", end: "2026-11-14" }],
          ["R2", { start: "2026-11-10", end: "2026-11-20" }],
          ["R3", { start: "2026-11-16", end: "2026-11-25" }],
        ],
      );
      const [date] = app.propertyIds;
      if (date === undefined) throw new Error("setup");
      const items = [
        { propertyId: date, operator: "relative", value: operand, dateEnd },
      ];
      const filter = { conjunction: "and" as const, items };
      app.dispatch(setViewFilter.create({ viewId: app.view().id, filter }));

      const built = selectTableModel(
        app.store.getState(),
        app.databaseId,
        TODAY,
      );

      expect(built?.rows.map((row) => row.title).join(", ")).toBe(rows);
    },
  );
});
