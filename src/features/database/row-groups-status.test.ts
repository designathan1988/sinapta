import { describe, expect, it } from "vitest";
import { createDatabaseApp, type DatabaseApp } from "./database-builder.ts";
import { setViewGroupBy } from "./group.commands.ts";
import { selectRowGroups } from "./row-groups.selectors.ts";
import { selectTableModel } from "./table-model.selectors.ts";

const STAGE = {
  name: "Stage",
  type: "status",
  options: [
    { id: "todo", name: "Todo", color: "gray" },
    { id: "done", name: "Done", color: "green" },
  ],
};

function titlesByGroup(app: DatabaseApp): string[][] {
  const propertyId = app.propertyIds[0];
  if (propertyId === undefined) throw new Error("no property");
  app.dispatch(setViewGroupBy.create({ viewId: app.view().id, propertyId }));
  const model = selectTableModel(app.store.getState(), app.databaseId);
  if (model === undefined) throw new Error("no model");
  return (selectRowGroups(model)?.groups ?? []).map((group) =>
    group.rows.map((row) => row.title),
  );
}

describe("grouping by a status, as Notion's status board", () => {
  it("has no empty No <status> column", () => {
    const app = createDatabaseApp([STAGE], [["a", "todo"]]);

    expect(titlesByGroup(app)).toEqual([["a"], []]);
  });

  it("shows No <status> while a page has no status", () => {
    const app = createDatabaseApp([STAGE], [["a", "todo"], ["b"]]);

    expect(titlesByGroup(app)).toEqual([["b"], ["a"], []]);
  });
});
