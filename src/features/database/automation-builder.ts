// A database with a Stage select and a Done checkbox, one row, and one
// automation the runner watches, for the automation tests.
import { isPageLike } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import { installAutomations } from "./automation-runner.ts";
import { addAutomation } from "./automation.commands.ts";
import { createDatabaseApp } from "./database-builder.ts";

export async function settled(): Promise<void> {
  for (let turn = 0; turn < 3; turn += 1) await Promise.resolve();
}

export function automationApp() {
  const app = createDatabaseApp(
    [
      {
        name: "Stage",
        type: "select",
        options: [{ id: "new", name: "New", color: "gray" }],
      },
      { name: "Done", type: "checkbox" },
    ],
    [["First", "", false]],
  );
  const [stage, done] = app.propertyIds;
  const [first] = app.rowIds;
  if (stage === undefined || done === undefined || first === undefined)
    throw new Error("setup");
  installAutomations(app.store, app.dispatch);
  const { databaseId } = app;
  app.dispatch(addAutomation.create({ databaseId }));
  const automationId = app.database().props.automations?.[0]?.id ?? "";
  const valueOf = (rowId: BlockId | undefined, propertyId: string) => {
    const row =
      rowId === undefined
        ? undefined
        : app.store.getState().workspace.blocks[rowId];
    return row !== undefined && isPageLike(row)
      ? row.props.values?.[propertyId]
      : undefined;
  };
  return { app, stage, done, first, databaseId, automationId, valueOf };
}
