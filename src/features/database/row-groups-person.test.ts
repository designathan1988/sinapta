import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "./database-builder.ts";
import { setViewGroupBy } from "./group.commands.ts";
import { selectRowGroups } from "./row-groups.selectors.ts";
import { selectTableModel } from "./table-model.selectors.ts";

const OWNER = { name: "Owner", type: "person" };
const ADA = { id: "u1", name: "Ada" };
const GRACE = { id: "u2", name: "Grace" };

describe("grouping by a person, as Notion's", () => {
  it("puts a row in the group of each of its people, the rest first in No Owner", () => {
    const app = createDatabaseApp(
      [OWNER],
      [["Plan", [ADA]], ["Ship", [ADA, GRACE]], ["Rest"]],
    );
    const propertyId = app.propertyIds[0];
    if (propertyId === undefined) throw new Error("no property");
    app.dispatch(setViewGroupBy.create({ viewId: app.view().id, propertyId }));
    const model = selectTableModel(app.store.getState(), app.databaseId);
    if (model === undefined) throw new Error("no model");

    const groups = selectRowGroups(model)?.groups ?? [];

    expect(
      groups.map((group) => [group.label, group.rows.map((row) => row.title)]),
    ).toEqual([
      ["No Owner", ["Rest"]],
      ["Ada", ["Plan", "Ship"]],
      ["Grace", ["Ship"]],
    ]);
  });
});
