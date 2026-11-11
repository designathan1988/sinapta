// A database of rows, titled as given, with the row peek's commands: the
// state the peek's tests start from.
import { selectDatabase } from "../../blocks/database/index.ts";
import type { BlockId, ViewId } from "../../model/index.ts";
import { createTestApp, uiCommands, type TestApp } from "../../state/index.ts";
import {
  addRow,
  createDatabase,
  DATABASE_TIDIERS,
  databaseCommands,
} from "../database/index.ts";
import { peekCommands } from "./peek.commands.ts";

export interface PeekApp extends TestApp {
  readonly databaseId: BlockId;
  readonly viewId: ViewId;
  readonly rowIds: readonly BlockId[];
}

export function createPeekApp(titles: readonly string[]): PeekApp {
  const app = createTestApp({
    commands: [...databaseCommands, ...peekCommands, ...uiCommands],
    tidiers: DATABASE_TIDIERS,
  });
  app.dispatch(createDatabase.create({ parentId: null }));
  const databaseId = app.store.getState().ui.activePageId;
  if (databaseId === null) throw new Error("The database did not open.");
  for (const title of titles) {
    app.dispatch(addRow.create({ databaseId, title, staysPut: true }));
  }
  const database = selectDatabase(app.store.getState(), databaseId);
  const viewId = database?.props.viewIds[0];
  if (database === undefined || viewId === undefined) {
    throw new Error("The database has no view.");
  }
  return { ...app, databaseId, viewId, rowIds: database.childIds };
}
