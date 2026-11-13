import { describe, expect, it } from "vitest";
import { selectDatabase } from "../../../../blocks/database/index.ts";
import { createTestApp } from "../../../../state/index.ts";
import { addProperty, createDatabase } from "../../database.commands.ts";
import { addRow, rowCommands } from "../../row.commands.ts";
import { readStatusConfig } from "./status.schema.ts";

// A database with a status property "Stage" and one new row.
function withNewRow() {
  const app = createTestApp({
    commands: [createDatabase, addProperty, ...rowCommands],
  });
  app.dispatch(createDatabase.create({ parentId: null }));
  const databaseId = app.store.getState().workspace.rootIds.at(-1);
  if (databaseId === undefined) throw new Error("no database");
  app.dispatch(
    addProperty.create({ databaseId, propertyType: "status", name: "Stage" }),
  );
  app.dispatch(addRow.create({ databaseId }));
  const state = app.store.getState();
  const database = selectDatabase(state, databaseId);
  const stage = database?.props.properties.find((one) => one.name === "Stage");
  const rowId = database?.childIds.at(-1);
  if (stage === undefined || rowId === undefined) throw new Error("none");
  return { state, stage, rowId };
}

describe("a status property on a new row", () => {
  it("starts in To-do's first option, as Notion's Not started", () => {
    const { state, stage, rowId } = withNewRow();
    const todo = readStatusConfig(stage.config)?.groups[0]?.optionIds[0];

    expect(todo).toBeDefined();
    expect(state.workspace.blocks[rowId]?.props.values).toMatchObject({
      [stage.id]: todo,
    });
  });
});
