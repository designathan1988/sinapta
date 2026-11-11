import { describe, expect, it } from "vitest";
import { selectPage } from "../../../../blocks/page/index.ts";
import { createDatabaseApp } from "../../database-builder.ts";
import { setPropertyConfig } from "../../database.commands.ts";
import { propertyType } from "../../property-registry.ts";
import { pressRowButton } from "./button-property.commands.ts";

function createApp(actions: readonly unknown[]) {
  const app = createDatabaseApp(
    [
      {
        name: "Stage",
        type: "status",
      },
      { name: "Done", type: "checkbox" },
      { name: "Finished", type: "date" },
      { name: "Complete", type: "button" },
    ],
    [["Write"]],
  );
  const [stage, done, finished, button] = app.propertyIds;
  const [rowId] = app.rowIds;
  if (!stage || !done || !finished || !button || !rowId)
    throw new Error("setup");
  const doneOption = app.database().props.properties[0]?.options?.[2]?.id;
  app.dispatch(
    setPropertyConfig.create({
      databaseId: app.databaseId,
      propertyId: button,
      config: {
        label: "Complete",
        actions: actions.map((action) =>
          action === "set"
            ? {
                kind: "set-values",
                values: {
                  [stage]: doneOption,
                  [done]: true,
                  [finished]: { today: true },
                },
              }
            : action,
        ),
      },
    }),
  );
  const values = () => selectPage(app.store.getState(), rowId)?.props.values;
  const press = () =>
    app.dispatch(pressRowButton.create({ rowId, propertyId: button }));
  return { ...app, stage, done, finished, doneOption, rowId, values, press };
}

describe("the button property", () => {
  it("sets the values on its row in one undo step", () => {
    const app = createApp(["set"]);
    const before = app.store.getState().workspace;

    app.press();

    expect(app.values()).toEqual({
      [app.stage]: app.doneOption,
      [app.done]: true,
      [app.finished]: { start: "2026-11-10" },
    });
    app.dispatch({ type: "history.undo" });
    expect(app.store.getState().workspace).toEqual(before);
  });

  it("opens its row as a page", () => {
    const app = createApp([{ kind: "open-page" }]);

    app.press();

    expect(app.store.getState().ui.activePageId).toBe(app.rowId);
  });

  it("shows its label in the cell and is pressed rather than typed", () => {
    const app = createApp(["set"]);
    const property = app.database().props.properties[3];
    if (property === undefined) throw new Error("setup");

    expect(propertyType("button").format(undefined, property)).toBe("Complete");
    expect(propertyType("button").editor).toBe("button");
  });
});
