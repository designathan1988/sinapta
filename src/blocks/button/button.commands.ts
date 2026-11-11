// Pressing a button runs its actions in one transaction: inserting copies
// of its template blocks below it, adding rows to databases, and opening
// a page. One undo takes them all back.
import {
  isBlockOfType,
  listOf,
  siblingIds,
  type Block,
  type BlockId,
  type BlockProps,
  type Operation,
} from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type UiState,
} from "../../state/index.ts";
import { selectDatabase } from "../database/index.ts";
import { PAGE_TYPE, selectPage } from "../page/index.ts";
import {
  BUTTON_TYPE,
  type BlockTemplate,
  type ButtonAction,
  type ButtonBlock,
  type ButtonProps,
} from "./button.schema.ts";

export function buttonOf(state: AppState, blockId: BlockId) {
  const block = state.workspace.blocks[blockId];
  return block !== undefined && isBlockOfType<ButtonBlock>(block, BUTTON_TYPE)
    ? block
    : undefined;
}

// How many new blocks a press makes: one per template block and per row.
export function selectActionsSize(actions: readonly ButtonAction[]): number {
  return actions.reduce((sum, action) => {
    if (action.kind === "insert-blocks") return sum + action.blocks.length;
    return action.kind === "add-row" ? sum + 1 : sum;
  }, 0);
}

export function selectPressSize(state: AppState, blockId: BlockId): number {
  return selectActionsSize(buttonOf(state, blockId)?.props.actions ?? []);
}

function templateProps(template: BlockTemplate): BlockProps {
  const { type, text, level, isChecked } = template;
  if (type === "heading") return { text, level: level ?? 1 };
  if (type === "to-do") return { text, isChecked: isChecked ?? false };
  return { text };
}

interface Press {
  readonly button: ButtonBlock;
  readonly ids: BlockId[];
  readonly now: string;
  // Blocks inserted below the button so far.
  inserted: number;
}

function record(
  id: BlockId,
  spec: Omit<Block, "id" | "childIds" | "createdAt" | "updatedAt">,
  now: string,
): Block {
  return { ...spec, id, childIds: [], createdAt: now, updatedAt: now };
}

function insertOps(
  state: AppState,
  press: Press,
  templates: readonly BlockTemplate[],
) {
  const { button, now } = press;
  const parentId = button.parentId;
  if (parentId === null) return [];
  const start = siblingIds(state.workspace, parentId).indexOf(button.id) + 1;
  return templates.flatMap((template): Operation[] => {
    const id = press.ids.shift();
    if (id === undefined) return [];
    const props = templateProps(template);
    const block = record(id, { type: template.type, parentId, props }, now);
    const index = start + press.inserted;
    press.inserted += 1;
    return [
      { type: "record.create", kind: "block", record: block },
      { type: "list.insert", list: listOf(parentId), id, index },
    ];
  });
}

function rowOps(
  state: AppState,
  press: Press,
  action: Extract<ButtonAction, { kind: "add-row" }>,
) {
  const database = selectDatabase(state, action.databaseId);
  const id = press.ids.shift();
  if (database === undefined || id === undefined) return [];
  const props = {
    title: [],
    icon: null,
    isFavorite: false,
    isTrashed: false,
    values: { ...action.values },
  };
  const row = record(
    id,
    { type: PAGE_TYPE, parentId: database.id, props },
    press.now,
  );
  const index = database.childIds.length;
  return [
    { type: "record.create" as const, kind: "block" as const, record: row },
    { type: "list.insert" as const, list: listOf(database.id), id, index },
  ];
}

function opensPage(state: AppState, actions: readonly ButtonAction[]): UiState {
  const open = actions.find((action) => action.kind === "open-page");
  if (
    open?.kind !== "open-page" ||
    selectPage(state, open.pageId) === undefined
  ) {
    return state.ui;
  }
  return { ...state.ui, activePageId: open.pageId, isHomeOpen: false };
}

export const pressButton = defineCommand<{
  blockId: BlockId;
  blockCount: number;
}>({
  type: "button.press",
  newIds: (payload) => ({ blocks: payload.blockCount }),
  handle(state, command) {
    const button = buttonOf(state, command.blockId);
    if (button === undefined) return {};
    const press: Press = {
      button,
      ids: [...command.meta.blockIds],
      now: command.meta.now,
      inserted: 0,
    };
    const { actions } = button.props;
    const operations = actions.flatMap((action) => {
      if (action.kind === "insert-blocks")
        return insertOps(state, press, action.blocks);
      return action.kind === "add-row" ? rowOps(state, press, action) : [];
    });
    return { operations, ui: opensPage(state, actions) };
  },
});

function patchButton(
  button: ButtonBlock,
  props: Partial<ButtonProps>,
  now: string,
) {
  return {
    operations: [
      {
        type: "record.update" as const,
        kind: "block" as const,
        id: button.id,
        patch: { props: { ...button.props, ...props }, updatedAt: now },
      },
    ],
  };
}

export const setButtonLabel = defineCommand<{
  blockId: BlockId;
  label: string;
}>({
  type: "button.setLabel",
  handle(state, command) {
    const button = buttonOf(state, command.blockId);
    if (button === undefined) return {};
    const label = command.label.normalize("NFC");
    return patchButton(button, { label }, command.meta.now);
  },
});

export const setButtonActions = defineCommand<{
  blockId: BlockId;
  actions: readonly ButtonAction[];
}>({
  type: "button.setActions",
  handle(state, command) {
    const button = buttonOf(state, command.blockId);
    if (button === undefined) return {};
    return patchButton(
      button,
      { actions: [...command.actions] },
      command.meta.now,
    );
  },
});

export const buttonCommands = [pressButton, setButtonLabel, setButtonActions];
