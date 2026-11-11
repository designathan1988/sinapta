// Block menu items that reach beyond the page: turning the block into a
// page of its own, copying a link to it and moving it to another page.
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
import { selectPageIdOf } from "./editor.selectors.ts";

// The move-to feature shows the dialog; the editor names the block.
const MOVE_TO_OVERLAY = "move-to";

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

export function pageItems(
  block: Block,
  state: AppState,
  dispatch: Dispatch,
): MenuItem[] {
  const blockId = block.id;
  const pageId = selectPageIdOf(state, blockId);
  const copyLink = (): void => {
    if (pageId === undefined) return;
    writeSystemClipboard(linkToBlock(pageId, blockId));
    announce(COPY.blockMenu.linkCopied);
  };
  const moveTo = (): void => {
    const overlay = { kind: MOVE_TO_OVERLAY, anchorId: blockId };
    dispatch(openOverlay.create({ overlay }));
  };
  return [
    ...turnIntoPageItem(block, state, dispatch),
    { label: COPY.blockMenu.copyLink, icon: "link", onSelect: copyLink },
    { label: COPY.blockMenu.moveTo, icon: "move", onSelect: moveTo },
  ];
}
