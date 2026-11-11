import { describe, expect, it } from "vitest";
import { selectPage } from "../../blocks/page/index.ts";
import { createDatabaseApp } from "./database-builder.ts";
import { duplicateProperty, insertProperty } from "./property-copy.commands.ts";
import { COLUMN_MENU_OVERLAY } from "./database-overlay.ts";
import { setPropertyOrder } from "./view.commands.ts";

function createApp() {
  const app = createDatabaseApp(
    [
      { name: "Stage", type: "text" },
      { name: "Price", type: "number" },
    ],
    [
      ["One", "Draft", 3],
      ["Two", "Done", 5],
    ],
  );
  const [stage, price] = app.propertyIds;
  if (stage === undefined || price === undefined) throw new Error("setup");
  const names = () => app.database().props.properties.map((one) => one.name);
  const valuesOf = (propertyId: string) =>
    app.rowIds.map((rowId) => {
      const row = selectPage(app.store.getState(), rowId);
      return row?.props.values?.[propertyId];
    });
  const target = (propertyId = stage) => ({
    databaseId: app.databaseId,
    viewId: app.view().id,
    propertyId,
  });
  return { app, stage, price, names, valuesOf, target };
}

describe("duplicateProperty", () => {
  it("copies a property and its values right after it", () => {
    const { app, names, valuesOf, target } = createApp();

    app.dispatch(duplicateProperty.create(target()));

    const copy = app.database().props.properties[1];
    expect(names()).toEqual(["Stage", "Stage (1)", "Price"]);
    expect(copy?.type).toBe("text");
    expect(valuesOf(copy?.id ?? "")).toEqual(["Draft", "Done"]);
  });

  it("places the copy beside the original in the view's own order", () => {
    const { app, stage, price, target } = createApp();
    const viewId = app.view().id;
    app.dispatch(
      setPropertyOrder.create({ viewId, propertyOrder: [price, stage] }),
    );

    app.dispatch(duplicateProperty.create(target()));

    const copyId = app.database().props.properties[1]?.id;
    expect(app.view().propertyOrder).toEqual([price, stage, copyId]);
  });
});

describe("insertProperty", () => {
  it("adds a text property left or right of a column and opens its menu", () => {
    const { app, names, price, target } = createApp();

    app.dispatch(insertProperty.create({ ...target(price), side: "left" }));
    const inserted = app.database().props.properties[1];
    app.dispatch(insertProperty.create({ ...target(price), side: "right" }));

    expect(names()).toEqual(["Stage", "Property", "Price", "Property"]);
    expect(inserted?.type).toBe("text");
    expect(app.store.getState().ui.overlay).toEqual({
      kind: COLUMN_MENU_OVERLAY,
      anchorId: app.database().props.properties[3]?.id,
    });
  });
});
