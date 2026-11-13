// The sample database built in Notion's test workspace on 2026-11-13 and
// the rows and groups Notion showed for it (docs/notion-study.md,
// "Sample database"): Pagecraft keeps and groups the same.
import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "./database-builder.ts";
import { setGroupOptions, setViewGroupBy } from "./group.commands.ts";
import { selectRowGroups } from "./row-groups.selectors.ts";
import { selectTableModel } from "./table-model.selectors.ts";
import { setViewFilter } from "./view.commands.ts";

const TODAY = "2026-11-13";

function sample() {
  return createDatabaseApp(
    [
      { name: "Number", type: "number" },
      { name: "Date", type: "date" },
    ],
    [
      ["Linha teste"],
      ["Ana", 5, { start: "2026-11-08" }],
      ["álvaro", -5, { start: "2026-11-10" }],
      ["Bia", 0, { start: "2026-11-12" }],
      ["3D", 9, { start: "2026-11-13" }],
      ["Carlos", 10, { start: "2026-11-14" }],
      ["Zeca", 12, { start: "2026-11-16" }],
      ["Ébano", 19, { start: "2026-11-18" }],
      ["Duda", 20, { start: "2026-11-20" }],
      ["Marta", 30, { start: "2026-11-02" }],
      ["Nina", 35, { start: "2026-12-01" }],
    ],
  );
}

type App = ReturnType<typeof sample>;

function model(app: App) {
  const built = selectTableModel(app.store.getState(), app.databaseId, TODAY);
  if (built === undefined) throw new Error("no model");
  return built;
}

function kept(app: App, operand: string): string[] {
  const [, date] = app.propertyIds;
  if (date === undefined) throw new Error("setup");
  const items = [{ propertyId: date, operator: "relative", value: operand }];
  const filter = { conjunction: "and" as const, items };
  app.dispatch(setViewFilter.create({ viewId: app.view().id, filter }));
  return model(app).rows.map((row) => row.title);
}

describe("the 2026-11-13 sample, as Notion filtered and grouped it", () => {
  it.each([
    ["this:week", "Ana, álvaro, Bia, 3D, Carlos"],
    ["past:week", "Ana, álvaro, Bia, 3D"],
    ["next:week", "3D, Carlos, Zeca, Ébano, Duda"],
    ["this:month", "Ana, álvaro, Bia, 3D, Carlos, Zeca, Ébano, Duda, Marta"],
    ["next:month", "3D, Carlos, Zeca, Ébano, Duda, Nina"],
    ["past:month", "Ana, álvaro, Bia, 3D, Marta"],
    ["this:day", "3D"],
    ["past:day", "Bia, 3D"],
    ["next:day", "3D, Carlos"],
  ])("keeps for %s the rows Notion kept", (operand, rows) => {
    expect(kept(sample(), operand).join(", ")).toBe(rows);
  });

  it("groups names by first character as Notion did", () => {
    const names = [
      "Linha teste",
      "Ana",
      "álvaro",
      "Bia",
      "3D",
      "Carlos",
      "Zeca",
      "Ébano",
      "Duda",
      "Marta",
      "Nina",
    ];
    const app = createDatabaseApp(
      [{ name: "Label", type: "text" }],
      names.map((name) => [name, name]),
    );
    const viewId = app.view().id;
    const [label] = app.propertyIds;
    if (label === undefined) throw new Error("setup");
    app.dispatch(setViewGroupBy.create({ viewId, propertyId: label }));
    const options = { textBy: "alphabetical", sort: "ascending" } as const;
    app.dispatch(setGroupOptions.create({ viewId, options }));

    const groups = selectRowGroups(model(app))?.groups ?? [];

    expect(
      groups.map(
        (group) =>
          `${group.label}: ${group.rows.map((row) => row.title).join(",")}`,
      ),
    ).toEqual([
      "3: 3D",
      "A: Ana",
      "B: Bia",
      "C: Carlos",
      "D: Duda",
      "L: Linha teste",
      "M: Marta",
      "N: Nina",
      "Z: Zeca",
      "Other: álvaro,Ébano",
    ]);
  });

  it("groups numbers by tens within 0 to 1000 as Notion did", () => {
    const app = sample();
    const viewId = app.view().id;
    const [number] = app.propertyIds;
    if (number === undefined) throw new Error("setup");
    app.dispatch(setViewGroupBy.create({ viewId, propertyId: number }));
    const options = {
      numberBy: { kind: "interval", size: 10 },
      sort: "ascending",
    } as const;
    app.dispatch(setGroupOptions.create({ viewId, options }));

    const groups = selectRowGroups(model(app))?.groups ?? [];

    expect(
      groups.map(
        (group) =>
          `${group.label}: ${group.rows.map((row) => row.title).join(",")}`,
      ),
    ).toEqual([
      "No Number: Linha teste",
      "0 to 10: Ana,Bia,3D",
      "10 to 20: Carlos,Zeca,Ébano",
      "20 to 30: Duda",
      "30 to 40: Marta,Nina",
      "Out of range: álvaro",
    ]);
  });

  it("groups numbers by unique value as Notion did, the empty group first", () => {
    const app = sample();
    const viewId = app.view().id;
    const [number] = app.propertyIds;
    if (number === undefined) throw new Error("setup");
    app.dispatch(setViewGroupBy.create({ viewId, propertyId: number }));
    const options = {
      numberBy: { kind: "unique" },
      sort: "ascending",
    } as const;
    app.dispatch(setGroupOptions.create({ viewId, options }));

    const groups = selectRowGroups(model(app))?.groups ?? [];

    // n60-groups2/06-unique-value and 09-unique-esc2.
    expect(
      groups.map(
        (group) =>
          `${group.label}: ${group.rows.map((row) => row.title).join(",")}`,
      ),
    ).toEqual([
      "No Number: Linha teste",
      "-5: álvaro",
      "0: Bia",
      "5: Ana",
      "9: 3D",
      "10: Carlos",
      "12: Zeca",
      "19: Ébano",
      "20: Duda",
      "30: Marta",
      "35: Nina",
    ]);
  });

  it("groups names by exact value as Notion did, accents set aside", () => {
    const names = [
      "Linha teste",
      "Ana",
      "álvaro",
      "Bia",
      "3D",
      "Carlos",
      "Zeca",
      "Ébano",
      "Duda",
      "Marta",
      "Nina",
    ];
    const app = createDatabaseApp(
      [{ name: "Label", type: "text" }],
      names.map((name) => [name, name]),
    );
    const viewId = app.view().id;
    const [label] = app.propertyIds;
    if (label === undefined) throw new Error("setup");
    app.dispatch(setViewGroupBy.create({ viewId, propertyId: label }));
    const options = { textBy: "exact", sort: "ascending" } as const;
    app.dispatch(setGroupOptions.create({ viewId, options }));

    const groups = selectRowGroups(model(app))?.groups ?? [];

    // n60-groups2/16-exact-value and 19-exact-esc2: "Alfabética".
    expect(groups.map((group) => group.label)).toEqual([
      "3D",
      "álvaro",
      "Ana",
      "Bia",
      "Carlos",
      "Duda",
      "Ébano",
      "Linha teste",
      "Marta",
      "Nina",
      "Zeca",
    ]);
  });
});
