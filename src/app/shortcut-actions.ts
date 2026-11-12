// What Notion's navigation keys do: a new page, back and forward through
// the pages opened, the open page's link copied, and the page it is in.
import { createPage, isPageLike, selectPage } from "../blocks/page/index.ts";
import { setActivePage, type AppState, type Dispatch } from "../state/index.ts";
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

function copyLink(): void {
  void navigator.clipboard.writeText(location.href).then(() => {
    announce(COPY.shell.linkCopied);
  });
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
  }
}
