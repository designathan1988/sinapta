import { describe, expect, it } from "vitest";
import {
  calculate,
  calculationsFor,
  cappedCount,
} from "./calculations.selectors.ts";
import { setCalculation, setCountCap } from "./calculation.commands.ts";
import { createDatabaseApp, type DatabaseApp } from "./database-builder.ts";
import { setViewGroupBy } from "./group.commands.ts";
import { selectRowGroups } from "./row-groups.selectors.ts";
import { selectTableModel } from "./table-model.selectors.ts";
import { setViewFilter } from "./view.commands.ts";

function createApp() {
  return createDatabaseApp(
    [
      { name: "Points", type: "number" },
      { name: "Done", type: "checkbox" },
      {
        name: "Stage",
        type: "select",
        options: [
          { id: "a", name: "A", color: "gray" },
          { id: "b", name: "B", color: "blue" },
        ],
      },
    ],
    [
      ["one", 1, true, "a"],
      ["two", 2, true, "a"],
      ["ten", 10, undefined, "b"],
    ],
  );
}

function modelOf(app: DatabaseApp) {
  const model = selectTableModel(app.store.getState(), app.databaseId);
  if (model === undefined) throw new Error("no model");
  return model;
}

function property(app: DatabaseApp, index: number) {
  const found = app.database().props.properties[index];
  if (found === undefined) throw new Error("no property");
  return found;
}

describe("column calculations", () => {
  it("sums, averages and takes the median of numbers", () => {
    const app = createApp();
    const { rows } = modelOf(app);
    const points = property(app, 0);

    expect(calculate(rows, points, "sum")).toBe("13");
    expect(calculate(rows, points, "average")).toBe("4.33");
    expect(calculate(rows, points, "median")).toBe("2");
    expect(calculate(rows, points, "min")).toBe("1");
    expect(calculate(rows, points, "max")).toBe("10");
    expect(calculate(rows, points, "range")).toBe("9");
  });

  it("finds the earliest and latest dates and the range between them", () => {
    const app = createDatabaseApp(
      [{ name: "Due", type: "date" }],
      [
        ["a", { start: "2026-11-02" }],
        ["b", { start: "2026-11-20" }],
        ["c", { start: "2026-11-10" }],
      ],
    );
    const { rows } = modelOf(app);
    const due = property(app, 0);

    expect(calculate(rows, due, "earliest-date")).toContain("2");
    expect(calculate(rows, due, "latest-date")).toContain("20");
    expect(calculate(rows, due, "date-range")).toBe(
      "November 2, 2026 → November 20, 2026",
    );
  });

  it("works out the share of checked boxes", () => {
    const app = createApp();

    expect(
      calculate(modelOf(app).rows, property(app, 1), "percent-checked"),
    ).toBe("66.7%");
  });

  it("counts only the rows the view's filter keeps", () => {
    const app = createApp();
    const points = property(app, 0);
    const rule = {
      propertyId: points.id,
      operator: "greater-than",
      value: "1",
    };
    app.dispatch(
      setViewFilter.create({
        viewId: app.view().id,
        filter: { conjunction: "and", items: [rule] },
      }),
    );

    expect(calculate(modelOf(app).rows, points, "sum")).toBe("12");
  });

  it("works out each group's rows on their own", () => {
    const app = createApp();
    const stage = property(app, 2);
    app.dispatch(
      setViewGroupBy.create({ viewId: app.view().id, propertyId: stage.id }),
    );
    const groups = selectRowGroups(modelOf(app))?.groups ?? [];

    expect(
      groups.map((group) => calculate(group.rows, property(app, 0), "sum")),
    ).toEqual(["0", "3", "10"]);
  });

  it("offers the calculations that fit each type", () => {
    const app = createApp();

    expect(calculationsFor(property(app, 0))).toContain("median");
    expect(calculationsFor(property(app, 1))).toEqual([
      "count-all",
      "checked",
      "unchecked",
      "percent-checked",
      "percent-unchecked",
    ]);
    expect(calculationsFor(property(app, 2))).not.toContain("sum");
  });

  it("keeps the calculation in the view, refuses one that does not fit, and removes it", () => {
    const app = createApp();
    const viewId = app.view().id;
    const points = property(app, 0).id;
    const stage = property(app, 2).id;

    app.dispatch(
      setCalculation.create({ viewId, propertyId: points, kind: "sum" }),
    );
    app.dispatch(
      setCalculation.create({ viewId, propertyId: stage, kind: "sum" }),
    );
    expect(app.view().calculations).toEqual({ [points]: "sum" });

    app.dispatch(
      setCalculation.create({ viewId, propertyId: points, kind: null }),
    );
    expect(app.view().calculations).toEqual({});
  });
});

describe("Show large counts as 99+", () => {
  const rows = Array.from({ length: 150 }, (_, index): [string] => [
    `row ${String(index)}`,
  ]);

  it("writes 99+ for a count above 99 with the switch on, the count without", () => {
    const app = createDatabaseApp([{ name: "Points", type: "number" }], rows);
    const viewId = app.view().id;
    const points = property(app, 0);
    const count = calculate(modelOf(app).rows, points, "count-all");

    expect(cappedCount(count, "count-all", false)).toBe("150");
    app.dispatch(setCountCap.create({ viewId, on: true }));
    expect(app.view().countCap).toBe(true);
    expect(cappedCount(count, "count-all", true)).toBe("99+");
    expect(cappedCount("99", "count-all", true)).toBe("99");
  });

  it("leaves percents as they are", () => {
    expect(cappedCount("100%", "percent-empty", true)).toBe("100%");
  });
});
