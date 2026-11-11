import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "../../database-builder.ts";
import { selectTableModel } from "../../table-model.selectors.ts";
import { selectChart } from "./chart.selectors.ts";

const STAGE = {
  name: "Stage",
  type: "select",
  options: [
    { id: "todo", name: "Todo", color: "gray" },
    { id: "done", name: "Done", color: "green" },
  ],
};

function model(chart: Record<string, unknown> = {}) {
  const app = createDatabaseApp(
    [STAGE, { name: "Points", type: "number" }],
    [
      ["A", "todo", 3],
      ["B", "done", 5],
      ["C", "done", 2],
    ],
  );
  const built = selectTableModel(app.store.getState(), app.databaseId);
  if (built === undefined) throw new Error("no model");
  const points = app.propertyIds[1];
  const options = {
    ...built.view.chart,
    ...chart,
    ...(chart.valuePropertyId === "points" && { valuePropertyId: points }),
  };
  return { ...built, view: { ...built.view, chart: options } };
}

describe("selectChart", () => {
  it("counts the rows of each group of the first select property", () => {
    const chart = selectChart(model());

    expect(
      chart?.points.map((point) => [point.label, point.value, point.color]),
    ).toEqual([
      ["Todo", 1, "gray"],
      ["Done", 2, "green"],
    ]);
    expect(chart?.max).toBe(2);
  });

  it("sums a number property per group", () => {
    const chart = selectChart(
      model({ aggregate: "sum", valuePropertyId: "points" }),
    );

    expect(chart?.points.map((point) => point.value)).toEqual([3, 7]);
    expect(chart?.total).toBe(10);
  });
});
