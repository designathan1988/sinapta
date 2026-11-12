// Builds a database with properties and rows for tests of the table.
import {
  selectDatabase,
  type DatabaseBlock,
  type SelectOption,
} from "../../blocks/database/index.ts";
import type { BlockId, PropertyId, View } from "../../model/index.ts";
import { createTestApp, type TestApp } from "../../state/index.ts";
import {
  addProperty,
  changeProperty,
  createDatabase,
  databaseCommands,
} from "./database.commands.ts";
import { optionCommands } from "./option.commands.ts";
import { propertyCopyCommands } from "./property-copy.commands.ts";
import { propertyTypeCommands } from "./property-type.commands.ts";
import { buttonPropertyCommands } from "./properties/button/index.ts";
import {
  relationCommands,
  relationTidier,
} from "./properties/relation/index.ts";
import { addRow, rowCommands, setRowValue } from "./row.commands.ts";
import { tableCommands } from "./table.commands.ts";
import { calendarCommands } from "./layouts/calendar/calendar.commands.ts";
import { viewLayoutCommands } from "./view-layout.commands.ts";
import { viewSearchCommands } from "./view-search.commands.ts";
import { viewCommands } from "./view.commands.ts";
import { groupCommands } from "./group.commands.ts";
import { calculationCommands } from "./calculation.commands.ts";
import { rowBulkCommands } from "./row-bulk.commands.ts";
import { tableLayoutCommands } from "./table-layout.commands.ts";
import { cardCommands } from "./card.commands.ts";
import { calendarOptionCommands } from "./calendar-options.commands.ts";
import { timelineOptionCommands } from "./timeline-options.commands.ts";
import { chartOptionCommands } from "./chart-options.commands.ts";
import { formOptionCommands } from "./form-options.commands.ts";
import { rowOpenCommands } from "./row-open.commands.ts";
import { templateCommands } from "./template.commands.ts";
import { csvImportCommands } from "./csv-import.commands.ts";
import { viewLockCommands } from "./view-lock.commands.ts";
import { subGroupCommands } from "./sub-group.commands.ts";
import { formCommands } from "./layouts/form/form.commands.ts";
import { boardCardCommands } from "./layouts/board/board-card.commands.ts";
import {
  lockGuard,
  pageCommands,
  pageLockCommands,
  pageTrashCommands,
  renamePage,
} from "../../blocks/page/index.ts";

export { toPropertyId } from "../../model/index.ts";

export interface PropertySpec {
  readonly name: string;
  readonly type: string;
  readonly options?: readonly SelectOption[];
}

// A row: its title, then one value per property, in property order.
export type RowSpec = readonly [title: string, ...values: unknown[]];

export interface DatabaseApp extends TestApp {
  readonly databaseId: BlockId;
  readonly propertyIds: readonly PropertyId[];
  readonly rowIds: readonly BlockId[];
  readonly database: () => DatabaseBlock;
  readonly view: () => View;
}

function mustFind<TValue>(value: TValue | undefined, name: string): TValue {
  if (value === undefined) throw new Error(`Test setup: no ${name}.`);
  return value;
}

function addProperties(
  app: DatabaseApp,
  properties: readonly PropertySpec[],
): void {
  const { dispatch, databaseId } = app;
  for (const { name, type, options } of properties) {
    dispatch(addProperty.create({ databaseId, propertyType: type, name }));
    const propertyId = mustFind(
      app.database().props.properties.at(-1)?.id,
      "property",
    );
    if (options !== undefined) {
      dispatch(changeProperty.create({ databaseId, propertyId, options }));
    }
  }
}

function addRows(app: DatabaseApp, rows: readonly RowSpec[]): void {
  const { dispatch, databaseId } = app;
  const propertyIds = app
    .database()
    .props.properties.map((property) => property.id);
  for (const [title, ...values] of rows) {
    dispatch(addRow.create({ databaseId }));
    const rowId = mustFind(app.database().childIds.at(-1), "row");
    dispatch(renamePage.create({ pageId: rowId, title }));
    values.forEach((value, index) => {
      const propertyId = mustFind(propertyIds[index], "property for a value");
      dispatch(setRowValue.create({ rowId, propertyId, value }));
    });
  }
}

const DATABASE_TEST_COMMANDS = [
  ...databaseCommands,
  ...rowCommands,
  ...viewCommands,
  ...groupCommands,
  ...calculationCommands,
  ...rowBulkCommands,
  ...tableLayoutCommands,
  ...cardCommands,
  ...calendarOptionCommands,
  ...timelineOptionCommands,
  ...chartOptionCommands,
  ...formOptionCommands,
  ...rowOpenCommands,
  ...templateCommands,
  ...csvImportCommands,
  ...viewLockCommands,
  ...subGroupCommands,
  ...formCommands,
  ...boardCardCommands,
  ...viewLayoutCommands,
  ...viewSearchCommands,
  ...calendarCommands,
  ...pageCommands,
  ...pageLockCommands,
  ...pageTrashCommands,
  ...tableCommands,
  ...optionCommands,
  ...propertyTypeCommands,
  ...propertyCopyCommands,
  ...relationCommands,
  ...buttonPropertyCommands,
];

export function createDatabaseApp(
  properties: readonly PropertySpec[],
  rows: readonly RowSpec[],
): DatabaseApp {
  const base = createTestApp({
    commands: DATABASE_TEST_COMMANDS,
    tidiers: [relationTidier],
    guards: [lockGuard],
  });
  const { store } = base;
  base.dispatch(createDatabase.create({ parentId: null }));
  const databaseId = mustFind(
    store.getState().ui.activePageId ?? undefined,
    "database",
  );
  const database = (): DatabaseBlock =>
    mustFind(selectDatabase(store.getState(), databaseId), "database");
  const view = (): View => {
    const viewId = mustFind(database().props.viewIds[0], "view");
    return mustFind(store.getState().workspace.views[viewId], "view record");
  };
  const empty = {
    ...base,
    databaseId,
    propertyIds: [],
    rowIds: [],
    database,
    view,
  };
  addProperties(empty, properties);
  addRows(empty, rows);
  const propertyIds = database().props.properties.map(
    (property) => property.id,
  );
  return { ...empty, propertyIds, rowIds: database().childIds };
}
