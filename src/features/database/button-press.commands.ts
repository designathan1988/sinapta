// Pressing a row's button, as Notion's button automation: its actions run
// in order in one step that one undo takes back. Edit property sets the
// row's values, Add page to adds a row to a database, Edit pages in sets
// the values of the rows of a database that pass a filter, and Open page
// opens this row or a page. The question and the web address are the
// view's (button-press.view.ts).
import {
  selectDatabase,
  type DatabaseBlock,
} from "../../blocks/database/index.ts";
import { PAGE_TYPE, selectPage } from "../../blocks/page/index.ts";
import {
  listOf,
  parseBlockId,
  type Block,
  type BlockId,
  type Operation,
  type PropertyId,
} from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import {
  resolveValues,
  workOutVariables,
  type PressContext,
  type Variables,
} from "./button-values.ts";
import { selectEditedRows } from "./button-targets.ts";
import {
  readButtonPropertyConfig,
  type ButtonPropertyAction,
  type ButtonPropertyConfig,
} from "./properties/button/index.ts";
import { numberNewRow, startingValues } from "./row-numbering.ts";

// The button's config, when the property is a button of the row's
// database.
export function selectButtonConfig(
  state: AppState,
  rowId: BlockId,
  propertyId: PropertyId,
): ButtonPropertyConfig | undefined {
  const row = selectPage(state, rowId);
  const property = selectDatabase(
    state,
    row?.parentId ?? null,
  )?.props.properties.find((item) => item.id === propertyId);
  if (property?.type !== "button") return undefined;
  return readButtonPropertyConfig(property.config);
}

interface Pressing {
  readonly press: PressContext;
  readonly variables: Variables;
  readonly now: string;
  // Changes to rows that exist, by row.
  readonly changes: Map<BlockId, Record<string, unknown>>;
  readonly created: Operation[];
  readonly ids: BlockId[];
}

function change(pressing: Pressing, rowId: BlockId, values: object): void {
  const before = pressing.changes.get(rowId) ?? {};
  pressing.changes.set(rowId, { ...before, ...values });
}

interface NewRow {
  readonly database: DatabaseBlock;
  readonly id: BlockId;
  readonly values: Readonly<Record<string, unknown>>;
}

// A new row at the database's end, with its starting values, its numbers
// and the action's values.
function newRow(row: NewRow, now: string): Operation[] {
  const { database, id } = row;
  const numbered = numberNewRow(database);
  const values = {
    ...startingValues(database),
    ...numbered.values,
    ...row.values,
  };
  const record: Block = {
    id,
    type: PAGE_TYPE,
    parentId: database.id,
    childIds: [],
    props: {
      title: [],
      icon: null,
      isFavorite: false,
      isTrashed: false,
      values,
    },
    createdAt: now,
    updatedAt: now,
  };
  const list = listOf(database.id);
  const index = database.childIds.length;
  return [
    { type: "record.create", kind: "block", record },
    { type: "list.insert", list, id, index },
    ...numbered.operations,
  ];
}

function addPage(
  action: Extract<ButtonPropertyAction, { kind: "add-page" }>,
  pressing: Pressing,
): void {
  const { state, today } = pressing.press;
  const databaseId = parseBlockId(action.databaseId) ?? null;
  const database = selectDatabase(state, databaseId);
  const id = pressing.ids.shift();
  if (database === undefined || id === undefined) return;
  const values = resolveValues(action.values, today, pressing.variables);
  pressing.created.push(...newRow({ database, id, values }, pressing.now));
}

function run(action: ButtonPropertyAction, pressing: Pressing): void {
  const { press, variables } = pressing;
  if (action.kind === "set-values") {
    change(
      pressing,
      press.row.id,
      resolveValues(action.values, press.today, variables),
    );
  } else if (action.kind === "add-page") {
    addPage(action, pressing);
  } else if (action.kind === "edit-pages") {
    const values = resolveValues(action.values, press.today, variables);
    for (const rowId of selectEditedRows(press, action)) {
      change(pressing, rowId, values);
    }
  }
}

function updates(pressing: Pressing): Operation[] {
  const { state } = pressing.press;
  return [...pressing.changes].flatMap(([rowId, values]): Operation[] => {
    const row = selectPage(state, rowId);
    if (row === undefined) return [];
    const props = { ...row.props, values: { ...row.props.values, ...values } };
    const patch = { props, updatedAt: pressing.now };
    return [{ type: "record.update", kind: "block", id: rowId, patch }];
  });
}

// Where Open page goes: the page it names, or the row.
function opened(actions: readonly ButtonPropertyAction[], rowId: BlockId) {
  const open = actions.find((action) => action.kind === "open-page");
  if (open === undefined || open.url !== undefined) return undefined;
  return parseBlockId(open.pageId ?? "") ?? rowId;
}

export const pressRowButton = defineCommand<{
  rowId: BlockId;
  propertyId: PropertyId;
  // How many pages its Add page to actions add.
  adds?: number;
}>({
  type: "row.pressButton",
  newIds: (payload) => ({ blocks: payload.adds ?? 0 }),
  handle(state, command) {
    const row = selectPage(state, command.rowId);
    const config = selectButtonConfig(state, command.rowId, command.propertyId);
    const database = selectDatabase(state, row?.parentId ?? null);
    if (row === undefined || config === undefined || database === undefined)
      return {};
    const { now } = command.meta;
    const press = {
      state,
      row,
      properties: database.props.properties,
      today: now.slice(0, 10),
    };
    const pressing: Pressing = {
      press,
      variables: workOutVariables(config.actions, press),
      now,
      changes: new Map(),
      created: [],
      ids: [...command.meta.blockIds],
    };
    for (const action of config.actions) run(action, pressing);
    const pageId = opened(config.actions, row.id);
    const ui =
      pageId === undefined ? state.ui : { ...state.ui, activePageId: pageId };
    const operations = [...pressing.created, ...updates(pressing)];
    return operations.length === 0 ? { ui } : { operations, ui };
  },
});

// The command a press sends, with room for the pages it adds.
export function buttonPress(
  state: AppState,
  rowId: BlockId,
  propertyId: PropertyId,
) {
  const config = selectButtonConfig(state, rowId, propertyId);
  const adds =
    config?.actions.filter((action) => action.kind === "add-page").length ?? 0;
  return pressRowButton.create({ rowId, propertyId, adds });
}

export const buttonPressCommands = [pressRowButton];
