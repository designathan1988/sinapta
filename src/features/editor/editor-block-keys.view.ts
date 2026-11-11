// Notion's keys for whole blocks, pressed in a block's text: Escape selects
// the block, Ctrl+A twice selects the page, Ctrl+D duplicates, Ctrl+Shift
// with an arrow moves, Ctrl+Enter activates, Ctrl+Alt+T opens or closes
// every toggle, Ctrl+Shift with a digit turns the block into another type
// and Ctrl+Shift+H applies the last color used (design decision D14).
import { isTextBlock, textOf } from "../../blocks/index.ts";
import { HEADING_TYPE, setHeadingOpen } from "../../blocks/heading/index.ts";
import { PAGE_LINK_TYPE } from "../../blocks/page-link/index.ts";
import { PAGE_TYPE } from "../../blocks/page/index.ts";
import { TO_DO_TYPE, toggleToDo } from "../../blocks/to-do/index.ts";
import {
  isTogglable,
  setAllTogglesOpen,
  setToggleOpen,
  TOGGLE_TYPE,
} from "../../blocks/toggle/index.ts";
import {
  countBlockTree,
  parseBlockId,
  type Block,
  type BlockId,
  type BlockProps,
} from "../../model/index.ts";
import { setActivePage, type AppState } from "../../state/index.ts";
import { readSelection } from "../../ui/caret/index.ts";
import type { KeyStroke } from "../../ui/shortcuts/index.ts";
import { turnIntoCommand } from "./editor-convert.commands.ts";
import type { InputContext } from "./editor-input.view.ts";
import { duplicateBlock } from "./editor-insert.commands.ts";
import { moveBlockBy } from "./editor-move.commands.ts";
import { selectBlockRange } from "./editor-selection.commands.ts";
import { setTextTone } from "./editor.commands.ts";
import {
  selectBlockOrder,
  selectChildBlocks,
  selectPageIdOf,
} from "./editor.selectors.ts";

export interface BlockKeyStroke extends KeyStroke {
  // The physical key, so Shift with a digit is still that digit.
  readonly code: string;
}

export type BlockKeyAction =
  | { readonly kind: "select-block" }
  | { readonly kind: "select-all" }
  | { readonly kind: "duplicate" }
  | { readonly kind: "move"; readonly offset: -1 | 1 }
  | { readonly kind: "activate" }
  | { readonly kind: "toggle-all" }
  | { readonly kind: "last-color" }
  | {
      readonly kind: "turn-into";
      readonly blockType: string;
      readonly extraProps?: BlockProps;
    };

const heading = (level: number): BlockKeyAction => ({
  kind: "turn-into",
  blockType: HEADING_TYPE,
  extraProps: { level },
});
const turnInto = (blockType: string): BlockKeyAction => ({
  kind: "turn-into",
  blockType,
});

// Ctrl+Shift with a digit, by the digit's physical key.
const TURN_INTO: Readonly<Record<string, BlockKeyAction>> = {
  Digit0: turnInto("paragraph"),
  Digit1: heading(1),
  Digit2: heading(2),
  Digit3: heading(3),
  Digit4: turnInto(TO_DO_TYPE),
  Digit5: turnInto("bulleted-list"),
  Digit6: turnInto("numbered-list"),
  Digit7: turnInto(TOGGLE_TYPE),
  Digit8: turnInto("code"),
  Digit9: turnInto(PAGE_TYPE),
};

const WITH_MOD: Readonly<Record<string, BlockKeyAction>> = {
  a: { kind: "select-all" },
  d: { kind: "duplicate" },
  enter: { kind: "activate" },
};

const WITH_MOD_SHIFT: Readonly<Record<string, BlockKeyAction>> = {
  arrowup: { kind: "move", offset: -1 },
  arrowdown: { kind: "move", offset: 1 },
  h: { kind: "last-color" },
};

// Escape alone selects the block; any other key needs Ctrl or Command.
function withoutMod(stroke: BlockKeyStroke): BlockKeyAction | undefined {
  const isPlain = !stroke.shiftKey && !stroke.altKey;
  return isPlain && stroke.key === "Escape"
    ? { kind: "select-block" }
    : undefined;
}

export function blockKeyAction(
  stroke: BlockKeyStroke,
): BlockKeyAction | undefined {
  if (!(stroke.ctrlKey || stroke.metaKey)) return withoutMod(stroke);
  const key = stroke.key.toLowerCase();
  if (stroke.altKey) {
    const isToggles = stroke.code === "KeyT" && !stroke.shiftKey;
    return isToggles ? { kind: "toggle-all" } : undefined;
  }
  if (stroke.shiftKey) return WITH_MOD_SHIFT[key] ?? TURN_INTO[stroke.code];
  return WITH_MOD[key];
}

export interface KeyTarget {
  readonly blockId: BlockId;
  // The selected text, for the last color.
  readonly start: number;
  readonly end: number;
}

function selectAll(state: AppState, blockId: BlockId) {
  const pageId = selectPageIdOf(state, blockId);
  const blocks = pageId === undefined ? [] : selectChildBlocks(state, pageId);
  const first = blocks[0];
  const last = blocks.at(-1);
  if (first === undefined || last === undefined) return undefined;
  return selectBlockRange.create({ anchorId: first.id, focusId: last.id });
}

// Opening a toggle or toggle heading, or following a page link.
function openOrFollow(block: Block) {
  const blockId = block.id;
  if (block.type === TOGGLE_TYPE) {
    return setToggleOpen.create({
      blockId,
      isOpen: block.props.isOpen !== true,
    });
  }
  if (block.type === HEADING_TYPE && block.props.isToggleable === true) {
    return setHeadingOpen.create({
      blockId,
      isOpen: block.props.isOpen === false,
    });
  }
  const linked = block.props.pageId;
  const pageId = typeof linked === "string" ? parseBlockId(linked) : undefined;
  if (block.type !== PAGE_LINK_TYPE || pageId === undefined) return undefined;
  return setActivePage.create({ pageId });
}

function activate(state: AppState, blockId: BlockId) {
  const block = state.workspace.blocks[blockId];
  if (block === undefined) return undefined;
  if (block.type === TO_DO_TYPE) return toggleToDo.create({ blockId });
  return openOrFollow(block);
}

function toggleAll(state: AppState, blockId: BlockId) {
  const pageId = selectPageIdOf(state, blockId);
  if (pageId === undefined) return undefined;
  const toggles = selectBlockOrder(state, pageId).filter(isTogglable);
  const isOpen = toggles.some((block) => block.props.isOpen === false);
  return setAllTogglesOpen.create({ pageId, isOpen });
}

function lastColor(state: AppState, target: KeyTarget) {
  const { lastTone } = state.ui;
  if (lastTone === null || target.start === target.end) return undefined;
  return setTextTone.create({ ...target, ...lastTone });
}

// Sends the action's command; false when the action does not apply here.
export function runBlockKeyAction(
  action: BlockKeyAction,
  target: KeyTarget,
  { state, dispatch }: InputContext,
): boolean {
  const { blockId } = target;
  const blockCount = countBlockTree(state.workspace, blockId);
  const commands = {
    "select-block": () =>
      selectBlockRange.create({ anchorId: blockId, focusId: blockId }),
    "select-all": () => selectAll(state, blockId),
    duplicate: () => duplicateBlock.create({ blockId, blockCount }),
    move: () =>
      action.kind === "move"
        ? moveBlockBy.create({ blockId, offset: action.offset })
        : undefined,
    activate: () => activate(state, blockId),
    "toggle-all": () => toggleAll(state, blockId),
    "last-color": () => lastColor(state, target),
    "turn-into": () =>
      action.kind === "turn-into"
        ? turnIntoCommand(blockId, action)
        : undefined,
  };
  const command = commands[action.kind]();
  if (command === undefined) return false;
  dispatch(command);
  return true;
}

// Whether the selected text is all of its block's text: then Ctrl+A goes
// on to select the page's blocks.
function coversBlock(state: AppState, target: KeyTarget): boolean {
  const block = state.workspace.blocks[target.blockId];
  return (
    isTextBlock(block) &&
    target.start === 0 &&
    target.end === textOf(block).length
  );
}

// Selecting whole blocks leaves the text: the keyboard then works on the
// blocks from their container.
function leaveText(event: KeyboardEvent): void {
  document.getSelection()?.removeAllRanges();
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.focus({ preventScroll: true });
  }
}

export function onBlockKeys(event: KeyboardEvent, context: InputContext) {
  const selection = readSelection();
  const action = blockKeyAction(event);
  if (selection === null || action === undefined) return false;
  const { anchorOffset, focusOffset } = selection;
  const target = {
    blockId: selection.blockId,
    start: Math.min(anchorOffset, focusOffset),
    end: Math.max(anchorOffset, focusOffset),
  };
  const isSelectAll = action.kind === "select-all";
  if (isSelectAll && !coversBlock(context.state, target)) return false;
  if (!runBlockKeyAction(action, target, context)) return false;
  if (isSelectAll || action.kind === "select-block") leaveText(event);
  return true;
}
