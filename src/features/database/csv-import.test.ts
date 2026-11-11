import { describe, expect, it } from "vitest";
import { selectDatabase } from "../../blocks/database/index.ts";
import { selectPage, selectPageTitle } from "../../blocks/page/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { importCsv } from "./csv-import.commands.ts";
import { planCsvImport } from "./csv-import.ts";

const ROWS = [
  ["Name", "Count", "Due", "Done", "Stage", "Notes"],
  ["Write", "3", "2026-11-10", "yes", "Doing", "first"],
  ["Read", "1.5", "November 12, 2026", "no", "Done", "second"],
  ["Rest", "", "", "", "Doing", "third"],
];

describe("planning a CSV import", () => {
  it("guesses each column's type from its values", () => {
    const plan = planCsvImport(ROWS);

    expect(plan.columns.map((column) => column.type)).toEqual([
      "number",
      "date",
      "checkbox",
      "select",
      "text",
    ]);
    expect(plan.columns[3]?.optionNames).toEqual(["Doing", "Done"]);
  });

  it("reads Notion's written dates and yes or no as the app does", () => {
    const plan = planCsvImport(ROWS);

    expect(plan.rows[1]).toEqual([
      "Read",
      "1.5",
      "2026-11-12",
      "",
      "Done",
      "second",
    ]);
    expect(plan.rows[0]?.[3]).toBe("true");
  });
});

// The database a CSV import made, opened, and its first row.
function imported() {
  const app = createDatabaseApp([], []);
  const plan = planCsvImport(ROWS);
  app.dispatch(importCsv.create({ parentId: null, title: "Plan", plan }));
  const state = app.store.getState();
  const database = selectDatabase(state, state.ui.activePageId);
  if (database === undefined) throw new Error("no database");
  const row = selectPage(state, database.childIds[0] ?? null);
  if (row === undefined) throw new Error("no row");
  const { properties } = database.props;
  const idOf = (name: string): string =>
    properties.find((property) => property.name === name)?.id ?? "";
  const value = (name: string): unknown => row.props.values?.[idOf(name)];
  return { database, row, properties, value };
}

describe("importing a CSV", () => {
  it("makes a database named as the file, one row per line", () => {
    const { database, row } = imported();

    expect(selectPageTitle(database)).toBe("Plan");
    expect(database.childIds).toHaveLength(3);
    expect(selectPageTitle(row)).toBe("Write");
  });

  it("keeps each value as its column's type", () => {
    const { properties, value } = imported();
    const stage = properties.find((property) => property.name === "Stage");

    expect(value("Count")).toBe(3);
    expect(value("Due")).toEqual({ start: "2026-11-10" });
    expect(value("Done")).toBe(true);
    expect(value("Stage")).toBe(stage?.options?.[0]?.id);
    expect(value("Notes")).toBe("first");
  });
});
