import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "./database-builder.ts";
import { addRow } from "./row.commands.ts";

describe("adding a row beside another", () => {
  it("puts it right below the row, or above it, as Notion's + does", () => {
    const app = createDatabaseApp([], [["A"], ["B"], ["C"]]);
    const [a, b] = app.rowIds;
    if (a === undefined || b === undefined) throw new Error("setup");

    app.dispatch(addRow.create({ databaseId: app.databaseId, besideId: a }));
    const below = app.database().childIds[1];
    app.dispatch(
      addRow.create({ databaseId: app.databaseId, besideId: b, above: true }),
    );

    const ids = app.database().childIds;
    expect(ids).toHaveLength(5);
    expect(ids[0]).toBe(a);
    expect(ids[1]).toBe(below);
    expect(ids[3]).toBe(b);
    expect(ids[2]).not.toBe(b);
  });
});
