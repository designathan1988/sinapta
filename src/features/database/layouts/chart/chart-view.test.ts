// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import type { ChartOptions } from "../../../../model/index.ts";
import { createDatabaseApp } from "../../database-builder.ts";
import { renderDatabase } from "../../database.view.ts";
import { setChartOptions } from "../../chart-options.commands.ts";
import { setViewType } from "../../view-layout.commands.ts";

function rendered(options: Partial<ChartOptions> = {}) {
  const app = createDatabaseApp(
    [
      {
        name: "Stage",
        type: "select",
        options: [
          { id: "todo", name: "Todo", color: "gray" },
          { id: "done", name: "Done", color: "green" },
        ],
      },
    ],
    [
      ["A", "todo"],
      ["B", "done"],
      ["C", "done"],
    ],
  );
  const viewId = app.view().id;
  app.dispatch(setViewType.create({ viewId, viewType: "chart" }));
  app.dispatch(setChartOptions.create({ viewId, options }));
  const host = document.createElement("div");
  document.body.replaceChildren(host);
  render(
    renderDatabase(app.store.getState(), () => ({ ok: true })),
    host,
  );
  return host;
}

describe("the chart", () => {
  it("draws a column per group in the group's color, as tall as its share", () => {
    const host = rendered();
    const columns = [...host.querySelectorAll<HTMLElement>(".chart__mark")];

    expect(columns.map((column) => column.dataset.color)).toEqual([
      "gray",
      "green",
    ]);
    expect(
      columns.map((column) => column.style.getPropertyValue("--share")),
    ).toEqual(["0.5", "1"]);
  });

  it("tells its numbers to screen readers in a table", () => {
    const host = rendered();

    const cells = [
      ...host.querySelectorAll(".chart table td, .chart table th[scope=row]"),
    ];

    expect(cells.map((cell) => cell.textContent.trim())).toEqual([
      "Todo",
      "1",
      "Done",
      "2",
    ]);
  });

  it("draws a donut slice per group, and a line through the groups", () => {
    const donut = rendered({ kind: "donut" });
    const line = rendered({ kind: "line" });

    expect(donut.querySelectorAll(".chart__slice")).toHaveLength(2);
    expect(line.querySelector(".chart__line")?.getAttribute("points")).toBe(
      "0,50 100,0",
    );
  });
});

describe("the bar chart", () => {
  it("draws a bar per group, as long as its share, lying down", () => {
    const host = rendered({ kind: "bar" });
    const bars = [...host.querySelectorAll<HTMLElement>(".chart__mark")];

    expect(host.querySelector(".chart")?.getAttribute("data-kind")).toBe("bar");
    expect(bars.map((bar) => bar.style.getPropertyValue("--share"))).toEqual([
      "0.5",
      "1",
    ]);
  });
});
