import { describe, expect, it } from "vitest";
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import { createDatabaseApp } from "../../database-builder.ts";
import { propertyType } from "../../property-registry.ts";
import { setViewType } from "../../view-layout.commands.ts";

function statusProperty(): PropertyDefinition {
  const app = createDatabaseApp([{ name: "Status", type: "status" }], []);
  const property = app.database().props.properties[0];
  if (property === undefined) throw new Error("no status property");
  return property;
}

function inGroup() {
  const found = propertyType("status").filterOperators.find(
    (operator) => operator.id === "in-group",
  );
  if (found === undefined) throw new Error("no in-group operator");
  return found;
}

describe("the status property", () => {
  it("starts with Not started, In progress and Done in the three groups", () => {
    const property = statusProperty();
    const [notStarted, inProgress, done] = property.options ?? [];

    expect(property.options?.map((option) => option.name)).toEqual([
      "Not started",
      "In progress",
      "Done",
    ]);
    expect(property.config).toEqual({
      groups: [
        { id: "to-do", optionIds: [notStarted?.id] },
        { id: "in-progress", optionIds: [inProgress?.id] },
        { id: "complete", optionIds: [done?.id] },
      ],
    });
  });

  it("filters rows whose status is in the Complete group", () => {
    const property = statusProperty();
    const [notStarted, , done] = property.options ?? [];

    expect(inGroup().test(done?.id, "complete", { property })).toBe(true);
    expect(inGroup().test(notStarted?.id, "complete", { property })).toBe(
      false,
    );
    expect(inGroup().test(undefined, "complete", { property })).toBe(false);
  });

  it("places an option outside every group in To-do", () => {
    const property = { ...statusProperty(), config: undefined };
    const first = property.options?.[0]?.id;

    expect(inGroup().test(first, "to-do", { property })).toBe(true);
  });

  it("is what a new board groups by, before a select property", () => {
    const app = createDatabaseApp(
      [
        { name: "Stage", type: "select" },
        { name: "Status", type: "status" },
      ],
      [],
    );

    app.dispatch(
      setViewType.create({ viewId: app.view().id, viewType: "board" }),
    );

    expect(app.view().groupBy?.propertyId).toBe(app.propertyIds[1]);
  });
});
