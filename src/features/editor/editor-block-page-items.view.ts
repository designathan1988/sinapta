// Block menu items that move the block or reach beyond it: turning it
// into a page of its own, copying a link to it, moving it to another page
// and into a new column.
import { moveToNewColumn } from "../../blocks/column-list/index.ts";
import { isTextBlock } from "../../blocks/index.ts";
import { PAGE_TYPE } from "../../blocks/page/index.ts";
import type { Block } from "../../model/index.ts";
import {
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { linkToBlock } from "../../ui/address/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";
import { writeSystemClipboard } from "./editor-clipboard.view.ts";
import { turnIntoPage } from "./editor-convert.commands.ts";
import { syncedItems } from "./editor-synced-items.view.ts";
import { selectPageIdOf } from "./editor.selectors.ts";

// The move-to feature shows the dialog; the editor names the block.
const MOVE_TO_OVERLAY = "move-to";
// Move to's popover, under the block (the move-to feature names it so).
const MOVE_TO_PLACE_PANEL = "place";

// Only a text block that sits directly on a page can become a page.
function turnIntoPageItem(block: Block, state: AppState, dispatch: Dispatch) {
  const parent =
    block.parentId === null
      ? undefined
      : state.workspace.blocks[block.parentId];
  if (!isTextBlock(block) || parent?.type !== PAGE_TYPE) return [];
  return [
    {
      label: COPY.blockMenu.turnIntoPage,
      icon: "page",
      onSelect: () => dispatch(turnIntoPage.create({ blockId: block.id })),
    } satisfies MenuItem,
  ];
}

// "Copy link to block", first of Notion's second group.
export function copyLinkItem(block: Block, state: AppState): MenuItem {
  const blockId = block.id;
  const pageId = selectPageIdOf(state, blockId);
  const copyLink = (): void => {
    if (pageId === undefined) return;
    writeSystemClipboard(linkToBlock(pageId, blockId));
    announce(COPY.blockMenu.linkCopied);
  };
  return { label: COPY.blockMenu.copyLink, icon: "link", onSelect: copyLink };
}

// "Move to", Notion's popover under the block that moves it to another
// page.
export function moveToItem(block: Block, dispatch: Dispatch): MenuItem {
  const overlay = {
    kind: MOVE_TO_OVERLAY,
    anchorId: block.id,
    panel: MOVE_TO_PLACE_PANEL,
  };
  return {
    label: COPY.blockMenu.moveTo,
    icon: "move",
    onSelect: () => dispatch(openOverlay.create({ overlay })),
  };
}

// Pagecraft's own, after Notion's groups: a page of the block, its sync,
// and a new column for it (the keyboard's way to make columns).
export function extraItems(
  block: Block,
  state: AppState,
  dispatch: Dispatch,
): MenuItem[] {
  const blockId = block.id;
  return [
    ...turnIntoPageItem(block, state, dispatch),
    ...syncedItems(block, state, dispatch),
    {
      label: COPY.blockMenu.moveToNewColumn,
      icon: "columns",
      onSelect: () => dispatch(moveToNewColumn.create({ blockId })),
    },
  ];
}
