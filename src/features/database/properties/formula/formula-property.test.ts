import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "../../database-builder.ts";
import { setPropertyConfig } from "../../database.commands.ts";
import { propertyType } from "../../property-registry.ts";
import { selectTableModel } from "../../table-model.selectors.ts";

function createApp(expression: string) {
  const app = createDatabaseApp(
    [
      { name: "Hours", type: "number" },
      {
        name: "Stage",
        type: "select",
        options: [{ id: "o1", name: "Doing", color: "blue" }],
      },
      { name: "Due", type: "date" },
      { name: "Score", type: "formula" },
    ],
    [["Write", 3, "o1", { start: "2026-11-01" }]],
  );
  const propertyId = app.propertyIds[3];
  if (propertyId === undefined) throw new Error("setup");
  app.dispatch(
    setPropertyConfig.create({
      databaseId: app.databaseId,
      propertyId,
      config: { expression },
    }),
  );
  const score = () => {
    const model = selectTableModel(
      app.store.getState(),
      app.databaseId,
      "2026-11-11",
    );
    return model?.rows[0]?.values[propertyId];
  };
  return { ...app, score };
}

describe("the formula property", () => {
  it("works out each row from its other properties and its title", () => {
    const app = createApp(
      'prop("Hours") * 2 + length(prop("Stage")) + prop("Name").length()',
    );

    expect(app.score()).toBe(16);
  });

  it("knows today for date math", () => {
    const app = createApp('dateBetween(today(), prop("Due"), "days")');

    expect(app.score()).toBe(10);
  });

  it("shows a mistake in the formula instead of a value", () => {
    const app = createApp('prop("Hours") +');

    const formula = app.database().props.properties[3];
    if (formula === undefined) throw new Error("no formula");

    expect(app.score()).toEqual({ error: "A value is missing here." });
    expect(propertyType("formula").format(app.score(), formula)).toBe(
      "A value is missing here.",
    );
  });

  it("is worked out by the app, never typed", () => {
    expect(propertyType("formula").editor).toBe("none");
  });
});
