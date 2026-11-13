import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "../../database-builder.ts";
import { setPropertyConfig } from "../../database.commands.ts";
import { editorOf, propertyType } from "../../property-registry.ts";
import { setStatusChecked } from "../../row.commands.ts";
import { selectTableModel } from "../../table-model.selectors.ts";
import { isStatusChecked, statusOptionFor } from "./status-checkbox.ts";
import { readStatusConfig } from "./status.schema.ts";

// A Status column shown as a checkbox, with one row.
function createApp(emptyComplete = false) {
  const app = createDatabaseApp(
    [{ name: "Status", type: "status" }],
    [["Ship"]],
  );
  const [propertyId] = app.propertyIds;
  const [rowId] = app.rowIds;
  const stored = app.database().props.properties[0];
  const groups = readStatusConfig(stored?.config)?.groups ?? [];
  if (propertyId === undefined || rowId === undefined) throw new Error("setup");
  const shown = groups.map((group) =>
    emptyComplete && group.id === "complete"
      ? { ...group, optionIds: [] }
      : group,
  );
  const config = { groups: shown, showAs: "checkbox" };
  app.dispatch(
    setPropertyConfig.create({
      databaseId: app.databaseId,
      propertyId,
      config,
    }),
  );
  const property = () => {
    const found = app.database().props.properties[0];
    if (found === undefined) throw new Error("no property");
    return found;
  };
  const value = (): unknown =>
    selectTableModel(app.store.getState(), app.databaseId)?.rows[0]?.values[
      propertyId
    ];
  return { app, rowId, propertyId, property, value };
}

describe("a status shown as a checkbox", () => {
  it("is toggled, and draws a ticked box for a value in Complete", () => {
    const { property } = createApp();
    const done = statusOptionFor(property(), true);

    expect(editorOf(property())).toBe("toggle");
    expect(isStatusChecked(property(), done)).toBe(true);
    const cell = propertyType("status").renderCell(done, property());
    expect(JSON.stringify(cell)).toContain("data-checked");
  });

  it("ticks to Complete's first option and unticks to To-do's", () => {
    const { app, rowId, propertyId, property, value } = createApp();

    app.dispatch(setStatusChecked.create({ rowId, propertyId, checked: true }));
    expect(value()).toBe(statusOptionFor(property(), true));

    app.dispatch(
      setStatusChecked.create({ rowId, propertyId, checked: false }),
    );
    expect(value()).toBe(statusOptionFor(property(), false));
  });

  it("cannot be ticked while Complete has no option", () => {
    const { app, rowId, propertyId, value } = createApp(true);
    const before = value();

    app.dispatch(setStatusChecked.create({ rowId, propertyId, checked: true }));

    expect(value()).toBe(before);
  });
});
