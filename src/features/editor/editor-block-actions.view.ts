// What the block menu lists, in Notion's groups: the block's type over
// "Turn into" and "Color"; then "Copy link to block", "Duplicate", "Move
// to" and "Delete"; then "Comment"; then Pagecraft's own. Each shows the
// keys that do the same.
import { blockDefinition, isTextBlock } from "../../blocks/index.ts";
import { askAiItem } from "../ai/index.ts";
import { countBlockTree, type Block } from "../../model/index.ts";
import {
  openOverlay,
  type AppState,
  type Dispatch,
  type OpenOverlay,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuEntry, MenuItem } from "../../ui/menu/index.ts";
import { COMMENT_COMPOSER_OVERLAY } from "../comments/index.ts";
import {
  copyLinkItem,
  extraItems,
  moveToItem,
} from "./editor-block-page-items.view.ts";
import { colorMenuItem } from "./editor-color-menu.view.ts";
import { duplicateBlock } from "./editor-insert.commands.ts";
import { deleteBlock } from "./editor-move.commands.ts";
import { deleteSelectedBlocks } from "./editor-selection.commands.ts";
import { duplicateSelected } from "./editor-selection-actions.ts";
import { selectSelectedBlocks } from "./editor.selectors.ts";

export const TURN_INTO_OVERLAY = "turn-into";
// Turn into opened from the block menu, in its place; the formatting
// toolbar opens it beside its own row.
export const FROM_BLOCK_MENU = "from-block-menu";

export interface ActionContext {
  readonly overlay: OpenOverlay;
  readonly state: AppState;
  readonly dispatch: Dispatch;
}

const DIVIDER: MenuEntry = { kind: "divider" };

const HEADING_NAMES: Readonly<Record<number, string>> = {
  1: COPY.blockNames.heading,
  2: COPY.blockNames.heading2,
  3: COPY.blockNames.heading3,
  4: COPY.blockNames.heading4,
};

// The block's type as Notion names it over the menu: "Text", "Heading 2".
export function blockTypeName(block: Block): string {
  const level = block.props.level;
  if (block.type === "heading" && typeof level === "number") {
    return HEADING_NAMES[level] ?? COPY.blockNames.heading;
  }
  return blockDefinition(block.type)?.label ?? "";
}

// Over the menu: the block's type, or "2 blocks" for a selection.
function menuName(block: Block, state: AppState): string {
  const count = selectedWith(block, state);
  return count > 1 ? COPY.blockMenu.blocks(count) : blockTypeName(block);
}

// A text block can turn into another type and take a color.
function textItems(block: Block, context: ActionContext): MenuItem[] {
  const { overlay, dispatch } = context;
  if (!isTextBlock(block)) return [];
  const turnInto: MenuItem = {
    label: COPY.blockMenu.turnInto,
    icon: "swap",
    opensPanel: true,
    onSelect: () =>
      dispatch(
        openOverlay.create({
          overlay: {
            ...overlay,
            kind: TURN_INTO_OVERLAY,
            panel: FROM_BLOCK_MENU,
          },
        }),
      ),
  };
  return [turnInto, colorMenuItem(overlay, dispatch)];
}

// The other blocks selected with this one, when it is one of several.
function selectedWith(block: Block, state: AppState): number {
  const selected = selectSelectedBlocks(state);
  return selected.some((each) => each.id === block.id) ? selected.length : 1;
}

function editItems(block: Block, context: ActionContext): MenuItem[] {
  const { state, dispatch } = context;
  const blockId = block.id;
  const isMany = selectedWith(block, state) > 1;
  // Blocks in the tree of the block, for a copy of it.
  const blockCount = countBlockTree(state.workspace, blockId);
  return [
    copyLinkItem(block, state),
    {
      label: COPY.blockMenu.duplicate,
      icon: "duplicate",
      shortcut: COPY.blockMenu.duplicateKeys,
      onSelect: () => {
        if (isMany) duplicateSelected(context);
        else dispatch(duplicateBlock.create({ blockId, blockCount }));
      },
    },
    moveToItem(block, dispatch),
    {
      label: COPY.blockMenu.delete,
      icon: "trash",
      shortcut: COPY.blockMenu.deleteKeys,
      onSelect: () =>
        dispatch(
          isMany
            ? deleteSelectedBlocks.create({})
            : deleteBlock.create({ blockId }),
        ),
    },
  ];
}

// "Comment": a discussion on the whole block.
function commentItem(block: Block, dispatch: Dispatch): MenuItem {
  const overlay = { kind: COMMENT_COMPOSER_OVERLAY, anchorId: block.id };
  return {
    label: COPY.comments.comment,
    icon: "comment",
    shortcut: COPY.blockMenu.commentKeys,
    onSelect: () => dispatch(openOverlay.create({ overlay })),
  };
}

// Groups with a line between each, leaving out the empty ones.
function grouped(groups: readonly (readonly MenuItem[])[]): MenuEntry[] {
  return groups
    .filter((group) => group.length > 0)
    .flatMap((group, index): MenuEntry[] =>
      index === 0 ? [...group] : [DIVIDER, ...group],
    );
}

export function blockActionEntries(
  block: Block,
  context: ActionContext,
): MenuEntry[] {
  const { state, dispatch } = context;
  return [
    { kind: "section", label: menuName(block, state) },
    ...grouped([
      isTextBlock(block) ? [askAiItem(context.overlay, dispatch)] : [],
      textItems(block, context),
      editItems(block, context),
      [commentItem(block, dispatch)],
      extraItems(block, state, dispatch),
    ]),
  ];
}
