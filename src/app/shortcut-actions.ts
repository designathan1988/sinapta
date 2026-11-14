// What Notion's navigation keys do: a new page, back and forward through
// the pages opened, the open page's link copied, and the page it is in.
import { createPage, isPageLike, selectPage } from "../blocks/page/index.ts";
import {
  openOverlay,
  setActivePage,
  type AppState,
  type Dispatch,
} from "../state/index.ts";
import { COMMENT_COMPOSER_OVERLAY } from "../features/comments/index.ts";
import {
  MOVE_TO_OVERLAY_KIND,
  MOVE_TO_PLACE_PANEL,
} from "../features/page-menu/index.ts";
import { announce } from "../ui/announcer/index.ts";
import { COPY } from "../ui/copy.ts";
import type { ShortcutAction } from "../ui/shortcuts/index.ts";

// The page the open page is in, past any blocks between them.
function openParent(state: AppState, dispatch: Dispatch): void {
  let parentId = selectPage(state, state.ui.activePageId)?.parentId ?? null;
  while (parentId !== null) {
    const parent = state.workspace.blocks[parentId];
    if (parent === undefined) return;
    if (isPageLike(parent)) {
      dispatch(setActivePage.create({ pageId: parent.id }));
      return;
    }
    parentId = parent.parentId;
  }
}

// A discussion on the selected text, or on the block the caret is in.
function commentOnSelection(state: AppState, dispatch: Dispatch): void {
  const { selection } = state.ui;
  if (selection === null) return;
  const start = Math.min(selection.anchorOffset, selection.focusOffset);
  const end = Math.max(selection.anchorOffset, selection.focusOffset);
  const overlay = {
    kind: COMMENT_COMPOSER_OVERLAY,
    anchorId: selection.blockId,
    ...(start !== end && { start, end }),
  };
  dispatch(openOverlay.create({ overlay }));
}

function copyLink(): void {
  void navigator.clipboard.writeText(location.href).then(() => {
    announce(COPY.shell.linkCopied);
  });
}

// Notion's Move to for the open page, as its page menu opens it.
function moveOpenPage(state: AppState, dispatch: Dispatch): void {
  const pageId = state.ui.activePageId;
  if (pageId === null) return;
  const overlay = {
    kind: MOVE_TO_OVERLAY_KIND,
    anchorId: pageId,
    panel: MOVE_TO_PLACE_PANEL,
  };
  dispatch(openOverlay.create({ overlay }));
}

export function runShortcutAction(
  action: ShortcutAction,
  state: AppState,
  dispatch: Dispatch,
): void {
  switch (action) {
    case "new-page":
      dispatch(createPage.create({ parentId: null }));
      return;
    case "back":
      history.back();
      return;
    case "forward":
      history.forward();
      return;
    case "copy-link":
      copyLink();
      return;
    case "parent-page":
      openParent(state, dispatch);
      return;
    case "comment":
      commentOnSelection(state, dispatch);
      return;
    case "move-to":
      moveOpenPage(state, dispatch);
      return;
  }
}
