// The handle beside each block and the menus it opens: block actions and
// the list of types to turn the block into.
import { AI_MENU_OVERLAY, renderAskAiMenu } from "../ai/index.ts";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  BLOCK_DEFINITIONS,
  countText,
  isTextBlock,
  textOf,
} from "../../blocks/index.ts";
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
import { COPY, countLabel } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import {
  blockActionEntries,
  FROM_BLOCK_MENU,
  TURN_INTO_OVERLAY,
} from "./editor-block-actions.view.ts";
import { convertBlock } from "./editor-convert.commands.ts";
import { insertBlockBelow } from "./editor-insert.commands.ts";
import type { InputContext } from "./editor-input.view.ts";
import { BLOCK_COLOR_OVERLAY } from "./editor-color-menu.view.ts";
import { selectBlockOrder, selectSelectedBlocks } from "./editor.selectors.ts";

export const BLOCK_MENU_OVERLAY = "block-menu";

const HANDLE_MENUS: ReadonlySet<string> = new Set([
  BLOCK_MENU_OVERLAY,
  BLOCK_COLOR_OVERLAY,
]);

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
  // Open only for the block's own menu and its colors: a picker of the
  // block, such as a callout's icon, is another control's.
  const isOpen =
    overlay?.anchorId === block.id && HANDLE_MENUS.has(overlay.kind);
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

interface TurnIntoAt {
  readonly blockId: BlockId;
  readonly overlay: OpenOverlay;
  readonly dispatch: Dispatch;
}

// The types a block can turn into; from the selection panel's type row
// they open beside it, as Notion's.
function renderTurnInto(at: TurnIntoAt, onClose: () => void): TemplateResult {
  const fromPanel =
    at.overlay.start !== undefined && at.overlay.panel !== FROM_BLOCK_MENU;
  return renderMenu({
    label: COPY.blockMenu.turnInto,
    items: typeItems(at.blockId, at.overlay, at.dispatch),
    onClose,
    // Opened from the block menu it takes that menu's place, before the
    // grip, not the far end of the block's row.
    placement: fromPanel ? "beside" : "before",
    ...(at.overlay.point && { point: at.overlay.point }),
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
      ...selectionFooter(state, block.id),
    });
  }
  return renderPanel({ block, overlay, dispatch }, onClose);
}

// Opened on selected blocks, the menu ends with their words and
// characters, as the page menu ends with the page's.
function selectionFooter(state: AppState, blockId: BlockId) {
  const selected = selectSelectedBlocks(state);
  if (!selected.some((each) => each.id === blockId)) return {};
  const inside = selected.flatMap((each) => [
    each,
    ...selectBlockOrder(state, each.id),
  ]);
  return { footer: countLabel(countText(inside)) };
}

// The panels the block menu opens in its place: Turn into and Ask AI.
function renderPanel(
  at: {
    readonly block: Block;
    readonly overlay: OpenOverlay;
    readonly dispatch: Dispatch;
  },
  onClose: () => void,
): TemplateResult | typeof nothing {
  const { block, overlay, dispatch } = at;
  if (overlay.kind === TURN_INTO_OVERLAY) {
    return renderTurnInto({ blockId: block.id, overlay, dispatch }, onClose);
  }
  if (overlay.kind === AI_MENU_OVERLAY && isTextBlock(block)) {
    const text = textOf(block);
    return renderAskAiMenu({ id: block.id, text }, dispatch, onClose);
  }
  return nothing;
}
