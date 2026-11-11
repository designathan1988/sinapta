import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "./database-builder.ts";
import { selectViewCsv } from "./csv-export.selectors.ts";
import { selectTableModel } from "./table-model.selectors.ts";

describe("exporting a view as CSV", () => {
  it("writes the view's columns and rows as text, quoting what needs it", () => {
    const app = createDatabaseApp(
      [{ name: "Count", type: "number" }],
      [["Write, then read", 3], ["Rest"]],
    );
    const state = app.store.getState();
    const model = selectTableModel(state, app.databaseId);
    if (model === undefined) throw new Error("setup");

    expect(selectViewCsv(model)).toBe(
      'Name,Count\r\n"Write, then read",3\r\nRest,\r\n',
    );
  });
});
