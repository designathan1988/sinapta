import { describe, expect, it } from "vitest";
import { createDatabaseApp, type DatabaseApp } from "./database-builder.ts";
import {
  setGroupOptions,
  setViewGroupBy,
  type GroupOptions,
} from "./group.commands.ts";
import { selectRowGroups } from "./row-groups.selectors.ts";
import { selectTableModel } from "./table-model.selectors.ts";

function groupedBy(app: DatabaseApp, options: GroupOptions) {
  const viewId = app.view().id;
  const propertyId = app.propertyIds[0];
  if (propertyId === undefined) throw new Error("no property");
  app.dispatch(setViewGroupBy.create({ viewId, propertyId }));
  app.dispatch(setGroupOptions.create({ viewId, options }));
  const model = selectTableModel(app.store.getState(), app.databaseId);
  if (model === undefined) throw new Error("no model");
  return (selectRowGroups(model)?.groups ?? []).map((group) => ({
    label: group.label,
    titles: group.rows.map((row) => row.title),
  }));
}

describe("grouping text and numbers as Notion's Text by and Number by", () => {
  it("groups text by its first character as Notion does: digits, A to Z, then Other", () => {
    const app = createDatabaseApp(
      [{ name: "Owner", type: "text" }],
      [
        ["r1", "Ana"],
        ["r2", "álvaro"],
        ["r3", "bia"],
        ["r4", "3D"],
        ["r5", "Ébano"],
        ["r6"],
      ],
    );

    expect(
      groupedBy(app, { textBy: "alphabetical", sort: "ascending" }),
    ).toEqual([
      { label: "No Owner", titles: ["r6"] },
      { label: "3", titles: ["r4"] },
      { label: "A", titles: ["r1"] },
      { label: "B", titles: ["r3"] },
      { label: "Other", titles: ["r2", "r5"] },
    ]);
  });

  it("groups text by its whole value by default", () => {
    const app = createDatabaseApp(
      [{ name: "Owner", type: "text" }],
      [
        ["r1", "Ana"],
        ["r2", "Ana"],
        ["r3", "álvaro"],
      ],
    );

    expect(
      groupedBy(app, { sort: "ascending" }).map((group) => group.label),
    ).toEqual(["álvaro", "Ana"]);
  });

  it("groups numbers by intervals of a size within Notion's 0 to 1000, the rest out of range", () => {
    const app = createDatabaseApp(
      [{ name: "Points", type: "number" }],
      [
        ["r1", 5],
        ["r2", 12],
        ["r3", 19],
        ["r4", -3],
        ["r5", 1200],
      ],
    );

    expect(
      groupedBy(app, {
        numberBy: { kind: "interval", size: 10 },
        sort: "ascending",
      }),
    ).toEqual([
      { label: "0 to 10", titles: ["r1"] },
      { label: "10 to 20", titles: ["r2", "r3"] },
      { label: "Out of range", titles: ["r4", "r5"] },
    ]);
  });

  it("starts the intervals at the range's start", () => {
    const app = createDatabaseApp(
      [{ name: "Points", type: "number" }],
      [["r1", -3]],
    );
    const numberBy = { kind: "interval", size: 5, from: -10, to: 10 } as const;

    expect(groupedBy(app, { numberBy }).map((group) => group.label)).toEqual([
      "-5 to 0",
    ]);
  });

  it("groups numbers by each value, in number order", () => {
    const app = createDatabaseApp(
      [{ name: "Points", type: "number" }],
      [
        ["r1", 10],
        ["r2", 9],
        ["r3", -2],
      ],
    );

    expect(
      groupedBy(app, {
        numberBy: { kind: "unique" },
        sort: "ascending",
        hideEmpty: true,
      }).map((group) => group.label),
    ).toEqual(["-2", "9", "10"]);
  });
});
