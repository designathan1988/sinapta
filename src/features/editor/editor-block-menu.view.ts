// The handle beside each block and the menus it opens: block actions and
// the list of types to turn the block into.
import { html, nothing, type TemplateResult } from "lit-html";
import { BLOCK_DEFINITIONS } from "../../blocks/index.ts";
import { parseBlockId, type Block, type BlockId } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  setOverlayQuery,
  setSelection,
  type AppState,
  type Dispatch,
  type OpenOverlay,
  type TextSelection,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import {
  blockActionEntries,
  TURN_INTO_OVERLAY,
} from "./editor-block-actions.view.ts";
import { convertBlock } from "./editor-convert.commands.ts";
import { insertBlockBelow } from "./editor-insert.commands.ts";
import type { InputContext } from "./editor-input.view.ts";

export const BLOCK_MENU_OVERLAY = "block-menu";

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
    data-overlay-anchor
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
  // Only types that keep the text are offered: turning text into a
  // divider or an image would lose it.
  return BLOCK_DEFINITIONS.flatMap((definition): MenuItem[] => {
    const keepsText = Array.isArray(definition.createProps([]).text);
    if (definition.label === undefined || !keepsText) return [];
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
    // As Notion's: a search over the actions, the menu before the grip
    // (or where a right click was).
    return renderMenu({
      label: COPY.blockMenu.open,
      items: blockActionEntries(block, { overlay, state, dispatch }),
      onClose,
      search: {
        placeholder: COPY.menu.searchActions,
        query: overlay.query ?? "",
        onQuery: (query) => dispatch(setOverlayQuery.create({ query })),
      },
      ...(overlay.point ? { point: overlay.point } : { placement: "before" }),
    });
  }
  if (overlay.kind === TURN_INTO_OVERLAY) {
    const items = typeItems(block.id, overlay, dispatch);
    return renderMenu({ label: COPY.blockMenu.turnInto, items, onClose });
  }
  return nothing;
}
