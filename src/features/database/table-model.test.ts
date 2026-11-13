import { describe, expect, it } from "vitest";
import { trashPage } from "../../blocks/page/index.ts";
import { createDatabaseApp, type DatabaseApp } from "./database-builder.ts";
import { removeProperty } from "./database.commands.ts";
import {
  propertyIcon,
  selectTableModel,
  titleProperty,
  TITLE_PROPERTY_ID,
} from "./table-model.selectors.ts";
import {
  resizeProperty,
  setPropertyOrder,
  setViewFilter,
  setViewSorts,
  togglePropertyHidden,
} from "./view.commands.ts";

const STAGES = [
  { id: "todo", name: "Todo", color: "gray" },
  { id: "done", name: "Done", color: "green" },
];

function createApp(): DatabaseApp {
  return createDatabaseApp(
    [
      { name: "Points", type: "number" },
      { name: "Stage", type: "select", options: STAGES },
    ],
    [
      ["Write spec", 3, "done"],
      ["build app", 8, "todo"],
      ["Audit", undefined, "todo"],
      ["Ship", 5, undefined],
    ],
  );
}

function model(app: DatabaseApp) {
  const found = selectTableModel(app.store.getState(), app.databaseId);
  if (found === undefined) throw new Error("no model");
  return found;
}

const titles = (app: DatabaseApp) => model(app).rows.map((row) => row.title);

describe("selectTableModel", () => {
  it("lists rows in their stored order with the title column first", () => {
    const app = createApp();

    expect(titles(app)).toEqual(["Write spec", "build app", "Audit", "Ship"]);
    expect(model(app).columns.map((column) => column.property.name)).toEqual([
      "Name",
      "Points",
      "Stage",
    ]);
  });

  it("sorts by a number property with empty cells last in both directions", () => {
    const app = createApp();
    const [points] = app.propertyIds;
    if (points === undefined) throw new Error("setup");
    const viewId = app.view().id;

    app.dispatch(
      setViewSorts.create({
        viewId,
        sorts: [{ propertyId: points, direction: "ascending" }],
      }),
    );
    expect(titles(app)).toEqual(["Write spec", "Ship", "build app", "Audit"]);
    app.dispatch(
      setViewSorts.create({
        viewId,
        sorts: [{ propertyId: points, direction: "descending" }],
      }),
    );

    expect(titles(app)).toEqual(["build app", "Ship", "Write spec", "Audit"]);
  });

  it("sorts by title without regard to case", () => {
    const app = createApp();
    if (TITLE_PROPERTY_ID === undefined) throw new Error("setup");
    const sorts = [
      { propertyId: TITLE_PROPERTY_ID, direction: "ascending" } as const,
    ];

    app.dispatch(setViewSorts.create({ viewId: app.view().id, sorts }));

    expect(titles(app)).toEqual(["Audit", "build app", "Ship", "Write spec"]);
  });

  it("sorts by a second property within equal values of the first", () => {
    const app = createApp();
    const [points, stage] = app.propertyIds;
    if (points === undefined || stage === undefined) throw new Error("setup");
    const sorts = [
      { propertyId: stage, direction: "descending" } as const,
      { propertyId: points, direction: "descending" } as const,
    ];

    app.dispatch(setViewSorts.create({ viewId: app.view().id, sorts }));

    expect(titles(app)).toEqual(["build app", "Audit", "Write spec", "Ship"]);
  });

  it("keeps only rows that pass every filter", () => {
    const app = createApp();
    const [points, stage] = app.propertyIds;
    if (points === undefined || stage === undefined) throw new Error("setup");
    const items = [
      { propertyId: stage, operator: "is", value: "todo" },
      { propertyId: points, operator: "greater-than", value: "4" },
    ];
    const filter = { conjunction: "and" as const, items };

    app.dispatch(setViewFilter.create({ viewId: app.view().id, filter }));

    expect(titles(app)).toEqual(["build app"]);
    expect(model(app).totalRowCount).toBe(4);
  });

  it("keeps rows that pass either filter of an or group, and its inner group", () => {
    const app = createApp();
    const [points, stage] = app.propertyIds;
    if (points === undefined || stage === undefined) throw new Error("setup");
    const isTodo = { propertyId: stage, operator: "is", value: "todo" };
    const big = { propertyId: points, operator: "greater-than", value: "4" };
    const small = { propertyId: points, operator: "less-than", value: "2" };
    const filter = {
      conjunction: "or" as const,
      items: [big, { conjunction: "and" as const, items: [isTodo, small] }],
    };

    app.dispatch(setViewFilter.create({ viewId: app.view().id, filter }));

    // Audit is to do, but has no points to be under 2.
    expect(titles(app)).toEqual(["build app", "Ship"]);
  });

  it("ignores a condition whose value is not chosen yet, as Notion does", () => {
    const app = createApp();
    const [, stage] = app.propertyIds;
    if (stage === undefined) throw new Error("setup");
    const unfinished = { propertyId: stage, operator: "is", value: "" };
    const filter = { conjunction: "and" as const, items: [unfinished] };

    app.dispatch(setViewFilter.create({ viewId: app.view().id, filter }));

    expect(titles(app)).toHaveLength(model(app).totalRowCount);
  });

  it("orders, hides and sizes columns from the view record", () => {
    const app = createApp();
    const [points, stage] = app.propertyIds;
    if (points === undefined || stage === undefined) throw new Error("setup");
    const viewId = app.view().id;

    app.dispatch(
      setPropertyOrder.create({ viewId, propertyOrder: [stage, points] }),
    );
    app.dispatch(
      resizeProperty.create({ viewId, propertyId: stage, width: 300 }),
    );
    expect(
      model(app).columns.map((column) => [column.property.name, column.width]),
    ).toEqual([
      ["Name", 280],
      ["Stage", 300],
      ["Points", 180],
    ]);
    app.dispatch(togglePropertyHidden.create({ viewId, propertyId: stage }));

    expect(model(app).columns.map((column) => column.property.name)).toEqual([
      "Name",
      "Points",
    ]);
  });

  it("ignores a sort on a property that has been removed", () => {
    const app = createApp();
    const [points] = app.propertyIds;
    if (points === undefined) throw new Error("setup");
    app.dispatch(
      setViewSorts.create({
        viewId: app.view().id,
        sorts: [{ propertyId: points, direction: "descending" }],
      }),
    );

    app.dispatch(
      removeProperty.create({ databaseId: app.databaseId, propertyId: points }),
    );

    expect(titles(app)).toEqual(["Write spec", "build app", "Audit", "Ship"]);
  });

  it("returns the same model for the same blocks and view", () => {
    const app = createApp();

    expect(model(app)).toBe(model(app));
  });

  it("leaves out rows in the trash", () => {
    const app = createDatabaseApp([], [["Keep"], ["Remove"]]);
    const rowId = app.rowIds[1];
    if (rowId === undefined) throw new Error("setup");

    app.dispatch(trashPage.create({ pageId: rowId }));

    expect(titles(app)).toEqual(["Keep"]);
  });
});

describe("propertyIcon", () => {
  it("shows the title column as its header does, and others by type", () => {
    const title = titleProperty();
    if (title === undefined) throw new Error("no title");
    const app = createDatabaseApp([{ name: "Notes", type: "text" }], []);
    const [notes] = app.database().props.properties;
    if (notes === undefined) throw new Error("setup");

    expect(propertyIcon(title)).toBe("title");
    expect(propertyIcon(notes)).toBe("text");
  });
});
