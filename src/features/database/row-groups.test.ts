import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import { createDatabaseApp, type DatabaseApp } from "./database-builder.ts";
import {
  setGroupOptions,
  setGroupOrder,
  setViewGroupBy,
  toggleGroupCollapsed,
  toggleGroupHidden,
} from "./group.commands.ts";
import { selectRowGroups, selectVisibleRows } from "./row-groups.selectors.ts";
import { selectTableModel } from "./table-model.selectors.ts";

const STAGE = {
  name: "Stage",
  type: "select",
  options: [
    { id: "todo", name: "Todo", color: "gray" },
    { id: "done", name: "Done", color: "green" },
  ],
};

function groupBy(app: DatabaseApp, index: number): void {
  const propertyId = app.propertyIds[index];
  if (propertyId === undefined) throw new Error("no property");
  app.dispatch(setViewGroupBy.create({ viewId: app.view().id, propertyId }));
}

function modelOf(app: DatabaseApp) {
  const model = selectTableModel(app.store.getState(), app.databaseId);
  if (model === undefined) throw new Error("no model");
  return model;
}

function groups(app: DatabaseApp) {
  return (selectRowGroups(modelOf(app))?.groups ?? []).map((group) => ({
    key: group.key,
    label: group.label,
    titles: group.rows.map((row) => row.title),
  }));
}

describe("grouping rows", () => {
  it("groups by a select property: no option first, then each option", () => {
    const app = createDatabaseApp(
      [STAGE],
      [["a", "done"], ["b"], ["c", "todo"]],
    );
    groupBy(app, 0);

    expect(groups(app)).toEqual([
      { key: "", label: "No Stage", titles: ["b"] },
      { key: "todo", label: "Todo", titles: ["c"] },
      { key: "done", label: "Done", titles: ["a"] },
    ]);
  });

  it("groups by a status property by its options", () => {
    const app = createDatabaseApp(
      [{ ...STAGE, type: "status" }],
      [["a", "todo"]],
    );
    groupBy(app, 0);

    expect(groups(app).map((group) => group.titles)).toEqual([[], ["a"], []]);
  });

  it("puts a row with several options in the group of each", () => {
    const app = createDatabaseApp(
      [{ ...STAGE, type: "multi-select" }],
      [["a", ["todo", "done"]], ["b"]],
    );
    groupBy(app, 0);

    expect(groups(app)).toEqual([
      { key: "", label: "No Stage", titles: ["b"] },
      { key: "todo", label: "Todo", titles: ["a"] },
      { key: "done", label: "Done", titles: ["a"] },
    ]);
  });

  it("groups by a checkbox: checked, then unchecked", () => {
    const app = createDatabaseApp(
      [{ name: "Done", type: "checkbox" }],
      [["a"], ["b", true]],
    );
    groupBy(app, 0);

    expect(groups(app).map((group) => [group.label, group.titles])).toEqual([
      ["Checked", ["b"]],
      ["Unchecked", ["a"]],
    ]);
  });

  it("groups dates by day, week, month and year, in date order", () => {
    const app = createDatabaseApp(
      [{ name: "Due", type: "date" }],
      [
        ["late", { start: "2026-12-02" }],
        ["early", { start: "2026-11-10" }],
        ["same week", { start: "2026-11-12" }],
        ["none"],
      ],
    );
    groupBy(app, 0);
    const viewId = app.view().id;
    const labels = (dateBy: "day" | "week" | "month" | "year") => {
      app.dispatch(setGroupOptions.create({ viewId, options: { dateBy } }));
      return groups(app).map((group) => group.label);
    };

    expect(labels("day")).toEqual([
      "No Due",
      "Nov 10, 2026",
      "Nov 12, 2026",
      "Dec 2, 2026",
    ]);
    expect(labels("week")).toEqual([
      "No Due",
      "Week of Nov 9, 2026",
      "Week of Nov 30, 2026",
    ]);
    expect(labels("month")).toEqual([
      "No Due",
      "November 2026",
      "December 2026",
    ]);
    expect(labels("year")).toEqual(["No Due", "2026"]);
  });

  it("sorts groups by name and hides empty ones when asked", () => {
    const app = createDatabaseApp([STAGE], [["a", "done"]]);
    groupBy(app, 0);
    const viewId = app.view().id;

    app.dispatch(
      setGroupOptions.create({
        viewId,
        options: { sort: "descending", hideEmpty: true },
      }),
    );

    expect(groups(app).map((group) => group.label)).toEqual(["Done"]);
  });

  it("keeps a group collapsed in the view, and leaves its rows out of the visible order", () => {
    const app = createDatabaseApp(
      [STAGE],
      [
        ["a", "done"],
        ["b", "todo"],
      ],
    );
    groupBy(app, 0);
    const viewId = app.view().id;

    app.dispatch(toggleGroupCollapsed.create({ viewId, key: "todo" }));

    const model = modelOf(app);
    expect(app.view().groupBy?.collapsed).toEqual(["todo"]);
    expect(selectRowGroups(model)?.groups[1]?.isCollapsed).toBe(true);
    expect(selectVisibleRows(model).map((row) => row.title)).toEqual(["a"]);
  });

  it("refuses to group by a property whose values have no text, such as files", () => {
    const app = createDatabaseApp([{ name: "Files", type: "files" }], []);

    groupBy(app, 0);

    expect(app.view().groupBy).toBeUndefined();
  });

  it("puts groups in the order placed by hand, the others after", () => {
    const app = createDatabaseApp([STAGE], [["a", "done"]]);
    groupBy(app, 0);

    app.dispatch(
      setGroupOrder.create({ viewId: app.view().id, order: ["done", ""] }),
    );

    expect(groups(app).map((group) => group.key)).toEqual(["done", "", "todo"]);
  });

  it("hides a group and leaves its rows out of the visible order", () => {
    const app = createDatabaseApp(
      [STAGE],
      [
        ["a", "done"],
        ["b", "todo"],
      ],
    );
    groupBy(app, 0);
    const viewId = app.view().id;

    app.dispatch(toggleGroupHidden.create({ viewId, key: "done" }));

    const grouped = selectRowGroups(modelOf(app));
    expect(
      grouped?.groups.find((group) => group.key === "done")?.isHidden,
    ).toBe(true);
    expect(selectVisibleRows(modelOf(app)).map((row) => row.title)).toEqual([
      "b",
    ]);
    app.dispatch(toggleGroupHidden.create({ viewId, key: "done" }));
    expect(app.view().groupBy?.hidden).toEqual([]);
  });

  it("ungroups a view", () => {
    const app = createDatabaseApp([STAGE], [["a", "done"]]);
    groupBy(app, 0);

    app.dispatch(
      setViewGroupBy.create({ viewId: app.view().id, propertyId: null }),
    );

    expect(app.view().groupBy).toBeUndefined();
    expect(groups(app)).toEqual([]);
  });

  it("groups 5,000 rows quickly", () => {
    const app = createDatabaseApp([STAGE], []);
    groupBy(app, 0);
    const [stage] = app.propertyIds;
    if (stage === undefined) throw new Error("no property");
    const rows = Array.from({ length: 5000 }, (_, index) => ({
      id: toBlockId(`row-${String(index)}`),
      title: `row ${String(index)}`,
      values: { [stage]: index % 2 === 0 ? "todo" : "done" },
    }));
    const model = { ...modelOf(app), rows };

    const started = performance.now();
    const grouped = selectRowGroups(model);
    const visible = selectVisibleRows(model);
    const elapsed = performance.now() - started;

    expect(grouped?.groups.map((group) => group.rows.length)).toEqual([
      0, 2500, 2500,
    ]);
    expect(visible).toHaveLength(5000);
    expect(elapsed).toBeLessThan(50);
  });
});
