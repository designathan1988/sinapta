import { describe, expect, it } from "vitest";
import { createDatabaseApp } from "./database-builder.ts";
import {
  deleteOption,
  moveOption,
  recolorOption,
  renameOption,
} from "./option.commands.ts";

const OPTIONS = [
  { id: "o1", name: "Todo", color: "gray" },
  { id: "o2", name: "Doing", color: "blue" },
  { id: "o3", name: "Done", color: "green" },
];

function createApp() {
  const app = createDatabaseApp(
    [
      { name: "Stage", type: "select", options: OPTIONS },
      { name: "Tags", type: "multi-select", options: OPTIONS },
    ],
    [
      ["One", "o2", ["o1", "o2"]],
      ["Two", "o1", ["o3"]],
    ],
  );
  const [stage, tags] = app.propertyIds;
  if (stage === undefined || tags === undefined) throw new Error("setup");
  const target = (propertyId = stage) => ({
    databaseId: app.databaseId,
    propertyId,
  });
  const options = (index = 0) =>
    app.database().props.properties[index]?.options ?? [];
  const values = (rowIndex: number) => {
    const rowId = app.rowIds[rowIndex];
    const row =
      rowId === undefined
        ? undefined
        : app.store.getState().workspace.blocks[rowId];
    return row?.props.values;
  };
  return { ...app, stage, tags, target, options, values };
}

describe("option commands", () => {
  it("renames an option", () => {
    const app = createApp();

    app.dispatch(
      renameOption.create({
        ...app.target(),
        optionId: "o2",
        name: " Doing now ",
      }),
    );

    expect(app.options()[1]).toEqual({
      id: "o2",
      name: "Doing now",
      color: "blue",
    });
  });

  it("keeps the name when the new one is empty", () => {
    const app = createApp();

    app.dispatch(
      renameOption.create({ ...app.target(), optionId: "o2", name: "  " }),
    );

    expect(app.options()[1]?.name).toBe("Doing");
  });

  it("recolors an option", () => {
    const app = createApp();

    app.dispatch(
      recolorOption.create({ ...app.target(), optionId: "o1", color: "red" }),
    );

    expect(app.options()[0]?.color).toBe("red");
  });

  it("moves an option down and back up, within the list", () => {
    const app = createApp();

    app.dispatch(
      moveOption.create({ ...app.target(), optionId: "o1", offset: 1 }),
    );
    expect(app.options().map((option) => option.id)).toEqual([
      "o2",
      "o1",
      "o3",
    ]);
    app.dispatch(
      moveOption.create({ ...app.target(), optionId: "o2", offset: -1 }),
    );

    expect(app.options().map((option) => option.id)).toEqual([
      "o2",
      "o1",
      "o3",
    ]);
  });

  it("deletes an option and clears it from every row in one step", () => {
    const app = createApp();
    const before = app.store.getState().workspace;

    app.dispatch(deleteOption.create({ ...app.target(), optionId: "o2" }));
    app.dispatch(
      deleteOption.create({ ...app.target(app.tags), optionId: "o1" }),
    );

    expect(app.options().map((option) => option.id)).toEqual(["o1", "o3"]);
    expect(app.values(0)).toEqual({ [app.tags]: ["o2"] });
    expect(app.values(1)).toEqual({ [app.stage]: "o1", [app.tags]: ["o3"] });
    app.dispatch({ type: "history.undo" });
    app.dispatch({ type: "history.undo" });
    expect(app.store.getState().workspace).toEqual(before);
  });
});
