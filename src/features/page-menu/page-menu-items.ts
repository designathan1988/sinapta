// Page menu rows that make something from the page or show more of it:
// a duplicate, its files, its history and its resolved comments.
import { duplicatePage, selectPageCopySize } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import {
  openOverlay,
  PAGE_HISTORY_OVERLAY,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";
import {
  RESOLVED_COMMENTS_OVERLAY,
  selectResolvedDiscussions,
} from "../comments/index.ts";
import {
  exportPageAsHtml,
  exportPageAsMarkdown,
} from "../markdown-export/index.ts";

// Actions that make something from the page: a duplicate, a file.
export function copyItems(
  state: AppState,
  pageId: BlockId,
  dispatch: Dispatch,
): MenuItem[] {
  return [
    {
      label: COPY.pageMenu.duplicate,
      icon: "duplicate",
      onSelect: () => {
        const size = selectPageCopySize(state, pageId);
        dispatch(duplicatePage.create({ pageId, ...size }));
      },
    },
    {
      label: COPY.pageMenu.exportMarkdown,
      icon: "download",
      onSelect: () => {
        exportPageAsMarkdown(state, pageId);
      },
    },
    {
      label: COPY.pageMenu.exportHtml,
      icon: "download",
      onSelect: () => {
        exportPageAsHtml(state, pageId);
      },
    },
    {
      label: COPY.pageMenu.print,
      icon: "page",
      onSelect: () => {
        window.print();
      },
    },
  ];
}

// "Page history": the page's versions, to look at and restore.
export function historyItem(pageId: BlockId, dispatch: Dispatch): MenuItem {
  const overlay = { kind: PAGE_HISTORY_OVERLAY, anchorId: pageId };
  return {
    label: COPY.pageHistory.open,
    icon: "history",
    onSelect: () => dispatch(openOverlay.create({ overlay })),
  };
}

// "Resolved comments", with how many, while the page has any.
export function resolvedItems(
  state: AppState,
  pageId: BlockId,
  dispatch: Dispatch,
): MenuItem[] {
  const count = selectResolvedDiscussions(state, pageId).length;
  if (count === 0) return [];
  const overlay = { kind: RESOLVED_COMMENTS_OVERLAY, anchorId: pageId };
  return [
    {
      label: COPY.comments.resolved,
      icon: "comment",
      value: String(count),
      onSelect: () => dispatch(openOverlay.create({ overlay })),
    },
  ];
}
