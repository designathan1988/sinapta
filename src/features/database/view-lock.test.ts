import { describe, expect, it } from "vitest";
import { setPageLocked } from "../../blocks/page/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { addProperty } from "./database.commands.ts";
import { addRow } from "./row.commands.ts";
import { setViewLocked } from "./view-lock.commands.ts";
import { setViewFilter } from "./view.commands.ts";

const FILTER: { conjunction: "or"; items: [] } = {
  conjunction: "or",
  items: [],
};

describe("a locked view", () => {
  it("keeps its filter until it is unlocked", () => {
    const app = createDatabaseApp([], [["One"]]);
    const viewId = app.view().id;
    app.dispatch(setViewLocked.create({ viewId, isLocked: true }));

    const refused = app.dispatch(
      setViewFilter.create({ viewId, filter: FILTER }),
    );
    expect(refused).toEqual({ ok: false, error: { kind: "locked" } });
    expect(app.view().filter.conjunction).toBe("and");

    app.dispatch(setViewLocked.create({ viewId, isLocked: false }));
    app.dispatch(setViewFilter.create({ viewId, filter: FILTER }));
    expect(app.view().filter.conjunction).toBe("or");
  });
});

describe("a locked database", () => {
  it("takes new rows but no new properties", () => {
    const app = createDatabaseApp([], [["One"]]);
    const { databaseId } = app;
    app.dispatch(setPageLocked.create({ pageId: databaseId, isLocked: true }));

    app.dispatch(
      addProperty.create({ databaseId, propertyType: "text", name: "Notes" }),
    );
    app.dispatch(addRow.create({ databaseId, staysPut: true }));

    expect(app.database().props.properties.map((p) => p.name)).not.toContain(
      "Notes",
    );
    expect(app.database().childIds).toHaveLength(2);
  });
});
