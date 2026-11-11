// The handle beside each block and the menus it opens: block actions and
// the list of types to turn the block into.
import { html, nothing, type TemplateResult } from "lit-html";
import { BLOCK_DEFINITIONS } from "../../blocks/block-registry.ts";
import { isTextBlock } from "../../blocks/text-block.ts";
import {
  countBlockTree,
  parseBlockId,
  type Block,
  type BlockId,
} from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  setSelection,
  type AppState,
  type Dispatch,
  type OpenOverlay,
  type TextSelection,
} from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { startPointerDrag } from "../../ui/drag/index.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { convertBlock } from "./editor-convert.commands.ts";
import { duplicateBlock, insertBlockBelow } from "./editor-insert.commands.ts";
import type { InputContext } from "./editor-input.view.ts";
import {
  deleteBlock,
  moveBlock,
  moveBlockBy,
  selectBlockDrop,
} from "./editor-move.commands.ts";

export const BLOCK_MENU_OVERLAY = "block-menu";
const TURN_INTO_OVERLAY = "turn-into";
const BLOCK = ".editor__block";

// Opened from the keyboard, the menu remembers where the caret was so
// that closing it puts the caret back.
export function openBlockMenu(
  blockId: BlockId,
  dispatch: Dispatch,
  caret?: TextSelection,
): void {
  const anchor = { kind: BLOCK_MENU_OVERLAY, anchorId: blockId };
  const overlay =
    caret === undefined
      ? anchor
      : { ...anchor, start: caret.anchorOffset, end: caret.focusOffset };
  dispatch(openOverlay.create({ overlay }));
}

// The caret a menu was opened from, if it was opened from one.
function caretOf(overlay: OpenOverlay, blockId: BlockId) {
  const { start, end } = overlay;
  if (start === undefined || end === undefined) return undefined;
  return { blockId, anchorOffset: start, focusOffset: end };
}

// A handle shown beside a block: press to open its menu, drag to move it.
export function renderHandle(
  block: Block,
  context: InputContext,
): TemplateResult {
  const { overlay } = context.state.ui;
  const isOpen =
    overlay?.anchorId === block.id && overlay.kind !== "slash-menu";
  const onClick = (): void => {
    if (isOpen) context.dispatch(closeOverlay.create({}));
    else openBlockMenu(block.id, context.dispatch);
  };
  return html`<button
    type="button"
    class="editor__handle"
    tabindex="-1"
    data-handle
    aria-haspopup="menu"
    aria-expanded=${String(isOpen)}
    aria-label=${COPY.blockMenu.open}
    title=${tooltipTitle(COPY.blockMenu.open)}
    interestfor=${TOOLTIP_TARGET}
    @click=${onClick}
  >
    ${renderIcon("grip")}
  </button>`;
}

// The "+" beside a block: adds a block below it and opens the slash menu.
export function renderAddButton(
  block: Block,
  context: InputContext,
): TemplateResult {
  return html`<button
    type="button"
    class="editor__handle"
    tabindex="-1"
    data-add
    aria-label=${COPY.blockMenu.add}
    title=${tooltipTitle(COPY.blockMenu.add)}
    interestfor=${TOOLTIP_TARGET}
    @click=${() => context.dispatch(insertBlockBelow.create({ blockId: block.id }))}
  >
    ${renderIcon("plus")}
  </button>`;
}

// Dragging starts on a handle and drops on any block.
export function startBlockDrag(
  event: PointerEvent,
  context: InputContext,
): void {
  const handle =
    event.target instanceof Element
      ? event.target.closest("[data-handle]")
      : null;
  if (handle === null) return;
  const idOf = (element: Element): BlockId | undefined =>
    parseBlockId(element.closest<HTMLElement>(BLOCK)?.dataset.blockId ?? "");
  startPointerDrag(event, {
    itemSelector: BLOCK,
    onDrop(source, target, position) {
      const blockId = idOf(source);
      const targetId = idOf(target);
      if (blockId === undefined || targetId === undefined) return;
      const move = selectBlockDrop(context.state, blockId, {
        targetId,
        position,
      });
      if (move === undefined) return;
      context.dispatch(moveBlock.create(move));
      announce(COPY.blockMenu.moved);
    },
  });
}

interface ActionContext {
  readonly overlay: OpenOverlay;
  readonly dispatch: Dispatch;
  // Blocks in the tree of the block, for a copy of it.
  readonly blockCount: number;
}

function actionItems(block: Block, context: ActionContext): MenuItem[] {
  const { overlay, dispatch, blockCount } = context;
  const blockId = block.id;
  const turnInto: MenuItem = {
    label: COPY.blockMenu.turnInto,
    icon: "chevron",
    onSelect: () =>
      dispatch(
        openOverlay.create({
          overlay: { ...overlay, kind: TURN_INTO_OVERLAY },
        }),
      ),
  };
  return [
    ...(isTextBlock(block) ? [turnInto] : []),
    {
      label: COPY.blockMenu.duplicate,
      icon: "duplicate",
      onSelect: () => dispatch(duplicateBlock.create({ blockId, blockCount })),
    },
    {
      label: COPY.blockMenu.moveUp,
      icon: "up",
      onSelect: () => dispatch(moveBlockBy.create({ blockId, offset: -1 })),
    },
    {
      label: COPY.blockMenu.moveDown,
      icon: "down",
      onSelect: () => dispatch(moveBlockBy.create({ blockId, offset: 1 })),
    },
    {
      label: COPY.blockMenu.delete,
      icon: "trash",
      isDanger: true,
      onSelect: () => dispatch(deleteBlock.create({ blockId })),
    },
  ];
}

// Converting keeps the caret where the menu was opened from.
function typeItems(
  blockId: BlockId,
  overlay: OpenOverlay,
  dispatch: Dispatch,
): MenuItem[] {
  const selection = caretOf(overlay, blockId);
  const convert = (blockType: string) => (): void => {
    dispatch(convertBlock.create({ blockId, blockType }));
    if (selection !== undefined) dispatch(setSelection.create({ selection }));
  };
  return BLOCK_DEFINITIONS.flatMap((definition): MenuItem[] => {
    if (definition.label === undefined || definition.type === "divider")
      return [];
    return [{ label: definition.label, onSelect: convert(definition.type) }];
  });
}

// The open block menu, if any.
export function renderBlockMenu(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const { overlay } = state.ui;
  const blockId = parseBlockId(overlay?.anchorId ?? "");
  const block =
    blockId === undefined ? undefined : state.workspace.blocks[blockId];
  if (block === undefined || overlay === null) return nothing;
  const onClose = (): void => {
    dispatch(closeOverlay.create({}));
    const selection = caretOf(overlay, block.id);
    if (selection !== undefined) dispatch(setSelection.create({ selection }));
  };
  if (overlay.kind === BLOCK_MENU_OVERLAY) {
    const blockCount = countBlockTree(state.workspace, block.id);
    const items = actionItems(block, { overlay, dispatch, blockCount });
    return renderMenu({ label: COPY.blockMenu.open, items, onClose });
  }
  if (overlay.kind === TURN_INTO_OVERLAY) {
    const items = typeItems(block.id, overlay, dispatch);
    return renderMenu({ label: COPY.blockMenu.turnInto, items, onClose });
  }
  return nothing;
}
